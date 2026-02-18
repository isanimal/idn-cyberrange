<?php

namespace Tests\Feature;

use App\Enums\LabTemplateStatus;
use App\Models\LabTemplate;
use App\Models\User;
use App\Services\Orchestration\LabOrchestratorService;
use App\Services\Orchestration\OrchestrationPreflightService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class LabInstanceApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_activate_and_deactivate_instance(): void
    {
        $user = User::factory()->create();
        $template = LabTemplate::factory()->create([
            'status' => LabTemplateStatus::PUBLISHED,
            'docker_image' => 'nginx:alpine',
            'internal_port' => 80,
        ]);

        $activate = $this->actingAs($user, 'sanctum')->postJson('/api/v1/labs/'.$template->id.'/activate');
        $activate->assertStatus(201)->assertJsonStructure(['instance_id', 'state']);

        $instanceId = $activate->json('instance_id');

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/lab-instances/'.$instanceId.'/deactivate')
            ->assertOk()
            ->assertJsonPath('state', 'INACTIVE');
    }

    public function test_user_can_start_instance_via_start_alias(): void
    {
        $user = User::factory()->create();
        $template = LabTemplate::factory()->create([
            'status' => LabTemplateStatus::PUBLISHED,
            'docker_image' => 'nginx:alpine',
            'internal_port' => 80,
        ]);

        $start = $this->actingAs($user, 'sanctum')->postJson('/api/v1/labs/'.$template->id.'/start');
        $start->assertStatus(201)->assertJsonStructure(['instance_id', 'state', 'connection_url']);
    }

    public function test_user_gets_structured_error_when_lab_start_fails_due_to_docker_permissions(): void
    {
        $user = User::factory()->create();
        $template = LabTemplate::factory()->create([
            'status' => LabTemplateStatus::PUBLISHED,
            'docker_image' => 'nginx:alpine',
            'internal_port' => 80,
        ]);

        $orchestratorMock = Mockery::mock(LabOrchestratorService::class);
        $orchestratorMock->shouldReceive('startInstance')
            ->once()
            ->andThrow(new \RuntimeException('permission denied connecting to Docker daemon socket at unix:///var/run/docker.sock'));
        $this->app->instance(LabOrchestratorService::class, $orchestratorMock);

        $preflightMock = Mockery::mock(OrchestrationPreflightService::class);
        $preflightMock->shouldReceive('run')->andReturn([
            'ok' => false,
            'checked_at' => now()->toIso8601String(),
            'checks' => [
                'workdir' => ['ok' => true, 'message' => 'ok', 'hints' => []],
                'docker' => [
                    'ok' => false,
                    'message' => 'Docker daemon unreachable.',
                    'hints' => [
                        'Container mode: mount /var/run/docker.sock and /var/lib/idn-cyberrange into backend container.',
                    ],
                ],
            ],
        ]);
        $this->app->instance(OrchestrationPreflightService::class, $preflightMock);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/labs/'.$template->id.'/start')
            ->assertStatus(503)
            ->assertJsonPath('error', 'LAB_START_FAILED')
            ->assertJsonPath('details.operation', 'start')
            ->assertJsonPath('details.preflight.ok', false)
            ->assertJsonPath('details.hints.0', 'Container mode: mount /var/run/docker.sock and /var/lib/idn-cyberrange into backend container.');
    }
}
