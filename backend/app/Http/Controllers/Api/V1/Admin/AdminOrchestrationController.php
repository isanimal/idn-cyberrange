<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\LabInstanceResource;
use App\Models\LabInstance;
use App\Services\Audit\AuditLogService;
use App\Services\Lab\LabInstanceService;
use Illuminate\Http\JsonResponse;

class AdminOrchestrationController extends Controller
{
    public function __construct(
        private readonly LabInstanceService $instances,
        private readonly AuditLogService $audit,
    ) {
    }

    public function index(): JsonResponse
    {
        $rows = LabInstance::query()
            ->with(['user:id,name,email', 'template:id,slug,title,version'])
            ->where('state', 'ACTIVE')
            ->latest('last_activity_at')
            ->paginate(20);

        return response()->json([
            'data' => LabInstanceResource::collection($rows->items()),
            'meta' => [
                'current_page' => $rows->currentPage(),
                'last_page' => $rows->lastPage(),
                'total' => $rows->total(),
            ],
        ]);
    }

    public function forceStop(string $instance_id): JsonResponse
    {
        $instance = $this->instances->forceStopByAdmin($instance_id);

        $this->audit->log('ADMIN_FORCE_STOP_INSTANCE', auth()->id(), 'LabInstance', $instance->id);

        return response()->json(new LabInstanceResource($instance));
    }
}
