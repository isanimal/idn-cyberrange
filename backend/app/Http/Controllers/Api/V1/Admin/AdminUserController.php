<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\LabInstance;
use App\Models\User;
use App\Services\Audit\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AdminUserController extends Controller
{
    public function __construct(private readonly AuditLogService $audit)
    {
    }

    public function index(): JsonResponse
    {
        $users = User::query()
            ->select(['id', 'name', 'email', 'role', 'status', 'created_at'])
            ->paginate(20);

        return response()->json([
            'data' => $users->items(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'total' => $users->total(),
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
        $user->save();

        $this->audit->log('ADMIN_USER_SUSPENDED', auth()->id(), 'User', $user->id);

        return response()->json($user);
    }

   public function store(Request $request): JsonResponse
{
    $validated = $request->validate([
        'name' => ['required', 'string', 'max:255'],
        'email' => ['required', 'email', 'max:255', 'unique:users,email'],
        'password' => ['required', 'string', Password::min(8)],
        'role' => ['required', 'in:USER,ADMIN'],
        'status' => ['nullable', 'in:ACTIVE,SUSPENDED'], // sesuaikan kalau enum kamu beda
    ]);

    $user = User::query()->create([
        'name' => $validated['name'],
        'email' => $validated['email'],
        'password' => Hash::make($validated['password']),
        'role' => $validated['role'],
        'status' => $validated['status'] ?? UserStatus::ACTIVE,
    ]);

    $this->audit->log('ADMIN_USER_CREATED', auth()->id(), 'User', $user->id, [
        'email' => $user->email,
        'role' => $user->role,
        'status' => (string) $user->status,
    ]);

    return response()->json($user, 201);
}

public function destroy(string $id): JsonResponse
{
    $user = User::query()->findOrFail($id);

    // proteksi sederhana: admin tidak bisa hapus dirinya sendiri
    if ((string) auth()->id() === (string) $user->id) {
        return response()->json(['message' => 'You cannot delete your own account.'], 422);
    }

    $this->audit->log('ADMIN_USER_DELETED', auth()->id(), 'User', $user->id, [
        'email' => $user->email,
        'role' => $user->role,
    ]);

    $user->delete();

    return response()->json(['message' => 'User deleted.']);
}

}
