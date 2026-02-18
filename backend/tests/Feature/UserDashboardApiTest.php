<?php

namespace Tests\Feature;

use App\Enums\SubmissionResult;
use App\Models\Challenge;
use App\Models\LabInstance;
use App\Models\LabTemplate;
use App\Models\Module;
use App\Models\Submission;
use App\Models\User;
use App\Models\UserModule;
use App\Models\UserModuleProgress;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserDashboardApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_returns_assigned_modules_progress_and_recent_activity(): void
    {
        $user = User::factory()->create();
        $module = Module::query()->create([
            'title' => 'Dashboard Module',
            'slug' => 'dashboard-module',
            'description' => 'desc',
            'difficulty' => 'BASIC',
            'level' => 'basic',
            'status' => 'active',
            'order_index' => 1,
        ]);

        UserModule::query()->create([
            'user_id' => $user->id,
            'module_id' => $module->id,
            'status' => UserModule::STATUS_ASSIGNED,
            'assigned_at' => now()->subDay(),
        ]);

        UserModuleProgress::query()->create([
            'user_id' => $user->id,
            'module_id' => $module->id,
            'progress_percent' => 60,
            'started_at' => now()->subHours(3),
            'last_accessed_at' => now()->subHour(),
        ]);

        $template = LabTemplate::factory()->published()->create();
        LabInstance::query()->create([
            'user_id' => $user->id,
            'lab_template_id' => $template->id,
            'module_id' => $module->id,
            'template_version_pinned' => (string) $template->version,
            'state' => 'ACTIVE',
            'started_at' => now()->subHour(),
            'last_activity_at' => now(),
        ]);

        $challenge = Challenge::query()->create([
            'lab_template_id' => $template->id,
            'title' => 'Test Challenge',
            'description' => 'desc',
            'points' => 150,
            'flag_hash' => password_hash('FLAG{ok}', PASSWORD_ARGON2ID),
            'max_attempts' => 3,
            'cooldown_seconds' => 0,
            'is_active' => true,
        ]);

        Submission::query()->create([
            'user_id' => $user->id,
            'challenge_id' => $challenge->id,
            'submitted_hash' => hash('sha256', 'FLAG{ok}'),
            'result' => SubmissionResult::CORRECT,
            'attempt_no' => 1,
            'submitted_at' => now()->subMinutes(10),
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/dashboard')
            ->assertOk()
            ->assertJsonPath('data.total_points', 150)
            ->assertJsonPath('data.active_labs_count', 1)
            ->assertJsonPath('data.assigned_modules.0.slug', 'dashboard-module')
            ->assertJsonPath('data.assigned_modules.0.progress_percent', 60)
            ->assertJsonPath('data.recent_activity.0.challenge_title', 'Test Challenge');
    }
}
