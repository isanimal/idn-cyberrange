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
    /**
     * Legacy endpoint shape kept for backward compatibility.
     */
    public function overview(): JsonResponse
    {
        $stats = $this->buildOverviewStats();

        return response()->json([
            'metrics' => [
                'totalUsers' => $stats['totals']['users'],
                'activeLabInstances' => $stats['totals']['active_lab_instances'],
                'submissions24h' => $stats['totals']['submissions_24h'],
                'failedJobs' => $stats['totals']['failed_jobs'],
            ],
            'flagSubmissionsLast7Days' => collect($stats['submissions_last_7_days'])
                ->map(fn (array $row): array => [
                    'date' => $row['date'],
                    'count' => $row['count'],
                ])
                ->values(),
            'recentAuditLogs' => collect($stats['recent_audit_logs'])
                ->map(fn (array $row): array => [
                    'id' => $row['id'],
                    'tag' => strtoupper($row['actor_name'] ?: 'ADMIN'),
                    'message' => $row['entity_label'],
                    'createdAt' => $row['created_at'],
                    'timeAgo' => $row['created_at_human'],
                ])
                ->values(),
        ]);
    }

    public function adminOverview(): JsonResponse
    {
        return response()->json([
            'data' => $this->buildOverviewStats(),
        ]);
    }

    private function buildOverviewStats(): array
    {
        $now = now();
        $start24h = $now->copy()->subDay();
        $start7d = $now->copy()->startOfDay()->subDays(6);

        $totalUsers = User::query()->count();
        $activeLabInstances = LabInstance::query()->where('state', LabInstanceState::ACTIVE)->count();

        // Existing submissions table is used as canonical source for flag submissions.
        $submissions24h = Submission::query()->where('submitted_at', '>=', $start24h)->count();

        // Failed jobs derived from orchestration runtime failures in last 24h.
        $failedJobs = LabInstance::query()
            ->where(function ($query): void {
                $query->where('state', LabInstanceState::ABANDONED)
                    ->orWhereNotNull('last_error');
            })
            ->where('updated_at', '>=', $start24h)
            ->count();

        $submissionsByDate = Submission::query()
            ->selectRaw('DATE(submitted_at) as day, COUNT(*) as count')
            ->where('submitted_at', '>=', $start7d)
            ->groupBy('day')
            ->orderBy('day')
            ->pluck('count', 'day');

        $submissionsLast7Days = [];
        for ($i = 0; $i < 7; $i++) {
            $date = $start7d->copy()->addDays($i);
            $dateString = $date->toDateString();
            $submissionsLast7Days[] = [
                'date' => $dateString,
                'day' => $date->format('D'),
                'count' => (int) ($submissionsByDate[$dateString] ?? 0),
            ];
        }

        $recentAuditLogs = AuditLog::query()
            ->with(['actor:id,name'])
            ->latest('created_at')
            ->limit(10)
            ->get()
            ->map(function (AuditLog $log): array {
                $metadata = is_array($log->metadata) ? $log->metadata : [];
                $entityLabel = isset($metadata['message']) && is_string($metadata['message'])
                    ? $metadata['message']
                    : $this->fallbackEntityLabel($log);

                return [
                    'id' => $log->id,
                    'actor_name' => $log->actor?->name,
                    'action' => $log->action,
                    'entity_type' => $log->target_type,
                    'entity_label' => $entityLabel,
                    'created_at' => $log->created_at?->toIso8601String(),
                    'created_at_human' => $log->created_at ? Carbon::parse($log->created_at)->diffForHumans(short: true) : null,
                ];
            })
            ->values()
            ->all();

        return [
            'totals' => [
                'users' => $totalUsers,
                'active_lab_instances' => $activeLabInstances,
                'submissions_24h' => $submissions24h,
                'failed_jobs' => $failedJobs,
            ],
            'submissions_last_7_days' => $submissionsLast7Days,
            'recent_audit_logs' => $recentAuditLogs,
        ];
    }

    private function fallbackEntityLabel(AuditLog $log): string
    {
        $action = str_replace('_', ' ', strtolower((string) $log->action));
        $target = (string) ($log->target_type ?: 'entity');

        return trim(ucfirst($action).' '.$target);
    }
}
