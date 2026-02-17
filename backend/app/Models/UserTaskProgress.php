<?php

namespace App\Models;

use App\Models\Concerns\UsesUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserTaskProgress extends Model
{
    use UsesUuid;

    protected $table = 'user_task_progress';

    protected $fillable = [
        'user_id',
        'task_id',
        'is_done',
        'done_at',
    ];

    protected function casts(): array
    {
        return [
            'is_done' => 'boolean',
            'done_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(LessonTask::class, 'task_id');
    }
}
