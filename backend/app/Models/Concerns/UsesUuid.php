<?php

namespace App\Models\Concerns;

use Illuminate\Support\Str;

trait UsesUuid
{
    public static function bootUsesUuid(): void
    {
        static::creating(function ($model) {
            if (! $model->getKey()) {
                $model->{$model->getKeyName()} = (string) Str::uuid();
            }
        });
    }

    public function initializeUsesUuid(): void
    {
        $this->keyType = 'string';
        $this->incrementing = false;
    }
}
