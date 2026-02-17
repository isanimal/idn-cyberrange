<?php

namespace Tests\Feature;

use App\Enums\ModuleLevel;
use App\Enums\ModuleStatus;
use App\Enums\UserRole;
use App\Models\Module;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminModuleApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_update_and_delete_module(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);

        $create = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/modules', [
            'title' => 'M7: API Security',
            'slug' => 'api-security',
            'description' => 'Testing JWT and access controls.',
            'level' => ModuleLevel::INTERMEDIATE->value,
            'status' => ModuleStatus::DRAFT->value,
            'order_index' => 7,
        ]);

        $create->assertCreated()
            ->assertJsonPath('slug', 'api-security')
            ->assertJsonPath('lessons_count', 0);

        $moduleId = $create->json('id');

        $this->actingAs($admin, 'sanctum')->patchJson('/api/v1/admin/modules/'.$moduleId, [
            'status' => ModuleStatus::ACTIVE->value,
            'order_index' => 8,
        ])->assertOk()
            ->assertJsonPath('status', ModuleStatus::ACTIVE->value)
            ->assertJsonPath('order_index', 8);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/modules')
            ->assertOk()
            ->assertJsonPath('data.0.id', $moduleId);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson('/api/v1/admin/modules/'.$moduleId)
            ->assertNoContent();

        $this->assertDatabaseMissing('modules', ['id' => $moduleId]);
    }

    public function test_admin_can_manage_module_lessons(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);
        $module = Module::query()->create([
            'title' => 'M8: SSRF',
            'slug' => 'ssrf',
            'description' => 'Server side request forgery fundamentals.',
            'level' => ModuleLevel::ADVANCED,
            'status' => ModuleStatus::LOCKED,
            'order_index' => 8,
        ]);

        $createLesson = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/modules/'.$module->id.'/lessons', [
            'title' => 'SSRF Basics',
            'content' => '# SSRF',
            'order_index' => 1,
        ]);

        $createLesson->assertCreated()->assertJsonPath('title', 'SSRF Basics');

        $lessonId = $createLesson->json('id');

        $this->actingAs($admin, 'sanctum')
            ->patchJson('/api/v1/admin/modules/'.$module->id.'/lessons/'.$lessonId, [
                'order_index' => 2,
            ])->assertOk()
            ->assertJsonPath('order_index', 2);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/modules/'.$module->id.'/lessons')
            ->assertOk()
            ->assertJsonPath('data.0.id', $lessonId);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson('/api/v1/admin/modules/'.$module->id.'/lessons/'.$lessonId)
            ->assertNoContent();
    }
}

