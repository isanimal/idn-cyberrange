<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateModuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $moduleId = $this->route('id');

        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:255', Rule::unique('modules', 'slug')->ignore($moduleId)],
            'description' => ['sometimes', 'nullable', 'string'],
            'difficulty' => ['sometimes', 'string', 'in:BASIC,INTERMEDIATE,ADVANCED'],
            'category' => ['sometimes', 'nullable', 'string', 'max:120'],
            'est_minutes' => ['sometimes', 'integer', 'min:1'],
            'status' => ['sometimes', 'string', 'in:DRAFT,PUBLISHED,ARCHIVED'],
            'version' => ['sometimes', 'string', 'max:32'],
            'tags' => ['sometimes', 'nullable', 'array'],
            'tags.*' => ['string', 'max:60'],
            'cover_icon' => ['sometimes', 'nullable', 'string', 'max:255'],
            'order_index' => ['sometimes', 'integer', 'min:1'],
        ];
    }
}
