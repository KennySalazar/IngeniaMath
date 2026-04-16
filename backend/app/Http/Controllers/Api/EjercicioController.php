<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CrearEjercicioRequest;
use App\Http\Requests\EditarEjercicioRequest;
use App\Services\EjercicioService;
use App\DAO\ModuloDAO;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EjercicioController extends Controller
{
    public function __construct(
        private EjercicioService $ejercicioService,
        private ModuloDAO $moduloDAO
    ) {}

    // GET /api/ejercicios
    public function index(Request $request): JsonResponse
    {
        $filtros = $request->only([
            'modulo_id',
            'subtema_id',
            'nivel_dificultad',
            'tipo_ejercicio',
            'estado',
            'buscar',
            'per_page',
        ]);

        $resultado = $this->ejercicioService->listar(
            $filtros,
            $request->user()->id,
            $request->user()->codigoRol()
        );

        return response()->json(['success' => true, 'data' => $resultado]);
    }

    // GET /api/ejercicios/{id}
    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $ejercicio = $this->ejercicioService->verDetalle(
                $id,
                $request->user()->codigoRol()
            );
            return response()->json(['success' => true, 'data' => $ejercicio]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], $e->getCode() ?: 500);
        }
    }

    // POST /api/ejercicios
    public function store(CrearEjercicioRequest $request): JsonResponse
    {
        try {
            $ejercicio = $this->ejercicioService->crear(
                $request->validated(),
                $request->user()->id
            );
            return response()->json(['success' => true, 'data' => $ejercicio], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], $e->getCode() ?: 500);
        }
    }

    // PUT /api/ejercicios/{id}
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
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], $e->getCode() ?: 500);
        }
    }

    // POST /api/ejercicios/{id}/enviar-revision
    public function enviarRevision(Request $request, int $id): JsonResponse
    {
        try {
            $ejercicio = $this->ejercicioService->enviarARevision($id, $request->user()->id);
            return response()->json(['success' => true, 'data' => $ejercicio]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], $e->getCode() ?: 500);
        }
    }

    // POST /api/ejercicios/{id}/aprobar
    public function aprobar(Request $request, int $id): JsonResponse
    {
        $request->validate(['notas' => ['nullable', 'string', 'max:500']]);
        try {
            $ejercicio = $this->ejercicioService->aprobar($id, $request->user()->id, $request->notas);
            return response()->json(['success' => true, 'data' => $ejercicio]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], $e->getCode() ?: 500);
        }
    }

    // POST /api/ejercicios/{id}/rechazar
    public function rechazar(Request $request, int $id): JsonResponse
    {
        $request->validate(['notas' => ['required', 'string', 'min:5', 'max:500']]);
        try {
            $ejercicio = $this->ejercicioService->rechazar($id, $request->user()->id, $request->notas);
            return response()->json(['success' => true, 'data' => $ejercicio]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], $e->getCode() ?: 500);
        }
    }

    // POST /api/ejercicios/{id}/publicar
    public function publicar(Request $request, int $id): JsonResponse
    {
        try {
            $ejercicio = $this->ejercicioService->publicar($id);
            return response()->json(['success' => true, 'data' => $ejercicio]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], $e->getCode() ?: 500);
        }
    }

    // POST /api/ejercicios/{id}/deshabilitar
    public function deshabilitar(Request $request, int $id): JsonResponse
    {
        try {
            $ejercicio = $this->ejercicioService->deshabilitar($id);
            return response()->json(['success' => true, 'data' => $ejercicio]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], $e->getCode() ?: 500);
        }
    }

    // GET /api/modulos — para poblar selectores en el formulario
    public function modulos(): JsonResponse
    {
        $modulos = $this->moduloDAO->listarTodos();
        return response()->json(['success' => true, 'data' => $modulos]);
    }

    // GET /api/modulos/{id}/subtemas
    public function subtemas(int $moduloId): JsonResponse
    {
        $subtemas = $this->moduloDAO->listarSubtemasPorModulo($moduloId);
        return response()->json(['success' => true, 'data' => $subtemas]);
    }
}
