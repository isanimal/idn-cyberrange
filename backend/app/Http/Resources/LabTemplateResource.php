<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LabTemplateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $configType = $this->configuration_type ?? 'docker-compose';
        $configContent = $this->configuration_content
            ?? ("services:\n  app:\n    image: ".($this->docker_image ?? 'nginx:alpine')."\n    ports:\n      - \"\\$".'{PORT}:'.($this->internal_port ?? 80)."\"\n");

        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'difficulty' => $this->difficulty,
            'category' => $this->category,
            'short_description' => $this->short_description,
            'long_description' => $this->long_description,
            'estimated_time_minutes' => $this->estimated_time_minutes,
            'objectives' => $this->objectives ?? [],
            'prerequisites' => $this->prerequisites ?? [],
            'tags' => $this->tags ?? [],
            'version' => $this->version,
            'status' => $this->status?->value ?? $this->status,
            'assets' => $this->assets ?? [],
            'changelog' => $this->changelog ?? [],
            'configuration' => [
                'type' => $configType,
                'content' => $configContent,
                'base_port' => (int) ($this->configuration_base_port ?? $this->internal_port ?? 80),
            ],
            'created_at' => optional($this->created_at)?->toIso8601String(),
            'updated_at' => optional($this->updated_at)?->toIso8601String(),
        ];
    }
}
