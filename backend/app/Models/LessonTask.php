<?php

namespace App\Models;

use App\Models\Concerns\UsesUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LessonTask extends Model
{
    use UsesUuid;

    protected $fillable = [
        'lesson_id',
        'title',
        'order_index',
        'points',
    ];

    protected function casts(): array
    {
        return [
            'order_index' => 'integer',
            'points' => 'integer',
        ];
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    public function userProgress(): HasMany
    {
        return $this->hasMany(UserTaskProgress::class, 'task_id');
    }
}
