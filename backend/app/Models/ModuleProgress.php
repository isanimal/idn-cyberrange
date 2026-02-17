<?php

namespace App\Models;

use App\Models\Concerns\UsesUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ModuleProgress extends Model
{
    use UsesUuid;

    protected $table = 'module_progress';

    protected $fillable = [
        'user_id',
        'module_id',
        'progress_percent',
        'is_completed',
        'last_accessed_at',
    ];

    protected function casts(): array
    {
        return [
            'is_completed' => 'boolean',
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

