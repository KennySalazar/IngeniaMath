<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\RutaAprendizajeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RutaAprendizajeController extends Controller
{
    public function __construct(
        private RutaAprendizajeService $service
    ) {}

    // GET /api/ruta
    public function obtener(Request $request): JsonResponse
    {
        try {
            $data = $this->service->obtener($request->user()->id);
            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Exception $e) {
            return response()->json(
                ['success' => false, 'message' => $e->getMessage()],
                $e->getCode() ?: 500
            );
        }
    }
}
