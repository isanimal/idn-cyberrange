<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateChallengeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'lab_template_id' => ['sometimes', 'uuid', 'exists:lab_templates,id'],
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'string'],
            'points' => ['sometimes', 'integer', 'min:0'],
            'flag' => ['sometimes', 'string', 'min:3', 'max:255'],
            'max_attempts' => ['sometimes', 'integer', 'min:1', 'max:1000'],
            'cooldown_seconds' => ['sometimes', 'integer', 'min:0', 'max:3600'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
