<?php

namespace App\Http\Requests\LabInstance;

use Illuminate\Foundation\Http\FormRequest;

class ActivateLabRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'pin_version' => ['nullable', 'string', 'max:32'],
        ];
    }
}
