<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\LabInstance\ActivateLabRequest;
use App\Http\Requests\LabInstance\UpdateLabInstanceRequest;
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

    public function activate(ActivateLabRequest $request, string $id): JsonResponse
    {
        $instance = $this->instances->activate(
            $id,
            $request->user(),
            $request->validated('pin_version')
        );

        return response()->json(new LabInstanceResource($instance), 201);
    }

    public function deactivate(Request $request, string $instance_id): JsonResponse
    {
        $instance = $this->instances->deactivate($instance_id, $request->user());

        return response()->json(new LabInstanceResource($instance));
    }

    public function restart(Request $request, string $instance_id): JsonResponse
    {
        $instance = $this->instances->restart($instance_id, $request->user());

        return response()->json(new LabInstanceResource($instance));
    }

    public function update(UpdateLabInstanceRequest $request, string $instance_id): JsonResponse
    {
        $instance = $this->instances->updateInstance($instance_id, $request->user(), $request->validated());

        return response()->json(new LabInstanceResource($instance));
    }

    public function upgrade(UpgradeLabInstanceRequest $request, string $instance_id): JsonResponse
    {
        $toVersion = $request->validated('to_version');
        if (! $toVersion && $request->filled('target_template_id')) {
            $toVersion = 'BY_TEMPLATE_ID:'.$request->validated('target_template_id');
        }

        $instance = $this->instances->upgrade(
            $instance_id,
            $toVersion,
            $request->validated('strategy'),
            $request->user(),
        );

        return response()->json(new LabInstanceResource($instance));
    }

    public function myInstances(Request $request): JsonResponse
    {
        $result = $this->instances->myInstances($request->user(), [
            'state' => $request->query('state'),
        ], (int) $request->integer('limit', 15));

        return response()->json([
            'data' => LabInstanceResource::collection($result->items()),
            'meta' => [
                'current_page' => $result->currentPage(),
                'last_page' => $result->lastPage(),
                'total' => $result->total(),
            ],
        ]);
    }
}
