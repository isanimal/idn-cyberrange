<?php

namespace App\Services\Orchestration;

use App\Models\LabInstance;
use Symfony\Component\Process\Process;

class AdminOrchestrationInspector
{
    public function inspect(LabInstance $instance): array
    {
        $containerRef = (string) (
            data_get($instance->runtime_metadata, 'container_id')
            ?? data_get($instance->runtime_metadata, 'container_name')
            ?? data_get($instance->runtime?->runtime_meta, 'container_id')
            ?? data_get($instance->runtime?->runtime_meta, 'container_name')
            ?? ''
        );

        $dockerInspect = $this->dockerInspect($containerRef);
        $dockerStats = $this->dockerStats($containerRef);
        $dockerLogs = $this->dockerLogs($containerRef);

        $dockerState = data_get($dockerInspect, 'State.Status');
        $status = $this->resolveStatus($instance->state?->value ?? (string) $instance->state, $dockerState);

        return [
            'instance_id' => $instance->id,
            'user' => [
                'id' => $instance->user?->id,
                'name' => $instance->user?->name,
                'email' => $instance->user?->email,
            ],
            'lab' => [
                'id' => $instance->template?->id,
                'title' => $instance->template?->title,
                'slug' => $instance->template?->slug,
                'image' => $instance->template?->docker_image,
            ],
            'container_id' => $containerRef ?: null,
            'status' => $status,
            'started_at' => optional($instance->started_at)?->toIso8601String(),
            'uptime_seconds' => $instance->started_at ? now()->diffInSeconds($instance->started_at) : 0,
            'resources' => [
                'cpu_percent' => $dockerStats['cpu_percent'],
                'mem_mb' => $dockerStats['mem_mb'],
            ],
            'network' => [
                'container_ip' => data_get($dockerInspect, 'NetworkSettings.IPAddress'),
                'gateway' => data_get($dockerInspect, 'NetworkSettings.Gateway'),
                'exposed_ports' => $this->extractPorts($dockerInspect),
            ],
            'logs_tail' => $dockerLogs,
            'env' => $this->extractEnv($dockerInspect),
            'last_error' => $instance->last_error,
        ];
    }

    private function dockerInspect(string $containerRef): array
    {
        if ($containerRef === '' || app()->environment('testing')) {
            return [];
        }

        $process = new Process(['docker', 'inspect', $containerRef]);
        $process->run();

        if (! $process->isSuccessful()) {
            return [];
        }

        $decoded = json_decode($process->getOutput(), true);
        if (! is_array($decoded) || ! isset($decoded[0]) || ! is_array($decoded[0])) {
            return [];
        }

        return $decoded[0];
    }

    private function dockerLogs(string $containerRef): string
    {
        if ($containerRef === '' || app()->environment('testing')) {
            return 'not implemented';
        }

        $process = new Process(['docker', 'logs', '--tail', '200', $containerRef]);
        $process->run();

        if (! $process->isSuccessful()) {
            return 'not implemented';
        }

        $output = trim($process->getOutput()."\n".$process->getErrorOutput());

        return $output !== '' ? $output : 'not implemented';
    }

    private function dockerStats(string $containerRef): array
    {
        if ($containerRef === '' || app()->environment('testing')) {
            return ['cpu_percent' => null, 'mem_mb' => null];
        }

        $process = new Process(['docker', 'stats', '--no-stream', '--format', '{{json .}}', $containerRef]);
        $process->run();

        if (! $process->isSuccessful()) {
            return ['cpu_percent' => null, 'mem_mb' => null];
        }

        $decoded = json_decode(trim($process->getOutput()), true);
        if (! is_array($decoded)) {
            return ['cpu_percent' => null, 'mem_mb' => null];
        }

        return [
            'cpu_percent' => $this->parseCpuPercent((string) ($decoded['CPUPerc'] ?? '')),
            'mem_mb' => $this->parseMemUsage((string) ($decoded['MemUsage'] ?? '')),
        ];
    }

    private function parseCpuPercent(string $value): ?float
    {
        if ($value === '') {
            return null;
        }

        $normalized = str_replace('%', '', trim($value));

        return is_numeric($normalized) ? (float) $normalized : null;
    }

    private function parseMemUsage(string $value): ?float
    {
        if ($value === '') {
            return null;
        }

        $first = trim(explode('/', $value)[0] ?? '');
        if ($first === '') {
            return null;
        }

        if (! preg_match('/^([0-9.]+)\s*([KMG]i?B)$/i', $first, $matches)) {
            return null;
        }

        $amount = (float) $matches[1];
        $unit = strtoupper($matches[2]);

        return match ($unit) {
            'KIB', 'KB' => round($amount / 1024, 2),
            'MIB', 'MB' => round($amount, 2),
            'GIB', 'GB' => round($amount * 1024, 2),
            default => null,
        };
    }

    private function extractPorts(array $dockerInspect): ?array
    {
        $ports = data_get($dockerInspect, 'NetworkSettings.Ports');
        if (! is_array($ports)) {
            return null;
        }

        $result = [];
        foreach ($ports as $containerPort => $bindings) {
            if (! is_array($bindings)) {
                $result[] = ['container_port' => $containerPort, 'host_port' => null];
                continue;
            }

            foreach ($bindings as $binding) {
                $result[] = [
                    'container_port' => $containerPort,
                    'host_port' => $binding['HostPort'] ?? null,
                ];
            }
        }

        return $result;
    }

    private function extractEnv(array $dockerInspect): array
    {
        $envRows = data_get($dockerInspect, 'Config.Env');
        if (! is_array($envRows)) {
            return [];
        }

        $result = [];
        foreach ($envRows as $row) {
            if (! is_string($row)) {
                continue;
            }
            [$key, $value] = array_pad(explode('=', $row, 2), 2, '');
            $result[$key] = $this->isSensitiveKey($key) ? '********' : $value;
        }

        return $result;
    }

    private function isSensitiveKey(string $key): bool
    {
        return (bool) preg_match('/(PASS|SECRET|TOKEN|KEY|FLAG)/i', $key);
    }

    private function resolveStatus(string $dbState, ?string $dockerState): string
    {
        if ($dockerState !== null) {
            return match (strtolower($dockerState)) {
                'running' => 'RUNNING',
                'created', 'restarting' => 'STARTING',
                'exited', 'dead' => 'STOPPED',
                default => 'ERROR',
            };
        }

        return match (strtoupper($dbState)) {
            'ACTIVE' => 'RUNNING',
            'INACTIVE', 'PAUSED', 'COMPLETED' => 'STOPPED',
            'ABANDONED' => 'ERROR',
            default => 'ERROR',
        };
    }
}

