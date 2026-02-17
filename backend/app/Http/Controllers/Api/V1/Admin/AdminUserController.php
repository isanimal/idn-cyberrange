<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\LabInstance;
use App\Models\User;
use App\Services\Audit\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
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

}
