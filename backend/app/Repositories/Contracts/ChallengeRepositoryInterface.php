<?php

namespace App\Repositories\Contracts;

use App\Models\Challenge;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface ChallengeRepositoryInterface
{
    public function paginate(int $perPage = 20): LengthAwarePaginator;

    public function listByTemplate(string $templateId): Collection;

    public function findById(string $id): ?Challenge;

    public function create(array $data): Challenge;

    public function update(Challenge $challenge, array $data): Challenge;

    public function delete(Challenge $challenge): void;

    public function countActiveByTemplate(string $templateId): int;
}
