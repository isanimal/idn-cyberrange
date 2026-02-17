<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ModuleLevel;
use App\Enums\ModuleStatus;
use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\Module;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class AdminModuleController extends Controller
{
    public function index(): JsonResponse
    {
        $modules = Module::query()
            ->withCount('lessons')
            ->orderBy('order_index')
            ->get();

        return response()->json([
            'data' => $modules->map(fn (Module $module): array => $this->transformModule($module))->values(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:modules,slug'],
            'description' => ['required', 'string'],
            'level' => ['required', Rule::enum(ModuleLevel::class)],
            'status' => ['required', Rule::enum(ModuleStatus::class)],
            'order_index' => ['required', 'integer', 'min:1'],
        ]);

        $module = Module::query()->create($validated)->loadCount('lessons');

        return response()->json($this->transformModule($module), Response::HTTP_CREATED);
    }

    public function show(string $id): JsonResponse
    {
        $module = Module::query()->withCount('lessons')->findOrFail($id);

        return response()->json($this->transformModule($module));
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $module = Module::query()->findOrFail($id);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:255', Rule::unique('modules', 'slug')->ignore($module->id)],
            'description' => ['sometimes', 'string'],
            'level' => ['sometimes', Rule::enum(ModuleLevel::class)],
            'status' => ['sometimes', Rule::enum(ModuleStatus::class)],
            'order_index' => ['sometimes', 'integer', 'min:1'],
        ]);

        $module->fill($validated);
        $module->save();

        return response()->json($this->transformModule($module->loadCount('lessons')));
    }

    public function destroy(string $id): JsonResponse
    {
        $module = Module::query()->findOrFail($id);
        $module->delete();

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    public function lessons(string $moduleId): JsonResponse
    {
        $module = Module::query()->findOrFail($moduleId);

        $lessons = $module->lessons()
            ->orderBy('order_index')
            ->get()
            ->map(fn (Lesson $lesson): array => $this->transformLesson($lesson))
            ->values();

        return response()->json(['data' => $lessons]);
    }

    public function storeLesson(Request $request, string $moduleId): JsonResponse
    {
        $module = Module::query()->findOrFail($moduleId);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'order_index' => ['required', 'integer', 'min:1'],
        ]);

        $lesson = $module->lessons()->create($validated);

        return response()->json($this->transformLesson($lesson), Response::HTTP_CREATED);
    }

    public function updateLesson(Request $request, string $moduleId, string $lessonId): JsonResponse
    {
        $module = Module::query()->findOrFail($moduleId);
        $lesson = $module->lessons()->where('id', $lessonId)->firstOrFail();

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'content' => ['sometimes', 'string'],
            'order_index' => ['sometimes', 'integer', 'min:1'],
        ]);

        $lesson->fill($validated);
        $lesson->save();

        return response()->json($this->transformLesson($lesson->fresh()));
    }

    public function destroyLesson(string $moduleId, string $lessonId): JsonResponse
    {
        $module = Module::query()->findOrFail($moduleId);
        $lesson = $module->lessons()->where('id', $lessonId)->firstOrFail();
        $lesson->delete();

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    private function transformModule(Module $module): array
    {
        $status = $module->status instanceof ModuleStatus ? $module->status->value : (string) $module->status;
        $level = $module->level instanceof ModuleLevel ? $module->level->value : (string) $module->level;

        return [
            'id' => $module->id,
            'title' => $module->title,
            'slug' => $module->slug,
            'description' => $module->description,
            'level' => $level,
            'status' => $status,
            'order_index' => $module->order_index,
            'lessons_count' => $module->lessons_count ?? 0,
            // admin list does not include learner-specific progress yet.
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
            'content' => $lesson->content,
            'order_index' => $lesson->order_index,
            'created_at' => $lesson->created_at?->toISOString(),
            'updated_at' => $lesson->updated_at?->toISOString(),
        ];
    }
}

