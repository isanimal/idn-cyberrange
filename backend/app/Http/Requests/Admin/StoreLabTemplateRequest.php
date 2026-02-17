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
            'slug' => ['required', 'string', 'max:120'],
            'title' => ['required', 'string', 'max:255'],
            'difficulty' => ['required', 'string', 'max:50'],
            'category' => ['required', 'string', 'max:100'],
            'short_description' => ['required', 'string', 'max:500'],
            'long_description' => ['required', 'string'],
            'estimated_time_minutes' => ['required', 'integer', 'min:1'],
            'objectives' => ['required', 'array'],
            'prerequisites' => ['required', 'array'],
            'tags' => ['required', 'array'],
            'assets' => ['nullable', 'array'],
            'version' => ['required', 'string', 'max:32'],
            'status' => ['nullable', Rule::enum(LabTemplateStatus::class)],
            'lab_summary' => ['nullable', 'array'],
            'configuration' => ['required', 'array'],
            'configuration.type' => ['required', Rule::in(['docker-compose', 'dockerfile'])],
            'configuration.content' => ['required', 'string'],
            'configuration.base_port' => ['required', 'integer', 'min:1', 'max:65535'],

            'docker_image' => ['nullable', 'string', 'max:255'],
            'internal_port' => ['nullable', 'integer', 'min:1', 'max:65535'],
            'env_vars' => ['nullable', 'array'],
            'resource_limits' => ['nullable', 'array'],
        ];
    }
}
