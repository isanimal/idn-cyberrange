<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Challenge\SubmitChallengeRequest;
use App\Http\Resources\ChallengeResource;
use App\Services\Challenge\ChallengeSubmissionService;
use App\Services\Lab\LabTemplateService;
use Illuminate\Http\JsonResponse;

class ChallengeController extends Controller
{
    public function __construct(
        private readonly ChallengeSubmissionService $submissions,
        private readonly LabTemplateService $templates,
    ) {
    }

    public function listByLab(string $id): JsonResponse
    {
        $template = $this->templates->findPublishedForUserCatalogOrFail($id);
        $challenges = $this->submissions->listLabChallengesWithUserProgress(auth()->user(), $template->id);

        return response()->json([
            'data' => ChallengeResource::collection($challenges),
        ]);
    }

    public function submit(SubmitChallengeRequest $request, string $challenge_id): JsonResponse
    {
        $result = $this->submissions->submit(
            $request->user(),
            $challenge_id,
            $request->validated('flag')
        );

        return response()->json($result);
    }
}
