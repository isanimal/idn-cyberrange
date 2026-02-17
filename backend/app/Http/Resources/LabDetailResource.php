<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class LabDetailResource extends LabTemplateResource
{
    public function toArray(Request $request): array
    {
        $base = parent::toArray($request);
        $base['user_instance'] = $this->whenLoaded('user_instance', function () {
            return $this->user_instance ? (new LabInstanceResource($this->user_instance))->resolve() : null;
        }, null);

        return $base;
    }
}
