<?php

namespace App\Repositories\Eloquent;

use App\Models\LabInstance;
use App\Models\User;
use App\Repositories\Contracts\LabInstanceRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentLabInstanceRepository implements LabInstanceRepositoryInterface
{
    public function findById(string $id): ?LabInstance
    {
        return LabInstance::query()->find($id);
    }

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

    public function findByTemplateFamilyForUser(string $familyUuid, User $user): ?LabInstance
    {
        return LabInstance::query()
            ->where('lab_instances.user_id', $user->id)
            ->join('lab_templates', 'lab_templates.id', '=', 'lab_instances.lab_template_id')
            ->where('lab_templates.template_family_uuid', $familyUuid)
            ->orderByDesc('lab_instances.last_activity_at')
            ->select('lab_instances.*')
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

    public function myInstances(User $user, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return LabInstance::query()
            ->where('user_id', $user->id)
            ->when(! empty($filters['state']), fn ($q) => $q->where('state', $filters['state']))
            ->latest('last_activity_at')
            ->paginate($perPage);
    }
}
