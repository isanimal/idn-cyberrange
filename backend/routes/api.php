<?php

use App\Http\Controllers\Api\V1\Admin\AdminChallengeController;
use App\Http\Controllers\Api\V1\Admin\AdminLabController;
use App\Http\Controllers\Api\V1\Admin\AdminModuleController;
use App\Http\Controllers\Api\V1\Admin\AdminOrchestrationController;
use App\Http\Controllers\Api\V1\Admin\AdminUserController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ChallengeController;
use App\Http\Controllers\Api\V1\LabController;
use App\Http\Controllers\Api\V1\LabInstanceController;
use App\Http\Controllers\Api\V1\UserModuleController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/ping', fn() => response()->json(['ok' => true]));
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::get('/modules', [UserModuleController::class, 'index']);
        Route::get('/modules/{slug}', [UserModuleController::class, 'show']);

        Route::get('/labs', [LabController::class, 'index']);
        Route::get('/labs/{id_or_slug}', [LabController::class, 'show']);
        Route::post('/labs/{id}/activate', [LabInstanceController::class, 'activate']);
        Route::post('/labs/{id}/start', [LabInstanceController::class, 'start']);
        Route::get('/labs/{id}/challenges', [ChallengeController::class, 'listByLab']);

        Route::get('/me/lab-instances', [LabInstanceController::class, 'myInstances']);
        Route::post('/lab-instances/{instance_id}/deactivate', [LabInstanceController::class, 'deactivate']);
        Route::post('/lab-instances/{instance_id}/restart', [LabInstanceController::class, 'restart']);
        Route::patch('/lab-instances/{instance_id}', [LabInstanceController::class, 'update']);
        Route::post('/lab-instances/{instance_id}/upgrade', [LabInstanceController::class, 'upgrade']);

        Route::post('/challenges/{challenge_id}/submit', [ChallengeController::class, 'submit'])
            ->middleware('throttle:challenge-submission');

        Route::prefix('admin')->middleware('role:ADMIN')->group(function (): void {
            Route::get('/labs', [AdminLabController::class, 'index']);
            Route::post('/labs', [AdminLabController::class, 'store']);
            Route::get('/labs/{id}', [AdminLabController::class, 'show']);
            Route::patch('/labs/{id}', [AdminLabController::class, 'update']);
            Route::delete('/labs/{id}', [AdminLabController::class, 'destroy']);
            Route::post('/labs/{id}/publish', [AdminLabController::class, 'publish']);
            Route::post('/labs/{id}/archive', [AdminLabController::class, 'archive']);

            Route::get('/challenges', [AdminChallengeController::class, 'index']);
            Route::post('/challenges', [AdminChallengeController::class, 'store']);
            Route::get('/challenges/{id}', [AdminChallengeController::class, 'show']);
            Route::patch('/challenges/{id}', [AdminChallengeController::class, 'update']);
            Route::delete('/challenges/{id}', [AdminChallengeController::class, 'destroy']);

            Route::get('/users', [AdminUserController::class, 'index']);
            Route::post('/users', [AdminUserController::class, 'store']);
            Route::patch('/users/{id}', [AdminUserController::class, 'update']);
            Route::patch('/users/{id}/suspend', [AdminUserController::class, 'suspend']);
            Route::delete('/users/{id}', [AdminUserController::class, 'destroy']);

            Route::get('/modules', [AdminModuleController::class, 'index']);
            Route::post('/modules', [AdminModuleController::class, 'store']);
            Route::get('/modules/{id}', [AdminModuleController::class, 'show']);
            Route::patch('/modules/{id}', [AdminModuleController::class, 'update']);
            Route::delete('/modules/{id}', [AdminModuleController::class, 'destroy']);
            Route::get('/modules/{id}/lessons', [AdminModuleController::class, 'lessons']);
            Route::post('/modules/{id}/lessons', [AdminModuleController::class, 'storeLesson']);
            Route::patch('/modules/{id}/lessons/{lesson_id}', [AdminModuleController::class, 'updateLesson']);
            Route::delete('/modules/{id}/lessons/{lesson_id}', [AdminModuleController::class, 'destroyLesson']);

            Route::get('/orchestration/instances', [AdminOrchestrationController::class, 'index']);
            Route::post('/orchestration/instances/{instance_id}/force-stop', [AdminOrchestrationController::class, 'forceStop']);
            Route::post('/orchestration/instances/{instance_id}/restart', [AdminOrchestrationController::class, 'restart']);
        });
    });
});
