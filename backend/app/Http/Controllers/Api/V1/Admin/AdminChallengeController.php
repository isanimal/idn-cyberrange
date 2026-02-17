<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreChallengeRequest;
use App\Http\Requests\Admin\UpdateChallengeRequest;
use App\Http\Resources\ChallengeResource;
use App\Services\Challenge\ChallengeAdminService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminChallengeController extends Controller
{
    public function __construct(private readonly ChallengeAdminService $challenges)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $result = $this->challenges->paginate((int) $request->integer('per_page', 20));

        return response()->json([
            'data' => ChallengeResource::collection($result->items()),
            'meta' => [
                'current_page' => $result->currentPage(),
                'last_page' => $result->lastPage(),
                'total' => $result->total(),
            ],
        ]);
    }

    public function store(StoreChallengeRequest $request): JsonResponse
    {
        $challenge = $this->challenges->create($request->validated(), $request->user()->id);

        return response()->json(new ChallengeResource($challenge), 201);
    }

    public function show(string $id): JsonResponse
    {
        $challenge = $this->challenges->findOrFail($id);

        return response()->json(new ChallengeResource($challenge));
    }

    public function update(UpdateChallengeRequest $request, string $id): JsonResponse
    {
        $challenge = $this->challenges->findOrFail($id);
        $challenge = $this->challenges->update($challenge, $request->validated(), $request->user()->id);

        return response()->json(new ChallengeResource($challenge));
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $challenge = $this->challenges->findOrFail($id);
        $this->challenges->delete($challenge, $request->user()->id);

        return response()->json([], 204);
    }
}
