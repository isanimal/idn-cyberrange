<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Challenge\SubmitChallengeRequest;
use App\Services\Challenge\ChallengeSubmissionService;
use Illuminate\Http\JsonResponse;

class ChallengeController extends Controller
{
    public function __construct(private readonly ChallengeSubmissionService $submissions)
    {
    }

    public function submit(SubmitChallengeRequest $request, string $id): JsonResponse
    {
        $result = $this->submissions->submit(
            $request->user(),
            $id,
            $request->validated('flag')
        );

        return response()->json($result);
    }
}
