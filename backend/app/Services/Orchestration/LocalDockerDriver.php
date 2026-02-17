<?php

namespace App\Services\Orchestration;

use App\Models\LabInstance;
use App\Models\LabTemplate;
use Symfony\Component\Process\Process;

class LocalDockerDriver implements LabDriverInterface
{
    public function startInstance(LabInstance $instance, LabTemplate $template, int $assignedPort): array
    {
        $workdir = rtrim(config('labs.runtime_root'), '/').'/'.$instance->id;
        $composePath = $workdir.'/docker-compose.yml';

        if (! is_dir($workdir) && ! @mkdir($workdir, 0775, true) && ! is_dir($workdir)) {
            throw new \RuntimeException('Failed to create workdir: '.$workdir);
        }

        $composeContent = $this->renderCompose($template, $assignedPort);
        file_put_contents($composePath, $composeContent);

        if (! app()->environment('testing')) {
            $process = new Process(['docker', 'compose', '-f', $composePath, 'up', '-d']);
            $process->run();

            if (! $process->isSuccessful()) {
                throw new \RuntimeException('Failed to start lab instance: '.$process->getErrorOutput());
            }
        }

        return [
            'container_name' => 'lab_'.$instance->id,
            'compose_path' => $composePath,
            'workdir' => $workdir,
            'network_name' => 'lab_net_'.$instance->id,
            'assigned_port' => $assignedPort,
        ];
    }

    public function stopInstance(LabInstance $instance): array
    {
        $composePath = data_get($instance->runtime_metadata, 'compose_path');

        if ($composePath && ! app()->environment('testing')) {
            $process = new Process(['docker', 'compose', '-f', $composePath, 'down', '-v']);
            $process->run();

            if (! $process->isSuccessful()) {
                throw new \RuntimeException('Failed to stop lab instance: '.$process->getErrorOutput());
            }
        }

        return ['status' => 'stopped'];
    }

    public function restartInstance(LabInstance $instance): array
    {
        $composePath = data_get($instance->runtime_metadata, 'compose_path');

        if ($composePath && ! app()->environment('testing')) {
            $process = new Process(['docker', 'compose', '-f', $composePath, 'restart']);
            $process->run();

            if (! $process->isSuccessful()) {
                throw new \RuntimeException('Failed to restart lab instance: '.$process->getErrorOutput());
            }
        }

        return ['status' => 'restarted'];
    }

    public function destroyInstance(LabInstance $instance): array
    {
        $composePath = data_get($instance->runtime_metadata, 'compose_path');
        $workdir = data_get($instance->runtime_metadata, 'workdir');

        if ($composePath && ! app()->environment('testing')) {
            $process = new Process(['docker', 'compose', '-f', $composePath, 'down', '-v']);
            $process->run();
        }

        if ($workdir && is_dir($workdir)) {
            $this->deleteDirectory($workdir);
        }

        return ['status' => 'destroyed'];
    }

    public function upgradeInstance(LabInstance $instance, LabTemplate $targetTemplate, string $strategy, int $assignedPort): array
    {
        $this->destroyInstance($instance);

        return $this->startInstance($instance, $targetTemplate, $assignedPort) + [
            'strategy' => $strategy,
            'target_template_id' => $targetTemplate->id,
        ];
    }

    private function renderCompose(LabTemplate $template, int $assignedPort): string
    {
        $basePort = (int) ($template->configuration_base_port ?? $template->internal_port ?? 80);

        if (($template->configuration_type ?? 'docker-compose') === 'docker-compose' && $template->configuration_content) {
            return str_replace(['${PORT}', '${BASE_PORT}'], [(string) $assignedPort, (string) $basePort], $template->configuration_content);
        }

        $image = $template->docker_image ?? 'nginx:alpine';

        return "version: '3.9'\nservices:\n  app:\n    image: {$image}\n    ports:\n      - \"{$assignedPort}:{$basePort}\"\n";
    }

    private function deleteDirectory(string $directory): void
    {
        $items = @scandir($directory) ?: [];
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }
            $path = $directory.'/'.$item;
            if (is_dir($path)) {
                $this->deleteDirectory($path);
            } else {
                @unlink($path);
            }
        }
        @rmdir($directory);
    }
}
