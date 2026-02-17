<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLessonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'content_md' => ['sometimes', 'string'],
            'order' => ['sometimes', 'integer', 'min:1'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
