<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\LabInstance\UpgradeLabInstanceRequest;
use App\Http\Resources\LabInstanceResource;
use App\Services\Lab\LabInstanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LabInstanceController extends Controller
{
    public function __construct(private readonly LabInstanceService $instances)
    {
    }

    public function activate(Request $request, string $id): JsonResponse
    {
        $instance = $this->instances->activate($id, $request->user());

        return response()->json(new LabInstanceResource($instance), 201);
    }

    public function deactivate(Request $request, string $id): JsonResponse
    {
        $instance = $this->instances->deactivate($id, $request->user());

        return response()->json(new LabInstanceResource($instance));
    }

    public function restart(Request $request, string $id): JsonResponse
    {
        $instance = $this->instances->restart($id, $request->user());

        return response()->json(new LabInstanceResource($instance));
    }

    public function upgrade(UpgradeLabInstanceRequest $request, string $id): JsonResponse
    {
        $instance = $this->instances->upgrade(
            $id,
            $request->validated('target_template_id'),
            $request->validated('strategy'),
            $request->user(),
        );

        return response()->json(new LabInstanceResource($instance));
    }

    public function myInstances(Request $request): JsonResponse
    {
        return response()->json([
            'data' => LabInstanceResource::collection($this->instances->myInstances($request->user())),
        ]);
    }
}
