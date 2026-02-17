<?php

namespace App\Services\Orchestration;

use App\Models\PortAllocation;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

class PortAllocatorService
{
    public function allocate(string $instanceId): int
    {
        $start = (int) config('labs.port_start', 20000);
        $end = (int) config('labs.port_end', 40000);

        return DB::transaction(function () use ($instanceId, $start, $end): int {
            for ($port = $start; $port <= $end; $port++) {
                $occupied = PortAllocation::query()
                    ->where('port', $port)
                    ->where('status', 'ASSIGNED')
                    ->exists();

                if ($occupied || $this->isPortInUse($port)) {
                    continue;
                }

                PortAllocation::query()->create([
                    'port' => $port,
                    'lab_instance_id' => $instanceId,
                    'status' => 'ASSIGNED',
                    'allocated_at' => now(),
                ]);

                return $port;
            }

            throw new HttpException(409, 'No available port in allocation range.');
        });
    }

    public function releaseByInstance(string $instanceId): void
    {
        PortAllocation::query()
            ->where('lab_instance_id', $instanceId)
            ->where('status', 'ASSIGNED')
            ->update([
                'status' => 'RELEASED',
                'released_at' => now(),
            ]);
    }

    private function isPortInUse(int $port): bool
    {
        if (app()->environment('testing')) {
            return false;
        }

        $conn = @fsockopen('127.0.0.1', $port, $errno, $errstr, 0.05);
        if (is_resource($conn)) {
            fclose($conn);
            return true;
        }

        return false;
    }
}
