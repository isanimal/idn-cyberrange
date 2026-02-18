<?php

namespace Tests\Feature;

use App\Enums\LabInstanceState;
use App\Enums\LabTemplateStatus;
use App\Enums\UserRole;
use App\Models\LabInstance;
use App\Models\LabTemplate;
use App\Models\User;
use App\Services\Orchestration\OrchestrationPreflightService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class AdminOrchestrationApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_orchestration_instances_with_expected_fields(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);
        $user = User::factory()->create();
        $template = LabTemplate::factory()->create(['status' => LabTemplateStatus::PUBLISHED]);

        LabInstance::query()->create([
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
            'runtime_metadata' => ['container_name' => 'test-container'],
        ]);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/orchestration/instances')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [[
                    'instance_id',
                    'user' => ['id', 'name', 'email'],
                    'lab' => ['id', 'title', 'slug', 'image'],
                    'container_id',
                    'status',
                    'started_at',
                    'uptime_seconds',
                    'resources' => ['cpu_percent', 'mem_mb'],
                    'network' => ['container_ip', 'exposed_ports', 'gateway'],
                    'logs_tail',
                    'env',
                ]],
            ]);
    }

    public function test_admin_can_force_stop_instance(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);
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
            'started_at' => now()->subMinute(),
            'last_activity_at' => now(),
        ]);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/orchestration/instances/'.$instance->id.'/force-stop')
            ->assertOk()
            ->assertJsonPath('status', 'STOPPED');
    }

    public function test_admin_can_fetch_orchestration_overview(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);
        $user = User::factory()->create();
        $template = LabTemplate::factory()->create(['status' => LabTemplateStatus::PUBLISHED]);

        LabInstance::query()->create([
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
            ->getJson('/api/v1/admin/orchestration/overview')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'activeContainers',
                    'avgCpu',
                    'memAllocated',
                    'errors',
                    'instances',
                ],
            ]);
    }

    public function test_admin_can_view_preflight_report_with_structured_errors(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);

        $mock = Mockery::mock(OrchestrationPreflightService::class);
        $mock->shouldReceive('run')->once()->andReturn([
            'ok' => false,
            'checked_at' => now()->toIso8601String(),
            'checks' => [
                'workdir' => [
                    'ok' => false,
                    'message' => 'Runtime workdir root is not writable.',
                    'hints' => ['Mount writable /var/lib/idn-cyberrange in backend container.'],
                ],
                'docker' => [
                    'ok' => false,
                    'message' => 'Docker daemon unreachable.',
                    'hints' => ['Mount /var/run/docker.sock and set userns_mode: host.'],
                ],
            ],
        ]);
        $this->app->instance(OrchestrationPreflightService::class, $mock);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/orchestration/preflight')
            ->assertStatus(503)
            ->assertJsonPath('data.ok', false)
            ->assertJsonStructure([
                'data' => [
                    'ok',
                    'checked_at',
                    'checks' => [
                        'workdir' => ['ok', 'message', 'hints'],
                        'docker' => ['ok', 'message', 'hints'],
                    ],
                ],
            ]);
    }
}
