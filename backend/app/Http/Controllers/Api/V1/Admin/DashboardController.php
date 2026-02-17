<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\LabInstanceState;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\LabInstance;
use App\Models\Submission;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function overview(): JsonResponse
    {
        $now = now();
        $start24h = $now->copy()->subDay();
        $start7d = $now->copy()->startOfDay()->subDays(6);

        $totalUsers = User::query()->count();
        $activeLabInstances = LabInstance::query()->where('state', LabInstanceState::ACTIVE)->count();
        $submissions24h = Submission::query()->where('submitted_at', '>=', $start24h)->count();
        $failedJobs = LabInstance::query()
            ->where('state', LabInstanceState::ABANDONED)
            ->where('updated_at', '>=', $start24h)
            ->count();

        $submissionsByDay = Submission::query()
            ->selectRaw('DATE(submitted_at) as day, COUNT(*) as count')
            ->where('submitted_at', '>=', $start7d)
            ->groupBy('day')
            ->orderBy('day')
            ->pluck('count', 'day');

        $flagSubmissionsLast7Days = [];
        for ($i = 0; $i < 7; $i++) {
            $day = $start7d->copy()->addDays($i)->toDateString();
            $flagSubmissionsLast7Days[] = [
                'date' => $day,
                'count' => (int) ($submissionsByDay[$day] ?? 0),
            ];
        }

        $recentAuditLogs = AuditLog::query()
            ->latest('created_at')
            ->limit(10)
            ->get()
            ->map(function (AuditLog $log): array {
                $metadata = $log->metadata ?? [];
                $message = is_array($metadata) && isset($metadata['message']) && is_string($metadata['message'])
                    ? $metadata['message']
                    : $this->fallbackMessage($log);

                return [
                    'id' => $log->id,
                    'tag' => 'ADMIN',
                    'message' => $message,
                    'createdAt' => optional($log->created_at)?->toIso8601String(),
                    'timeAgo' => $log->created_at ? Carbon::parse($log->created_at)->diffForHumans(short: true) : null,
                ];
            })
            ->values();

        return response()->json([
            'metrics' => [
                'totalUsers' => $totalUsers,
                'activeLabInstances' => $activeLabInstances,
                'submissions24h' => $submissions24h,
                'failedJobs' => $failedJobs,
            ],
            'flagSubmissionsLast7Days' => $flagSubmissionsLast7Days,
            'recentAuditLogs' => $recentAuditLogs,
        ]);
    }

    private function fallbackMessage(AuditLog $log): string
    {
        $target = $log->target_type ?: 'entity';
        $action = str_replace('_', ' ', strtolower($log->action));
        $action = ucfirst($action);

        return sprintf('%s %s', $action, $target);
    }
}

