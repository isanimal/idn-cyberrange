<?php

namespace App\Services\Orchestration;

use App\Models\LabInstance;
use App\Models\LabTemplate;
use Symfony\Component\Process\Process;

class LocalDockerDriver implements LabDriverInterface
{
    public function startInstance(LabInstance $instance, LabTemplate $template, int $assignedPort): array
    {
        if (app()->environment('testing')) {
            return [
                'container_name' => $this->containerName($instance->id),
                'container_id' => 'testing-container',
                'network' => config('labs.network'),
                'driver_mode' => 'testing-bypass',
            ];
        }

        return $this->runContainer($instance, $template, $assignedPort);
    }

    public function stopInstance(LabInstance $instance): array
    {
        if (app()->environment('testing')) {
            return ['container_name' => $this->containerName($instance->id), 'status' => 'stopped', 'driver_mode' => 'testing-bypass'];
        }

        $container = $this->containerName($instance->id);
        $process = new Process(['docker', 'stop', $container]);
        $process->run();

        if (! $process->isSuccessful()) {
            throw new \RuntimeException('Failed to stop container: '.$process->getErrorOutput());
        }

        return ['container_name' => $container, 'status' => 'stopped'];
    }

    public function restartInstance(LabInstance $instance): array
    {
        if (app()->environment('testing')) {
            return ['container_name' => $this->containerName($instance->id), 'status' => 'restarted', 'driver_mode' => 'testing-bypass'];
        }

        $container = $this->containerName($instance->id);
        $process = new Process(['docker', 'restart', $container]);
        $process->run();

        if (! $process->isSuccessful()) {
            throw new \RuntimeException('Failed to restart container: '.$process->getErrorOutput());
        }

        return ['container_name' => $container, 'status' => 'restarted'];
    }

    public function destroyInstance(LabInstance $instance): array
    {
        if (app()->environment('testing')) {
            return ['container_name' => $this->containerName($instance->id), 'status' => 'destroyed', 'driver_mode' => 'testing-bypass'];
        }

        $container = $this->containerName($instance->id);
        $process = new Process(['docker', 'rm', '-f', $container]);
        $process->run();

        if (! $process->isSuccessful()) {
            throw new \RuntimeException('Failed to remove container: '.$process->getErrorOutput());
        }

        return ['container_name' => $container, 'status' => 'destroyed'];
    }

    public function upgradeInstance(LabInstance $instance, LabTemplate $targetTemplate, string $strategy, int $assignedPort): array
    {
        if (app()->environment('testing')) {
            return [
                'strategy' => $strategy,
                'target_template_id' => $targetTemplate->id,
                'assigned_port' => $assignedPort,
                'driver_mode' => 'testing-bypass',
            ];
        }

        // Reset/in-place both recreate runtime with pinned target image.
        $this->destroyIfExists($instance);
        $run = $this->runContainer($instance, $targetTemplate, $assignedPort);

        return [
            'strategy' => $strategy,
            'target_template_id' => $targetTemplate->id,
            'assigned_port' => $assignedPort,
            'container' => $run,
        ];
    }

    private function runContainer(LabInstance $instance, LabTemplate $template, int $assignedPort): array
    {
        $container = $this->containerName($instance->id);
        $network = config('labs.network');
        $command = [
            'docker', 'run', '-d', '--name', $container,
            '--network', $network,
            '-p', $assignedPort.':'.$template->internal_port,
        ];

        foreach (($template->env_vars ?? []) as $key => $value) {
            $command[] = '-e';
            $command[] = $key.'='.$value;
        }

        $command[] = $template->docker_image;

        $process = new Process($command);
        $process->run();

        if (! $process->isSuccessful()) {
            throw new \RuntimeException('Failed to start lab instance: '.$process->getErrorOutput());
        }

        return [
            'container_name' => $container,
            'container_id' => trim($process->getOutput()),
            'network' => $network,
        ];
    }

    private function destroyIfExists(LabInstance $instance): void
    {
        $container = $this->containerName($instance->id);
        $process = new Process(['docker', 'rm', '-f', $container]);
        $process->run();
        // ignore errors if the container does not exist
    }

    private function containerName(string $instanceId): string
    {
        return 'lab_'.$instanceId;
    }
}
