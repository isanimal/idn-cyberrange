<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LabInstanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $template = $this->whenLoaded('template');
        $host = (string) config('labs.host');
        $assignedPort = $this->assigned_port ? (int) $this->assigned_port : null;
        $internalPort = $template?->internal_port ? (int) $template->internal_port : 80;
        $runtime = $this->whenLoaded('runtime');
        $runtimeAccessUrl = data_get($runtime, 'access_url');
        $runtimePublicHost = data_get($runtime, 'public_host');
        $runtimeHostPort = data_get($runtime, 'host_port');
        $accessUrl = $this->connection_url ?: $runtimeAccessUrl;

        $runtimeMeta = is_array($this->runtime_metadata) ? $this->runtime_metadata : [];
        $gateway = data_get($runtimeMeta, 'gateway', $host);
        $ipAddress = data_get($runtimeMeta, 'ip_address', null);
        $resolvedPorts = data_get($runtimeMeta, 'ports');

        $accessUrls = [];
        if ($accessUrl) {
            $accessUrls[] = [
                'label' => 'Public',
                'url' => $accessUrl,
            ];
        } elseif ($assignedPort) {
            $accessUrls[] = [
                'label' => 'HTTP',
                'url' => sprintf('http://%s:%d', $host, $assignedPort),
            ];
        }

        return [
            'instance_id' => $this->id,
            'user_id' => $this->user_id,
            'module_id' => $this->module_id,
            'lab_template_id' => $this->lab_template_id,
            'template_version_pinned' => $this->template_version_pinned,
            'state' => $this->state?->value ?? $this->state,
            'progress_percent' => $this->progress_percent,
            'attempts_count' => $this->attempts_count,
            'notes' => $this->notes,
            'score' => $this->score,
            'started_at' => optional($this->started_at)?->toIso8601String(),
            'last_activity_at' => optional($this->last_activity_at)?->toIso8601String(),
            'completed_at' => optional($this->completed_at)?->toIso8601String(),
            'expires_at' => optional($this->expires_at)?->toIso8601String(),
            'assigned_port' => $this->assigned_port,
            'host_port' => $runtimeHostPort ?: $assignedPort,
            'public_host' => $runtimePublicHost,
            'access_url' => $accessUrl,
            'connection_url' => $accessUrl,
            'runtime_metadata' => $this->runtime_metadata ?? (object) [],
            'last_error' => $this->last_error,
            'status' => $this->state?->value ?? $this->state,
            'ip_address' => $ipAddress,
            'exposed_ports' => is_array($resolvedPorts) && ! empty($resolvedPorts)
                ? $resolvedPorts
                : ($assignedPort ? [[
                    'container_port' => $internalPort,
                    'host_port' => $assignedPort,
                ]] : []),
            'gateway' => $gateway,
            'max_ttl' => ((int) config('labs.max_ttl_minutes', 120)) * 60,
            'resources' => [
                'cpu' => null,
                'memory_mb' => null,
            ],
            'access_urls' => $accessUrls,
        ];
    }
}
