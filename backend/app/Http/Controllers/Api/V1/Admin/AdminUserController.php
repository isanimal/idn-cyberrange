<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\LabInstance;
use App\Models\Module;
use App\Models\User;
use App\Models\UserModule;
use App\Services\Audit\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    public function __construct(private readonly AuditLogService $audit)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $includeDeleted = $request->boolean('includeDeleted', false);
        $query = User::query()
            ->select(['id', 'name', 'email', 'role', 'status', 'deleted_at', 'created_at', 'updated_at'])
            ->when(! $includeDeleted, fn ($q) => $q->whereNull('deleted_at'));

        $users = $query->paginate(20);

        return response()->json([
            'data' => collect($users->items())->map(function (User $user): array {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role?->value,
                    'status' => $user->deleted_at ? 'DELETED' : $user->status?->value,
                    'created_at' => $user->created_at?->toISOString(),
                    'updated_at' => $user->updated_at?->toISOString(),
                    'deleted_at' => $user->deleted_at?->toISOString(),
                    // TODO: replace these defaults when gamification/progress source of truth is available.
                    'points' => 0,
                    'completedModules' => 0,
                ];
            })->values(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'total' => $users->total(),
                'per_page' => $users->perPage(),
            ],
        ]);
    }

    public function update(UpdateUserRequest $request, string $id): JsonResponse
    {
        $user = User::query()->findOrFail($id);

        if ($user->deleted_at) {
            return response()->json(['message' => 'Deleted user cannot be updated.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if ($request->filled('status')) {
            $user->status = $request->enum('status', UserStatus::class);
            $user->save();
        }

        if ($request->boolean('reset_attempts', false)) {
            LabInstance::query()->where('user_id', $user->id)->update(['attempts_count' => 0]);
        }

        $this->audit->log('ADMIN_USER_UPDATED', auth()->id(), 'User', $user->id, $request->validated());

        return response()->json($user->fresh());
    }

    public function suspend(string $id): JsonResponse
    {
        $user = User::query()->findOrFail($id);
        if ($user->deleted_at) {
            return response()->json(['message' => 'Deleted user cannot be suspended.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user->status = UserStatus::SUSPENDED;
        $user->tokens()->delete();
        $user->save();

        $this->audit->log('ADMIN_USER_SUSPENDED', auth()->id(), 'User', $user->id);

        return response()->json($user->fresh());
    }

    public function unsuspend(string $id): JsonResponse
    {
        $user = User::query()->findOrFail($id);
        if ($user->deleted_at) {
            return response()->json(['message' => 'Deleted user cannot be unsuspended.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user->status = UserStatus::ACTIVE;
        $user->save();

        $this->audit->log('ADMIN_USER_UNSUSPENDED', auth()->id(), 'User', $user->id);

        return response()->json($user->fresh());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in([UserRole::ADMIN->value, UserRole::USER->value])],
        ]);

        $user = User::query()->create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => UserRole::from($validated['role']),
            'status' => UserStatus::ACTIVE,
        ]);

        $this->audit->log('ADMIN_USER_CREATED', auth()->id(), 'User', $user->id, [
            'email' => $user->email,
            'role' => $user->role?->value,
            'status' => $user->status?->value,
        ]);

        return response()->json($user, Response::HTTP_CREATED);
    }

    public function destroy(string $id): JsonResponse
    {
        $user = User::query()->findOrFail($id);

        if ((string) auth()->id() === (string) $user->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user->tokens()->delete();
        $user->status = UserStatus::SUSPENDED;
        $user->deleted_at = now();
        $user->save();

        $this->audit->log('ADMIN_USER_DELETED', auth()->id(), 'User', $user->id, [
            'email' => $user->email,
            'role' => $user->role?->value,
            'status' => $user->status?->value,
        ]);

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    public function restore(string $id): JsonResponse
    {
        $user = User::query()->findOrFail($id);
        $user->deleted_at = null;
        $user->status = UserStatus::ACTIVE;
        $user->save();

        $this->audit->log('ADMIN_USER_RESTORED', auth()->id(), 'User', $user->id, [
            'email' => $user->email,
        ]);

        return response()->json($user->fresh());
    }

    public function modules(string $id): JsonResponse
    {
        $user = User::query()->findOrFail($id);

        $assignedRows = UserModule::query()
            ->where('user_id', $user->id)
            ->with('module')
            ->orderByDesc('assigned_at')
            ->get();

        $assigned = $assignedRows
            ->filter(fn (UserModule $row) => $row->module !== null)
            ->map(function (UserModule $row): array {
                return [
                    'assignment_id' => $row->id,
                    'module_id' => $row->module_id,
                    'status' => strtoupper((string) $row->status),
                    'assigned_at' => $row->assigned_at?->toISOString(),
                    'due_at' => $row->due_at?->toISOString(),
                    'module' => [
                        'id' => $row->module->id,
                        'slug' => $row->module->slug,
                        'title' => $row->module->title,
                        'description' => $row->module->description,
                        'difficulty' => strtoupper((string) ($row->module->difficulty ?: $row->module->level ?: 'BASIC')),
                    ],
                ];
            })
            ->values();

        $assignedIds = $assignedRows->pluck('module_id')->all();

        $available = Module::query()
            ->whereNull('archived_at')
            ->where('status', 'active')
            ->whereNotIn('id', $assignedIds)
            ->orderBy('order_index')
            ->get()
            ->map(fn (Module $module): array => [
                'id' => $module->id,
                'slug' => $module->slug,
                'title' => $module->title,
                'description' => $module->description,
                'difficulty' => strtoupper((string) ($module->difficulty ?: $module->level ?: 'BASIC')),
            ])
            ->values();

        return response()->json([
            'data' => [
                'assigned' => $assigned,
                'available' => $available,
            ],
        ]);
    }

    public function assignModules(Request $request, string $id): JsonResponse
    {
        $user = User::query()->findOrFail($id);

        $validated = $request->validate([
            'module_ids' => ['required', 'array', 'min:1'],
            'module_ids.*' => ['uuid', 'exists:modules,id'],
            'status' => ['nullable', Rule::in([
                UserModule::STATUS_ASSIGNED,
                UserModule::STATUS_ACTIVE,
                UserModule::STATUS_LOCKED,
            ])],
            'due_at' => ['nullable', 'date'],
        ]);

        $status = strtoupper((string) ($validated['status'] ?? UserModule::STATUS_ASSIGNED));
        $dueAt = $validated['due_at'] ?? null;
        $moduleIds = collect($validated['module_ids'])->unique()->values()->all();

        DB::transaction(function () use ($user, $moduleIds, $status, $dueAt): void {
            $allowedModuleIds = Module::query()
                ->whereNull('archived_at')
                ->where('status', 'active')
                ->whereIn('id', $moduleIds)
                ->pluck('id')
                ->all();

            foreach ($allowedModuleIds as $moduleId) {
                UserModule::query()->updateOrCreate(
                    ['user_id' => $user->id, 'module_id' => $moduleId],
                    [
                        'status' => $status,
                        'assigned_at' => now(),
                        'due_at' => $dueAt,
                    ]
                );
            }
        });

        $this->audit->log('ADMIN_USER_MODULES_ASSIGNED', auth()->id(), 'User', $user->id, [
            'module_ids' => $moduleIds,
            'status' => $status,
            'due_at' => $dueAt,
        ]);

        return $this->modules($id);
    }

    public function unassignModule(string $id, string $moduleId): JsonResponse
    {
        $user = User::query()->findOrFail($id);

        UserModule::query()
            ->where('user_id', $user->id)
            ->where('module_id', $moduleId)
            ->delete();

        $this->audit->log('ADMIN_USER_MODULE_UNASSIGNED', auth()->id(), 'User', $user->id, [
            'module_id' => $moduleId,
        ]);

        return response()->json(['ok' => true]);
    }
}
