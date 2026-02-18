<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\LabInstance;
use App\Services\Audit\AuditLogService;
use App\Services\Lab\LabInstanceService;
use App\Services\Orchestration\AdminOrchestrationInspector;
use App\Services\Orchestration\OrchestrationPreflightService;
use Illuminate\Http\JsonResponse;

class AdminOrchestrationController extends Controller
{
    public function __construct(
        private readonly LabInstanceService $instances,
        private readonly AuditLogService $audit,
        private readonly AdminOrchestrationInspector $inspector,
        private readonly OrchestrationPreflightService $preflight,
    ) {
    }

    public function preflight(): JsonResponse
    {
        $report = $this->preflight->run();

        return response()->json([
            'data' => $report,
        ], $report['ok'] ? 200 : 503);
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

    public function overview(): JsonResponse
    {
        $rows = LabInstance::query()
            ->with(['user:id,name,email', 'template:id,slug,title,version,docker_image', 'runtime'])
            ->latest('last_activity_at')
            ->limit(100)
            ->get()
            ->map(fn (LabInstance $instance): array => $this->inspector->inspect($instance))
            ->values();

        $activeContainers = $rows->where('status', 'RUNNING')->count();
        $cpuValues = $rows->pluck('resources.cpu_percent')->filter(fn ($v) => $v !== null)->values();
        $memValues = $rows->pluck('resources.mem_mb')->filter(fn ($v) => $v !== null)->values();
        $errors = $rows->where('status', 'ERROR')->count();

        return response()->json([
            'data' => [
                'activeContainers' => $activeContainers,
                'avgCpu' => $cpuValues->count() > 0 ? round($cpuValues->sum() / $cpuValues->count(), 2) : null,
                'memAllocated' => $memValues->count() > 0 ? round($memValues->sum(), 2) : null,
                'errors' => $errors,
                'instances' => $rows,
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
