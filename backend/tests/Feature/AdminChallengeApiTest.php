<?php

namespace Tests\Feature;

use App\Enums\LabTemplateStatus;
use App\Enums\UserRole;
use App\Models\LabTemplate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminChallengeApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_challenge_and_flag_is_hashed(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);
        $template = LabTemplate::factory()->create(['status' => LabTemplateStatus::PUBLISHED]);

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/challenges', [
            'lab_template_id' => $template->id,
            'title' => 'SQLi Flag',
            'description' => 'Find database secret',
            'points' => 100,
            'flag' => 'FLAG{SQLI_WIN}',
            'max_attempts' => 3,
            'cooldown_seconds' => 1,
            'is_active' => true,
        ]);

        $response->assertCreated()->assertJsonMissingPath('flag_hash');

        $challengeId = $response->json('id');
        $storedHash = \App\Models\Challenge::query()->findOrFail($challengeId)->getRawOriginal('flag_hash');

        $this->assertStringStartsWith('$argon2id$', $storedHash);
        $this->assertTrue(password_verify('FLAG{SQLI_WIN}', $storedHash));
    }
}
