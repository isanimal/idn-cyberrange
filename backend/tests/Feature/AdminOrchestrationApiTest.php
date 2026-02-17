<?php

namespace Tests\Feature;

use App\Enums\LabInstanceState;
use App\Enums\LabTemplateStatus;
use App\Enums\UserRole;
use App\Models\LabInstance;
use App\Models\LabTemplate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
}

