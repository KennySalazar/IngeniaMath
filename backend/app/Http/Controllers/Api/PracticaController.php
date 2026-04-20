<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PracticaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class PracticaController extends Controller
{
    public function __construct(
        private PracticaService $service
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

    public function iniciar(Request $request): JsonResponse
    {
        $request->validate([
            'modo' => ['required', 'string', 'in:LIBRE,GUIADA'],
            'modulo_id' => ['nullable', 'integer'],
            'subtema_id' => ['nullable', 'integer'],
            'nivel_dificultad' => ['nullable', 'string', 'in:BASICO,INTERMEDIO,AVANZADO,EXAMEN_REAL'],
        ]);

        try {
            $data = $this->service->iniciar($request->user()->id, $request->all());

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return $this->responderError($e);
        }
    }

    public function detalle(Request $request, int $sesionId): JsonResponse
    {
        try {
            $data = $this->service->detalle($request->user()->id, $sesionId);

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return $this->responderError($e);
        }
    }

    public function responder(Request $request, int $sesionId): JsonResponse
    {
        $request->validate([
            'ejercicio_id' => ['required', 'integer'],
            'opcion_id' => ['nullable', 'integer'],
            'respuesta_texto' => ['nullable', 'string', 'max:1000'],
            'marcado_guardado' => ['nullable', 'boolean'],
            'tiempo_segundos' => ['nullable', 'integer', 'min:0'],
        ]);

        try {
            $data = $this->service->responder($request->user()->id, $sesionId, $request->all());

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return $this->responderError($e);
        }
    }

    public function finalizar(Request $request, int $sesionId): JsonResponse
    {
        try {
            $data = $this->service->finalizar($request->user()->id, $sesionId);

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return $this->responderError($e);
        }
    }

    public function resumen(Request $request, int $sesionId): JsonResponse
    {
        try {
            $data = $this->service->resumen($request->user()->id, $sesionId);

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return $this->responderError($e);
        }
    }

        public function guardados(Request $request): JsonResponse
    {
        try {
            $data = $this->service->guardados($request->user()->id);

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return $this->responderError($e);
        }
    }

    public function eliminarGuardado(Request $request, int $ejercicioId): JsonResponse
    {
        try {
            $data = $this->service->eliminarGuardado($request->user()->id, $ejercicioId);

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return $this->responderError($e);
        }
    }

        public function guardarParaDespues(Request $request): JsonResponse
    {
                $request->validate([
            'ejercicio_id' => ['required', 'integer'],
            'sesion_id' => ['nullable', 'integer'],
            'tiempo_segundos' => ['nullable', 'integer', 'min:0'],
        ]);

        try {
            $data = $this->service->guardarParaDespues($request->user()->id, $request->all());

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return $this->responderError($e);
        }
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
}