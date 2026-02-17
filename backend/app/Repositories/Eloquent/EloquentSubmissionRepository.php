<?php

namespace App\Repositories\Eloquent;

use App\Enums\SubmissionResult;
use App\Models\Submission;
use App\Repositories\Contracts\SubmissionRepositoryInterface;

class EloquentSubmissionRepository implements SubmissionRepositoryInterface
{
    public function countForUserChallenge(string $userId, string $challengeId): int
    {
        return Submission::query()
            ->where('user_id', $userId)
            ->where('challenge_id', $challengeId)
            ->count();
    }

    public function latestForUserChallenge(string $userId, string $challengeId): ?Submission
    {
        return Submission::query()
            ->where('user_id', $userId)
            ->where('challenge_id', $challengeId)
            ->latest('submitted_at')
            ->first();
    }

    public function findCorrectForUserChallenge(string $userId, string $challengeId): ?Submission
    {
        return Submission::query()
            ->where('user_id', $userId)
            ->where('challenge_id', $challengeId)
            ->where('result', SubmissionResult::CORRECT)
            ->first();
    }

    public function countCorrectForUserTemplate(string $userId, string $templateId): int
    {
        return Submission::query()
            ->where('submissions.user_id', $userId)
            ->where('submissions.result', SubmissionResult::CORRECT)
            ->join('challenges', 'challenges.id', '=', 'submissions.challenge_id')
            ->where('challenges.lab_template_id', $templateId)
            ->count();
    }

    public function create(array $data): Submission
    {
        return Submission::query()->create($data);
    }
}
