<?php

namespace App\Models;

use App\Models\Concerns\UsesUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserModuleProgress extends Model
{
    use UsesUuid;

    protected $table = 'user_module_progress';

    protected $fillable = [
        'user_id',
        'module_id',
        'progress_percent',
        'started_at',
        'completed_at',
        'last_accessed_at',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'last_accessed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }
}

