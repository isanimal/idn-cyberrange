<?php

namespace Tests\Feature;

use App\Models\PortAllocation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class CleanupStalePortAllocationsCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_cleanup_command_releases_stale_assigned_port_allocations(): void
    {
        PortAllocation::query()->create([
            'id' => (string) Str::uuid(),
            'port' => 21001,
            'active_port' => 21001,
            'lab_instance_id' => null,
            'status' => 'ASSIGNED',
            'allocated_at' => now()->subMinutes(10),
        ]);

        $this->artisan('ports:cleanup-stale')
            ->expectsOutputToContain('Stale port allocations cleaned: 1')
            ->assertExitCode(0);

        $this->assertDatabaseHas('port_allocations', [
            'port' => 21001,
            'status' => 'RELEASED',
            'active_port' => null,
        ]);
    }
}
