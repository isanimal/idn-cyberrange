<?php

namespace App\Repositories\Contracts;

use App\Models\LabInstance;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

interface LabInstanceRepositoryInterface
{
    public function findByIdForUser(string $id, User $user): ?LabInstance;

    public function findByTemplateForUser(string $templateId, User $user): ?LabInstance;

    public function create(array $data): LabInstance;

    public function update(LabInstance $instance, array $data): LabInstance;

    public function myInstances(User $user): Collection;
}
