<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChallengeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'lab_template_id' => $this->lab_template_id,
            'title' => $this->title,
            'description' => $this->description,
            'points' => $this->points,
            'max_attempts' => $this->max_attempts,
            'cooldown_seconds' => $this->cooldown_seconds,
            'is_active' => (bool) $this->is_active,
            'created_at' => optional($this->created_at)?->toIso8601String(),
            'updated_at' => optional($this->updated_at)?->toIso8601String(),
        ];
    }
}
