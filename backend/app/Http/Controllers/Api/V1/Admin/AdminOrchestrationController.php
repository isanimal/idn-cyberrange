<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\LabInstance;
use App\Services\Audit\AuditLogService;
use App\Services\Lab\LabInstanceService;
use App\Services\Orchestration\AdminOrchestrationInspector;
use Illuminate\Http\JsonResponse;

class AdminOrchestrationController extends Controller
{
    public function __construct(
        private readonly LabInstanceService $instances,
        private readonly AuditLogService $audit,
        private readonly AdminOrchestrationInspector $inspector,
    ) {
    }

    public function index(): JsonResponse
    {
        $rows = LabInstance::query()
            ->with(['user:id,name,email', 'template:id,slug,title,version,docker_image', 'runtime'])
            ->latest('last_activity_at')
            ->paginate(20);

        $data = collect($rows->items())
            ->map(fn (LabInstance $instance): array => $this->inspector->inspect($instance))
            ->values();

        return response()->json([
            'data' => $data,
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

        $instance->load(['user:id,name,email', 'template:id,slug,title,version,docker_image', 'runtime']);

        return response()->json($this->inspector->inspect($instance));
    }

    public function restart(string $instance_id): JsonResponse
    {
        $instance = $this->instances->forceRestartByAdmin($instance_id);

        $this->audit->log('ADMIN_RESTART_INSTANCE', auth()->id(), 'LabInstance', $instance->id);

        $instance->load(['user:id,name,email', 'template:id,slug,title,version,docker_image', 'runtime']);

        return response()->json($this->inspector->inspect($instance));
    }
}
