<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\EstadisticasService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EstadisticasController extends Controller
{
    public function __construct(private EstadisticasService $estadisticasService) {}

    public function estudiante(Request $request): JsonResponse
    {
        try {
            $data = $this->estadisticasService->dashboardEstudiante(
                $request->user()->id
            );
            return response()->json(['data' => $data]);
        } catch (\Exception $e) {
            return $this->responderError($e);
        }
    }

    private function responderError(\Exception $e): JsonResponse
    {
        $codigo = in_array($e->getCode(), [400, 403, 404, 422, 500])
            ? $e->getCode() : 500;

        return response()->json(['message' => $e->getMessage()], $codigo);
    }
}