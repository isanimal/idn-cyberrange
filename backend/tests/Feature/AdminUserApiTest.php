<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Module;
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

    public function test_admin_can_assign_and_unassign_modules_for_user(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN, 'status' => UserStatus::ACTIVE]);
        $target = User::factory()->create(['role' => UserRole::USER, 'status' => UserStatus::ACTIVE]);
        $module = Module::query()->create([
            'title' => 'Assigned module',
            'slug' => 'assigned-module',
            'description' => 'Module description',
            'difficulty' => 'BASIC',
            'level' => 'basic',
            'status' => 'active',
            'order_index' => 1,
        ]);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/users/'.$target->id.'/modules', [
                'module_ids' => [$module->id],
                'status' => 'LOCKED',
            ])
            ->assertOk()
            ->assertJsonPath('data.assigned.0.module_id', $module->id)
            ->assertJsonPath('data.assigned.0.status', 'LOCKED');

        $this->assertDatabaseHas('user_modules', [
            'user_id' => $target->id,
            'module_id' => $module->id,
            'status' => 'LOCKED',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson('/api/v1/admin/users/'.$target->id.'/modules/'.$module->id)
            ->assertOk()
            ->assertJsonPath('ok', true);

        $this->assertDatabaseMissing('user_modules', [
            'user_id' => $target->id,
            'module_id' => $module->id,
        ]);
    }

    public function test_non_admin_cannot_manage_user_module_assignments(): void
    {
        $user = User::factory()->create(['role' => UserRole::USER, 'status' => UserStatus::ACTIVE]);
        $target = User::factory()->create(['role' => UserRole::USER, 'status' => UserStatus::ACTIVE]);
        $module = Module::query()->create([
            'title' => 'Assigned module',
            'slug' => 'assigned-module',
            'description' => 'Module description',
            'difficulty' => 'BASIC',
            'level' => 'basic',
            'status' => 'active',
            'order_index' => 1,
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/admin/users/'.$target->id.'/modules', [
                'module_ids' => [$module->id],
            ])
            ->assertForbidden();
    }
}
