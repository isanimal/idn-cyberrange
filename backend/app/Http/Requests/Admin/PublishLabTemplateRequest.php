<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class PublishLabTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'version' => ['required', 'string', 'max:32'],
            'notes' => ['required', 'string', 'max:1000'],
        ];
    }
}
