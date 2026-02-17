<?php

namespace Tests\Feature;

use App\Models\Lesson;
use App\Models\Module;
use App\Models\User;
use App\Models\UserModuleProgress;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserModuleApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_list_modules_returns_progress_and_locked_fields(): void
    {
        $user = User::factory()->create();

        $m1 = Module::query()->create([
            'title' => 'M1',
            'slug' => 'm1',
            'description' => 'd1',
            'difficulty' => 'BASIC',
            'level' => 'basic',
            'status' => 'active',
            'order_index' => 1,
        ]);

        $m2 = Module::query()->create([
            'title' => 'M2',
            'slug' => 'm2',
            'description' => 'd2',
            'difficulty' => 'INTERMEDIATE',
            'level' => 'intermediate',
            'status' => 'active',
            'order_index' => 2,
        ]);

        Lesson::query()->create([
            'module_id' => $m1->id,
            'title' => 'L1',
            'content_md' => '# L1',
            'content_markdown' => '# L1',
            'content' => '# L1',
            'order' => 1,
            'order_index' => 1,
            'is_active' => true,
        ]);

        UserModuleProgress::query()->create([
            'user_id' => $user->id,
            'module_id' => $m1->id,
            'progress_percent' => 100,
            'started_at' => now()->subHour(),
            'completed_at' => now()->subMinutes(5),
            'last_accessed_at' => now(),
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/modules')
            ->assertOk()
            ->assertJsonPath('data.0.slug', 'm1')
            ->assertJsonPath('data.0.progress_percent', 100)
            ->assertJsonPath('data.0.is_locked', false)
            ->assertJsonPath('data.1.slug', 'm2')
            ->assertJsonPath('data.1.is_locked', false);

        UserModuleProgress::query()
            ->where('user_id', $user->id)
            ->where('module_id', $m1->id)
            ->update(['progress_percent' => 40, 'completed_at' => null]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/modules')
            ->assertOk()
            ->assertJsonPath('data.1.slug', 'm2')
            ->assertJsonPath('data.1.is_locked', true);
    }

    public function test_marking_lesson_complete_recalculates_module_progress(): void
    {
        $user = User::factory()->create();

        $module = Module::query()->create([
            'title' => 'Web 101',
            'slug' => 'web-101',
            'description' => 'd1',
            'difficulty' => 'BASIC',
            'level' => 'basic',
            'status' => 'active',
            'order_index' => 1,
        ]);

        $lesson1 = Lesson::query()->create([
            'module_id' => $module->id,
            'title' => 'Lesson 1',
            'content_md' => '# L1',
            'content_markdown' => '# L1',
            'content' => '# L1',
            'order' => 1,
            'order_index' => 1,
            'is_active' => true,
        ]);

        $lesson2 = Lesson::query()->create([
            'module_id' => $module->id,
            'title' => 'Lesson 2',
            'content_md' => '# L2',
            'content_markdown' => '# L2',
            'content' => '# L2',
            'order' => 2,
            'order_index' => 2,
            'is_active' => true,
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/modules/web-101/start')
            ->assertOk()
            ->assertJsonPath('data.progress_percent', 0);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/modules/web-101/lessons/'.$lesson1->id.'/complete')
            ->assertOk()
            ->assertJsonPath('data.progress_percent', 50);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/modules/web-101/lessons/'.$lesson2->id.'/complete')
            ->assertOk()
            ->assertJsonPath('data.progress_percent', 100);

        $this->assertDatabaseHas('user_module_progress', [
            'user_id' => $user->id,
            'module_id' => $module->id,
            'progress_percent' => 100,
        ]);
    }
}
