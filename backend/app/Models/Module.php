<?php

namespace App\Models;

use App\Enums\ModuleLevel;
use App\Enums\ModuleStatus;
use App\Models\Concerns\UsesUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Module extends Model
{
    use UsesUuid;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'level',
        'status',
        'order_index',
    ];

    protected function casts(): array
    {
        return [
            'level' => ModuleLevel::class,
            'status' => ModuleStatus::class,
        ];
    }

    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class);
    }

    public function progress(): HasMany
    {
        return $this->hasMany(ModuleProgress::class);
    }

    public function userProgress(): HasOne
    {
        return $this->hasOne(ModuleProgress::class);
    }
}
