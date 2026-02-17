<?php

namespace App\Http\Requests\LabInstance;

use App\Enums\LabInstanceState;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLabInstanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'notes' => ['sometimes', 'nullable', 'string'],
            'progress_percent' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'state' => ['sometimes', Rule::enum(LabInstanceState::class)],
        ];
    }
}
