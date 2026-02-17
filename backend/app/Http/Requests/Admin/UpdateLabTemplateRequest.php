<?php

namespace App\Http\Requests\Admin;

use App\Enums\LabTemplateStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLabTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $labId = $this->route('id');

        return [
            'slug' => ['sometimes', 'string', 'max:120', Rule::unique('lab_templates', 'slug')->ignore($labId)],
            'title' => ['sometimes', 'string', 'max:255'],
            'difficulty' => ['sometimes', 'string', 'max:50'],
            'category' => ['sometimes', 'string', 'max:100'],
            'short_description' => ['sometimes', 'string', 'max:500'],
            'long_description' => ['sometimes', 'string'],
            'estimated_time_minutes' => ['sometimes', 'integer', 'min:1'],
            'objectives' => ['sometimes', 'array'],
            'prerequisites' => ['sometimes', 'array'],
            'tags' => ['sometimes', 'array'],
            'version' => ['sometimes', 'string', 'max:32'],
            'status' => ['sometimes', Rule::enum(LabTemplateStatus::class)],
            'lab_summary' => ['nullable', 'array'],
            'docker_image' => ['sometimes', 'string', 'max:255'],
            'internal_port' => ['sometimes', 'integer', 'min:1', 'max:65535'],
            'env_vars' => ['nullable', 'array'],
            'resource_limits' => ['nullable', 'array'],
        ];
    }
}
