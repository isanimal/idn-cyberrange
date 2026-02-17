<?php

namespace App\Repositories\Eloquent;

use App\Models\Challenge;
use App\Repositories\Contracts\ChallengeRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentChallengeRepository implements ChallengeRepositoryInterface
{
    public function paginate(int $perPage = 20): LengthAwarePaginator
    {
        return Challenge::query()->latest('created_at')->paginate($perPage);
    }

    public function findById(string $id): ?Challenge
    {
        return Challenge::query()->find($id);
    }

    public function create(array $data): Challenge
    {
        return Challenge::query()->create($data);
    }

    public function update(Challenge $challenge, array $data): Challenge
    {
        $challenge->fill($data);
        $challenge->save();

        return $challenge->refresh();
    }

    public function delete(Challenge $challenge): void
    {
        $challenge->delete();
    }

    public function countActiveByTemplate(string $templateId): int
    {
        return Challenge::query()
            ->where('lab_template_id', $templateId)
            ->where('is_active', true)
            ->count();
    }
}
