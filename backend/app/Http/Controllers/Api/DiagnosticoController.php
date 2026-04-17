<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DiagnosticoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DiagnosticoController extends Controller
{
    public function __construct(
        private DiagnosticoService $service
    ) {}

    // GET /api/diagnostico/estado
    public function estado(Request $request): JsonResponse
    {
        try {
            $data = $this->service->estado($request->user()->id);
            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Exception $e) {
            return response()->json(
                ['success' => false, 'message' => $e->getMessage()],
                $e->getCode() ?: 500
            );
        }
    }

    // POST /api/diagnostico/iniciar
    public function iniciar(Request $request): JsonResponse
    {
        try {
            $data = $this->service->iniciar($request->user()->id);
            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Exception $e) {
            return response()->json(
                ['success' => false, 'message' => $e->getMessage()],
                $e->getCode() ?: 500
            );
        }
    }

    // POST /api/diagnostico/{intentoId}/responder
    public function responder(Request $request, int $intentoId): JsonResponse
    {
        $request->validate([
            'ejercicio_id'    => ['required', 'integer'],
            'opcion_id'       => ['nullable', 'integer'],
            'respuesta_texto' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $data = $this->service->responder(
                $request->user()->id,
                $intentoId,
                $request->ejercicio_id,
                $request->opcion_id,
                $request->respuesta_texto
            );
            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Exception $e) {
            return response()->json(
                ['success' => false, 'message' => $e->getMessage()],
                $e->getCode() ?: 500
            );
        }
    }

    // POST /api/diagnostico/{intentoId}/finalizar
    public function finalizar(Request $request, int $intentoId): JsonResponse
    {
        try {
            $data = $this->service->finalizar(
                $request->user()->id,
                $intentoId
            );
            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Exception $e) {
            return response()->json(
                ['success' => false, 'message' => $e->getMessage()],
                $e->getCode() ?: 500
            );
        }
    }

    // GET /api/diagnostico/{intentoId}/resultados
    public function resultados(Request $request, int $intentoId): JsonResponse
    {
        try {
            $data = $this->service->verResultados(
                $request->user()->id,
                $intentoId
            );
            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Exception $e) {
            return response()->json(
                ['success' => false, 'message' => $e->getMessage()],
                $e->getCode() ?: 500
            );
        }
    }
}
