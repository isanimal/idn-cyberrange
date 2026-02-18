<?php

namespace App\Services\Orchestration;

use App\Models\LabInstance;
use App\Models\LabInstanceRuntime;
use App\Models\LabTemplate;
use Illuminate\Support\Facades\DB;

class LabOrchestratorService
{
    public function __construct(
        private readonly LabDriverInterface $driver,
        private readonly PublicLabAccessService $publicAccess,
    )
    {
    }

    public function startInstance(LabInstance $instance, LabTemplate $template, int $assignedPort): LabInstance
    {
        $metadata = $this->driver->startInstance($instance, $template, $assignedPort);
        $publicAccess = $this->publicAccess->resolve($instance, $assignedPort);

        $instance->fill([
            'runtime_metadata' => $metadata,
            'assigned_port' => $assignedPort,
            'connection_url' => $publicAccess['access_url'],
        ])->save();

        $this->syncRuntime($instance, $metadata, $publicAccess);

        return $instance->refresh();
    }

    public function stopInstance(LabInstance $instance): LabInstance
    {
        $metadata = $this->driver->stopInstance($instance);

        $instance->fill([
            'runtime_metadata' => array_merge($instance->runtime_metadata ?? [], ['stop' => $metadata]),
            'connection_url' => null,
            'assigned_port' => null,
        ])->save();

        $instance->runtime()?->update([
            'host_port' => null,
            'public_host' => null,
            'access_url' => null,
            'runtime_meta' => array_merge(
                is_array($instance->runtime?->runtime_meta) ? $instance->runtime->runtime_meta : [],
                ['stop' => $metadata]
            ),
        ]);

        return $instance->refresh();
    }

    public function restartInstance(LabInstance $instance): LabInstance
    {
        $metadata = $this->driver->restartInstance($instance);

        $instance->fill([
            'runtime_metadata' => array_merge($instance->runtime_metadata ?? [], ['restart' => $metadata]),
        ])->save();

        return $instance->refresh();
    }

    public function destroyInstance(LabInstance $instance): LabInstance
    {
        DB::transaction(function () use ($instance): void {
            $this->driver->destroyInstance($instance);
            $instance->fill(['connection_url' => null, 'assigned_port' => null])->save();
            $instance->runtime()->delete();
        });

        return $instance->refresh();
    }

    public function upgradeInstance(LabInstance $instance, LabTemplate $targetTemplate, string $strategy, int $assignedPort): LabInstance
    {
        $metadata = $this->driver->upgradeInstance($instance, $targetTemplate, $strategy, $assignedPort);
        $publicAccess = $this->publicAccess->resolve($instance, $assignedPort);

        $instance->fill([
            'runtime_metadata' => array_merge($instance->runtime_metadata ?? [], ['upgrade' => $metadata]),
            'assigned_port' => $assignedPort,
            'connection_url' => $publicAccess['access_url'],
        ])->save();

        $this->syncRuntime($instance, $metadata, $publicAccess);

        return $instance->refresh();
    }

    private function syncRuntime(LabInstance $instance, array $metadata, array $publicAccess): void
    {
        LabInstanceRuntime::query()->updateOrCreate(
            ['lab_instance_id' => $instance->id],
            [
                'workdir' => $metadata['workdir'] ?? null,
                'compose_path' => $metadata['compose_path'] ?? null,
                'network_name' => $metadata['network_name'] ?? null,
                'container_name' => $metadata['container_name'] ?? null,
                'host_port' => $publicAccess['host_port'] ?? null,
                'public_host' => $publicAccess['public_host'] ?? null,
                'access_url' => $publicAccess['access_url'] ?? null,
                'runtime_meta' => $metadata,
            ]
        );
    }
}
