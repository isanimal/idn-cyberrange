<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\SubmissionResult;
use App\Http\Controllers\Controller;
use App\Models\LabInstance;
use App\Models\Submission;
use App\Models\UserModule;
use App\Models\UserModuleProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        $assignmentQuery = UserModule::query()
            ->where('user_id', $user->id)
            ->with([
                'module' => fn ($q) => $q
                    ->whereNull('archived_at')
                    ->where('status', 'active')
                    ->withCount('lessons'),
            ]);

        $assignments = $assignmentQuery->get()->filter(fn (UserModule $assignment) => $assignment->module !== null)->values();
        $moduleIds = $assignments->pluck('module_id')->all();

        $progressRows = UserModuleProgress::query()
            ->where('user_id', $user->id)
            ->whereIn('module_id', $moduleIds)
            ->get()
            ->keyBy('module_id');

        $assignedModules = $assignments->map(function (UserModule $assignment) use ($progressRows): array {
            $module = $assignment->module;
            $progress = $progressRows->get($assignment->module_id);

            return [
                'id' => $module->id,
                'slug' => $module->slug,
                'title' => $module->title,
                'description' => $module->description,
                'difficulty' => strtoupper((string) ($module->difficulty ?: $module->level ?: 'BASIC')),
                'status' => strtoupper((string) $assignment->status),
                'is_locked' => strtoupper((string) $assignment->status) === UserModule::STATUS_LOCKED,
                'lessons_count' => (int) $module->lessons_count,
                'progress_percent' => (int) ($progress->progress_percent ?? 0),
                'last_accessed_at' => $progress?->last_accessed_at?->toISOString(),
                'last_lesson_id' => $progress?->last_lesson_id,
                'completed_at' => $progress?->completed_at?->toISOString(),
                'assigned_at' => $assignment->assigned_at?->toISOString(),
                'due_at' => $assignment->due_at?->toISOString(),
            ];
        })->values();

        $lastAccessedModule = $assignedModules
            ->filter(fn (array $module): bool => ! empty($module['last_accessed_at']))
            ->sortByDesc('last_accessed_at')
            ->first();

        $totalPoints = (int) Submission::query()
            ->join('challenges', 'challenges.id', '=', 'submissions.challenge_id')
            ->where('submissions.user_id', $user->id)
            ->where('submissions.result', SubmissionResult::CORRECT->value)
            ->sum('challenges.points');

        $activeLabsCount = LabInstance::query()
            ->where('user_id', $user->id)
            ->where('state', 'ACTIVE')
            ->count();

        $recentActivity = Submission::query()
            ->with('challenge:id,title')
            ->where('user_id', $user->id)
            ->orderByDesc('submitted_at')
            ->limit(10)
            ->get()
            ->map(function (Submission $submission): array {
                return [
                    'type' => 'submission',
                    'id' => $submission->id,
                    'challenge_id' => $submission->challenge_id,
                    'challenge_title' => $submission->challenge?->title,
                    'result' => $submission->result?->value ?? (string) $submission->result,
                    'attempt_no' => (int) $submission->attempt_no,
                    'submitted_at' => $submission->submitted_at?->toISOString(),
                ];
            })
            ->values();

        return response()->json([
            'data' => [
                'total_points' => $totalPoints,
                'active_labs_count' => $activeLabsCount,
                'global_rank' => null,
                'assigned_modules' => $assignedModules,
                'last_accessed_module' => $lastAccessedModule,
                'recent_activity' => $recentActivity,
            ],
        ]);
    }
}
