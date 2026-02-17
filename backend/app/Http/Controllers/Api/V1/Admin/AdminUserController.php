<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
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
        return response()->json([
            'data' => User::query()->select(['id', 'name', 'email', 'role', 'status', 'created_at'])->paginate(20),
        ]);
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
