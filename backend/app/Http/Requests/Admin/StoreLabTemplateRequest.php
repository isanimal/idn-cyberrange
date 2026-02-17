<?php

namespace App\Http\Requests\Admin;

use App\Enums\LabTemplateStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLabTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'slug' => ['required', 'string', 'max:120', Rule::unique('lab_templates', 'slug')],
            'title' => ['required', 'string', 'max:255'],
            'difficulty' => ['required', 'string', 'max:50'],
            'category' => ['required', 'string', 'max:100'],
            'short_description' => ['required', 'string', 'max:500'],
            'long_description' => ['required', 'string'],
            'estimated_time_minutes' => ['required', 'integer', 'min:1'],
            'objectives' => ['required', 'array'],
            'prerequisites' => ['required', 'array'],
            'tags' => ['required', 'array'],
            'version' => ['required', 'string', 'max:32'],
            'status' => ['nullable', Rule::enum(LabTemplateStatus::class)],
            'lab_summary' => ['nullable', 'array'],
            'docker_image' => ['required', 'string', 'max:255'],
            'internal_port' => ['required', 'integer', 'min:1', 'max:65535'],
            'env_vars' => ['nullable', 'array'],
            'resource_limits' => ['nullable', 'array'],
        ];
    }
}
