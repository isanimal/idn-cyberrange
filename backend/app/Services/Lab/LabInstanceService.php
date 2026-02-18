<?php

namespace App\Services\Lab;

use App\Enums\LabInstanceState;
use App\Exceptions\OrchestrationOperationException;
use App\Models\LabInstance;
use App\Models\Module;
use App\Models\ModuleLabTemplate;
use App\Models\User;
use App\Repositories\Contracts\LabInstanceRepositoryInterface;
use App\Services\Audit\AuditLogService;
use App\Services\Orchestration\LabOrchestratorService;
use App\Services\Orchestration\OrchestrationPreflightService;
use App\Services\Orchestration\PortAllocatorService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Throwable;
use Symfony\Component\HttpKernel\Exception\HttpException;

class LabInstanceService
{
    public function __construct(
        private readonly LabTemplateService $templates,
        private readonly LabInstanceRepositoryInterface $instances,
        private readonly LabOrchestratorService $orchestrator,
        private readonly PortAllocatorService $ports,
        private readonly AuditLogService $audit,
        private readonly OrchestrationPreflightService $preflight,
    ) {
    }

    public function activate(string $templateId, User $user, ?string $pinVersion = null, ?string $moduleId = null): LabInstance
    {
        $template = $this->templates->findPublishedForUserCatalogOrFail($templateId);

        if ($pinVersion) {
            $pinned = $this->templates->findPublishedByVersion($template->template_family_uuid, $pinVersion);
            if (! $pinned) {
                throw new HttpException(422, 'Requested pin_version not available.');
            }
            $template = $pinned;
        }

        if ($moduleId) {
            $module = Module::query()
                ->where('id', $moduleId)
                ->where('status', 'active')
                ->whereNull('archived_at')
                ->first();
            if (! $module) {
                throw new HttpException(422, 'Module is not available for this lab.');
            }

            $isLinked = ModuleLabTemplate::query()
                ->where('module_id', $moduleId)
                ->whereHas('labTemplate', fn ($q) => $q->where('template_family_uuid', $template->template_family_uuid))
                ->exists();

            if (! $isLinked) {
                throw new HttpException(422, 'Lab template is not linked to this module.');
            }
        }

        $instance = $this->instances->findByTemplateFamilyForUser($template->template_family_uuid, $user);

        if (! $instance) {
            $instance = $this->instances->create([
                'user_id' => $user->id,
                'module_id' => $moduleId,
                'lab_template_id' => $template->id,
                'template_version_pinned' => $template->version,
                'state' => LabInstanceState::INACTIVE,
                'progress_percent' => 0,
                'attempts_count' => 0,
                'notes' => '',
                'score' => 0,
                'started_at' => now(),
                'last_activity_at' => now(),
            ]);
        }

        try {
            $port = $instance->assigned_port ?: $this->ports->allocate($instance->id);
            $instance = $this->orchestrator->startInstance($instance, $template, $port);
        } catch (Throwable $e) {
            $this->instances->update($instance, [
                'state' => LabInstanceState::ABANDONED,
                'last_activity_at' => now(),
                'last_error' => $e->getMessage(),
            ]);

            throw new OrchestrationOperationException(
                'LAB_START_FAILED',
                $this->humanizeRuntimeError($e->getMessage(), 'start'),
                $this->buildOperationDetails('start', $e),
                503
            );
        }

        $instance = $this->instances->update($instance, [
            'module_id' => $moduleId ?? $instance->module_id,
            'lab_template_id' => $template->id,
            'template_version_pinned' => $template->version,
            'state' => LabInstanceState::ACTIVE,
            'last_activity_at' => now(),
            'expires_at' => now()->addMinutes((int) config('labs.max_ttl_minutes', 120)),
            'attempts_count' => $instance->attempts_count + 1,
            'last_error' => null,
        ]);

        $this->audit->log('LAB_INSTANCE_ACTIVATED', $user->id, 'LabInstance', $instance->id, [
            'template_id' => $template->id,
            'version' => $template->version,
        ]);

        return $instance;
    }

    public function deactivate(string $instanceId, User $user): LabInstance
    {
        $instance = $this->findInstanceForUserOrFail($instanceId, $user);
        try {
            $instance = $this->orchestrator->stopInstance($instance);
        } catch (Throwable $e) {
            $this->instances->update($instance, [
                'last_activity_at' => now(),
                'last_error' => $e->getMessage(),
            ]);
            throw new OrchestrationOperationException(
                'LAB_STOP_FAILED',
                $this->humanizeRuntimeError($e->getMessage(), 'stop'),
                $this->buildOperationDetails('stop', $e),
                503
            );
        }

        $this->ports->releaseByInstance($instance->id);

        $instance = $this->instances->update($instance, [
            'state' => LabInstanceState::INACTIVE,
            'last_activity_at' => now(),
            'last_error' => null,
        ]);

        $this->audit->log('LAB_INSTANCE_DEACTIVATED', $user->id, 'LabInstance', $instance->id);

        return $instance;
    }

    public function restart(string $instanceId, User $user): LabInstance
    {
        $instance = $this->findInstanceForUserOrFail($instanceId, $user);
        try {
            $instance = $this->orchestrator->restartInstance($instance);
        } catch (Throwable $e) {
            $this->instances->update($instance, [
                'last_activity_at' => now(),
                'last_error' => $e->getMessage(),
            ]);
            throw new OrchestrationOperationException(
                'LAB_RESTART_FAILED',
                $this->humanizeRuntimeError($e->getMessage(), 'restart'),
                $this->buildOperationDetails('restart', $e),
                503
            );
        }

        return $this->instances->update($instance, [
            'last_activity_at' => now(),
            'expires_at' => now()->addMinutes((int) config('labs.max_ttl_minutes', 120)),
            'last_error' => null,
        ]);
    }

    public function updateInstance(string $instanceId, User $user, array $data): LabInstance
    {
        $instance = $this->findInstanceForUserOrFail($instanceId, $user);

        return $this->instances->update($instance, $data + ['last_activity_at' => now()]);
    }

    public function upgrade(string $instanceId, ?string $toVersion, string $strategy, User $user): LabInstance
    {
        $instance = $this->findInstanceForUserOrFail($instanceId, $user);
        $currentTemplate = $this->templates->findOrFail($instance->lab_template_id);

        $targetTemplate = null;
        if ($toVersion && str_starts_with($toVersion, 'BY_TEMPLATE_ID:')) {
            $targetTemplate = $this->templates->findOrFail(substr($toVersion, 15));
        } elseif ($toVersion) {
            $targetTemplate = $this->templates->findPublishedByVersion($currentTemplate->template_family_uuid, $toVersion);
        } else {
            $targetTemplate = $this->templates->findLatestPublishedForFamily($currentTemplate->template_family_uuid);
        }

        if (! $targetTemplate) {
            throw new HttpException(422, 'Target version not found.');
        }

        if ($strategy === 'IN_PLACE' && ! $this->isInPlaceCompatible($currentTemplate, $targetTemplate)) {
            throw new HttpException(422, 'IN_PLACE upgrade is not compatible with this target version.');
        }

        if ($strategy === 'RESET') {
            $instance = $this->instances->update($instance, [
                'progress_percent' => 0,
                'notes' => '',
                'score' => 0,
                'completed_at' => null,
            ]);
        }

        $port = $instance->assigned_port ?: $this->ports->allocate($instance->id);
        $instance = $this->orchestrator->upgradeInstance($instance, $targetTemplate, $strategy, $port);

        $instance = $this->instances->update($instance, [
            'lab_template_id' => $targetTemplate->id,
            'template_version_pinned' => $targetTemplate->version,
            'state' => LabInstanceState::ACTIVE,
            'last_activity_at' => now(),
        ]);

        $this->audit->log('LAB_INSTANCE_UPGRADED', $user->id, 'LabInstance', $instance->id, [
            'from_version' => $currentTemplate->version,
            'to_version' => $targetTemplate->version,
            'strategy' => $strategy,
        ]);

        return $instance;
    }

    public function myInstances(User $user, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return $this->instances->myInstances($user, $filters, $perPage);
    }

    public function findUserInstanceForTemplateFamily(User $user, $template): ?LabInstance
    {
        return $this->instances->findByTemplateFamilyForUser($template->template_family_uuid, $user);
    }

    public function forceStopByAdmin(string $instanceId): LabInstance
    {
        $instance = $this->instances->findById($instanceId);

        if (! $instance) {
            throw new \Illuminate\Database\Eloquent\ModelNotFoundException('Lab instance not found.');
        }

        $instance = $this->orchestrator->stopInstance($instance);
        $this->ports->releaseByInstance($instance->id);

        return $this->instances->update($instance, [
            'state' => LabInstanceState::INACTIVE,
            'last_activity_at' => now(),
            'last_error' => null,
        ]);
    }

    public function forceRestartByAdmin(string $instanceId): LabInstance
    {
        $instance = $this->instances->findById($instanceId);

        if (! $instance) {
            throw new \Illuminate\Database\Eloquent\ModelNotFoundException('Lab instance not found.');
        }

        $instance = $this->orchestrator->restartInstance($instance);

        return $this->instances->update($instance, [
            'state' => LabInstanceState::ACTIVE,
            'last_activity_at' => now(),
            'last_error' => null,
        ]);
    }

    public function findInstanceForUserOrFail(string $id, User $user): LabInstance
    {
        $instance = $this->instances->findByIdForUser($id, $user);

        if (! $instance) {
            throw new \Illuminate\Database\Eloquent\ModelNotFoundException('Lab instance not found.');
        }

        return $instance;
    }

    private function isInPlaceCompatible($currentTemplate, $targetTemplate): bool
    {
        if ($currentTemplate->template_family_uuid !== $targetTemplate->template_family_uuid) {
            return false;
        }

        return (int) ($currentTemplate->configuration_base_port ?? $currentTemplate->internal_port) ===
            (int) ($targetTemplate->configuration_base_port ?? $targetTemplate->internal_port);
    }

    /**
     * @return array<string, mixed>
     */
    private function buildOperationDetails(string $operation, Throwable $e): array
    {
        $report = $this->preflight->run();

        return [
            'operation' => $operation,
            'raw_error' => $e->getMessage(),
            'hints' => $this->extractHints($report),
            'preflight' => $report,
        ];
    }

    private function humanizeRuntimeError(string $raw, string $operation): string
    {
        $normalized = strtolower($raw);
        $prefix = match ($operation) {
            'start' => 'Failed to start lab instance.',
            'stop' => 'Failed to stop lab instance.',
            'restart' => 'Failed to restart lab instance.',
            default => 'Lab runtime operation failed.',
        };

        if (str_contains($normalized, 'permission denied') && str_contains($normalized, 'docker.sock')) {
            return $prefix.' Docker daemon unreachable / permission denied on socket. Check remediation hints in details.preflight.';
        }

        if (str_contains($normalized, 'failed to create workdir')) {
            return $prefix.' Runtime workdir is not writable. Check remediation hints in details.preflight.';
        }

        if (str_contains($normalized, 'cannot connect to the docker daemon')) {
            return $prefix.' Docker daemon unreachable. Check remediation hints in details.preflight.';
        }

        return $prefix.' '.$raw;
    }

    /**
     * @param  array<string, mixed>  $report
     * @return array<int, string>
     */
    private function extractHints(array $report): array
    {
        $hints = [];
        $checks = $report['checks'] ?? [];
        if (! is_array($checks)) {
            return $hints;
        }

        foreach (['workdir', 'docker'] as $key) {
            $node = $checks[$key] ?? null;
            if (! is_array($node)) {
                continue;
            }
            $nodeHints = $node['hints'] ?? [];
            if (is_array($nodeHints)) {
                foreach ($nodeHints as $hint) {
                    if (is_string($hint) && $hint !== '') {
                        $hints[] = $hint;
                    }
                }
            }
        }

        return array_values(array_unique($hints));
    }
}
