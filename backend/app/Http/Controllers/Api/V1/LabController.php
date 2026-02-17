<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\LabDetailResource;
use App\Http\Resources\LabTemplateResource;
use App\Services\Lab\LabInstanceService;
use App\Services\Lab\LabTemplateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LabController extends Controller
{
    public function __construct(
        private readonly LabTemplateService $templates,
        private readonly LabInstanceService $instances,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $result = $this->templates->listPublished($request->all(), (int) $request->integer('per_page', 15));

        return response()->json([
            'data' => LabTemplateResource::collection($result->items()),
            'meta' => [
                'current_page' => $result->currentPage(),
                'last_page' => $result->lastPage(),
                'total' => $result->total(),
            ],
        ]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $template = $this->templates->findOrFail($id);
        $instance = $this->instances->myInstances($request->user())
            ->firstWhere('lab_template_id', $template->id);

        $template->setRelation('user_instance', $instance);

        return response()->json((new LabDetailResource($template))->resolve());
    }
}
