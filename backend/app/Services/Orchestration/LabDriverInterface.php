<?php

namespace App\Services\Orchestration;

use App\Models\LabInstance;
use App\Models\LabTemplate;

interface LabDriverInterface
{
    public function startInstance(LabInstance $instance, LabTemplate $template, int $assignedPort): array;

    public function stopInstance(LabInstance $instance): array;

    public function restartInstance(LabInstance $instance): array;

    public function destroyInstance(LabInstance $instance): array;

    public function upgradeInstance(LabInstance $instance, LabTemplate $targetTemplate, string $strategy, int $assignedPort): array;
}
