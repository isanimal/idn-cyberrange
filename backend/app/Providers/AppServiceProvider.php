<?php

namespace App\Providers;

use App\Repositories\Contracts\ChallengeRepositoryInterface;
use App\Repositories\Contracts\LabInstanceRepositoryInterface;
use App\Repositories\Contracts\LabTemplateRepositoryInterface;
use App\Repositories\Contracts\SubmissionRepositoryInterface;
use App\Repositories\Eloquent\EloquentChallengeRepository;
use App\Repositories\Eloquent\EloquentLabInstanceRepository;
use App\Repositories\Eloquent\EloquentLabTemplateRepository;
use App\Repositories\Eloquent\EloquentSubmissionRepository;
use App\Services\Orchestration\FakeDockerDriver;
use App\Services\Orchestration\FutureK8sDriver;
use App\Services\Orchestration\LabDriverInterface;
use App\Services\Orchestration\LocalDockerDriver;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(LabTemplateRepositoryInterface::class, EloquentLabTemplateRepository::class);
        $this->app->bind(LabInstanceRepositoryInterface::class, EloquentLabInstanceRepository::class);
        $this->app->bind(ChallengeRepositoryInterface::class, EloquentChallengeRepository::class);
        $this->app->bind(SubmissionRepositoryInterface::class, EloquentSubmissionRepository::class);

        $this->app->bind(LabDriverInterface::class, function () {
            return match (config('labs.driver')) {
                'k8s' => new FutureK8sDriver(),
                'fake' => new FakeDockerDriver(),
                default => app()->environment('testing') ? new FakeDockerDriver() : new LocalDockerDriver(),
            };
        });
    }

    public function boot(): void
    {
        RateLimiter::for('challenge-submission', function (Request $request) {
            return [Limit::perMinute(30)->by($request->user()?->id ?: $request->ip())];
        });
    }
}
