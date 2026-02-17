<?php

namespace App\Services\Challenge;

use App\Enums\LabInstanceState;
use App\Enums\SubmissionResult;
use App\Models\LabInstance;
use App\Models\User;
use App\Repositories\Contracts\ChallengeRepositoryInterface;
use App\Repositories\Contracts\SubmissionRepositoryInterface;
use App\Services\Audit\AuditLogService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Symfony\Component\HttpKernel\Exception\HttpException;

class ChallengeSubmissionService
{
    public function __construct(
        private readonly ChallengeRepositoryInterface $challenges,
        private readonly SubmissionRepositoryInterface $submissions,
        private readonly AuditLogService $audit,
    ) {
    }

    public function submit(User $user, string $challengeId, string $flag): array
    {
        $challenge = $this->challenges->findById($challengeId);
        if (! $challenge) {
            throw new ModelNotFoundException('Challenge not found.');
        }

        if (! $challenge->is_active) {
            throw new HttpException(422, 'Challenge is not active.');
        }

        $alreadySolved = $this->submissions->findCorrectForUserChallenge($user->id, $challenge->id);
        if ($alreadySolved) {
            throw new HttpException(409, 'Challenge already solved by this user.');
        }

        $attemptsUsed = $this->submissions->countForUserChallenge($user->id, $challenge->id);
        if ($attemptsUsed >= $challenge->max_attempts) {
            throw new HttpException(429, 'Max attempts reached for this challenge.');
        }

        $latest = $this->submissions->latestForUserChallenge($user->id, $challenge->id);
        if ($latest) {
            $remaining = $challenge->cooldown_seconds - $latest->submitted_at->diffInSeconds(now());
            if ($remaining > 0) {
                throw new HttpException(429, 'Challenge cooldown is active. Retry after '.$remaining.' seconds.');
            }
        }

        $isCorrect = password_verify($flag, $challenge->flag_hash);
        $result = $isCorrect ? SubmissionResult::CORRECT : SubmissionResult::WRONG;

        $submission = $this->submissions->create([
            'user_id' => $user->id,
            'challenge_id' => $challenge->id,
            'submitted_hash' => hash('sha256', $flag),
            'result' => $result,
            'attempt_no' => $attemptsUsed + 1,
            'submitted_at' => CarbonImmutable::now(),
        ]);

        $progress = $this->refreshProgress($user->id, $challenge->lab_template_id);

        $this->audit->log('CHALLENGE_SUBMITTED', $user->id, 'Challenge', $challenge->id, [
            'result' => $result->value,
            'attempt_no' => $submission->attempt_no,
        ]);

        return [
            'submission_id' => $submission->id,
            'challenge_id' => $challenge->id,
            'result' => $result->value,
            'attempt_no' => $submission->attempt_no,
            'points_earned' => $isCorrect ? $challenge->points : 0,
            'submitted_at' => $submission->submitted_at?->toIso8601String(),
            'progress_percent' => $progress,
        ];
    }

    private function refreshProgress(string $userId, string $templateId): int
    {
        $total = $this->challenges->countActiveByTemplate($templateId);
        if ($total === 0) {
            return 0;
        }

        $correct = $this->submissions->countCorrectForUserTemplate($userId, $templateId);
        $progress = (int) round(($correct / $total) * 100);

        $instance = LabInstance::query()
            ->where('user_id', $userId)
            ->where('lab_template_id', $templateId)
            ->first();

        if ($instance) {
            $instance->progress_percent = $progress;
            $instance->last_activity_at = now();
            if ($progress >= 100) {
                $instance->state = LabInstanceState::COMPLETED;
                $instance->completed_at = now();
            }
            $instance->save();
        }

        return $progress;
    }
}
