<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\LabInstance;
use App\Models\User;
use App\Services\Audit\AuditLogService;
use Illuminate\Http\JsonResponse;

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
}
