<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreChallengeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'lab_template_id' => ['required', 'uuid', 'exists:lab_templates,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'points' => ['required', 'integer', 'min:0'],
            'flag' => ['required', 'string', 'min:3', 'max:255'],
            'max_attempts' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'cooldown_seconds' => ['nullable', 'integer', 'min:0', 'max:3600'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
