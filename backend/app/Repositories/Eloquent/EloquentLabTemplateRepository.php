<?php

namespace App\Repositories\Eloquent;

use App\Models\LabTemplate;
use App\Repositories\Contracts\LabTemplateRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentLabTemplateRepository implements LabTemplateRepositoryInterface
{
    public function paginatePublished(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $sort = $filters['sort'] ?? 'newest';

        $query = LabTemplate::query()
            ->where('status', 'PUBLISHED')
            ->where('is_latest', true)
            ->when(! empty($filters['search']), function ($q) use ($filters): void {
                $search = strtolower(trim((string) $filters['search']));
                $q->where(function ($sub) use ($search): void {
                    $sub->whereRaw('LOWER(title) LIKE ?', ["%{$search}%"])
                        ->orWhereRaw('LOWER(short_description) LIKE ?', ["%{$search}%"])
                        ->orWhereRaw('LOWER(category) LIKE ?', ["%{$search}%"]);
                });
            })
            ->when(! empty($filters['difficulty']), fn ($q) => $q->where('difficulty', $filters['difficulty']))
            ->when(! empty($filters['category']), fn ($q) => $q->where('category', $filters['category']))
            ->when(! empty($filters['tag']), fn ($q) => $q->whereJsonContains('tags', $filters['tag']));

        match ($sort) {
            'title_asc' => $query->orderBy('title'),
            'title_desc' => $query->orderByDesc('title'),
            'oldest' => $query->orderBy('published_at'),
            default => $query->orderByDesc('published_at'),
        };

        return $query->paginate($perPage);
    }

    public function findByIdOrSlug(string $idOrSlug, bool $latestOnly = true): ?LabTemplate
    {
        $query = LabTemplate::query()->where(function ($q) use ($idOrSlug): void {
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

    public function findPublishedByVersion(string $familyUuid, string $version): ?LabTemplate
    {
        return LabTemplate::query()
            ->where('template_family_uuid', $familyUuid)
            ->where('version', $version)
            ->where('status', 'PUBLISHED')
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
