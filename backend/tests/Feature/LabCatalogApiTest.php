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
}
