<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreLessonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'content_md' => ['required', 'string'],
            'order' => ['required', 'integer', 'min:1'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
