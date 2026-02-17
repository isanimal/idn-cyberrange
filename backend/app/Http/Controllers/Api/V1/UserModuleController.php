<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\LabInstance;
use App\Models\Lesson;
use App\Models\Module;
use App\Models\UserLessonProgress;
use App\Models\UserModuleProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class UserModuleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $modules = Module::query()
            ->whereNull('archived_at')
            ->where('status', 'active')
            ->withCount('lessons')
            ->with(['lessons' => fn ($q) => $q->where('is_active', true)->orderBy('order')])
            ->orderBy('order_index')
            ->get();

        $progressRows = UserModuleProgress::query()
            ->where('user_id', $user->id)
            ->whereIn('module_id', $modules->pluck('id'))
            ->get()
            ->keyBy('module_id');

        $lockedMap = $this->buildLockedMap($modules, $progressRows);

        $data = $modules->map(function (Module $module) use ($progressRows, $lockedMap): array {
            $progress = $progressRows->get($module->id);

            return [
                'id' => $module->id,
                'slug' => $module->slug,
                'title' => $module->title,
                'description' => $module->description,
                'difficulty' => strtoupper((string) ($module->difficulty ?: $module->level ?: 'BASIC')),
                'level' => strtoupper((string) ($module->difficulty ?: $module->level ?: 'BASIC')),
                'category' => $module->category ?: 'Web',
                'est_minutes' => (int) ($module->est_minutes ?? 30),
                'status' => 'PUBLISHED',
                'version' => (string) ($module->version ?? '0.1.0'),
                'tags' => is_array($module->tags) ? $module->tags : [],
                'cover_icon' => $module->cover_icon,
                'order_index' => (int) $module->order_index,
                'lessons_count' => (int) $module->lessons_count,
                'progress_percent' => (int) ($progress->progress_percent ?? 0),
                'is_locked' => (bool) ($lockedMap[$module->id] ?? false),
                'completed_at' => $progress?->completed_at?->toISOString(),
            ];
        })->values();

        return response()->json(['data' => $data]);
    }

    public function show(Request $request, string $slug): JsonResponse
    {
        $user = $request->user();

        $module = Module::query()
            ->where('slug', $slug)
            ->whereNull('archived_at')
            ->where('status', 'active')
            ->with([
                'lessons' => fn ($q) => $q->where('is_active', true)->orderBy('order'),
                'moduleLabTemplates' => fn ($q) => $q->with('labTemplate')->orderBy('order'),
            ])
            ->withCount('lessons')
            ->firstOrFail();

        $orderedModules = Module::query()
            ->whereNull('archived_at')
            ->where('status', 'active')
            ->orderBy('order_index')
            ->get(['id', 'order_index']);

        $progressRows = UserModuleProgress::query()
            ->where('user_id', $user->id)
            ->whereIn('module_id', $orderedModules->pluck('id'))
            ->get()
            ->keyBy('module_id');

        $lockedMap = $this->buildLockedMap($orderedModules, $progressRows);
        if ($lockedMap[$module->id] ?? false) {
            return response()->json(['message' => 'Module is locked'], Response::HTTP_FORBIDDEN);
        }

        $moduleProgress = UserModuleProgress::query()->updateOrCreate(
            ['user_id' => $user->id, 'module_id' => $module->id],
            [
                'started_at' => now(),
                'last_accessed_at' => now(),
            ]
        );

        $lessonProgressMap = UserLessonProgress::query()
            ->where('user_id', $user->id)
            ->whereIn('lesson_id', $module->lessons->pluck('id'))
            ->get()
            ->keyBy('lesson_id');

        $familyMap = $module->moduleLabTemplates
            ->filter(fn ($link) => $link->labTemplate !== null)
            ->mapWithKeys(fn ($link) => [$link->labTemplate->template_family_uuid => true])
            ->keys()
            ->values();

        $instancesByFamily = LabInstance::query()
            ->where('user_id', $user->id)
            ->whereHas('template', fn ($q) => $q->whereIn('template_family_uuid', $familyMap))
            ->with('template:id,template_family_uuid')
            ->orderByDesc('last_activity_at')
            ->get()
            ->groupBy(fn (LabInstance $instance) => $instance->template?->template_family_uuid)
            ->map(fn ($items) => $items->first());

        $payload = [
            'id' => $module->id,
            'slug' => $module->slug,
            'title' => $module->title,
            'description' => $module->description,
            'difficulty' => strtoupper((string) ($module->difficulty ?: $module->level ?: 'BASIC')),
            'level' => strtoupper((string) ($module->difficulty ?: $module->level ?: 'BASIC')),
            'category' => $module->category ?: 'Web',
            'est_minutes' => (int) ($module->est_minutes ?? 30),
            'status' => 'PUBLISHED',
            'version' => (string) ($module->version ?? '0.1.0'),
            'tags' => is_array($module->tags) ? $module->tags : [],
            'cover_icon' => $module->cover_icon,
            'order_index' => (int) $module->order_index,
            'progress_percent' => (int) ($moduleProgress->progress_percent ?? 0),
            'is_locked' => false,
            'lessons' => $module->lessons->map(function (Lesson $lesson) use ($lessonProgressMap): array {
                $progress = $lessonProgressMap->get($lesson->id);

                return [
                    'id' => $lesson->id,
                    'title' => $lesson->title,
                    'content_md' => $lesson->content_md ?? $lesson->content_markdown ?? $lesson->content,
                    'order' => (int) ($lesson->order ?? $lesson->order_index ?? 1),
                    'is_completed' => (bool) ($progress->is_completed ?? false),
                    'completed_at' => $progress?->completed_at?->toISOString(),
                ];
            })->values(),
            'labs' => $module->moduleLabTemplates->map(function ($link) use ($instancesByFamily): array {
                $template = $link->labTemplate;
                $instance = $template ? $instancesByFamily->get($template->template_family_uuid) : null;
                $state = strtoupper((string) ($instance?->state?->value ?? $instance?->state ?? ''));

                $statusForUser = match ($state) {
                    'ACTIVE' => 'RUNNING',
                    'INACTIVE', 'PAUSED', 'COMPLETED', 'ABANDONED' => 'STOPPED',
                    default => 'NOT_STARTED',
                };

                return [
                    'lab_template_id' => $template?->id,
                    'title' => $template?->title,
                    'difficulty' => strtoupper((string) ($template?->difficulty ?? '')),
                    'est_minutes' => (int) ($template?->estimated_time_minutes ?? 0),
                    'type' => strtoupper((string) ($link->type ?? 'LAB')),
                    'required' => (bool) $link->required,
                    'status_for_user' => $instance ? $statusForUser : 'NOT_STARTED',
                    'instance_id' => $instance?->id,
                ];
            })->values(),
        ];

        return response()->json(array_merge($payload, ['data' => $payload]));
    }

    public function start(Request $request, string $slug): JsonResponse
    {
        $user = $request->user();

        $module = Module::query()
            ->where('slug', $slug)
            ->whereNull('archived_at')
            ->where('status', 'active')
            ->firstOrFail();

        $isLocked = $this->isModuleLockedForUser($user->id, $module->id);
        if ($isLocked) {
            return response()->json(['message' => 'Module is locked'], Response::HTTP_FORBIDDEN);
        }

        $progress = UserModuleProgress::query()->updateOrCreate(
            ['user_id' => $user->id, 'module_id' => $module->id],
            [
                'started_at' => now(),
                'last_accessed_at' => now(),
            ]
        );

        return response()->json([
            'data' => [
                'module_id' => $module->id,
                'progress_percent' => (int) $progress->progress_percent,
                'started_at' => $progress->started_at?->toISOString(),
                'completed_at' => $progress->completed_at?->toISOString(),
            ],
        ]);
    }

    public function completeLesson(Request $request, string $slug, string $lessonId): JsonResponse
    {
        $user = $request->user();

        $module = Module::query()
            ->where('slug', $slug)
            ->whereNull('archived_at')
            ->where('status', 'active')
            ->firstOrFail();

        $isLocked = $this->isModuleLockedForUser($user->id, $module->id);
        if ($isLocked) {
            return response()->json(['message' => 'Module is locked'], Response::HTTP_FORBIDDEN);
        }

        $lesson = Lesson::query()
            ->where('id', $lessonId)
            ->where('module_id', $module->id)
            ->where('is_active', true)
            ->firstOrFail();

        UserLessonProgress::query()->updateOrCreate(
            ['user_id' => $user->id, 'lesson_id' => $lesson->id],
            [
                'is_completed' => true,
                'completed_at' => now(),
            ]
        );

        $progress = $this->recalculateModuleProgress($user->id, $module);

        return response()->json([
            'data' => [
                'module_id' => $module->id,
                'lesson_id' => $lesson->id,
                'progress_percent' => (int) $progress->progress_percent,
                'completed_at' => $progress->completed_at?->toISOString(),
            ],
        ]);
    }

    private function recalculateModuleProgress(string $userId, Module $module): UserModuleProgress
    {
        $lessonIds = $module->lessons()->where('is_active', true)->pluck('id');
        $totalLessons = max(1, $lessonIds->count());

        $completedLessons = UserLessonProgress::query()
            ->where('user_id', $userId)
            ->whereIn('lesson_id', $lessonIds)
            ->where('is_completed', true)
            ->count();

        $percent = (int) round(($completedLessons / $totalLessons) * 100);

        $progress = UserModuleProgress::query()->updateOrCreate(
            ['user_id' => $userId, 'module_id' => $module->id],
            [
                'started_at' => now(),
                'last_accessed_at' => now(),
            ]
        );

        $progress->progress_percent = min(100, max(0, $percent));
        $progress->last_accessed_at = now();
        if ($progress->progress_percent >= 100) {
            $progress->completed_at = now();
        }
        $progress->save();

        return $progress;
    }

    private function isModuleLockedForUser(string $userId, string $moduleId): bool
    {
        $modules = Module::query()
            ->whereNull('archived_at')
            ->where('status', 'active')
            ->orderBy('order_index')
            ->get(['id', 'order_index']);

        $progressRows = UserModuleProgress::query()
            ->where('user_id', $userId)
            ->whereIn('module_id', $modules->pluck('id'))
            ->get()
            ->keyBy('module_id');

        $lockedMap = $this->buildLockedMap($modules, $progressRows);

        return (bool) ($lockedMap[$moduleId] ?? false);
    }

    private function buildLockedMap($modules, $progressRows): array
    {
        $previousCompleted = true;
        $lockedMap = [];

        foreach ($modules as $module) {
            $progress = $progressRows->get($module->id);
            $isCompleted = ($progress?->completed_at !== null) || ((int) ($progress?->progress_percent ?? 0) >= 100);

            $lockedMap[$module->id] = ! $previousCompleted;
            $previousCompleted = $isCompleted;
        }

        return $lockedMap;
    }
}
