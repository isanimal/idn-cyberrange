<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PublishLabTemplateRequest;
use App\Http\Requests\Admin\StoreLabTemplateRequest;
use App\Http\Requests\Admin\UpdateLabTemplateRequest;
use App\Http\Resources\LabTemplateResource;
use App\Services\Lab\LabTemplateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminLabController extends Controller
{
    public function __construct(private readonly LabTemplateService $templates)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $query = \App\Models\LabTemplate::query()->latest('updated_at')->paginate((int) $request->integer('per_page', 20));

        return response()->json([
            'data' => LabTemplateResource::collection($query->items()),
            'meta' => [
                'current_page' => $query->currentPage(),
                'last_page' => $query->lastPage(),
                'total' => $query->total(),
            ],
        ]);
    }

    public function store(StoreLabTemplateRequest $request): JsonResponse
    {
        $lab = $this->templates->create($request->validated(), $request->user()->id);

        return response()->json(new LabTemplateResource($lab), 201);
    }

    public function show(string $id): JsonResponse
    {
        $lab = $this->templates->findOrFail($id);

        return response()->json(new LabTemplateResource($lab));
    }

    public function update(UpdateLabTemplateRequest $request, string $id): JsonResponse
    {
        $lab = $this->templates->findOrFail($id);
        $lab = $this->templates->update($lab, $request->validated(), $request->user()->id);

        return response()->json(new LabTemplateResource($lab));
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $lab = $this->templates->findOrFail($id);
        $this->templates->delete($lab, $request->user()->id);

        return response()->json([], 204);
    }

    public function publish(PublishLabTemplateRequest $request, string $id): JsonResponse
    {
        $lab = $this->templates->findOrFail($id);
        $lab = $this->templates->publish(
            $lab,
            $request->validated('version'),
            $request->validated('notes'),
            $request->user()->id,
        );

        return response()->json(new LabTemplateResource($lab));
    }

    public function archive(Request $request, string $id): JsonResponse
    {
        $lab = $this->templates->findOrFail($id);
        $lab = $this->templates->archive($lab, $request->user()->id);

        return response()->json(new LabTemplateResource($lab));
    }
}
