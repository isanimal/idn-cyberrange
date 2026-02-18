<?php

namespace App\Services\Orchestration;

use App\Models\PortAllocation;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

class PortAllocatorService
{
    public function allocate(string $instanceId): int
    {
        return DB::transaction(function () use ($instanceId): int {
            $alreadyAssigned = PortAllocation::query()
                ->where('lab_instance_id', $instanceId)
                ->where('status', 'ASSIGNED')
                ->whereNotNull('active_port')
                ->lockForUpdate()
                ->latest('allocated_at')
                ->first(['port']);

            if ($alreadyAssigned) {
                return (int) $alreadyAssigned->port;
            }

            $start = (int) config('labs.port_start', 20000);
            $end = (int) config('labs.port_end', 40000);
            if ($end < $start) {
                [$start, $end] = [$end, $start];
            }

            for ($candidate = $start; $candidate <= $end; $candidate++) {
                try {
                    PortAllocation::query()->create([
                        'port' => $candidate,
                        'active_port' => $candidate,
                        'lab_instance_id' => $instanceId,
                        'status' => 'ASSIGNED',
                        'allocated_at' => now(),
                        'released_at' => null,
                    ]);

                    return $candidate;
                } catch (QueryException $e) {
                    if ($this->isActivePortDuplicate($e)) {
                        continue;
                    }

                    throw $e;
                }
            }

            throw new HttpException(409, "No available port in allocation range {$start}-{$end}.");
        });
    }

    public function releaseByInstance(string $instanceId): void
    {
        DB::transaction(function () use ($instanceId): void {
            PortAllocation::query()
                ->where('lab_instance_id', $instanceId)
                ->where('status', 'ASSIGNED')
                ->whereNotNull('active_port')
                ->lockForUpdate()
                ->update([
                    'status' => 'RELEASED',
                    'active_port' => null,
                    'released_at' => now(),
                    'updated_at' => now(),
                ]);
        });
    }

    private function isActivePortDuplicate(QueryException $e): bool
    {
        $message = strtolower((string) $e->getMessage());

        return (string) $e->getCode() === '23000'
            && (str_contains($message, 'active_port')
                || str_contains($message, 'port_allocations_active_port_unique')
                || str_contains($message, 'unique constraint failed: port_allocations.active_port'));
    }
}
