<?php

namespace App\Repositories\Eloquent;

use App\Models\LabInstance;
use App\Models\User;
use App\Repositories\Contracts\LabInstanceRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class EloquentLabInstanceRepository implements LabInstanceRepositoryInterface
{
    public function findByIdForUser(string $id, User $user): ?LabInstance
    {
        return LabInstance::query()
            ->where('id', $id)
            ->where('user_id', $user->id)
            ->first();
    }

    public function findByTemplateForUser(string $templateId, User $user): ?LabInstance
    {
        return LabInstance::query()
            ->where('lab_template_id', $templateId)
            ->where('user_id', $user->id)
            ->latest('created_at')
            ->first();
    }

    public function create(array $data): LabInstance
    {
        return LabInstance::query()->create($data);
    }

    public function update(LabInstance $instance, array $data): LabInstance
    {
        $instance->fill($data);
        $instance->save();

        return $instance->refresh();
    }

    public function myInstances(User $user): Collection
    {
        return LabInstance::query()
            ->where('user_id', $user->id)
            ->latest('last_activity_at')
            ->get();
    }
}
