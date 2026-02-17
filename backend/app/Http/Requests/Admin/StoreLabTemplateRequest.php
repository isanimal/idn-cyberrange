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
            'slug' => [
                'required',
                'string',
                'max:120',
                Rule::unique('lab_templates', 'slug')
                    ->where(fn ($query) => $query->where('is_latest', true)->whereNull('deleted_at')),
            ],
            'title' => ['required', 'string', 'max:255'],
            'difficulty' => ['required', 'string', 'max:50'],
            'category' => ['required', 'string', 'max:100'],
            'short_description' => ['required', 'string', 'max:500'],
            'long_description' => ['nullable', 'string', 'required_without:guide_markdown'],
            'guide_markdown' => ['nullable', 'string', 'required_without:long_description'],
            'estimated_time_minutes' => ['nullable', 'integer', 'min:1'],
            'est_minutes' => ['nullable', 'integer', 'min:1'],
            'objectives' => ['nullable', 'array'],
            'prerequisites' => ['nullable', 'array'],
            'tags' => ['nullable', 'array'],
            'assets' => ['nullable', 'array'],
            'version' => ['nullable', 'string', 'max:32'],
            'status' => ['nullable', Rule::enum(LabTemplateStatus::class)],
            'lab_summary' => ['nullable', 'array'],
            'configuration' => ['nullable', 'array'],
            'configuration.type' => ['nullable', Rule::in(['docker-compose', 'dockerfile'])],
            'configuration.content' => ['nullable', 'string', 'max:65535'],
            'configuration.base_port' => ['nullable', 'integer', 'min:1', 'max:65535'],

            'docker_compose_yaml' => ['nullable', 'string', 'max:65535'],

            'docker_image' => ['nullable', 'string', 'max:255'],
            'internal_port' => ['required', 'integer', 'min:1', 'max:65535'],
            'env_vars' => ['nullable', 'array'],
            'resource_limits' => ['nullable', 'array'],
        ];
    }
}
