<?php

namespace App\Models;

use App\Models\Concerns\UsesUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LabInstanceRuntime extends Model
{
    use HasFactory;
    use UsesUuid;

    protected $fillable = [
        'lab_instance_id',
        'workdir',
        'compose_path',
        'network_name',
        'container_name',
        'runtime_meta',
    ];

    protected function casts(): array
    {
        return [
            'runtime_meta' => 'array',
        ];
    }

    public function instance(): BelongsTo
    {
        return $this->belongsTo(LabInstance::class, 'lab_instance_id');
    }
}
