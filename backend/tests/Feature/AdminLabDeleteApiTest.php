<?php

namespace Tests\Feature;

use App\Enums\LabInstanceState;
use App\Enums\LabTemplateStatus;
use App\Enums\UserRole;
use App\Models\LabInstance;
use App\Models\LabTemplate;
use App\Models\Module;
use App\Models\ModuleLabTemplate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminLabDeleteApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_soft_delete_draft_template(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);
        $draft = LabTemplate::factory()->create(['status' => LabTemplateStatus::DRAFT]);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson('/api/v1/admin/labs/'.$draft->id)
            ->assertOk()
            ->assertJsonPath('ok', true);

        $this->assertDatabaseHas('lab_templates', [
            'id' => $draft->id,
        ]);
        $this->assertNotNull($draft->fresh()->deleted_at);
    }

    public function test_soft_deleted_template_is_hidden_from_admin_and_catalog_lists_by_default(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);
        $user = User::factory()->create();
        $template = LabTemplate::factory()->create([
            'status' => LabTemplateStatus::PUBLISHED,
            'is_latest' => true,
        ]);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson('/api/v1/admin/labs/'.$template->id)
            ->assertOk()
            ->assertJsonPath('ok', true);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/labs')
            ->assertOk()
            ->assertJsonMissing(['id' => $template->id]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/labs')
            ->assertOk()
            ->assertJsonMissing(['id' => $template->id]);
    }

    public function test_soft_delete_keeps_instances_but_cleans_module_links(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);
        $user = User::factory()->create();
        $template = LabTemplate::factory()->create(['status' => LabTemplateStatus::PUBLISHED]);

        $module = Module::query()->create([
            'title' => 'Web Security Basics',
            'slug' => 'web-security-basics-2',
            'description' => 'Module',
            'level' => 'basic',
            'status' => 'active',
            'order_index' => 1,
            'difficulty' => 'BASIC',
            'category' => 'Web',
            'est_minutes' => 30,
            'version' => '1.0.0',
        ]);

        ModuleLabTemplate::query()->create([
            'module_id' => $module->id,
            'lab_template_id' => $template->id,
            'order' => 1,
            'type' => 'LAB',
            'required' => true,
        ]);

        $instance = LabInstance::query()->create([
            'user_id' => $user->id,
            'lab_template_id' => $template->id,
            'template_version_pinned' => $template->version,
            'state' => LabInstanceState::ACTIVE,
            'progress_percent' => 0,
            'attempts_count' => 1,
            'notes' => '',
            'score' => 0,
            'started_at' => now()->subMinute(),
            'last_activity_at' => now(),
        ]);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson('/api/v1/admin/labs/'.$template->id)
            ->assertOk()
            ->assertJsonPath('ok', true);

        $this->assertDatabaseHas('lab_instances', ['id' => $instance->id]);
        $this->assertDatabaseMissing('module_lab_templates', [
            'module_id' => $module->id,
            'lab_template_id' => $template->id,
        ]);
    }

    public function test_non_admin_cannot_delete_template(): void
    {
        $user = User::factory()->create(['role' => UserRole::USER]);
        $template = LabTemplate::factory()->create(['status' => LabTemplateStatus::DRAFT]);

        $this->actingAs($user, 'sanctum')
            ->deleteJson('/api/v1/admin/labs/'.$template->id)
            ->assertStatus(403);
    }
}
