<?php

namespace App\Services\Auth;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function register(array $data): array
    {
        $user = User::query()->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => UserRole::USER,
            'status' => UserStatus::ACTIVE,
        ]);

        $token = $user->createToken($data['device_name'] ?? 'api-token')->plainTextToken;

        return [$user, $token];
    }

    public function login(array $credentials): array
    {
        $user = User::query()->where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages(['email' => ['Invalid credentials.']]);
        }

        if ($user->status !== UserStatus::ACTIVE) {
            throw ValidationException::withMessages(['email' => ['User account is suspended.']]);
        }

        $token = $user->createToken($credentials['device_name'] ?? 'api-token')->plainTextToken;

        return [$user, $token];
    }

    public function logout(User $user): void
    {
        $user->currentAccessToken()?->delete();
    }
}
