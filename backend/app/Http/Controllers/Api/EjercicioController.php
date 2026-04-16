<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CrearEjercicioRequest;
use App\Http\Requests\EditarEjercicioRequest;
use App\Services\EjercicioService;
use App\DAO\ModuloDAO;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class EjercicioController extends Controller
{
    public function __construct(
        private EjercicioService $ejercicioService,
        private ModuloDAO $moduloDAO
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

    public function index(Request $request): JsonResponse
    {
        try {
            $filtros = $request->only([
                'modulo_id',
                'subtema_id',
                'nivel_dificultad',
                'tipo_ejercicio',
                'estado',
                'buscar',
                'per_page',
                'page',
            ]);

            $resultado = $this->ejercicioService->listar(
                $filtros,
                $request->user()->id,
                $request->user()->codigoRol()
            );

            return response()->json(['success' => true, 'data' => $resultado]);
        } catch (\Throwable $e) {
            return $this->responderError($e);
        }
    }

    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $ejercicio = $this->ejercicioService->verDetalle(
                $id,
                $request->user()->codigoRol()
            );

            return response()->json(['success' => true, 'data' => $ejercicio]);
        } catch (\Throwable $e) {
            return $this->responderError($e);
        }
    }

    public function store(CrearEjercicioRequest $request): JsonResponse
    {
        try {
            $ejercicio = $this->ejercicioService->crear(
                $request->validated(),
                $request->user()->id
            );

            return response()->json(['success' => true, 'data' => $ejercicio], 201);
        } catch (\Throwable $e) {
            return $this->responderError($e);
        }
    }

    public function update(EditarEjercicioRequest $request, int $id): JsonResponse
    {
        try {
            $ejercicio = $this->ejercicioService->editar(
                $id,
                $request->validated(),
                $request->user()->id,
                $request->user()->codigoRol()
            );

            return response()->json(['success' => true, 'data' => $ejercicio]);
        } catch (\Throwable $e) {
            return $this->responderError($e);
        }
    }

    public function enviarRevision(Request $request, int $id): JsonResponse
    {
        try {
            $ejercicio = $this->ejercicioService->enviarARevision(
                $id,
                $request->user()->id
            );

            return response()->json(['success' => true, 'data' => $ejercicio]);
        } catch (\Throwable $e) {
            return $this->responderError($e);
        }
    }

    public function aprobar(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'notas' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $ejercicio = $this->ejercicioService->aprobar(
                $id,
                $request->user()->id,
                $request->notas,
                $request->user()->codigoRol()
            );

            return response()->json(['success' => true, 'data' => $ejercicio]);
        } catch (\Throwable $e) {
            return $this->responderError($e);
        }
    }

    public function rechazar(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'notas' => ['required', 'string', 'min:5', 'max:500'],
        ]);

        try {
            $ejercicio = $this->ejercicioService->rechazar(
                $id,
                $request->user()->id,
                $request->notas
            );

            return response()->json(['success' => true, 'data' => $ejercicio]);
        } catch (\Throwable $e) {
            return $this->responderError($e);
        }
    }

    public function publicar(Request $request, int $id): JsonResponse
    {
        try {
            $ejercicio = $this->ejercicioService->publicar(
                $id,
                $request->user()->id
            );

            return response()->json(['success' => true, 'data' => $ejercicio]);
        } catch (\Throwable $e) {
            return $this->responderError($e);
        }
    }

    public function deshabilitar(Request $request, int $id): JsonResponse
    {
        try {
            $ejercicio = $this->ejercicioService->deshabilitar(
                $id,
                $request->user()->id
            );

            return response()->json(['success' => true, 'data' => $ejercicio]);
        } catch (\Throwable $e) {
            return $this->responderError($e);
        }
    }

    public function modulos(): JsonResponse
    {
        try {
            $modulos = $this->moduloDAO->listarTodos();
            return response()->json(['success' => true, 'data' => $modulos]);
        } catch (\Throwable $e) {
            return $this->responderError($e);
        }
    }

    public function subtemas(int $moduloId): JsonResponse
    {
        try {
            $subtemas = $this->moduloDAO->listarSubtemasPorModulo($moduloId);
            return response()->json(['success' => true, 'data' => $subtemas]);
        } catch (\Throwable $e) {
            return $this->responderError($e);
        }
    }
}
