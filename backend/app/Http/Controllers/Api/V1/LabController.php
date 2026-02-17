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
        $filters = [
            'search' => $request->query('search'),
            'difficulty' => $request->query('difficulty'),
            'category' => $request->query('category'),
            'tag' => $request->query('tag'),
            'sort' => $request->query('sort'),
            'status' => 'PUBLISHED',
        ];

        $result = $this->templates->listPublished($filters, (int) $request->integer('limit', 15));

        return response()->json([
            'data' => LabTemplateResource::collection($result->items()),
            'meta' => [
                'current_page' => $result->currentPage(),
                'last_page' => $result->lastPage(),
                'total' => $result->total(),
            ],
        ]);
    }

    public function show(Request $request, string $id_or_slug): JsonResponse
    {
        $template = $this->templates->findPublishedForUserCatalogOrFail($id_or_slug);
        $instance = $this->instances->findUserInstanceForTemplateFamily($request->user(), $template);

        $template->setRelation('user_instance', $instance);

        return response()->json((new LabDetailResource($template))->resolve());
    }
}
