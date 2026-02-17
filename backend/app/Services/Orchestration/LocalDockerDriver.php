<?php

namespace App\Services\Orchestration;

use App\Models\LabInstance;
use App\Models\LabTemplate;
use Symfony\Component\Process\Process;

class LocalDockerDriver implements LabDriverInterface
{
    public function startInstance(LabInstance $instance, LabTemplate $template, int $assignedPort): array
    {
        $workdir = rtrim((string) config('labs.runtime_root'), '/').'/'.$instance->id;
        $composePath = $workdir.'/docker-compose.yml';
        $projectName = 'lab_'.str_replace('-', '', substr($instance->id, 0, 12));

        if (! is_dir($workdir) && ! @mkdir($workdir, 0775, true) && ! is_dir($workdir)) {
            throw new \RuntimeException('Failed to create workdir: '.$workdir);
        }

        $composeContent = $this->renderCompose($instance, $template, $assignedPort);
        file_put_contents($composePath, $composeContent);

        if (! app()->environment('testing')) {
            $process = new Process([
                'docker', 'compose',
                '--project-name', $projectName,
                '-f', $composePath,
                'up', '-d', '--remove-orphans',
            ]);
            $process->setTimeout((int) config('labs.compose_timeout_seconds', 30));
            $process->run();

            if (! $process->isSuccessful()) {
                throw new \RuntimeException('Failed to start lab instance: '.$process->getErrorOutput());
            }
        }

        $containerId = null;
        if (! app()->environment('testing')) {
            $ps = new Process([
                'docker', 'compose',
                '--project-name', $projectName,
                '-f', $composePath,
                'ps', '-q', 'app',
            ]);
            $ps->setTimeout((int) config('labs.compose_timeout_seconds', 30));
            $ps->run();
            if ($ps->isSuccessful()) {
                $containerId = trim($ps->getOutput()) ?: null;
            }
        }

        $network = [
            'ip_address' => null,
            'gateway' => null,
            'ports' => [],
        ];

        if (! app()->environment('testing') && $containerId) {
            $network = $this->inspectContainerNetwork($containerId);
        }

        return [
            'container_name' => 'lab_'.$instance->id,
            'container_id' => $containerId,
            'compose_path' => $composePath,
            'workdir' => $workdir,
            'project_name' => $projectName,
            'network_name' => 'lab_'.$instance->id,
            'assigned_port' => $assignedPort,
            'ip_address' => $network['ip_address'],
            'gateway' => $network['gateway'],
            'ports' => $network['ports'],
        ];
    }

    public function stopInstance(LabInstance $instance): array
    {
        $composePath = data_get($instance->runtime_metadata, 'compose_path');
        $projectName = (string) (data_get($instance->runtime_metadata, 'project_name') ?: 'lab_'.str_replace('-', '', substr($instance->id, 0, 12)));

        if ($composePath && ! app()->environment('testing')) {
            $process = new Process([
                'docker', 'compose',
                '--project-name', $projectName,
                '-f', $composePath,
                'down', '--volumes', '--remove-orphans',
            ]);
            $process->setTimeout((int) config('labs.compose_timeout_seconds', 30));
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
        $projectName = (string) (data_get($instance->runtime_metadata, 'project_name') ?: 'lab_'.str_replace('-', '', substr($instance->id, 0, 12)));

        if ($composePath && ! app()->environment('testing')) {
            $process = new Process([
                'docker', 'compose',
                '--project-name', $projectName,
                '-f', $composePath,
                'restart',
            ]);
            $process->setTimeout((int) config('labs.compose_timeout_seconds', 30));
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
        $projectName = (string) (data_get($instance->runtime_metadata, 'project_name') ?: 'lab_'.str_replace('-', '', substr($instance->id, 0, 12)));

        if ($composePath && ! app()->environment('testing')) {
            $process = new Process([
                'docker', 'compose',
                '--project-name', $projectName,
                '-f', $composePath,
                'down', '--volumes', '--remove-orphans',
            ]);
            $process->setTimeout((int) config('labs.compose_timeout_seconds', 30));
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

    private function renderCompose(LabInstance $instance, LabTemplate $template, int $assignedPort): string
    {
        $raw = trim((string) ($template->configuration_content ?? ''));

        if ($raw !== '' && strlen($raw) <= 65535 && $this->isComposeSafe($raw)) {
            $rendered = str_replace('${PORT}', (string) $assignedPort, $raw);
            $guarded = $this->injectRuntimeGuards($rendered, $instance, $template);
            if ($guarded !== null) {
                return $guarded;
            }
        }

        return $this->buildFallbackCompose($instance, $template, $assignedPort);
    }

    private function isComposeSafe(string $compose): bool
    {
        $forbidden = [
            '/docker\\.sock/i',
            '/privileged\\s*:\\s*true/i',
            '/network_mode\\s*:\\s*["\']?host["\']?/i',
            '/pid\\s*:\\s*["\']?host["\']?/i',
            '/ipc\\s*:\\s*["\']?host["\']?/i',
            '/cap_add\\s*:/i',
            '/devices\\s*:/i',
            '/security_opt\\s*:/i',
        ];

        foreach ($forbidden as $pattern) {
            if (preg_match($pattern, $compose) === 1) {
                return false;
            }
        }

        return true;
    }

    private function injectRuntimeGuards(string $compose, LabInstance $instance, LabTemplate $template): ?string
    {
        if (! preg_match('/^\\s*services\\s*:/m', $compose)) {
            return null;
        }

        $networkName = 'lab_'.$instance->id;
        $memoryLimit = (string) ($template->resource_limits['memory'] ?? config('labs.default_memory_limit', '512m'));
        $cpuLimit = (string) ($template->resource_limits['cpus'] ?? config('labs.default_cpu_limit', '0.5'));

        $env = is_array($template->env_vars) ? $template->env_vars : [];
        $env['LAB_INSTANCE_ID'] = $instance->id;
        $env['LAB_TEMPLATE_ID'] = $template->id;
        $env['LAB_USER_ID'] = $instance->user_id;

        $updated = preg_replace_callback('/^(\\s*)app\\s*:\\s*$/m', function (array $matches) use ($instance, $template, $networkName, $memoryLimit, $cpuLimit, $env): string {
            $indent = $matches[1];
            $child = $indent.'  ';
            $leaf = $child.'  ';
            $lines = [];

            $lines[] = $child.'labels:';
            $lines[] = $leaf.'lab_instance_id: "'.$instance->id.'"';
            $lines[] = $leaf.'user_id: "'.$instance->user_id.'"';
            $lines[] = $leaf.'lab_template_id: "'.$template->id.'"';

            if (! empty($env)) {
                $lines[] = $child.'environment:';
                foreach ($env as $key => $value) {
                    if (! is_scalar($value)) {
                        continue;
                    }
                    $lines[] = $leaf.$key.': "'.str_replace('"', '\\"', (string) $value).'"';
                }
            }

            $lines[] = $child.'read_only: true';
            $lines[] = $child.'tmpfs:';
            $lines[] = $leaf.'- /tmp';
            $lines[] = $child.'security_opt:';
            $lines[] = $leaf.'- no-new-privileges:true';
            $lines[] = $child.'cap_drop:';
            $lines[] = $leaf.'- ALL';
            $lines[] = $child.'networks:';
            $lines[] = $leaf.'- '.$networkName;
            $lines[] = $child.'deploy:';
            $lines[] = $leaf.'resources:';
            $lines[] = $leaf.'  limits:';
            $lines[] = $leaf.'    memory: "'.$memoryLimit.'"';
            $lines[] = $leaf.'    cpus: "'.$cpuLimit.'"';

            return $matches[0]."\n".implode("\n", $lines);
        }, $compose, 1);

        if (! is_string($updated) || $updated === $compose) {
            return null;
        }

        if (! preg_match('/^\\s*networks\\s*:/m', $updated)) {
            $updated .= "\nnetworks:\n  {$networkName}:\n    driver: bridge\n";
        }

        return $updated;
    }

    private function buildFallbackCompose(LabInstance $instance, LabTemplate $template, int $assignedPort): string
    {
        $image = (string) ($template->docker_image ?: 'nginx:alpine');
        $internalPort = (int) ($template->internal_port ?: ($template->configuration_base_port ?: 80));
        $memoryLimit = (string) ($template->resource_limits['memory'] ?? config('labs.default_memory_limit', '512m'));
        $cpuLimit = (string) ($template->resource_limits['cpus'] ?? config('labs.default_cpu_limit', '0.5'));
        $networkName = 'lab_'.$instance->id;

        return "version: '3.9'\n"
            ."services:\n"
            ."  app:\n"
            ."    image: {$image}\n"
            ."    ports:\n"
            ."      - \"{$assignedPort}:{$internalPort}\"\n"
            ."    labels:\n"
            ."      lab_instance_id: \"{$instance->id}\"\n"
            ."      user_id: \"{$instance->user_id}\"\n"
            ."      lab_template_id: \"{$template->id}\"\n"
            ."    read_only: true\n"
            ."    tmpfs:\n"
            ."      - /tmp\n"
            ."    security_opt:\n"
            ."      - no-new-privileges:true\n"
            ."    cap_drop:\n"
            ."      - ALL\n"
            ."    networks:\n"
            ."      - {$networkName}\n"
            ."    deploy:\n"
            ."      resources:\n"
            ."        limits:\n"
            ."          memory: \"{$memoryLimit}\"\n"
            ."          cpus: \"{$cpuLimit}\"\n"
            ."networks:\n"
            ."  {$networkName}:\n"
            ."    driver: bridge\n";
    }

    private function inspectContainerNetwork(string $containerId): array
    {
        $process = new Process(['docker', 'inspect', $containerId]);
        $process->setTimeout((int) config('labs.compose_timeout_seconds', 30));
        $process->run();

        if (! $process->isSuccessful()) {
            return [
                'ip_address' => null,
                'gateway' => null,
                'ports' => [],
            ];
        }

        $decoded = json_decode($process->getOutput(), true);
        if (! is_array($decoded) || ! isset($decoded[0]) || ! is_array($decoded[0])) {
            return [
                'ip_address' => null,
                'gateway' => null,
                'ports' => [],
            ];
        }

        $inspect = $decoded[0];
        $ports = [];
        $rawPorts = data_get($inspect, 'NetworkSettings.Ports');
        if (is_array($rawPorts)) {
            foreach ($rawPorts as $containerPort => $bindings) {
                if (! is_array($bindings)) {
                    continue;
                }

                foreach ($bindings as $binding) {
                    $ports[] = [
                        'container_port' => $containerPort,
                        'host_port' => $binding['HostPort'] ?? null,
                    ];
                }
            }
        }

        return [
            'ip_address' => data_get($inspect, 'NetworkSettings.IPAddress'),
            'gateway' => data_get($inspect, 'NetworkSettings.Gateway'),
            'ports' => $ports,
        ];
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
