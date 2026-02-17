<?php

namespace Tests\Feature;

use App\Enums\LabTemplateStatus;
use App\Models\LabTemplate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
}
