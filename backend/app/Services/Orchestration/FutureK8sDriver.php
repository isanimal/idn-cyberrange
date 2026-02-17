<?php

namespace App\Services\Orchestration;

use App\Models\LabInstance;
use App\Models\LabTemplate;

class FutureK8sDriver implements LabDriverInterface
{
    public function startInstance(LabInstance $instance, LabTemplate $template, int $assignedPort): array
    {
        throw new \BadMethodCallException('K8s driver is not implemented yet.');
    }

    public function stopInstance(LabInstance $instance): array
    {
        throw new \BadMethodCallException('K8s driver is not implemented yet.');
    }

    public function restartInstance(LabInstance $instance): array
    {
        throw new \BadMethodCallException('K8s driver is not implemented yet.');
    }

    public function destroyInstance(LabInstance $instance): array
    {
        throw new \BadMethodCallException('K8s driver is not implemented yet.');
    }

    public function upgradeInstance(LabInstance $instance, LabTemplate $targetTemplate, string $strategy, int $assignedPort): array
    {
        throw new \BadMethodCallException('K8s driver is not implemented yet.');
    }
}
