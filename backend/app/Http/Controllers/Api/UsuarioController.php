<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CrearUsuarioRequest;
use App\Http\Requests\EditarPerfilRequest;
use App\Services\UsuarioService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UsuarioController extends Controller
{
    public function __construct(private UsuarioService $usuarioService) {}

    // GET /api/usuarios — solo ADMIN
    public function index(Request $request): JsonResponse
    {
        $filtros = $request->only(['rol_id', 'activo', 'buscar', 'per_page']);
        $resultado = $this->usuarioService->listar($filtros);

        return response()->json(['success' => true, 'data' => $resultado]);
    }

    // GET /api/usuarios/{id}
    public function show(int $id): JsonResponse
    {
        try {
            $usuario = $this->usuarioService->verPerfil($id);
            return response()->json(['success' => true, 'data' => $usuario]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], $e->getCode() ?: 500);
        }
    }

    // PUT /api/usuarios/{id} — perfil propio o admin
    public function update(EditarPerfilRequest $request, int $id): JsonResponse
    {
        try {
            $usuario = $this->usuarioService->editarPerfil(
                $id,
                $request->validated(),
                $request->user()->id,
                $request->user()->codigoRol()
            );
            return response()->json(['success' => true, 'data' => $usuario]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], $e->getCode() ?: 500);
        }
    }

    // POST /api/usuarios — solo ADMIN
    public function store(CrearUsuarioRequest $request): JsonResponse
    {
        try {
            $usuario = $this->usuarioService->crearDesdeAdmin($request->validated());
            return response()->json(['success' => true, 'data' => $usuario], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], $e->getCode() ?: 500);
        }
    }

    // PATCH /api/usuarios/{id}/estado — solo ADMIN
    public function cambiarEstado(Request $request, int $id): JsonResponse
    {
        $request->validate(['activo' => ['required', 'boolean']]);

        try {
            $usuario = $this->usuarioService->cambiarEstado($id, $request->activo);
            return response()->json(['success' => true, 'data' => $usuario]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], $e->getCode() ?: 500);
        }
    }

    // PATCH /api/usuarios/{id}/rol — solo ADMIN
    public function cambiarRol(Request $request, int $id): JsonResponse
    {
        $request->validate(['rol_id' => ['required', 'integer', 'in:1,2,3,4']]);

        try {
            $usuario = $this->usuarioService->cambiarRol($id, $request->rol_id);
            return response()->json(['success' => true, 'data' => $usuario]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], $e->getCode() ?: 500);
        }
    }

    // DELETE /api/usuarios/{id} — solo ADMIN
    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $this->usuarioService->eliminar($id, $request->user()->id);
            return response()->json(['success' => true, 'message' => 'Usuario eliminado correctamente.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], $e->getCode() ?: 500);
        }
    }

    // GET /api/usuarios/resumen — solo ADMIN, para dashboard
    public function resumen(): JsonResponse
    {
        $data = $this->usuarioService->resumenPorRol();
        return response()->json(['success' => true, 'data' => $data]);
    }
}
