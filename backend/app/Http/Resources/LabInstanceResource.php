<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LabInstanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'instance_id' => $this->id,
            'user_id' => $this->user_id,
            'lab_template_id' => $this->lab_template_id,
            'template_version_pinned' => $this->template_version_pinned,
            'state' => $this->state?->value ?? $this->state,
            'progress_percent' => $this->progress_percent,
            'attempts_count' => $this->attempts_count,
            'notes' => $this->notes,
            'started_at' => optional($this->started_at)?->toIso8601String(),
            'last_activity_at' => optional($this->last_activity_at)?->toIso8601String(),
            'completed_at' => optional($this->completed_at)?->toIso8601String(),
            'expires_at' => optional($this->expires_at)?->toIso8601String(),
            'assigned_port' => $this->assigned_port,
            'connection_url' => $this->connection_url,
            'runtime_metadata' => $this->runtime_metadata ?? (object) [],
        ];
    }
}
