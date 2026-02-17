<?php

namespace Tests\Feature;

use App\Enums\LabTemplateStatus;
use App\Enums\UserRole;
use App\Models\LabInstance;
use App\Models\LabTemplate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class LabVersioningApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_publish_creates_new_version_row_and_preserves_old_version(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);
        $family = (string) Str::uuid();

        $base = LabTemplate::factory()->create([
            'template_family_uuid' => $family,
            'slug' => 'dvwa',
            'version' => '2026.1.0',
            'status' => LabTemplateStatus::PUBLISHED,
            'is_latest' => true,
            'published_at' => now()->subMonth(),
        ]);

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/labs/'.$base->id.'/publish', [
            'version' => '2026.2.0',
            'notes' => 'Annual update',
        ]);

        $response->assertOk()->assertJsonPath('version', '2026.2.0')->assertJsonPath('is_latest', true);

        $this->assertDatabaseHas('lab_templates', [
            'id' => $base->id,
            'version' => '2026.1.0',
            'is_latest' => 0,
        ]);

        $this->assertDatabaseHas('lab_templates', [
            'template_family_uuid' => $family,
            'slug' => 'dvwa',
            'version' => '2026.2.0',
            'is_latest' => 1,
        ]);
    }

    public function test_upgrade_reset_moves_instance_to_new_version_and_resets_progress(): void
    {
        $user = User::factory()->create();
        $family = (string) Str::uuid();

        $v1 = LabTemplate::factory()->create([
            'template_family_uuid' => $family,
            'slug' => 'dvwa',
            'version' => '2026.1.0',
            'status' => LabTemplateStatus::PUBLISHED,
            'is_latest' => false,
            'internal_port' => 80,
        ]);

        $v2 = LabTemplate::factory()->create([
            'template_family_uuid' => $family,
            'slug' => 'dvwa',
            'version' => '2026.2.0',
            'status' => LabTemplateStatus::PUBLISHED,
            'is_latest' => true,
            'internal_port' => 80,
        ]);

        $instance = LabInstance::query()->create([
            'user_id' => $user->id,
            'lab_template_id' => $v1->id,
            'template_version_pinned' => $v1->version,
            'state' => 'ACTIVE',
            'progress_percent' => 70,
            'attempts_count' => 1,
            'notes' => 'my progress',
            'assigned_port' => 21000,
            'started_at' => now(),
            'last_activity_at' => now(),
        ]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/lab-instances/'.$instance->id.'/upgrade', [
            'target_template_id' => $v2->id,
            'strategy' => 'RESET',
        ]);

        $response->assertOk()
            ->assertJsonPath('lab_template_id', $v2->id)
            ->assertJsonPath('template_version_pinned', '2026.2.0')
            ->assertJsonPath('progress_percent', 0)
            ->assertJsonPath('notes', '');
    }

    public function test_upgrade_in_place_rejects_incompatible_template(): void
    {
        $user = User::factory()->create();
        $family = (string) Str::uuid();

        $v1 = LabTemplate::factory()->create([
            'template_family_uuid' => $family,
            'version' => '2026.1.0',
            'status' => LabTemplateStatus::PUBLISHED,
            'is_latest' => false,
            'internal_port' => 80,
        ]);

        $v2 = LabTemplate::factory()->create([
            'template_family_uuid' => $family,
            'version' => '2026.2.0',
            'status' => LabTemplateStatus::PUBLISHED,
            'is_latest' => true,
            'internal_port' => 8080,
        ]);

        $instance = LabInstance::query()->create([
            'user_id' => $user->id,
            'lab_template_id' => $v1->id,
            'template_version_pinned' => $v1->version,
            'state' => 'ACTIVE',
            'progress_percent' => 30,
            'attempts_count' => 1,
            'notes' => '',
            'assigned_port' => 21002,
            'started_at' => now(),
            'last_activity_at' => now(),
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/lab-instances/'.$instance->id.'/upgrade', [
                'target_template_id' => $v2->id,
                'strategy' => 'IN_PLACE',
            ])
            ->assertStatus(422);
    }
}
