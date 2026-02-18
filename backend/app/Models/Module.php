<?php

namespace App\Models;

use App\Models\Concerns\UsesUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Module extends Model
{
    use UsesUuid;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'difficulty',
        'category',
        'est_minutes',
        'version',
        'tags',
        'cover_icon',
        'created_by',
        'archived_at',
        'level',
        'status',
        'order_index',
    ];

    protected function casts(): array
    {
        return [
            'tags' => 'array',
            'est_minutes' => 'integer',
            'archived_at' => 'datetime',
        ];
    }

    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class);
    }

    public function moduleLabTemplates(): HasMany
    {
        return $this->hasMany(ModuleLabTemplate::class);
    }

    public function progress(): HasMany
    {
        return $this->hasMany(UserModuleProgress::class);
    }

    public function userProgress(): HasOne
    {
        return $this->hasOne(UserModuleProgress::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function userAssignments(): HasMany
    {
        return $this->hasMany(UserModule::class);
    }

    public function assignedUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_modules')
            ->withPivot(['id', 'status', 'assigned_at', 'due_at'])
            ->withTimestamps();
    }
}
