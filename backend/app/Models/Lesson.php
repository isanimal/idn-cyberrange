<?php

namespace App\Models;

use App\Models\Concerns\UsesUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Lesson extends Model
{
    use UsesUuid;

    protected $fillable = [
        'module_id',
        'title',
        'content',
        'content_markdown',
        'order_index',
    ];

    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }
}
