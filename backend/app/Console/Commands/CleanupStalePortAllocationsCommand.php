<?php

namespace App\Console\Commands;

use App\Models\PortAllocation;
use Illuminate\Console\Command;

class CleanupStalePortAllocationsCommand extends Command
{
    protected $signature = 'ports:cleanup-stale';

    protected $description = 'Release stale ASSIGNED port allocations that are no longer attached to a lab instance.';

    public function handle(): int
    {
        $released = PortAllocation::query()
            ->where('status', 'ASSIGNED')
            ->whereNotNull('active_port')
            ->whereNull('lab_instance_id')
            ->update([
                'status' => 'RELEASED',
                'active_port' => null,
                'released_at' => now(),
                'updated_at' => now(),
            ]);

        $this->info("Stale port allocations cleaned: {$released}");

        return self::SUCCESS;
    }
}
