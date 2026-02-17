<?php

namespace App\Repositories\Contracts;

use App\Models\LabTemplate;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface LabTemplateRepositoryInterface
{
    public function paginatePublished(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    public function findByIdOrSlug(string $idOrSlug, bool $latestOnly = true): ?LabTemplate;

    public function findPublishedByVersion(string $familyUuid, string $version): ?LabTemplate;

    public function findLatestPublishedInFamily(string $familyUuid): ?LabTemplate;

    public function markFamilyVersionsNotLatest(string $familyUuid): void;

    public function create(array $data): LabTemplate;

    public function update(LabTemplate $template, array $data): LabTemplate;

    public function delete(LabTemplate $template): void;
}
