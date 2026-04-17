<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PlanEstudioService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class PlanEstudioController extends Controller
{
    public function __construct(
        private PlanEstudioService $service
    ) {}

    private function responderError(\Throwable $e): JsonResponse
    {
        if ($e instanceof HttpExceptionInterface) {
            $status = $e->getStatusCode();
        } else {
            $codigo = (int) $e->getCode();

            if (in_array($codigo, [400, 401, 403, 404, 409, 422])) {
                $status = $codigo;
            } else {
                $status = 500;
            }
        }

        return response()->json([
            'success' => false,
            'message' => $e->getMessage(),
        ], $status);
    }

    public function generar(Request $request): JsonResponse
    {
        $request->validate([
            'semana_inicio' => ['nullable', 'date_format:Y-m-d'],
            'horas_disponibles_semana' => ['nullable', 'numeric', 'min:1', 'max:60'],
        ]);

        try {
            $data = $this->service->generar(
                $request->user()->id,
                $request->semana_inicio,
                $request->horas_disponibles_semana !== null
                    ? (float) $request->horas_disponibles_semana
                    : null
            );

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return $this->responderError($e);
        }
    }

    public function obtener(Request $request): JsonResponse
    {
        try {
            $data = $this->service->obtener($request->user()->id);

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return $this->responderError($e);
        }
    }
}
