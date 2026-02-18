<?php

namespace Tests\Feature;

use App\Enums\LabInstanceState;
use App\Enums\LabTemplateStatus;
use App\Models\LabInstance;
use App\Models\LabTemplate;
use App\Models\User;
use App\Services\Orchestration\PortAllocatorService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PortAllocatorServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_allocator_assigns_unique_ports_to_ten_instances(): void
    {
        $allocator = app(PortAllocatorService::class);
        $ports = [];

        for ($i = 0; $i < 10; $i++) {
            $instance = $this->makeInstance();
            $ports[] = $allocator->allocate($instance->id);
        }

        $this->assertCount(10, array_unique($ports));

        foreach ($ports as $port) {
            $this->assertDatabaseHas('port_allocations', [
                'port' => $port,
                'active_port' => $port,
                'status' => 'ASSIGNED',
            ]);
        }
    }

    public function test_allocator_reuses_port_after_release_while_preserving_history(): void
    {
        $allocator = app(PortAllocatorService::class);

        $first = $this->makeInstance();
        $second = $this->makeInstance();

        $firstPort = $allocator->allocate($first->id);
        $allocator->releaseByInstance($first->id);
        $secondPort = $allocator->allocate($second->id);

        $this->assertSame($firstPort, $secondPort);

        $this->assertDatabaseHas('port_allocations', [
            'lab_instance_id' => $first->id,
            'port' => $firstPort,
            'status' => 'RELEASED',
            'active_port' => null,
        ]);
        $this->assertDatabaseHas('port_allocations', [
            'lab_instance_id' => $second->id,
            'port' => $secondPort,
            'status' => 'ASSIGNED',
            'active_port' => $secondPort,
        ]);

        $historyRows = \App\Models\PortAllocation::query()
            ->where('port', $firstPort)
            ->count();

        $this->assertSame(2, $historyRows);
    }

    private function makeInstance(): LabInstance
    {
        $user = User::factory()->create();
        $template = LabTemplate::factory()->create(['status' => LabTemplateStatus::PUBLISHED]);

        return LabInstance::query()->create([
            'user_id' => $user->id,
            'lab_template_id' => $template->id,
            'template_version_pinned' => $template->version,
            'state' => LabInstanceState::INACTIVE,
            'progress_percent' => 0,
            'attempts_count' => 0,
            'notes' => '',
            'score' => 0,
            'started_at' => now(),
            'last_activity_at' => now(),
        ]);
    }
}
