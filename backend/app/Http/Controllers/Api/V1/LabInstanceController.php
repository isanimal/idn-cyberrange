<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\LabInstance\ActivateLabRequest;
use App\Http\Requests\LabInstance\UpdateLabInstanceRequest;
use App\Http\Requests\LabInstance\UpgradeLabInstanceRequest;
use App\Http\Resources\LabInstanceResource;
use App\Services\Lab\LabInstanceService;
use App\Services\Lab\LabTemplateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

class LabInstanceController extends Controller
{
    public function __construct(
        private readonly LabInstanceService $instances,
        private readonly LabTemplateService $templates,
    )
    {
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'lab_template_id' => ['required', 'string', 'exists:lab_templates,id'],
            'pin_version' => ['nullable', 'string', 'max:32'],
        ]);

        $instance = $this->instances->activate(
            $validated['lab_template_id'],
            $request->user(),
            $validated['pin_version'] ?? null
        );

        return response()->json(['data' => new LabInstanceResource($instance->load('template'))], 201);
    }

    public function activate(ActivateLabRequest $request, string $id): JsonResponse
    {
        $instance = $this->instances->activate(
            $id,
            $request->user(),
            $request->validated('pin_version')
        );

        return response()->json(new LabInstanceResource($instance->load('template')), 201);
    }

    public function start(ActivateLabRequest $request, string $id): JsonResponse
    {
        return $this->activate($request, $id);
    }

    public function deactivate(Request $request, string $instance_id): JsonResponse
    {
        $instance = $this->instances->deactivate($instance_id, $request->user());

        return response()->json(new LabInstanceResource($instance->load('template')));
    }

    public function restart(Request $request, string $instance_id): JsonResponse
    {
        $instance = $this->instances->restart($instance_id, $request->user());

        return response()->json(new LabInstanceResource($instance->load('template')));
    }

    public function stop(Request $request, string $instance_id): JsonResponse
    {
        return $this->deactivate($request, $instance_id);
    }

    public function stopBySlug(Request $request, string $id_or_slug): JsonResponse
    {
        $template = $this->templates->findPublishedForUserCatalogOrFail($id_or_slug);
        $instance = $this->instances->findUserInstanceForTemplateFamily($request->user(), $template);

        if (! $instance) {
            throw new HttpException(404, 'Lab instance not found for this template.');
        }

        return $this->deactivate($request, $instance->id);
    }

    public function update(UpdateLabInstanceRequest $request, string $instance_id): JsonResponse
    {
        $instance = $this->instances->updateInstance($instance_id, $request->user(), $request->validated());

        return response()->json(new LabInstanceResource($instance->load('template')));
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

        return response()->json(new LabInstanceResource($instance->load('template')));
    }

    public function myInstances(Request $request): JsonResponse
    {
        $result = $this->instances->myInstances($request->user(), [
            'state' => $request->query('state'),
        ], (int) $request->integer('limit', 15));
        $items = collect($result->items())->each(fn ($instance) => $instance->load('template'));

        return response()->json([
            'data' => LabInstanceResource::collection($items),
            'meta' => [
                'current_page' => $result->currentPage(),
                'last_page' => $result->lastPage(),
                'total' => $result->total(),
            ],
        ]);
    }

    public function my(Request $request): JsonResponse
    {
        $result = $this->instances->myInstances($request->user(), [
            'state' => $request->query('state'),
        ], (int) $request->integer('limit', 20));
        $items = collect($result->items())->each(fn ($instance) => $instance->load('template'));

        return response()->json([
            'data' => LabInstanceResource::collection($items),
            'meta' => [
                'current_page' => $result->currentPage(),
                'last_page' => $result->lastPage(),
                'total' => $result->total(),
            ],
        ]);
    }

    public function myForLabsNamespace(Request $request): JsonResponse
    {
        return $this->my($request);
    }

    public function show(Request $request, string $instance_id): JsonResponse
    {
        $instance = $this->instances->findInstanceForUserOrFail($instance_id, $request->user());

        return response()->json(['data' => new LabInstanceResource($instance->load('template'))]);
    }

    public function showForLabsNamespace(Request $request, string $instance_id): JsonResponse
    {
        return $this->show($request, $instance_id);
    }
}
