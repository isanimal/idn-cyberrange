<?php

namespace App\Models;

use App\Models\Concerns\UsesUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PortAllocation extends Model
{
    use HasFactory;
    use UsesUuid;

    protected $fillable = [
        'port',
        'lab_instance_id',
        'status',
        'allocated_at',
        'released_at',
    ];

    protected function casts(): array
    {
        return [
            'allocated_at' => 'datetime',
            'released_at' => 'datetime',
        ];
    }

    public function instance(): BelongsTo
    {
        return $this->belongsTo(LabInstance::class, 'lab_instance_id');
    }
}
