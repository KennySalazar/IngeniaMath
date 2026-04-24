<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SimulacroService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class SimulacroController extends Controller
{
    public function __construct(
        private SimulacroService $service
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

    public function activa(Request $request): JsonResponse
    {
        try {
            $data = $this->service->activa($request->user()->id);

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return $this->responderError($e);
        }
    }

    public function iniciar(Request $request): JsonResponse
    {
        try {
            $data = $this->service->iniciar($request->user()->id);

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return $this->responderError($e);
        }
    }

    public function detalle(Request $request, int $simulacroId): JsonResponse
    {
        try {
            $data = $this->service->detalle($request->user()->id, $simulacroId);

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return $this->responderError($e);
        }
    }

    public function responder(Request $request, int $simulacroId): JsonResponse
    {
        $request->validate([
            'ejercicio_id' => ['required', 'integer'],
            'opcion_id' => ['nullable', 'integer'],
            'respuesta_texto' => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $data = $this->service->responder($request->user()->id, $simulacroId, $request->all());

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return $this->responderError($e);
        }
    }

    public function finalizar(Request $request, int $simulacroId): JsonResponse
    {
        try {
            $data = $this->service->finalizar($request->user()->id, $simulacroId);

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return $this->responderError($e);
        }
    }

    public function historial(Request $request): JsonResponse
    {
        try {
            $data = $this->service->historial($request->user()->id);

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return $this->responderError($e);
        }
    }

    public function configuracion(Request $request): JsonResponse
{
    try {
        $data = $this->service->configuracion();

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    } catch (\Throwable $e) {
        return $this->responderError($e);
    }
}

    public function actualizarConfiguracion(Request $request): JsonResponse
    {
        $request->validate([
            'nombre' => ['required', 'string', 'max:100'],
            'duracion_minutos' => ['required', 'integer', 'min:1', 'max:240'],
            'puntaje_minimo_aprobacion' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        try {
            $data = $this->service->actualizarConfiguracion($request->user()->id, $request->all());

            return response()->json([
                'success' => true,
                'message' => 'Configuracion actualizada correctamente.',
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return $this->responderError($e);
        }
    }
}
