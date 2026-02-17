<?php

namespace App\Repositories\Contracts;

use App\Models\Submission;

interface SubmissionRepositoryInterface
{
    public function countForUserChallenge(string $userId, string $challengeId): int;

    public function latestForUserChallenge(string $userId, string $challengeId): ?Submission;

    public function findCorrectForUserChallenge(string $userId, string $challengeId): ?Submission;

    public function countCorrectForUserTemplate(string $userId, string $templateId): int;

    public function create(array $data): Submission;
}
