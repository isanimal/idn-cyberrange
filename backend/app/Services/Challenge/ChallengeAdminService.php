<?php

namespace App\Services\Challenge;

use App\Models\Challenge;
use App\Repositories\Contracts\ChallengeRepositoryInterface;
use App\Services\Audit\AuditLogService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class ChallengeAdminService
{
    public function __construct(
        private readonly ChallengeRepositoryInterface $challenges,
        private readonly AuditLogService $audit,
    ) {
    }

    public function paginate(int $perPage = 20): LengthAwarePaginator
    {
        return $this->challenges->paginate($perPage);
    }

    public function findOrFail(string $id): Challenge
    {
        $challenge = $this->challenges->findById($id);
        if (! $challenge) {
            throw new ModelNotFoundException('Challenge not found.');
        }

        return $challenge;
    }

    public function create(array $data, string $actorId): Challenge
    {
        $payload = $this->sanitize($data);
        $challenge = $this->challenges->create($payload);

        $this->audit->log('ADMIN_CHALLENGE_CREATED', $actorId, 'Challenge', $challenge->id, [
            'lab_template_id' => $challenge->lab_template_id,
        ]);

        return $challenge;
    }

    public function update(Challenge $challenge, array $data, string $actorId): Challenge
    {
        $payload = $this->sanitize($data);
        $challenge = $this->challenges->update($challenge, $payload);

        $this->audit->log('ADMIN_CHALLENGE_UPDATED', $actorId, 'Challenge', $challenge->id);

        return $challenge;
    }

    public function delete(Challenge $challenge, string $actorId): void
    {
        $this->challenges->delete($challenge);
        $this->audit->log('ADMIN_CHALLENGE_DELETED', $actorId, 'Challenge', $challenge->id);
    }

    private function sanitize(array $data): array
    {
        if (array_key_exists('flag', $data)) {
            $data['flag_hash'] = password_hash($data['flag'], PASSWORD_ARGON2ID);
            unset($data['flag']);
        }

        if (! array_key_exists('max_attempts', $data)) {
            $data['max_attempts'] = 10;
        }

        if (! array_key_exists('cooldown_seconds', $data)) {
            $data['cooldown_seconds'] = 30;
        }

        if (! array_key_exists('is_active', $data)) {
            $data['is_active'] = true;
        }

        return $data;
    }
}
