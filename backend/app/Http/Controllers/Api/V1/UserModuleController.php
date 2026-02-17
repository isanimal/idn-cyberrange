<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ModuleStatus;
use App\Http\Controllers\Controller;
use App\Models\Module;
use App\Models\ModuleProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserModuleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $modules = Module::query()
            ->whereNotIn('status', [ModuleStatus::DRAFT->value, 'archived'])
            ->withCount('lessons')
            ->orderBy('order_index')
            ->get();

        $progressRows = ModuleProgress::query()
            ->where('user_id', $user->id)
            ->whereIn('module_id', $modules->pluck('id'))
            ->get()
            ->keyBy('module_id');

        $previousCompleted = true;
        $data = $modules->map(function (Module $module) use ($progressRows, &$previousCompleted): array {
            $progress = $progressRows->get($module->id);
            $progressPercent = (int) ($progress->progress_percent ?? 0);
            $isCompleted = (bool) ($progress->is_completed ?? false) || $progressPercent >= 100;

            $statusValue = strtoupper($module->status?->value ?? (string) $module->status);
            $statusLocked = $statusValue === 'LOCKED';
            $chainLocked = ! $previousCompleted;
            $isLocked = $statusLocked || $chainLocked;

            $previousCompleted = $isCompleted;

            return [
                'id' => $module->id,
                'title' => $module->title,
                'slug' => $module->slug,
                'description' => $module->description,
                'level' => strtoupper($module->level?->value ?? (string) $module->level),
                'status' => $statusValue,
                'order_index' => $module->order_index,
                'lessons_count' => (int) $module->lessons_count,
                'progress_percent' => $progressPercent,
                'is_locked' => $isLocked,
            ];
        })->values();

        return response()->json(['data' => $data]);
    }

    public function show(Request $request, string $slug): JsonResponse
    {
        $user = $request->user();
        $module = Module::query()
            ->with(['lessons' => fn ($q) => $q->orderBy('order_index')])
            ->where('slug', $slug)
            ->firstOrFail();

        $statusValue = strtoupper($module->status?->value ?? (string) $module->status);
        if (! $user->isAdmin() && in_array($statusValue, ['DRAFT', 'ARCHIVED'], true)) {
            abort(404);
        }

        $sortedVisible = Module::query()
            ->whereNotIn('status', [ModuleStatus::DRAFT->value, 'archived'])
            ->withCount('lessons')
            ->orderBy('order_index')
            ->get();

        $progressRows = ModuleProgress::query()
            ->where('user_id', $user->id)
            ->whereIn('module_id', $sortedVisible->pluck('id'))
            ->get()
            ->keyBy('module_id');

        $previousCompleted = true;
        $lockedMap = [];
        foreach ($sortedVisible as $row) {
            $progress = $progressRows->get($row->id);
            $progressPercent = (int) ($progress->progress_percent ?? 0);
            $isCompleted = (bool) ($progress->is_completed ?? false) || $progressPercent >= 100;
            $statusLocked = strtoupper($row->status?->value ?? (string) $row->status) === 'LOCKED';
            $lockedMap[$row->id] = $statusLocked || ! $previousCompleted;
            $previousCompleted = $isCompleted;
        }

        $progress = ModuleProgress::query()->updateOrCreate(
            ['user_id' => $user->id, 'module_id' => $module->id],
            ['last_accessed_at' => now()],
        );

        return response()->json([
            'id' => $module->id,
            'title' => $module->title,
            'slug' => $module->slug,
            'description' => $module->description,
            'level' => strtoupper($module->level?->value ?? (string) $module->level),
            'status' => $statusValue,
            'order_index' => $module->order_index,
            'progress_percent' => (int) $progress->progress_percent,
            'is_locked' => (bool) ($lockedMap[$module->id] ?? false),
            'guide_markdown' => $module->description ?: '# Module',
            'lessons' => $module->lessons->map(fn ($lesson) => [
                'id' => $lesson->id,
                'title' => $lesson->title,
                'order_index' => $lesson->order_index,
                'content_markdown' => $lesson->content_markdown ?? $lesson->content,
            ])->values(),
        ]);
    }
}
