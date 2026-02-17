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
            'container_id' => 'fake-'.$instance->id,
            'compose_path' => '/tmp/fake/'.$instance->id.'/docker-compose.yml',
            'workdir' => '/tmp/fake/'.$instance->id,
            'project_name' => 'lab_'.substr(str_replace('-', '', $instance->id), 0, 12),
            'network_name' => 'lab_net_'.$instance->id,
            'assigned_port' => $assignedPort,
            'ip_address' => '172.18.0.10',
            'gateway' => '172.18.0.1',
            'ports' => [[
                'container_port' => (string) ($template->internal_port ?? 80),
                'host_port' => (string) $assignedPort,
            ]],
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
