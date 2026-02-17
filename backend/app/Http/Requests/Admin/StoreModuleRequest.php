<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreModuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:modules,slug'],
            'description' => ['nullable', 'string'],
            'difficulty' => ['required', 'string', 'in:BASIC,INTERMEDIATE,ADVANCED'],
            'category' => ['nullable', 'string', 'max:120'],
            'est_minutes' => ['nullable', 'integer', 'min:1'],
            'status' => ['nullable', 'string', 'in:DRAFT,PUBLISHED,ARCHIVED'],
            'version' => ['nullable', 'string', 'max:32'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:60'],
            'cover_icon' => ['nullable', 'string', 'max:255'],
            'order_index' => ['required', 'integer', 'min:1'],
        ];
    }
}
