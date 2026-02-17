<?php

namespace App\Services\Lab;

use App\Enums\LabInstanceState;
use App\Models\LabInstance;
use App\Models\User;
use App\Repositories\Contracts\LabInstanceRepositoryInterface;
use App\Services\Audit\AuditLogService;
use App\Services\Orchestration\LabOrchestratorService;
use Illuminate\Database\Eloquent\Collection;
use Symfony\Component\HttpKernel\Exception\HttpException;

class LabInstanceService
{
    public function __construct(
        private readonly LabTemplateService $templates,
        private readonly LabInstanceRepositoryInterface $instances,
        private readonly LabOrchestratorService $orchestrator,
        private readonly AuditLogService $audit,
    ) {
    }

    public function activate(string $templateId, User $user): LabInstance
    {
        $template = $this->templates->findOrFail($templateId);

        $instance = $this->instances->findByTemplateForUser($template->id, $user);
        if (! $instance) {
            $instance = $this->instances->create([
                'user_id' => $user->id,
                'lab_template_id' => $template->id,
                'template_version_pinned' => $template->version,
                'state' => LabInstanceState::INACTIVE,
                'progress_percent' => 0,
                'attempts_count' => 0,
                'notes' => '',
                'started_at' => now(),
                'last_activity_at' => now(),
            ]);
        }

        $port = $this->findAvailablePort();
        $instance = $this->orchestrator->startInstance($instance, $template, $port);
        $instance = $this->instances->update($instance, [
            'state' => LabInstanceState::ACTIVE,
            'started_at' => $instance->started_at ?? now(),
            'last_activity_at' => now(),
            'attempts_count' => $instance->attempts_count + 1,
        ]);

        $this->audit->log('LAB_INSTANCE_ACTIVATED', $user->id, 'LabInstance', $instance->id, ['template_id' => $template->id]);

        return $instance;
    }

    public function deactivate(string $instanceId, User $user): LabInstance
    {
        $instance = $this->findInstanceForUserOrFail($instanceId, $user);
        $instance = $this->orchestrator->stopInstance($instance);

        $instance = $this->instances->update($instance, [
            'state' => LabInstanceState::INACTIVE,
            'last_activity_at' => now(),
        ]);

        $this->audit->log('LAB_INSTANCE_DEACTIVATED', $user->id, 'LabInstance', $instance->id);

        return $instance;
    }

    public function restart(string $instanceId, User $user): LabInstance
    {
        $instance = $this->findInstanceForUserOrFail($instanceId, $user);
        $instance = $this->orchestrator->restartInstance($instance);

        return $this->instances->update($instance, ['last_activity_at' => now()]);
    }

    public function upgrade(string $instanceId, ?string $targetTemplateId, string $strategy, User $user): LabInstance
    {
        $instance = $this->findInstanceForUserOrFail($instanceId, $user);
        $currentTemplate = $this->templates->findOrFail($instance->lab_template_id);

        $targetTemplate = $targetTemplateId
            ? $this->templates->findOrFail($targetTemplateId)
            : $this->templates->findLatestPublishedForFamily($currentTemplate->template_family_uuid);

        if (! $targetTemplate) {
            throw new HttpException(422, 'No published target version available for upgrade.');
        }

        if ($strategy === 'IN_PLACE' && ! $this->isInPlaceCompatible($currentTemplate, $targetTemplate)) {
            throw new HttpException(422, 'IN_PLACE upgrade is not compatible with this template version.');
        }

        if ($strategy === 'RESET') {
            $instance = $this->instances->update($instance, [
                'progress_percent' => 0,
                'notes' => '',
                'completed_at' => null,
            ]);
        }

        $assignedPort = $instance->assigned_port ?? $this->findAvailablePort();
        $instance = $this->orchestrator->upgradeInstance($instance, $targetTemplate, $strategy, $assignedPort);

        $instance = $this->instances->update($instance, [
            'lab_template_id' => $targetTemplate->id,
            'template_version_pinned' => $targetTemplate->version,
            'state' => LabInstanceState::ACTIVE,
            'last_activity_at' => now(),
            'started_at' => $instance->started_at ?? now(),
        ]);

        $this->audit->log('LAB_INSTANCE_UPGRADED', $user->id, 'LabInstance', $instance->id, [
            'from_template_id' => $currentTemplate->id,
            'target_template_id' => $targetTemplate->id,
            'strategy' => $strategy,
        ]);

        return $instance;
    }

    public function myInstances(User $user): Collection
    {
        return $this->instances->myInstances($user);
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

        return $currentTemplate->internal_port === $targetTemplate->internal_port;
    }

    private function findAvailablePort(): int
    {
        $start = config('labs.port_start', 20000);
        $end = config('labs.port_end', 30000);

        return random_int($start, $end);
    }
}
