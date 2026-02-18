<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreLessonRequest;
use App\Http\Requests\Admin\StoreModuleRequest;
use App\Http\Requests\Admin\UpdateLessonRequest;
use App\Http\Requests\Admin\UpdateModuleRequest;
use App\Models\LessonAsset;
use App\Models\LessonTask;
use App\Models\Lesson;
use App\Models\Module;
use App\Models\ModuleLabTemplate;
use App\Services\Audit\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class AdminModuleController extends Controller
{
    public function __construct(private readonly AuditLogService $audit)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $status = strtoupper((string) $request->query('status', ''));

        $query = Module::query()
            ->withCount('lessons')
            ->orderBy('order_index');

        if (in_array($status, ['DRAFT', 'PUBLISHED', 'ARCHIVED'], true)) {
            if ($status === 'ARCHIVED') {
                $query->whereNotNull('archived_at');
            } elseif ($status === 'DRAFT') {
                $query->where('status', 'draft')->whereNull('archived_at');
            } else {
                $query->where('status', 'active')->whereNull('archived_at');
            }
        }

        $modules = $query->paginate((int) $request->integer('per_page', 20));

        return response()->json([
            'data' => collect($modules->items())->map(fn (Module $module): array => $this->transformModule($module))->values(),
            'meta' => [
                'page' => $modules->currentPage(),
                'per_page' => $modules->perPage(),
                'total' => $modules->total(),
            ],
        ]);
    }

    public function store(StoreModuleRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $title = $validated['title'];
        $slug = $validated['slug'] ?? Str::slug($title);

        if (Module::query()->where('slug', $slug)->exists()) {
            return response()->json(['message' => 'Slug already exists'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $status = strtoupper((string) ($validated['status'] ?? 'DRAFT'));

        $module = Module::query()->create([
            'title' => $title,
            'slug' => $slug,
            'description' => $validated['description'] ?? '',
            'difficulty' => strtoupper((string) $validated['difficulty']),
            'level' => strtolower((string) $validated['difficulty']),
            'category' => $validated['category'] ?? 'Web',
            'est_minutes' => (int) ($validated['est_minutes'] ?? 30),
            'status' => $status === 'DRAFT' ? 'draft' : 'active',
            'version' => $validated['version'] ?? '0.1.0',
            'tags' => $validated['tags'] ?? [],
            'cover_icon' => $validated['cover_icon'] ?? null,
            'created_by' => $request->user()?->id,
            'archived_at' => $status === 'ARCHIVED' ? now() : null,
            'order_index' => (int) $validated['order_index'],
        ])->loadCount('lessons');

        $this->audit->log('MODULE_CREATED', (string) $request->user()?->id, 'module', $module->id, [
            'message' => 'Created module "'.$module->title.'"',
        ]);

        return response()->json($this->transformModule($module), Response::HTTP_CREATED);
    }

    public function show(string $id): JsonResponse
    {
        $module = Module::query()
            ->with(['lessons' => fn ($q) => $q->with(['tasks', 'assets'])->orderBy('order')])
            ->withCount('lessons')
            ->findOrFail($id);

        $data = $this->transformModule($module);
        $data['lessons'] = $module->lessons->map(fn (Lesson $lesson): array => $this->transformLesson($lesson))->values();

        return response()->json(array_merge($data, ['data' => $data]));
    }

    public function update(UpdateModuleRequest $request, string $id): JsonResponse
    {
        $module = Module::query()->findOrFail($id);
        $validated = $request->validated();

        $payload = [];

        foreach (['title', 'slug', 'description', 'category', 'version', 'cover_icon', 'order_index'] as $field) {
            if (array_key_exists($field, $validated)) {
                $payload[$field] = $validated[$field];
            }
        }

        if (array_key_exists('difficulty', $validated)) {
            $payload['difficulty'] = strtoupper((string) $validated['difficulty']);
            $payload['level'] = strtolower((string) $validated['difficulty']);
        }

        if (array_key_exists('est_minutes', $validated)) {
            $payload['est_minutes'] = (int) $validated['est_minutes'];
        }

        if (array_key_exists('tags', $validated)) {
            $payload['tags'] = $validated['tags'] ?? [];
        }

        if (array_key_exists('status', $validated)) {
            $status = strtoupper((string) $validated['status']);
            $payload['status'] = $status === 'DRAFT' ? 'draft' : 'active';
            $payload['archived_at'] = $status === 'ARCHIVED' ? now() : null;
        }

        $module->fill($payload);
        $module->save();

        $this->audit->log('MODULE_UPDATED', (string) $request->user()?->id, 'module', $module->id, [
            'message' => 'Updated module "'.$module->title.'"',
        ]);

        return response()->json($this->transformModule($module->loadCount('lessons')));
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $module = Module::query()->findOrFail($id);
        $title = $module->title;
        $module->delete();

        $this->audit->log('MODULE_DELETED', (string) $request->user()?->id, 'module', $id, [
            'message' => 'Deleted module "'.$title.'"',
        ]);

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    public function publish(Request $request, string $id): JsonResponse
    {
        $module = Module::query()->withCount('lessons')->findOrFail($id);

        if (blank($module->title) || blank($module->slug) || (int) $module->lessons_count < 1) {
            return response()->json([
                'message' => 'Module requires title, slug, and at least one lesson before publish',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $module->update([
            'status' => 'active',
            'archived_at' => null,
        ]);

        $this->audit->log('MODULE_PUBLISHED', (string) $request->user()?->id, 'module', $module->id, [
            'message' => 'Published module "'.$module->title.'"',
        ]);

        return response()->json($this->transformModule($module->fresh()->loadCount('lessons')));
    }

    public function archive(Request $request, string $id): JsonResponse
    {
        $module = Module::query()->findOrFail($id);
        $module->update([
            'status' => 'active',
            'archived_at' => now(),
        ]);

        $this->audit->log('MODULE_ARCHIVED', (string) $request->user()?->id, 'module', $module->id, [
            'message' => 'Archived module "'.$module->title.'"',
        ]);

        return response()->json($this->transformModule($module->fresh()->loadCount('lessons')));
    }

    public function lessons(string $moduleId): JsonResponse
    {
        $module = Module::query()->findOrFail($moduleId);

        $lessons = $module->lessons()
            ->with([
                'tasks' => fn ($q) => $q->orderBy('order_index'),
                'assets' => fn ($q) => $q->orderBy('order_index'),
            ])
            ->orderBy('order')
            ->get()
            ->map(fn (Lesson $lesson): array => $this->transformLesson($lesson))
            ->values();

        return response()->json(['data' => $lessons]);
    }

    public function showLesson(string $moduleId, string $lessonId): JsonResponse
    {
        $module = Module::query()->findOrFail($moduleId);

        $lesson = $module->lessons()
            ->with([
                'tasks' => fn ($q) => $q->orderBy('order_index'),
                'assets' => fn ($q) => $q->orderBy('order_index'),
            ])
            ->where('id', $lessonId)
            ->firstOrFail();

        return response()->json(['data' => $this->transformLesson($lesson)]);
    }

    public function storeLesson(StoreLessonRequest $request, string $moduleId): JsonResponse
    {
        $module = Module::query()->findOrFail($moduleId);
        $validated = $request->validated();

        $lesson = $module->lessons()->create([
            'title' => $validated['title'],
            'content_md' => $validated['content_md'],
            'content_markdown' => $validated['content_md'],
            'content' => $validated['content_md'],
            'order' => (int) $validated['order'],
            'order_index' => (int) $validated['order'],
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);

        $this->audit->log('LESSON_CREATED', (string) $request->user()?->id, 'lesson', $lesson->id, [
            'message' => 'Created lesson "'.$lesson->title.'" for module "'.$module->title.'"',
        ]);

        return response()->json($this->transformLesson($lesson->load(['tasks', 'assets'])), Response::HTTP_CREATED);
    }

    public function updateLesson(UpdateLessonRequest $request, string $moduleId, string $lessonId): JsonResponse
    {
        $module = Module::query()->findOrFail($moduleId);
        $lesson = $module->lessons()->where('id', $lessonId)->firstOrFail();

        return $this->doUpdateLesson($request, $lesson, $module->title);
    }

    public function updateLessonById(UpdateLessonRequest $request, string $id): JsonResponse
    {
        $lesson = Lesson::query()->with('module')->findOrFail($id);

        return $this->doUpdateLesson($request, $lesson, (string) $lesson->module?->title);
    }

    public function destroyLesson(string $moduleId, string $lessonId): JsonResponse
    {
        $module = Module::query()->findOrFail($moduleId);
        $lesson = $module->lessons()->where('id', $lessonId)->firstOrFail();

        $lessonTitle = $lesson->title;
        $lesson->delete();

        $this->audit->log('LESSON_DELETED', (string) request()->user()?->id, 'lesson', $lessonId, [
            'message' => 'Deleted lesson "'.$lessonTitle.'" from module "'.$module->title.'"',
        ]);

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    public function destroyLessonById(string $id): JsonResponse
    {
        $lesson = Lesson::query()->with('module')->findOrFail($id);
        $lessonTitle = $lesson->title;
        $moduleTitle = (string) $lesson->module?->title;
        $lesson->delete();

        $this->audit->log('LESSON_DELETED', (string) request()->user()?->id, 'lesson', $id, [
            'message' => 'Deleted lesson "'.$lessonTitle.'" from module "'.$moduleTitle.'"',
        ]);

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    public function storeTask(Request $request, string $lessonId): JsonResponse
    {
        $lesson = Lesson::query()->with('module')->findOrFail($lessonId);
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'order_index' => ['required', 'integer', 'min:1'],
            'points' => ['nullable', 'integer', 'min:0'],
        ]);

        $task = LessonTask::query()->create([
            'lesson_id' => $lesson->id,
            'title' => $validated['title'],
            'order_index' => (int) $validated['order_index'],
            'points' => array_key_exists('points', $validated) ? $validated['points'] : null,
        ]);

        $this->audit->log('LESSON_TASK_CREATED', (string) $request->user()?->id, 'lesson_task', $task->id, [
            'message' => 'Created task for lesson "'.$lesson->title.'"',
        ]);

        return response()->json([
            'data' => [
                'id' => $task->id,
                'lesson_id' => $task->lesson_id,
                'title' => $task->title,
                'order_index' => (int) $task->order_index,
                'points' => $task->points !== null ? (int) $task->points : null,
                'created_at' => $task->created_at?->toISOString(),
                'updated_at' => $task->updated_at?->toISOString(),
            ],
        ], Response::HTTP_CREATED);
    }

    public function updateTask(Request $request, string $taskId): JsonResponse
    {
        $task = LessonTask::query()->with('lesson')->findOrFail($taskId);
        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'order_index' => ['sometimes', 'integer', 'min:1'],
            'points' => ['nullable', 'integer', 'min:0'],
        ]);

        $task->fill($validated);
        $task->save();

        $this->audit->log('LESSON_TASK_UPDATED', (string) $request->user()?->id, 'lesson_task', $task->id, [
            'message' => 'Updated task "'.$task->title.'"',
        ]);

        return response()->json([
            'data' => [
                'id' => $task->id,
                'lesson_id' => $task->lesson_id,
                'title' => $task->title,
                'order_index' => (int) $task->order_index,
                'points' => $task->points !== null ? (int) $task->points : null,
                'created_at' => $task->created_at?->toISOString(),
                'updated_at' => $task->updated_at?->toISOString(),
            ],
        ]);
    }

    public function destroyTask(Request $request, string $taskId): JsonResponse
    {
        $task = LessonTask::query()->findOrFail($taskId);
        $taskTitle = $task->title;
        $task->delete();

        $this->audit->log('LESSON_TASK_DELETED', (string) $request->user()?->id, 'lesson_task', $taskId, [
            'message' => 'Deleted task "'.$taskTitle.'"',
        ]);

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    public function storeAsset(Request $request, string $lessonId): JsonResponse
    {
        $lesson = Lesson::query()->findOrFail($lessonId);
        $validated = $request->validate([
            'type' => ['nullable', 'string', 'in:IMAGE'],
            'url' => ['nullable', 'url', 'max:2048', 'required_without:file'],
            'file' => ['nullable', 'file', 'image', 'max:5120', 'required_without:url'],
            'caption' => ['nullable', 'string', 'max:255'],
            'order_index' => ['required', 'integer', 'min:1'],
        ]);

        $resolvedUrl = $this->resolveAssetUrl($request->file('file'), $validated['url'] ?? null);

        $asset = LessonAsset::query()->create([
            'lesson_id' => $lesson->id,
            'type' => strtoupper((string) ($validated['type'] ?? 'IMAGE')),
            'url' => $resolvedUrl,
            'caption' => $validated['caption'] ?? null,
            'order_index' => (int) $validated['order_index'],
        ]);

        $this->audit->log('LESSON_ASSET_CREATED', (string) $request->user()?->id, 'lesson_asset', $asset->id, [
            'message' => 'Added asset to lesson "'.$lesson->title.'"',
        ]);

        return response()->json([
            'data' => [
                'id' => $asset->id,
                'lesson_id' => $asset->lesson_id,
                'type' => strtoupper((string) $asset->type),
                'url' => $asset->url,
                'caption' => $asset->caption,
                'order_index' => (int) $asset->order_index,
                'created_at' => $asset->created_at?->toISOString(),
                'updated_at' => $asset->updated_at?->toISOString(),
            ],
        ], Response::HTTP_CREATED);
    }

    public function updateAsset(Request $request, string $assetId): JsonResponse
    {
        $asset = LessonAsset::query()->findOrFail($assetId);
        $validated = $request->validate([
            'type' => ['sometimes', 'string', 'in:IMAGE'],
            'url' => ['sometimes', 'url', 'max:2048'],
            'file' => ['sometimes', 'file', 'image', 'max:5120'],
            'caption' => ['nullable', 'string', 'max:255'],
            'order_index' => ['sometimes', 'integer', 'min:1'],
        ]);

        if (array_key_exists('type', $validated)) {
            $validated['type'] = strtoupper((string) $validated['type']);
        }

        if ($request->hasFile('file')) {
            $this->deleteAssetFileIfLocal($asset->url);
            $validated['url'] = $this->resolveAssetUrl($request->file('file'), null);
        }

        $asset->fill($validated);
        $asset->save();

        $this->audit->log('LESSON_ASSET_UPDATED', (string) $request->user()?->id, 'lesson_asset', $asset->id, [
            'message' => 'Updated lesson asset',
        ]);

        return response()->json([
            'data' => [
                'id' => $asset->id,
                'lesson_id' => $asset->lesson_id,
                'type' => strtoupper((string) $asset->type),
                'url' => $asset->url,
                'caption' => $asset->caption,
                'order_index' => (int) $asset->order_index,
                'created_at' => $asset->created_at?->toISOString(),
                'updated_at' => $asset->updated_at?->toISOString(),
            ],
        ]);
    }

    public function destroyAsset(Request $request, string $assetId): JsonResponse
    {
        $asset = LessonAsset::query()->findOrFail($assetId);
        $this->deleteAssetFileIfLocal($asset->url);
        $asset->delete();

        $this->audit->log('LESSON_ASSET_DELETED', (string) $request->user()?->id, 'lesson_asset', $assetId, [
            'message' => 'Deleted lesson asset',
        ]);

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    public function listLabTemplates(string $moduleId): JsonResponse
    {
        $module = Module::query()->findOrFail($moduleId);

        $links = $module->moduleLabTemplates()
            ->with('labTemplate')
            ->orderBy('order')
            ->get()
            ->map(function (ModuleLabTemplate $link): array {
                $template = $link->labTemplate;

                return [
                    'id' => $link->id,
                    'module_id' => $link->module_id,
                    'lab_template_id' => $link->lab_template_id,
                    'order' => (int) $link->order,
                    'type' => strtoupper((string) $link->type),
                    'required' => (bool) $link->required,
                    'lab_template' => $template ? [
                        'id' => $template->id,
                        'title' => $template->title,
                        'slug' => $template->slug,
                        'difficulty' => strtoupper((string) $template->difficulty),
                        'est_minutes' => (int) ($template->estimated_time_minutes ?? 0),
                        'status' => $template->status?->value ?? $template->status,
                    ] : null,
                ];
            })
            ->values();

        return response()->json(['data' => $links]);
    }

    public function storeLabTemplate(Request $request, string $moduleId): JsonResponse
    {
        $module = Module::query()->findOrFail($moduleId);
        $validated = $request->validate([
            'lab_template_id' => ['required', 'string', 'exists:lab_templates,id'],
            'order' => ['required', 'integer', 'min:1'],
            'type' => ['nullable', 'string', 'in:LAB,CHALLENGE'],
            'required' => ['nullable', 'boolean'],
        ]);

        $link = ModuleLabTemplate::query()->updateOrCreate(
            [
                'module_id' => $module->id,
                'lab_template_id' => $validated['lab_template_id'],
            ],
            [
                'order' => (int) $validated['order'],
                'type' => strtoupper((string) ($validated['type'] ?? 'LAB')),
                'required' => (bool) ($validated['required'] ?? false),
            ]
        );

        $this->audit->log('MODULE_LAB_LINKED', (string) $request->user()?->id, 'module_lab_templates', $link->id, [
            'message' => 'Linked lab template to module "'.$module->title.'"',
        ]);

        $link->load('labTemplate');

        return response()->json([
            'data' => [
                'id' => $link->id,
                'module_id' => $link->module_id,
                'lab_template_id' => $link->lab_template_id,
                'order' => (int) $link->order,
                'type' => strtoupper((string) $link->type),
                'required' => (bool) $link->required,
                'lab_template' => [
                    'id' => $link->labTemplate?->id,
                    'title' => $link->labTemplate?->title,
                    'slug' => $link->labTemplate?->slug,
                ],
            ],
        ], Response::HTTP_CREATED);
    }

    public function destroyLabTemplate(Request $request, string $moduleId, string $linkId): JsonResponse
    {
        $module = Module::query()->findOrFail($moduleId);
        $link = $module->moduleLabTemplates()->where('id', $linkId)->firstOrFail();
        $link->delete();

        $this->audit->log('MODULE_LAB_UNLINKED', (string) $request->user()?->id, 'module_lab_templates', $linkId, [
            'message' => 'Unlinked lab template from module "'.$module->title.'"',
        ]);

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    public function destroyLabTemplateByTemplateId(Request $request, string $moduleId, string $labTemplateId): JsonResponse
    {
        $module = Module::query()->findOrFail($moduleId);
        $link = $module->moduleLabTemplates()->where('lab_template_id', $labTemplateId)->firstOrFail();
        $linkId = $link->id;
        $link->delete();

        $this->audit->log('MODULE_LAB_UNLINKED', (string) $request->user()?->id, 'module_lab_templates', $linkId, [
            'message' => 'Unlinked lab template from module "'.$module->title.'"',
        ]);

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    private function doUpdateLesson(UpdateLessonRequest $request, Lesson $lesson, string $moduleTitle): JsonResponse
    {
        $validated = $request->validated();
        $payload = [];

        if (array_key_exists('title', $validated)) {
            $payload['title'] = $validated['title'];
        }

        if (array_key_exists('content_md', $validated)) {
            $payload['content_md'] = $validated['content_md'];
            $payload['content_markdown'] = $validated['content_md'];
            $payload['content'] = $validated['content_md'];
        }

        if (array_key_exists('order', $validated)) {
            $payload['order'] = (int) $validated['order'];
            $payload['order_index'] = (int) $validated['order'];
        }

        if (array_key_exists('is_active', $validated)) {
            $payload['is_active'] = (bool) $validated['is_active'];
        }

        $lesson->fill($payload);
        $lesson->save();

        $this->audit->log('LESSON_UPDATED', (string) $request->user()?->id, 'lesson', $lesson->id, [
            'message' => 'Updated lesson "'.$lesson->title.'" in module "'.$moduleTitle.'"',
        ]);

        return response()->json($this->transformLesson($lesson->fresh()->load(['tasks', 'assets'])));
    }

    private function transformModule(Module $module): array
    {
        return [
            'id' => $module->id,
            'title' => $module->title,
            'slug' => $module->slug,
            'description' => $module->description,
            'difficulty' => strtoupper((string) ($module->difficulty ?: $module->level ?: 'BASIC')),
            'level' => strtoupper((string) ($module->difficulty ?: $module->level ?: 'BASIC')),
            'category' => $module->category ?: 'Web',
            'est_minutes' => (int) ($module->est_minutes ?? 30),
            'status' => $this->mapStatusOut($module),
            'version' => (string) ($module->version ?? '0.1.0'),
            'tags' => is_array($module->tags) ? $module->tags : [],
            'cover_icon' => $module->cover_icon,
            'order_index' => (int) $module->order_index,
            'lessons_count' => (int) ($module->lessons_count ?? 0),
            'progress' => 0,
            'created_at' => $module->created_at?->toISOString(),
            'updated_at' => $module->updated_at?->toISOString(),
        ];
    }

    private function transformLesson(Lesson $lesson): array
    {
        return [
            'id' => $lesson->id,
            'module_id' => $lesson->module_id,
            'title' => $lesson->title,
            'content_md' => $lesson->content_md ?? $lesson->content_markdown ?? $lesson->content,
            'content' => $lesson->content_md ?? $lesson->content_markdown ?? $lesson->content,
            'order' => (int) ($lesson->order ?? $lesson->order_index ?? 1),
            'order_index' => (int) ($lesson->order ?? $lesson->order_index ?? 1),
            'is_active' => (bool) ($lesson->is_active ?? true),
            'tasks' => $lesson->relationLoaded('tasks')
                ? $lesson->tasks->map(fn (LessonTask $task): array => [
                    'id' => $task->id,
                    'lesson_id' => $task->lesson_id,
                    'title' => $task->title,
                    'order_index' => (int) $task->order_index,
                    'points' => $task->points !== null ? (int) $task->points : null,
                    'created_at' => $task->created_at?->toISOString(),
                    'updated_at' => $task->updated_at?->toISOString(),
                ])->values()
                : [],
            'assets' => $lesson->relationLoaded('assets')
                ? $lesson->assets->map(fn (LessonAsset $asset): array => [
                    'id' => $asset->id,
                    'lesson_id' => $asset->lesson_id,
                    'type' => strtoupper((string) $asset->type),
                    'url' => $asset->url,
                    'caption' => $asset->caption,
                    'order_index' => (int) $asset->order_index,
                    'created_at' => $asset->created_at?->toISOString(),
                    'updated_at' => $asset->updated_at?->toISOString(),
                ])->values()
                : [],
            'created_at' => $lesson->created_at?->toISOString(),
            'updated_at' => $lesson->updated_at?->toISOString(),
        ];
    }

    private function mapStatusOut(Module $module): string
    {
        if ($module->archived_at !== null) {
            return 'ARCHIVED';
        }

        return strtolower((string) $module->status) === 'draft' ? 'DRAFT' : 'PUBLISHED';
    }

    private function resolveAssetUrl(?UploadedFile $file, ?string $url): string
    {
        if ($file) {
            $directory = public_path('uploads/lessons');
            File::ensureDirectoryExists($directory);

            $name = Str::uuid()->toString().'.'.$file->getClientOriginalExtension();
            $file->move($directory, $name);

            return '/uploads/lessons/'.$name;
        }

        return (string) $url;
    }

    private function deleteAssetFileIfLocal(?string $url): void
    {
        if (! is_string($url) || ! str_starts_with($url, '/uploads/lessons/')) {
            return;
        }

        $path = public_path(ltrim($url, '/'));
        if (File::exists($path)) {
            File::delete($path);
        }
    }
}
