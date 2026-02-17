<?php

namespace App\Models;

use App\Enums\LabTemplateStatus;
use App\Models\Concerns\UsesUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class LabTemplate extends Model
{
    use HasFactory;
    use SoftDeletes;
    use UsesUuid;

    protected $fillable = [
        'template_family_uuid',
        'slug',
        'title',
        'difficulty',
        'category',
        'short_description',
        'long_description',
        'estimated_time_minutes',
        'objectives',
        'prerequisites',
        'tags',
        'version',
        'status',
        'is_latest',
        'published_at',
        'changelog',
        'lab_summary',
        'assets',
        'docker_image',
        'internal_port',
        'env_vars',
        'resource_limits',
        'configuration_type',
        'configuration_content',
        'configuration_base_port',
    ];

    protected function casts(): array
    {
        return [
            'objectives' => 'array',
            'prerequisites' => 'array',
            'tags' => 'array',
            'changelog' => 'array',
            'lab_summary' => 'array',
            'assets' => 'array',
            'env_vars' => 'array',
            'resource_limits' => 'array',
            'published_at' => 'datetime',
            'is_latest' => 'boolean',
            'status' => LabTemplateStatus::class,
        ];
    }

    public function instances(): HasMany
    {
        return $this->hasMany(LabInstance::class);
    }
}
