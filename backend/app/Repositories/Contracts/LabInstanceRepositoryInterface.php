<?php

namespace App\Repositories\Contracts;

use App\Models\LabInstance;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface LabInstanceRepositoryInterface
{
    public function findById(string $id): ?LabInstance;

    public function findByIdForUser(string $id, User $user): ?LabInstance;

    public function findByTemplateForUser(string $templateId, User $user): ?LabInstance;

    public function findByTemplateFamilyForUser(string $familyUuid, User $user): ?LabInstance;

    public function create(array $data): LabInstance;

    public function update(LabInstance $instance, array $data): LabInstance;

    public function myInstances(User $user, array $filters = [], int $perPage = 15): LengthAwarePaginator;
}
