<?php

namespace App\Models;

use App\Models\Concerns\UsesUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserModule extends Model
{
    use UsesUuid;

    public const STATUS_ASSIGNED = 'ASSIGNED';
    public const STATUS_ACTIVE = 'ACTIVE';
    public const STATUS_LOCKED = 'LOCKED';

    protected $fillable = [
        'user_id',
        'module_id',
        'status',
        'assigned_at',
        'due_at',
    ];

    protected function casts(): array
    {
        return [
            'assigned_at' => 'datetime',
            'due_at' => 'datetime',
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
