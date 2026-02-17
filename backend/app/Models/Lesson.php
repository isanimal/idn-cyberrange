<?php

namespace App\Models;

use App\Models\Concerns\UsesUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lesson extends Model
{
    use UsesUuid;

    protected $fillable = [
        'module_id',
        'title',
        'content',
        'content_markdown',
        'content_md',
        'order',
        'order_index',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    public function progress(): HasMany
    {
        return $this->hasMany(UserLessonProgress::class, 'lesson_id');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(LessonTask::class)->orderBy('order_index');
    }

    public function assets(): HasMany
    {
        return $this->hasMany(LessonAsset::class)->orderBy('order_index');
    }
}
