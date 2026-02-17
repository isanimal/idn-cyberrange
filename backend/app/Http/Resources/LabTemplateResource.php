<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LabTemplateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'template_family_uuid' => $this->template_family_uuid,
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
            'is_latest' => (bool) $this->is_latest,
            'published_at' => optional($this->published_at)?->toIso8601String(),
            'changelog' => $this->changelog ?? [],
            'lab_summary' => $this->lab_summary ?? (object) [],
            'configuration' => [
                'docker_image' => $this->docker_image,
                'internal_port' => $this->internal_port,
                'env_vars' => $this->env_vars ?? (object) [],
                'resource_limits' => $this->resource_limits ?? (object) [],
            ],
            'created_at' => optional($this->created_at)?->toIso8601String(),
            'updated_at' => optional($this->updated_at)?->toIso8601String(),
        ];
    }
}
