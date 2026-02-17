<?php

namespace App\Services\Orchestration;

use App\Models\LabInstance;
use App\Models\LabTemplate;

class FakeDockerDriver implements LabDriverInterface
{
    public function startInstance(LabInstance $instance, LabTemplate $template, int $assignedPort): array
    {
        return [
            'driver' => 'fake',
            'container_name' => 'lab_'.$instance->id,
            'compose_path' => '/tmp/fake/'.$instance->id.'/docker-compose.yml',
            'workdir' => '/tmp/fake/'.$instance->id,
            'network_name' => 'lab_net_'.$instance->id,
        ];
    }

    public function stopInstance(LabInstance $instance): array
    {
        return ['driver' => 'fake', 'status' => 'stopped'];
    }

    public function restartInstance(LabInstance $instance): array
    {
        return ['driver' => 'fake', 'status' => 'restarted'];
    }

    public function destroyInstance(LabInstance $instance): array
    {
        return ['driver' => 'fake', 'status' => 'destroyed'];
    }

    public function upgradeInstance(LabInstance $instance, LabTemplate $targetTemplate, string $strategy, int $assignedPort): array
    {
        return [
            'driver' => 'fake',
            'status' => 'upgraded',
            'strategy' => $strategy,
            'assigned_port' => $assignedPort,
        ];
    }
}
