<?php

namespace App\Http\Requests\Challenge;

use Illuminate\Foundation\Http\FormRequest;

class SubmitChallengeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'flag' => ['required', 'string', 'min:3', 'max:255'],
        ];
    }
}
