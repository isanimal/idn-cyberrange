<?php

namespace Tests\Feature;

use App\Enums\LabTemplateStatus;
use App\Models\Challenge;
use App\Models\LabInstance;
use App\Models\LabTemplate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChallengeSubmissionApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_submit_correct_flag_and_progress_updates(): void
    {
        $user = User::factory()->create();
        $template = LabTemplate::factory()->create(['status' => LabTemplateStatus::PUBLISHED]);
        $challenge = Challenge::factory()->create([
            'lab_template_id' => $template->id,
            'flag_hash' => password_hash('FLAG{CORRECT}', PASSWORD_ARGON2ID),
            'max_attempts' => 3,
            'cooldown_seconds' => 1,
            'points' => 150,
        ]);

        LabInstance::query()->create([
            'user_id' => $user->id,
            'lab_template_id' => $template->id,
            'template_version_pinned' => $template->version,
            'state' => 'ACTIVE',
            'progress_percent' => 0,
            'attempts_count' => 1,
            'notes' => '',
            'started_at' => now(),
            'last_activity_at' => now(),
        ]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/challenges/'.$challenge->id.'/submit', [
            'flag' => 'FLAG{CORRECT}',
        ]);

        $response->assertOk()
            ->assertJsonPath('result', 'CORRECT')
            ->assertJsonPath('points_earned', 150)
            ->assertJsonPath('progress_percent', 100);
    }

    public function test_submission_respects_cooldown_and_max_attempts(): void
    {
        $user = User::factory()->create();
        $challenge = Challenge::factory()->create([
            'flag_hash' => password_hash('FLAG{RIGHT}', PASSWORD_ARGON2ID),
            'max_attempts' => 1,
            'cooldown_seconds' => 60,
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/challenges/'.$challenge->id.'/submit', ['flag' => 'FLAG{WRONG}'])
            ->assertOk()
            ->assertJsonPath('result', 'WRONG');

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/challenges/'.$challenge->id.'/submit', ['flag' => 'FLAG{WRONG2}'])
            ->assertStatus(429);
    }
}
