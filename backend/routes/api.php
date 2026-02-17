<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ChallengeController;
use App\Http\Controllers\Api\V1\LabController;
use App\Http\Controllers\Api\V1\LabInstanceController;
use App\Http\Controllers\Api\V1\Admin\AdminChallengeController;
use App\Http\Controllers\Api\V1\Admin\AdminLabController;
use App\Http\Controllers\Api\V1\Admin\AdminUserController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);

        Route::get('/labs', [LabController::class, 'index']);
        Route::get('/labs/{id}', [LabController::class, 'show']);
        Route::post('/labs/{id}/activate', [LabInstanceController::class, 'activate']);

        Route::post('/lab-instances/{id}/deactivate', [LabInstanceController::class, 'deactivate']);
        Route::post('/lab-instances/{id}/restart', [LabInstanceController::class, 'restart']);
        Route::post('/lab-instances/{id}/upgrade', [LabInstanceController::class, 'upgrade']);
        Route::get('/me/lab-instances', [LabInstanceController::class, 'myInstances']);

        Route::post('/challenges/{id}/submit', [ChallengeController::class, 'submit'])
            ->middleware('throttle:challenge-submission');

        Route::prefix('admin')->middleware('role:ADMIN')->group(function (): void {
            Route::apiResource('/labs', AdminLabController::class);
            Route::post('/labs/{id}/publish', [AdminLabController::class, 'publish']);
            Route::post('/labs/{id}/archive', [AdminLabController::class, 'archive']);

            Route::apiResource('/challenges', AdminChallengeController::class);
            Route::get('/users', [AdminUserController::class, 'index']);
            Route::patch('/users/{id}/suspend', [AdminUserController::class, 'suspend']);
        });
    });
});
