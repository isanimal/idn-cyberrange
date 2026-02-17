<?php

namespace App\Models;

use App\Models\Concerns\UsesUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ModuleLabTemplate extends Model
{
    use UsesUuid;

    protected $table = 'module_lab_templates';

    protected $fillable = [
        'module_id',
        'lab_template_id',
        'order',
        'type',
        'required',
    ];

    protected function casts(): array
    {
        return [
            'required' => 'boolean',
        ];
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    public function labTemplate(): BelongsTo
    {
        return $this->belongsTo(LabTemplate::class, 'lab_template_id');
    }
}

