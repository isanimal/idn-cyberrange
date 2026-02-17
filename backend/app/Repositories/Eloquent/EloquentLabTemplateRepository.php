<?php

namespace App\Repositories\Eloquent;

use App\Models\LabTemplate;
use App\Repositories\Contracts\LabTemplateRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentLabTemplateRepository implements LabTemplateRepositoryInterface
{
    public function paginatePublished(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return LabTemplate::query()
            ->where('status', 'PUBLISHED')
            ->where('is_latest', true)
            ->when(isset($filters['search']), function ($query) use ($filters): void {
                $search = strtolower(trim((string) $filters['search']));
                $query->where(function ($q) use ($search): void {
                    $q->whereRaw('LOWER(title) LIKE ?', ["%{$search}%"])
                        ->orWhereRaw('LOWER(short_description) LIKE ?', ["%{$search}%"]);
                });
            })
            ->latest('published_at')
            ->paginate($perPage);
    }

    public function findByIdOrSlug(string $idOrSlug, bool $latestOnly = true): ?LabTemplate
    {
        $query = LabTemplate::query()
            ->where(function ($q) use ($idOrSlug): void {
                $q->where('id', $idOrSlug)->orWhere('slug', $idOrSlug);
            });

        if ($latestOnly) {
            $query->where('is_latest', true);
        }

        return $query
            ->orderByDesc('is_latest')
            ->orderByDesc('published_at')
            ->latest('created_at')
            ->first();
    }

    public function findLatestPublishedInFamily(string $familyUuid): ?LabTemplate
    {
        return LabTemplate::query()
            ->where('template_family_uuid', $familyUuid)
            ->where('status', 'PUBLISHED')
            ->orderByDesc('is_latest')
            ->orderByDesc('published_at')
            ->latest('created_at')
            ->first();
    }

    public function markFamilyVersionsNotLatest(string $familyUuid): void
    {
        LabTemplate::query()
            ->where('template_family_uuid', $familyUuid)
            ->where('is_latest', true)
            ->update(['is_latest' => false]);
    }

    public function create(array $data): LabTemplate
    {
        return LabTemplate::query()->create($data);
    }

    public function update(LabTemplate $template, array $data): LabTemplate
    {
        $template->fill($data);
        $template->save();

        return $template->refresh();
    }

    public function delete(LabTemplate $template): void
    {
        $template->delete();
    }
}
