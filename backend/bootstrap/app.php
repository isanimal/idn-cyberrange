<?php

use App\Exceptions\OrchestrationOperationException;
use App\Exceptions\OrchestrationPreflightException;
use App\Http\Middleware\RoleMiddleware;
use App\Http\Middleware\EnsureUserIsActive;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Http\Middleware\HandleCors;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->append(HandleCors::class);
        $middleware->alias([
            'role' => RoleMiddleware::class,
            'user.active' => EnsureUserIsActive::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (OrchestrationPreflightException $e, Request $request) {
            if (! $request->expectsJson()) {
                return null;
            }

            return response()->json([
                'error' => 'ORCHESTRATION_PREFLIGHT_FAILED',
                'message' => $e->getMessage(),
                'details' => $e->reportPayload(),
            ], 503);
        });

        $exceptions->render(function (OrchestrationOperationException $e, Request $request) {
            if (! $request->expectsJson()) {
                return null;
            }

            return response()->json([
                'error' => $e->errorCode(),
                'message' => $e->getMessage(),
                'details' => $e->details(),
            ], $e->statusCode());
        });
    })->create();
