<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminUserApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_suspend_unsuspend_and_soft_delete_user(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN, 'status' => UserStatus::ACTIVE]);
        $target = User::factory()->create(['role' => UserRole::USER, 'status' => UserStatus::ACTIVE]);

        $this->actingAs($admin, 'sanctum')
            ->patchJson('/api/v1/admin/users/'.$target->id.'/suspend')
            ->assertOk()
            ->assertJsonPath('status', UserStatus::SUSPENDED->value);

        $this->actingAs($admin, 'sanctum')
            ->patchJson('/api/v1/admin/users/'.$target->id.'/unsuspend')
            ->assertOk()
            ->assertJsonPath('status', UserStatus::ACTIVE->value);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson('/api/v1/admin/users/'.$target->id)
            ->assertNoContent();

        $this->assertDatabaseHas('users', [
            'id' => $target->id,
            'status' => UserStatus::SUSPENDED->value,
        ]);

        $withoutDeleted = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/users?includeDeleted=0')
            ->assertOk()
            ->json('data');

        $withDeleted = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/users?includeDeleted=1')
            ->assertOk()
            ->json('data');

        $idsWithoutDeleted = collect($withoutDeleted)->pluck('id')->all();
        $idsWithDeleted = collect($withDeleted)->pluck('id')->all();

        $this->assertNotContains($target->id, $idsWithoutDeleted);
        $this->assertContains($target->id, $idsWithDeleted);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/users/'.$target->id.'/restore')
            ->assertOk()
            ->assertJsonPath('status', UserStatus::ACTIVE->value);
    }

    public function test_suspended_user_cannot_access_modules_endpoint(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::USER,
            'status' => UserStatus::SUSPENDED,
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/modules')
            ->assertForbidden();
    }
}
