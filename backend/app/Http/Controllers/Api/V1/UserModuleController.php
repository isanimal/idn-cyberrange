<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\LabInstance;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\Module;
use App\Models\UserLessonProgress;
use App\Models\UserModuleProgress;
use App\Models\UserTaskProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;

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
                'locked_reason' => (bool) ($lockedMap[$module->id] ?? false) ? 'Complete the previous module to unlock this one.' : null,
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
            'resume_lesson_id' => $moduleProgress->last_lesson_id,
            'lessons' => $module->lessons->map(function (Lesson $lesson) use ($lessonProgressMap): array {
                $progress = $lessonProgressMap->get($lesson->id);
                $percent = (int) ($progress->percent ?? 0);
                $status = $this->normalizeLessonStatus(
                    (string) ($progress->status ?? ''),
                    (bool) ($progress->is_completed ?? false),
                    $percent
                );

                return [
                    'id' => $lesson->id,
                    'title' => $lesson->title,
                    'content_md' => $lesson->content_md ?? $lesson->content_markdown ?? $lesson->content,
                    'order' => (int) ($lesson->order ?? $lesson->order_index ?? 1),
                    'status' => $status,
                    'percent' => $status === 'COMPLETED' ? 100 : $percent,
                    'is_completed' => $status === 'COMPLETED',
                    'started_at' => $progress?->started_at?->toISOString(),
                    'completed_at' => $progress?->completed_at?->toISOString(),
                    'last_seen_at' => $progress?->last_seen_at?->toISOString(),
                ];
            })->values(),
            'labs' => $this->buildModuleLabsPayload($user->id, $module),
        ];

        return response()->json(array_merge($payload, ['data' => $payload]));
    }

    public function labs(Request $request, string $slug): JsonResponse
    {
        $user = $request->user();

        $module = Module::query()
            ->where('slug', $slug)
            ->whereNull('archived_at')
            ->where('status', 'active')
            ->with(['moduleLabTemplates' => fn ($q) => $q->with('labTemplate')->orderBy('order')])
            ->firstOrFail();

        if ($this->isModuleLockedForUser($user->id, $module->id)) {
            return response()->json(['message' => 'Module is locked'], Response::HTTP_FORBIDDEN);
        }

        return response()->json([
            'data' => [
                'module_id' => $module->id,
                'module_slug' => $module->slug,
                'labs' => $this->buildModuleLabsPayload($user->id, $module),
            ],
        ]);
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
        $lesson = $this->getLessonOrFailForUser($user->id, $slug, $lessonId);

        UserLessonProgress::query()->updateOrCreate(
            ['user_id' => $user->id, 'lesson_id' => $lesson->id],
            [
                'status' => 'COMPLETED',
                'percent' => 100,
                'is_completed' => true,
                'started_at' => now(),
                'completed_at' => now(),
                'last_seen_at' => now(),
            ]
        );

        $progress = $this->recalculateModuleProgress($user->id, $lesson->module);
        $this->touchModuleLastLesson($user->id, $lesson->module_id, $lesson->id);

        return response()->json([
            'data' => [
                'module_id' => $lesson->module_id,
                'lesson_id' => $lesson->id,
                'progress_percent' => (int) $progress->progress_percent,
                'completed_at' => $progress->completed_at?->toISOString(),
            ],
        ]);
    }

    public function lesson(Request $request, string $slug, string $lessonId): JsonResponse
    {
        $user = $request->user();
        $lesson = $this->getLessonOrFailForUser($user->id, $slug, $lessonId);

        return response()->json([
            'data' => $this->buildLessonPayload($user->id, $lesson, true),
        ]);
    }

    public function lessonById(Request $request, string $lessonId): JsonResponse
    {
        $user = $request->user();

        $lesson = Lesson::query()
            ->with([
                'module',
                'tasks' => fn ($q) => $q->orderBy('order_index'),
                'assets' => fn ($q) => $q->orderBy('order_index'),
            ])
            ->where('id', $lessonId)
            ->where('is_active', true)
            ->firstOrFail();

        $module = $lesson->module;
        if (! $module || $module->status !== 'active' || $module->archived_at !== null) {
            return response()->json(['message' => 'Module is not available'], Response::HTTP_FORBIDDEN);
        }

        if ($this->isModuleLockedForUser($user->id, $module->id)) {
            return response()->json(['message' => 'Module is locked'], Response::HTTP_FORBIDDEN);
        }

        return response()->json([
            'data' => $this->buildLessonPayload($user->id, $lesson, true),
        ]);
    }

    public function updateLessonProgress(Request $request, string $lessonId): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'])],
            'percent' => ['nullable', 'integer', 'min:0', 'max:100'],
        ]);

        $lesson = Lesson::query()
            ->where('id', $lessonId)
            ->where('is_active', true)
            ->with('module')
            ->firstOrFail();

        $module = $lesson->module;
        if (! $module || $module->status !== 'active' || $module->archived_at !== null) {
            return response()->json(['message' => 'Module is not available'], Response::HTTP_FORBIDDEN);
        }

        if ($this->isModuleLockedForUser($user->id, $module->id)) {
            return response()->json(['message' => 'Module is locked'], Response::HTTP_FORBIDDEN);
        }

        $status = (string) $validated['status'];
        $percent = (int) ($validated['percent'] ?? 0);
        if ($status === 'COMPLETED') {
            $percent = 100;
        } elseif ($status === 'NOT_STARTED') {
            $percent = 0;
        } else {
            $percent = max(1, min(99, $percent));
        }

        $progress = UserLessonProgress::query()->updateOrCreate(
            ['user_id' => $user->id, 'lesson_id' => $lesson->id],
            [
                'status' => $status,
                'percent' => $percent,
                'is_completed' => $status === 'COMPLETED',
                'started_at' => $status !== 'NOT_STARTED' ? now() : null,
                'completed_at' => $status === 'COMPLETED' ? now() : null,
                'last_seen_at' => now(),
            ]
        );

        if ($status === 'IN_PROGRESS') {
            $progress->is_completed = false;
            $progress->completed_at = null;
            $progress->started_at = $progress->started_at ?? now();
            $progress->percent = max(1, min(99, (int) $progress->percent));
        }

        if ($status === 'NOT_STARTED') {
            $progress->is_completed = false;
            $progress->percent = 0;
            $progress->completed_at = null;
            $progress->started_at = null;
        }

        $progress->save();

        $moduleProgress = $this->recalculateModuleProgress($user->id, $module);
        $this->touchModuleLastLesson($user->id, $module->id, $lesson->id);

        return response()->json([
            'data' => [
                'lesson_id' => $lesson->id,
                'module_id' => $module->id,
                'status' => $this->normalizeLessonStatus((string) $progress->status, (bool) $progress->is_completed, (int) $progress->percent),
                'percent' => (int) $progress->percent,
                'is_completed' => (bool) $progress->is_completed,
                'started_at' => $progress->started_at?->toISOString(),
                'completed_at' => $progress->completed_at?->toISOString(),
                'last_seen_at' => $progress->last_seen_at?->toISOString(),
                'module_progress_percent' => (int) $moduleProgress->progress_percent,
            ],
        ]);
    }

    public function readingEvent(Request $request, string $lessonId): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'event' => ['required', 'string', Rule::in(['OPEN', 'SCROLL', 'HEARTBEAT'])],
            'percentViewed' => ['nullable', 'integer', 'min:0', 'max:100'],
        ]);

        $lesson = Lesson::query()
            ->with([
                'module',
                'tasks' => fn ($q) => $q->orderBy('order_index'),
            ])
            ->where('id', $lessonId)
            ->where('is_active', true)
            ->firstOrFail();

        $module = $lesson->module;
        if (! $module || $module->status !== 'active' || $module->archived_at !== null) {
            return response()->json(['message' => 'Module is not available'], Response::HTTP_FORBIDDEN);
        }

        if ($this->isModuleLockedForUser($user->id, $module->id)) {
            return response()->json(['message' => 'Module is locked'], Response::HTTP_FORBIDDEN);
        }

        $progress = UserLessonProgress::query()->updateOrCreate(
            ['user_id' => $user->id, 'lesson_id' => $lesson->id],
            [
                'status' => 'IN_PROGRESS',
                'percent' => 0,
                'is_completed' => false,
                'started_at' => now(),
                'last_seen_at' => now(),
            ]
        );

        if ($progress->is_completed || strtoupper((string) $progress->status) === 'COMPLETED') {
            $this->touchModuleLastLesson($user->id, $module->id, $lesson->id);
            return response()->json([
                'data' => [
                    'lesson_id' => $lesson->id,
                    'status' => 'COMPLETED',
                    'percent' => 100,
                    'module_progress_percent' => (int) ($this->recalculateModuleProgress($user->id, $module)->progress_percent),
                ],
            ]);
        }

        $readingPercent = $this->deriveReadingPercent(
            (string) $validated['event'],
            (int) ($validated['percentViewed'] ?? 0),
            (int) $progress->percent
        );

        $taskPercent = $this->calculateTaskCompletionPercent($user->id, $lesson);
        $combinedPercent = max($readingPercent, $taskPercent);

        $progress->status = $combinedPercent >= 100 ? 'COMPLETED' : ($combinedPercent > 0 ? 'IN_PROGRESS' : 'NOT_STARTED');
        $progress->percent = max(0, min(100, $combinedPercent));
        $progress->is_completed = $combinedPercent >= 100;
        $progress->started_at = $progress->started_at ?? now();
        $progress->last_seen_at = now();
        $progress->completed_at = $combinedPercent >= 100 ? now() : null;
        $progress->save();

        $moduleProgress = $this->recalculateModuleProgress($user->id, $module);
        $this->touchModuleLastLesson($user->id, $module->id, $lesson->id);

        return response()->json([
            'data' => [
                'lesson_id' => $lesson->id,
                'status' => $combinedPercent >= 100 ? 'COMPLETED' : 'IN_PROGRESS',
                'percent' => (int) $progress->percent,
                'module_progress_percent' => (int) $moduleProgress->progress_percent,
            ],
        ]);
    }

    public function toggleTask(Request $request, string $taskId): JsonResponse
    {
        $user = $request->user();

        $task = LessonTask::query()
            ->with(['lesson.module', 'lesson.tasks'])
            ->where('id', $taskId)
            ->firstOrFail();

        $lesson = $task->lesson;
        $module = $lesson?->module;
        if (! $lesson || ! $module || $module->status !== 'active' || $module->archived_at !== null) {
            return response()->json(['message' => 'Lesson is not available'], Response::HTTP_FORBIDDEN);
        }

        if ($this->isModuleLockedForUser($user->id, $module->id)) {
            return response()->json(['message' => 'Module is locked'], Response::HTTP_FORBIDDEN);
        }

        $taskProgress = UserTaskProgress::query()->firstOrNew([
            'user_id' => $user->id,
            'task_id' => $task->id,
        ]);

        $taskProgress->is_done = ! (bool) $taskProgress->is_done;
        $taskProgress->done_at = $taskProgress->is_done ? now() : null;
        $taskProgress->save();

        $lessonProgress = UserLessonProgress::query()->updateOrCreate(
            ['user_id' => $user->id, 'lesson_id' => $lesson->id],
            [
                'status' => 'IN_PROGRESS',
                'percent' => 0,
                'is_completed' => false,
                'started_at' => now(),
                'last_seen_at' => now(),
            ]
        );

        if (! $lessonProgress->is_completed) {
            $taskPercent = $this->calculateTaskCompletionPercent($user->id, $lesson);
            $readingPercent = (int) $lessonProgress->percent;
            $combinedPercent = max($readingPercent, $taskPercent);

            $lessonProgress->status = $combinedPercent >= 100 ? 'COMPLETED' : ($combinedPercent > 0 ? 'IN_PROGRESS' : 'NOT_STARTED');
            $lessonProgress->percent = max(0, min(100, $combinedPercent));
            $lessonProgress->is_completed = $combinedPercent >= 100;
            $lessonProgress->started_at = $lessonProgress->started_at ?? now();
            $lessonProgress->last_seen_at = now();
            $lessonProgress->completed_at = $combinedPercent >= 100 ? now() : null;
            $lessonProgress->save();
        }

        $moduleProgress = $this->recalculateModuleProgress($user->id, $module);
        $this->touchModuleLastLesson($user->id, $module->id, $lesson->id);

        return response()->json([
            'data' => [
                'task_id' => $task->id,
                'is_done' => (bool) $taskProgress->is_done,
                'done_at' => $taskProgress->done_at?->toISOString(),
                'lesson_id' => $lesson->id,
                'lesson_percent' => (int) $lessonProgress->percent,
                'module_progress_percent' => (int) $moduleProgress->progress_percent,
            ],
        ]);
    }

    public function completeLessonById(Request $request, string $lessonId): JsonResponse
    {
        $lesson = Lesson::query()->with('module')->findOrFail($lessonId);

        if (! $lesson->module) {
            return response()->json(['message' => 'Module not found'], Response::HTTP_NOT_FOUND);
        }

        return $this->completeLesson($request, (string) $lesson->module->slug, $lessonId);
    }

    private function recalculateModuleProgress(string $userId, Module $module): UserModuleProgress
    {
        $lessonIds = $module->lessons()->where('is_active', true)->pluck('id');
        $totalLessons = max(1, $lessonIds->count());
        $progressMap = UserLessonProgress::query()
            ->where('user_id', $userId)
            ->whereIn('lesson_id', $lessonIds)
            ->get()
            ->keyBy('lesson_id');

        $percentSum = 0;
        foreach ($lessonIds as $lessonId) {
            $lessonProgress = $progressMap->get($lessonId);
            if (! $lessonProgress) {
                continue;
            }

            $lessonPercent = (int) ($lessonProgress->percent ?? 0);
            if ((bool) ($lessonProgress->is_completed ?? false)) {
                $lessonPercent = 100;
            }
            $percentSum += max(0, min(100, $lessonPercent));
        }

        $percent = (int) round($percentSum / $totalLessons);

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

    private function normalizeLessonStatus(string $status, bool $isCompleted, int $percent): string
    {
        $status = strtoupper($status);
        if ($isCompleted || $percent >= 100 || $status === 'COMPLETED') {
            return 'COMPLETED';
        }

        if ($status === 'IN_PROGRESS' || $percent > 0) {
            return 'IN_PROGRESS';
        }

        return 'NOT_STARTED';
    }

    private function getLessonOrFailForUser(string $userId, string $slug, string $lessonId): Lesson
    {
        $module = Module::query()
            ->where('slug', $slug)
            ->whereNull('archived_at')
            ->where('status', 'active')
            ->firstOrFail();

        $isLocked = $this->isModuleLockedForUser($userId, $module->id);
        if ($isLocked) {
            abort(Response::HTTP_FORBIDDEN, 'Module is locked');
        }

        return Lesson::query()
            ->where('id', $lessonId)
            ->where('module_id', $module->id)
            ->where('is_active', true)
            ->with([
                'module',
                'tasks' => fn ($q) => $q->orderBy('order_index'),
                'assets' => fn ($q) => $q->orderBy('order_index'),
            ])
            ->firstOrFail();
    }

    private function buildLessonPayload(string $userId, Lesson $lesson, bool $touchProgress = false): array
    {
        $progress = UserLessonProgress::query()->firstOrNew([
            'user_id' => $userId,
            'lesson_id' => $lesson->id,
        ]);

        if ($touchProgress && ! $progress->exists) {
            $progress->status = 'IN_PROGRESS';
            $progress->percent = 10;
            $progress->is_completed = false;
            $progress->started_at = now();
            $progress->last_seen_at = now();
            $progress->save();
        }

        if ($touchProgress && $progress->exists && ! $progress->is_completed) {
            $progress->status = $progress->status ?: 'IN_PROGRESS';
            $progress->percent = max(10, (int) $progress->percent);
            $progress->started_at = $progress->started_at ?? now();
            $progress->last_seen_at = now();
            $progress->save();
        }

        $taskProgressMap = UserTaskProgress::query()
            ->where('user_id', $userId)
            ->whereIn('task_id', $lesson->tasks->pluck('id'))
            ->get()
            ->keyBy('task_id');

        $taskPercent = $this->calculateTaskCompletionPercent($userId, $lesson, $taskProgressMap);
        $rawPercent = (int) ($progress->percent ?? 0);
        $effectivePercent = $progress->is_completed ? 100 : max($rawPercent, $taskPercent);
        $status = $this->normalizeLessonStatus((string) ($progress->status ?? ''), (bool) ($progress->is_completed ?? false), $effectivePercent);

        if (! $progress->is_completed && $effectivePercent !== $rawPercent) {
            if ($effectivePercent >= 100) {
                $progress->status = 'COMPLETED';
                $progress->percent = 100;
                $progress->is_completed = true;
                $progress->completed_at = now();
            } else {
                $progress->status = 'IN_PROGRESS';
                $progress->percent = max(0, min(99, $effectivePercent));
            }
            $progress->last_seen_at = now();
            $progress->save();
        }

        $this->recalculateModuleProgress($userId, $lesson->module);
        $this->touchModuleLastLesson($userId, $lesson->module_id, $lesson->id);

        return [
            'id' => $lesson->id,
            'module_id' => $lesson->module_id,
            'module_slug' => $lesson->module?->slug,
            'title' => $lesson->title,
            'content_md' => $lesson->content_md ?? $lesson->content_markdown ?? $lesson->content,
            'order' => (int) ($lesson->order ?? $lesson->order_index ?? 1),
            'status' => $status,
            'percent' => $status === 'COMPLETED' ? 100 : (int) ($progress->percent ?? 0),
            'is_completed' => $status === 'COMPLETED',
            'started_at' => $progress->started_at?->toISOString(),
            'completed_at' => $progress->completed_at?->toISOString(),
            'last_seen_at' => $progress->last_seen_at?->toISOString(),
            'tasks' => $lesson->tasks->map(function (LessonTask $task) use ($taskProgressMap): array {
                $taskProgress = $taskProgressMap->get($task->id);

                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'order_index' => (int) $task->order_index,
                    'points' => $task->points !== null ? (int) $task->points : null,
                    'is_done' => (bool) ($taskProgress->is_done ?? false),
                    'done_at' => $taskProgress?->done_at?->toISOString(),
                ];
            })->values(),
            'assets' => $lesson->assets->map(fn ($asset): array => [
                'id' => $asset->id,
                'type' => strtoupper((string) $asset->type),
                'url' => $asset->url,
                'caption' => $asset->caption,
                'order_index' => (int) $asset->order_index,
            ])->values(),
        ];
    }

    private function calculateTaskCompletionPercent(string $userId, Lesson $lesson, ?Collection $taskProgressMap = null): int
    {
        $tasks = $lesson->tasks;
        if ($tasks->count() === 0) {
            return 0;
        }

        $taskProgressMap = $taskProgressMap ?? UserTaskProgress::query()
            ->where('user_id', $userId)
            ->whereIn('task_id', $tasks->pluck('id'))
            ->get()
            ->keyBy('task_id');

        $doneCount = $tasks->filter(fn (LessonTask $task) => (bool) ($taskProgressMap->get($task->id)?->is_done ?? false))->count();

        return (int) round(($doneCount / max(1, $tasks->count())) * 100);
    }

    private function touchModuleLastLesson(string $userId, string $moduleId, string $lessonId): void
    {
        UserModuleProgress::query()->updateOrCreate(
            ['user_id' => $userId, 'module_id' => $moduleId],
            [
                'last_lesson_id' => $lessonId,
                'started_at' => now(),
                'last_accessed_at' => now(),
            ]
        );
    }

    private function deriveReadingPercent(string $event, int $percentViewed, int $existingPercent): int
    {
        $event = strtoupper($event);
        $existingPercent = max(0, min(100, $existingPercent));

        return match ($event) {
            'OPEN' => max($existingPercent, 10),
            'HEARTBEAT' => max($existingPercent, 15),
            'SCROLL' => max($existingPercent, max(0, min(100, $percentViewed))),
            default => $existingPercent,
        };
    }

    private function buildModuleLabsPayload(string $userId, Module $module): Collection
    {
        $familyMap = $module->moduleLabTemplates
            ->filter(fn ($link) => $link->labTemplate !== null)
            ->mapWithKeys(fn ($link) => [$link->labTemplate->template_family_uuid => true])
            ->keys()
            ->values();

        $instancesByFamily = LabInstance::query()
            ->where('user_id', $userId)
            ->whereHas('template', fn ($q) => $q->whereIn('template_family_uuid', $familyMap))
            ->with('template:id,template_family_uuid')
            ->orderByDesc('last_activity_at')
            ->get()
            ->groupBy(fn (LabInstance $instance) => $instance->template?->template_family_uuid)
            ->map(fn ($items) => $items->first());

        return $module->moduleLabTemplates->map(function ($link) use ($instancesByFamily): array {
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
        })->values();
    }
}
