<?php

namespace Tests\Feature;

use App\Models\LabTemplate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LabCatalogApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_fetch_labs(): void
    {
        $user = User::factory()->create();
        LabTemplate::factory()->count(2)->published()->create();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/labs')
            ->assertOk()
            ->assertJsonStructure(['data', 'meta' => ['current_page', 'last_page', 'total']]);
    }

    public function test_user_can_start_and_list_instances_via_labs_namespace(): void
    {
        $user = User::factory()->create();
        $template = LabTemplate::factory()->published()->create([
            'slug' => 'web-lab-1',
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/labs/'.$template->slug.'/start')
            ->assertCreated()
            ->assertJsonStructure(['instance_id', 'lab_template_id', 'state', 'expires_at', 'max_ttl']);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/labs/instances/my')
            ->assertOk()
            ->assertJsonStructure(['data', 'meta']);
    }
}
