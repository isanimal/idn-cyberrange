<?php

namespace App\Models;

use App\Enums\LabInstanceState;
use App\Models\Concerns\UsesUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class LabInstance extends Model
{
    use HasFactory;
    use UsesUuid;

    protected $fillable = [
        'user_id',
        'lab_template_id',
        'template_version_pinned',
        'state',
        'progress_percent',
        'attempts_count',
        'notes',
        'score',
        'started_at',
        'last_activity_at',
        'completed_at',
        'expires_at',
        'assigned_port',
        'connection_url',
        'runtime_metadata',
        'last_error',
    ];

    protected function casts(): array
    {
        return [
            'state' => LabInstanceState::class,
            'started_at' => 'datetime',
            'last_activity_at' => 'datetime',
            'completed_at' => 'datetime',
            'expires_at' => 'datetime',
            'runtime_metadata' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(LabTemplate::class, 'lab_template_id');
    }

    public function runtime(): HasOne
    {
        return $this->hasOne(LabInstanceRuntime::class);
    }
}
