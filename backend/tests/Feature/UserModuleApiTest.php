<?php

namespace Tests\Feature;

use App\Enums\ModuleLevel;
use App\Enums\ModuleStatus;
use App\Models\Lesson;
use App\Models\Module;
use App\Models\ModuleProgress;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserModuleApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_list_modules_with_progress(): void
    {
        $user = User::factory()->create();

        $m1 = Module::query()->create([
            'title' => 'M1',
            'slug' => 'm1',
            'description' => 'd1',
            'level' => ModuleLevel::BASIC,
            'status' => ModuleStatus::ACTIVE,
            'order_index' => 1,
        ]);

        $m2 = Module::query()->create([
            'title' => 'M2',
            'slug' => 'm2',
            'description' => 'd2',
            'level' => ModuleLevel::INTERMEDIATE,
            'status' => ModuleStatus::ACTIVE,
            'order_index' => 2,
        ]);

        Lesson::query()->create([
            'module_id' => $m1->id,
            'title' => 'L1',
            'content' => '# L1',
            'content_markdown' => '# L1',
            'order_index' => 1,
        ]);

        ModuleProgress::query()->create([
            'user_id' => $user->id,
            'module_id' => $m1->id,
            'progress_percent' => 100,
            'is_completed' => true,
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/modules')
            ->assertOk()
            ->assertJsonPath('data.0.slug', 'm1')
            ->assertJsonPath('data.0.progress_percent', 100)
            ->assertJsonPath('data.0.lessons_count', 1)
            ->assertJsonPath('data.1.slug', 'm2')
            ->assertJsonPath('data.1.is_locked', false);
    }

    public function test_authenticated_user_can_get_module_detail(): void
    {
        $user = User::factory()->create();
        $module = Module::query()->create([
            'title' => 'M1',
            'slug' => 'm1',
            'description' => 'd1',
            'level' => ModuleLevel::BASIC,
            'status' => ModuleStatus::ACTIVE,
            'order_index' => 1,
        ]);

        Lesson::query()->create([
            'module_id' => $module->id,
            'title' => 'Lesson 1',
            'content' => '# Lesson',
            'content_markdown' => '# Lesson',
            'order_index' => 1,
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/modules/m1')
            ->assertOk()
            ->assertJsonPath('slug', 'm1')
            ->assertJsonPath('lessons.0.title', 'Lesson 1');
    }
}

