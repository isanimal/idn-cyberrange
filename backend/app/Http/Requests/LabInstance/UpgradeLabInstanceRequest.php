<?php

namespace App\Http\Requests\LabInstance;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpgradeLabInstanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'target_template_id' => ['nullable', 'uuid', 'exists:lab_templates,id'],
            'strategy' => ['required', Rule::in(['RESET', 'IN_PLACE'])],
        ];
    }
}
