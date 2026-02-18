<?php

use App\Http\Controllers\Api\V1\Admin\AdminChallengeController;
use App\Http\Controllers\Api\V1\Admin\DashboardController;
use App\Http\Controllers\Api\V1\Admin\AdminLabController;
use App\Http\Controllers\Api\V1\Admin\AdminModuleController;
use App\Http\Controllers\Api\V1\Admin\AdminOrchestrationController;
use App\Http\Controllers\Api\V1\Admin\AdminUserController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ChallengeController;
use App\Http\Controllers\Api\V1\DashboardController as UserDashboardController;
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
        Route::middleware('user.active')->group(function (): void {
            Route::get('/dashboard', [UserDashboardController::class, 'show']);
            Route::get('/modules', [UserModuleController::class, 'index']);
            Route::get('/modules/{slug}', [UserModuleController::class, 'show']);
            Route::get('/modules/{slug}/labs', [UserModuleController::class, 'labs']);
            Route::get('/modules/{slug}/lessons/{lessonId}', [UserModuleController::class, 'lesson']);
            Route::post('/modules/{slug}/start', [UserModuleController::class, 'start']);
            Route::post('/modules/{slug}/lessons/{lessonId}/complete', [UserModuleController::class, 'completeLesson']);
            Route::get('/lessons/{lessonId}', [UserModuleController::class, 'lessonById']);
            Route::post('/lessons/{lessonId}/progress', [UserModuleController::class, 'updateLessonProgress']);
            Route::post('/lessons/{lessonId}/reading-event', [UserModuleController::class, 'readingEvent']);
            Route::post('/lessons/{lessonId}/complete', [UserModuleController::class, 'completeLessonById']);
            Route::post('/tasks/{taskId}/toggle', [UserModuleController::class, 'toggleTask']);

            Route::get('/labs', [LabController::class, 'index']);
            Route::get('/labs/catalog', [LabController::class, 'index']);
            Route::get('/labs/instances/my', [LabInstanceController::class, 'myForLabsNamespace']);
            Route::get('/labs/instances/{instance_id}', [LabInstanceController::class, 'showForLabsNamespace']);
            Route::post('/labs/{id}/activate', [LabInstanceController::class, 'activate']);
            Route::post('/labs/{id}/start', [LabInstanceController::class, 'start']);
            Route::post('/labs/{id_or_slug}/stop', [LabInstanceController::class, 'stopBySlug']);
            Route::get('/labs/{id}/challenges', [ChallengeController::class, 'listByLab']);
            Route::get('/labs/{id_or_slug}', [LabController::class, 'show']);

            Route::get('/me/lab-instances', [LabInstanceController::class, 'myInstances']);
            Route::post('/lab-instances', [LabInstanceController::class, 'store']);
            Route::get('/lab-instances/my', [LabInstanceController::class, 'my']);
            Route::get('/lab-instances/{instance_id}', [LabInstanceController::class, 'show']);
            Route::post('/lab-instances/{instance_id}/stop', [LabInstanceController::class, 'stop']);
            Route::post('/lab-instances/{instance_id}/deactivate', [LabInstanceController::class, 'deactivate']);
            Route::post('/lab-instances/{instance_id}/restart', [LabInstanceController::class, 'restart']);
            Route::patch('/lab-instances/{instance_id}', [LabInstanceController::class, 'update']);
            Route::post('/lab-instances/{instance_id}/upgrade', [LabInstanceController::class, 'upgrade']);

            Route::post('/challenges/{challenge_id}/submit', [ChallengeController::class, 'submit'])
                ->middleware('throttle:challenge-submission');
        });

        Route::prefix('admin')->middleware('role:ADMIN')->group(function (): void {
            Route::get('/overview', [DashboardController::class, 'adminOverview']);
            Route::get('/dashboard/overview', [DashboardController::class, 'overview']);
            Route::get('/labs', [AdminLabController::class, 'index']);
            Route::get('/labs/templates', [AdminLabController::class, 'index']);
            Route::post('/labs', [AdminLabController::class, 'store']);
            Route::post('/labs/templates', [AdminLabController::class, 'store']);
            Route::get('/labs/{id}', [AdminLabController::class, 'show']);
            Route::get('/labs/templates/{id}', [AdminLabController::class, 'show']);
            Route::patch('/labs/{id}', [AdminLabController::class, 'update']);
            Route::put('/labs/templates/{id}', [AdminLabController::class, 'update']);
            Route::delete('/labs/{id}', [AdminLabController::class, 'destroy']);
            Route::post('/labs/{id}/publish', [AdminLabController::class, 'publish']);
            Route::post('/labs/templates/{id}/publish', [AdminLabController::class, 'publish']);
            Route::post('/labs/{id}/archive', [AdminLabController::class, 'archive']);
            Route::post('/labs/templates/{id}/archive', [AdminLabController::class, 'archive']);

            Route::get('/challenges', [AdminChallengeController::class, 'index']);
            Route::post('/challenges', [AdminChallengeController::class, 'store']);
            Route::get('/challenges/{id}', [AdminChallengeController::class, 'show']);
            Route::patch('/challenges/{id}', [AdminChallengeController::class, 'update']);
            Route::delete('/challenges/{id}', [AdminChallengeController::class, 'destroy']);

            Route::get('/users', [AdminUserController::class, 'index']);
            Route::post('/users', [AdminUserController::class, 'store']);
            Route::patch('/users/{id}', [AdminUserController::class, 'update']);
            Route::patch('/users/{id}/suspend', [AdminUserController::class, 'suspend']);
            Route::patch('/users/{id}/unsuspend', [AdminUserController::class, 'unsuspend']);
            Route::delete('/users/{id}', [AdminUserController::class, 'destroy']);
            Route::post('/users/{id}/restore', [AdminUserController::class, 'restore']);
            Route::get('/users/{id}/modules', [AdminUserController::class, 'modules']);
            Route::post('/users/{id}/modules', [AdminUserController::class, 'assignModules']);
            Route::delete('/users/{id}/modules/{moduleId}', [AdminUserController::class, 'unassignModule']);

            Route::get('/modules', [AdminModuleController::class, 'index']);
            Route::post('/modules', [AdminModuleController::class, 'store']);
            Route::get('/modules/{id}', [AdminModuleController::class, 'show']);
            Route::patch('/modules/{id}', [AdminModuleController::class, 'update']);
            Route::delete('/modules/{id}', [AdminModuleController::class, 'destroy']);
            Route::get('/modules/{id}/lessons', [AdminModuleController::class, 'lessons']);
            Route::post('/modules/{id}/lessons', [AdminModuleController::class, 'storeLesson']);
            Route::get('/modules/{id}/lessons/{lesson_id}', [AdminModuleController::class, 'showLesson']);
            Route::patch('/modules/{id}/lessons/{lesson_id}', [AdminModuleController::class, 'updateLesson']);
            Route::delete('/modules/{id}/lessons/{lesson_id}', [AdminModuleController::class, 'destroyLesson']);
            Route::post('/lessons/{lesson_id}/tasks', [AdminModuleController::class, 'storeTask']);
            Route::patch('/tasks/{task_id}', [AdminModuleController::class, 'updateTask']);
            Route::delete('/tasks/{task_id}', [AdminModuleController::class, 'destroyTask']);
            Route::post('/lessons/{lesson_id}/assets', [AdminModuleController::class, 'storeAsset']);
            Route::patch('/assets/{asset_id}', [AdminModuleController::class, 'updateAsset']);
            Route::delete('/assets/{asset_id}', [AdminModuleController::class, 'destroyAsset']);
            Route::get('/modules/{id}/lab-templates', [AdminModuleController::class, 'listLabTemplates']);
            Route::post('/modules/{id}/lab-templates', [AdminModuleController::class, 'storeLabTemplate']);
            Route::delete('/modules/{id}/lab-templates/{linkId}', [AdminModuleController::class, 'destroyLabTemplate']);
            Route::post('/modules/{id}/labs/link', [AdminModuleController::class, 'storeLabTemplate']);
            Route::delete('/modules/{id}/labs/{labTemplateId}/unlink', [AdminModuleController::class, 'destroyLabTemplateByTemplateId']);
            Route::patch('/lessons/{id}', [AdminModuleController::class, 'updateLessonById']);
            Route::delete('/lessons/{id}', [AdminModuleController::class, 'destroyLessonById']);
            Route::post('/modules/{id}/publish', [AdminModuleController::class, 'publish']);
            Route::post('/modules/{id}/archive', [AdminModuleController::class, 'archive']);

            Route::get('/orchestration/instances', [AdminOrchestrationController::class, 'index']);
            Route::get('/orchestration/overview', [AdminOrchestrationController::class, 'overview']);
            Route::get('/orchestration/preflight', [AdminOrchestrationController::class, 'preflight']);
            Route::post('/orchestration/instances/{instance_id}/force-stop', [AdminOrchestrationController::class, 'forceStop']);
            Route::post('/orchestration/instances/{instance_id}/restart', [AdminOrchestrationController::class, 'restart']);
        });
    });
});
