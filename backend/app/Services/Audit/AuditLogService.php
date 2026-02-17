<?php

namespace App\Services\Audit;

use App\Models\AuditLog;

class AuditLogService
{
    public function log(string $action, ?string $actorId, string $targetType, ?string $targetId, array $metadata = []): void
    {
        AuditLog::query()->create([
            'actor_id' => $actorId,
            'action' => $action,
            'target_type' => $targetType,
            'target_id' => $targetId,
            'metadata' => $metadata,
            'created_at' => now(),
        ]);
    }
}
