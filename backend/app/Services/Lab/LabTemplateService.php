<?php

namespace App\Services\Lab;

use App\Enums\LabTemplateStatus;
use App\Models\LabTemplate;
use App\Repositories\Contracts\LabTemplateRepositoryInterface;
use App\Services\Audit\AuditLogService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpException;

class LabTemplateService
{
    public function __construct(
        private readonly LabTemplateRepositoryInterface $templates,
        private readonly AuditLogService $audit,
    ) {
    }

    public function listPublished(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return $this->templates->paginatePublished($filters, $perPage);
    }

    public function findOrFail(string $idOrSlug): LabTemplate
    {
        $template = $this->templates->findByIdOrSlug($idOrSlug, false);

        if (! $template) {
            throw new ModelNotFoundException('Lab template not found.');
        }

        return $template;
    }

    public function findPublishedForUserCatalogOrFail(string $idOrSlug): LabTemplate
    {
        $template = $this->templates->findByIdOrSlug($idOrSlug, true);

        if (! $template || $template->status !== LabTemplateStatus::PUBLISHED) {
            throw new ModelNotFoundException('Published lab template not found.');
        }

        return $template;
    }

    public function findPublishedByVersion(string $familyUuid, string $version): ?LabTemplate
    {
        return $this->templates->findPublishedByVersion($familyUuid, $version);
    }

    public function findLatestPublishedForFamily(string $familyUuid): ?LabTemplate
    {
        return $this->templates->findLatestPublishedInFamily($familyUuid);
    }

    public function create(array $data, string $actorId): LabTemplate
    {
        $data = $this->normalizePayload($data);
        $data['status'] = $data['status'] ?? LabTemplateStatus::DRAFT;
        $data['changelog'] = $data['changelog'] ?? [];
        $data['template_family_uuid'] = $data['template_family_uuid'] ?? (string) Str::uuid();
        $data['is_latest'] = true;

        $lab = $this->templates->create($data);
        $this->audit->log('ADMIN_LAB_CREATED', $actorId, 'LabTemplate', $lab->id, ['slug' => $lab->slug]);

        return $lab;
    }

    public function update(LabTemplate $template, array $data, string $actorId): LabTemplate
    {
        $lab = $this->templates->update($template, $this->normalizePayload($data));
        $this->audit->log('ADMIN_LAB_UPDATED', $actorId, 'LabTemplate', $lab->id);

        return $lab;
    }

    public function publish(LabTemplate $template, string $version, string $notes, string $actorId): LabTemplate
    {
        $existing = LabTemplate::query()
            ->where('template_family_uuid', $template->template_family_uuid)
            ->where('version', $version)
            ->first();

        if ($existing) {
            throw new HttpException(422, 'Version already exists in this lab family.');
        }

        $changelog = $template->changelog ?? [];
        $changelog[] = [
            'version' => $version,
            'date' => now()->toDateString(),
            'notes' => $notes,
        ];

        $this->templates->markFamilyVersionsNotLatest($template->template_family_uuid);

        $lab = $this->templates->create([
            'template_family_uuid' => $template->template_family_uuid,
            'slug' => $template->slug,
            'title' => $template->title,
            'difficulty' => $template->difficulty,
            'category' => $template->category,
            'short_description' => $template->short_description,
            'long_description' => $template->long_description,
            'estimated_time_minutes' => $template->estimated_time_minutes,
            'objectives' => $template->objectives,
            'prerequisites' => $template->prerequisites,
            'tags' => $template->tags,
            'assets' => $template->assets,
            'version' => $version,
            'status' => LabTemplateStatus::PUBLISHED,
            'is_latest' => true,
            'published_at' => now(),
            'changelog' => $changelog,
            'lab_summary' => $template->lab_summary,
            'docker_image' => $template->docker_image,
            'internal_port' => $template->internal_port,
            'env_vars' => $template->env_vars,
            'resource_limits' => $template->resource_limits,
            'configuration_type' => $template->configuration_type,
            'configuration_content' => $template->configuration_content,
            'configuration_base_port' => $template->configuration_base_port,
        ]);

        $this->audit->log('ADMIN_LAB_PUBLISHED', $actorId, 'LabTemplate', $lab->id, [
            'version' => $version,
            'source_template_id' => $template->id,
        ]);

        return $lab;
    }

    public function archive(LabTemplate $template, string $actorId): LabTemplate
    {
        $lab = $this->templates->update($template, ['status' => LabTemplateStatus::ARCHIVED]);
        $this->audit->log('ADMIN_LAB_ARCHIVED', $actorId, 'LabTemplate', $lab->id);

        return $lab;
    }

    public function delete(LabTemplate $template, string $actorId): void
    {
        $this->templates->delete($template);
        $this->audit->log('ADMIN_LAB_DELETED', $actorId, 'LabTemplate', $template->id);
    }

    private function normalizePayload(array $data): array
    {
        if (isset($data['configuration'])) {
            $data['configuration_type'] = $data['configuration']['type'] ?? null;
            $data['configuration_content'] = $data['configuration']['content'] ?? null;
            $data['configuration_base_port'] = $data['configuration']['base_port'] ?? null;
            unset($data['configuration']);
        }

        if (! array_key_exists('internal_port', $data)) {
            $data['internal_port'] = $data['configuration_base_port'] ?? 80;
        }

        if (! array_key_exists('docker_image', $data)) {
            $data['docker_image'] = 'nginx:alpine';
        }

        return $data;
    }
}
