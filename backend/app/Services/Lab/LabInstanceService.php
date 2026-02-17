<?php

namespace App\Services\Lab;

use App\Enums\LabInstanceState;
use App\Models\LabInstance;
use App\Models\User;
use App\Repositories\Contracts\LabInstanceRepositoryInterface;
use App\Services\Audit\AuditLogService;
use App\Services\Orchestration\LabOrchestratorService;
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
    ) {
    }

    public function activate(string $templateId, User $user, ?string $pinVersion = null): LabInstance
    {
        $template = $this->templates->findPublishedForUserCatalogOrFail($templateId);

        if ($pinVersion) {
            $pinned = $this->templates->findPublishedByVersion($template->template_family_uuid, $pinVersion);
            if (! $pinned) {
                throw new HttpException(422, 'Requested pin_version not available.');
            }
            $template = $pinned;
        }

        $instance = $this->instances->findByTemplateFamilyForUser($template->template_family_uuid, $user);

        if (! $instance) {
            $instance = $this->instances->create([
                'user_id' => $user->id,
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

            throw new HttpException(500, 'Failed to start lab instance.');
        }

        $instance = $this->instances->update($instance, [
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
            throw new HttpException(500, 'Failed to stop lab instance.');
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
            throw new HttpException(500, 'Failed to restart lab instance.');
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
}
