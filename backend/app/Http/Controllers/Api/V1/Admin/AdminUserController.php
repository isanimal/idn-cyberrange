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

    public function index(): JsonResponse
    {
        $users = User::query()
            ->select(['id', 'name', 'email', 'role', 'status', 'created_at', 'updated_at'])
            ->paginate(20);

        return response()->json([
            'data' => collect($users->items())->map(function (User $user): array {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role?->value,
                    'status' => $user->status?->value,
                    'created_at' => $user->created_at?->toISOString(),
                    'updated_at' => $user->updated_at?->toISOString(),
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
        $user->status = UserStatus::SUSPENDED;
        $user->tokens()->delete();
        $user->save();

        $this->audit->log('ADMIN_USER_SUSPENDED', auth()->id(), 'User', $user->id);

        return response()->json($user);
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
        $user->save();

        $this->audit->log('ADMIN_USER_DELETED', auth()->id(), 'User', $user->id, [
            'email' => $user->email,
            'role' => $user->role?->value,
            'status' => $user->status?->value,
        ]);

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

}
