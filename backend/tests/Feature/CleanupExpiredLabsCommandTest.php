<?php

namespace Tests\Feature;

use App\Enums\LabInstanceState;
use App\Enums\LabTemplateStatus;
use App\Models\LabInstance;
use App\Models\LabTemplate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CleanupExpiredLabsCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_cleanup_command_stops_expired_active_instances(): void
    {
        $user = User::factory()->create();
        $template = LabTemplate::factory()->create(['status' => LabTemplateStatus::PUBLISHED]);

        $instance = LabInstance::query()->create([
            'user_id' => $user->id,
            'lab_template_id' => $template->id,
            'template_version_pinned' => $template->version,
            'state' => LabInstanceState::ACTIVE,
            'progress_percent' => 0,
            'attempts_count' => 1,
            'notes' => '',
            'score' => 0,
            'started_at' => now()->subHours(3),
            'last_activity_at' => now()->subHours(2),
            'expires_at' => now()->subMinute(),
            'runtime_metadata' => ['compose_path' => '/tmp/fake-compose.yml'],
        ]);

        $this->artisan('labs:cleanup-expired')
            ->expectsOutputToContain('Expired cleanup done')
            ->assertExitCode(0);

        $instance->refresh();

        $this->assertSame(LabInstanceState::INACTIVE, $instance->state);
    }
}
