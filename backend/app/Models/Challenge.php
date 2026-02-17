<?php

namespace App\Models;

use App\Models\Concerns\UsesUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Challenge extends Model
{
    use HasFactory;
    use UsesUuid;

    protected $fillable = [
        'lab_template_id',
        'title',
        'description',
        'points',
        'flag_hash',
        'max_attempts',
        'cooldown_seconds',
        'is_active',
    ];

    protected $hidden = ['flag_hash'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(LabTemplate::class, 'lab_template_id');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class);
    }
}
