<?php

namespace App\Services\Orchestration;

use App\Models\LabInstance;
use App\Models\LabTemplate;
use Illuminate\Support\Facades\DB;

class LabOrchestratorService
{
    public function __construct(private readonly LabDriverInterface $driver)
    {
    }

    public function startInstance(LabInstance $instance, LabTemplate $template, int $assignedPort): LabInstance
    {
        $metadata = $this->driver->startInstance($instance, $template, $assignedPort);

        $instance->fill([
            'runtime_metadata' => $metadata,
            'assigned_port' => $assignedPort,
            'connection_url' => sprintf('http://%s:%d', config('labs.host'), $assignedPort),
        ])->save();

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
        });

        return $instance->refresh();
    }

    public function upgradeInstance(LabInstance $instance, LabTemplate $targetTemplate, string $strategy, int $assignedPort): LabInstance
    {
        $metadata = $this->driver->upgradeInstance($instance, $targetTemplate, $strategy, $assignedPort);

        $instance->fill([
            'runtime_metadata' => array_merge($instance->runtime_metadata ?? [], ['upgrade' => $metadata]),
            'assigned_port' => $assignedPort,
            'connection_url' => sprintf('http://%s:%d', config('labs.host'), $assignedPort),
        ])->save();

        return $instance->refresh();
    }
}
