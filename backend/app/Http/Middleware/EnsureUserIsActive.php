<?php

namespace App\Http\Middleware;

use App\Enums\UserStatus;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ($user->status !== UserStatus::ACTIVE || $user->deleted_at !== null)) {
            return response()->json([
                'message' => 'Your account is inactive. Please contact administrator.',
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
