<?php

namespace App\Console\Commands;

use App\Enums\LabInstanceState;
use App\Models\LabInstance;
use App\Services\Lab\LabInstanceService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CleanupExpiredLabsCommand extends Command
{
    protected $signature = 'labs:cleanup-expired';

    protected $description = 'Stop expired active lab instances and release runtime resources.';

    public function handle(LabInstanceService $instances): int
    {
        $expired = LabInstance::query()
            ->where('state', LabInstanceState::ACTIVE)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->get(['id']);

        if ($expired->isEmpty()) {
            $this->line('No expired lab instances.');
            return self::SUCCESS;
        }

        $stopped = 0;
        $failed = 0;

        foreach ($expired as $row) {
            try {
                $instances->forceStopByAdmin($row->id);
                $stopped++;
            } catch (\Throwable $e) {
                $failed++;
                LabInstance::query()->where('id', $row->id)->update([
                    'state' => LabInstanceState::ABANDONED,
                    'last_error' => 'TTL cleanup failed: '.$e->getMessage(),
                    'last_activity_at' => now(),
                ]);

                Log::warning('Failed stopping expired lab instance', [
                    'instance_id' => $row->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->info("Expired cleanup done. stopped={$stopped}, failed={$failed}");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
