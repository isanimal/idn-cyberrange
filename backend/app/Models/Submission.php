<?php

namespace App\Models;

use App\Enums\SubmissionResult;
use App\Models\Concerns\UsesUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Submission extends Model
{
    use HasFactory;
    use UsesUuid;

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'challenge_id',
        'submitted_hash',
        'result',
        'attempt_no',
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
            'result' => SubmissionResult::class,
        ];
    }

    public function challenge(): BelongsTo
    {
        return $this->belongsTo(Challenge::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
