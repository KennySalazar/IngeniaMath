<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ForoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Log;

class ForoController extends Controller
{
    private const ESTADOS_HILO = ['ABIERTO', 'RESUELTO', 'CERRADO'];

    public function __construct(private ForoService $foroService) {}

    // ── GET /foro ────────────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'modulo_id'  => ['nullable', 'integer'],
            'subtema_id' => ['nullable', 'integer'],
            'estado'     => ['nullable', Rule::in(self::ESTADOS_HILO)],
            'buscar'     => ['nullable', 'string', 'max:100'],
            'per_page'   => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        try {
            $resultado = $this->foroService->listar($request->only([
                'modulo_id', 'subtema_id', 'estado', 'buscar', 'per_page', 'page',
            ]));
            return response()->json($resultado);
        } catch (\Exception $e) {
            Log::error('ForoController@index: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->responderError($e);
        }
    }

    // ── GET /foro/{id} ───────────────────────────────────────────────────────

    public function show(int $id): JsonResponse
    {
        try {
            $hilo = $this->foroService->obtener($id);
            return response()->json(['data' => $hilo]);
        } catch (\Exception $e) {
            return $this->responderError($e);
        }
    }

    // ── POST /foro ───────────────────────────────────────────────────────────

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'modulo_id'  => ['required', 'integer', 'exists:modulos_tematicos,id'],
            'subtema_id' => ['nullable', 'integer', 'exists:subtemas,id'],
            'titulo'     => ['required', 'string', 'min:10', 'max:200'],
            'contenido'  => ['required', 'string', 'min:20'],
        ]);

        try {
            $hilo = $this->foroService->crearHilo($data, $request->user()->id);
            return response()->json(['data' => $hilo], 201);
        } catch (\Exception $e) {
            return $this->responderError($e);
        }
    }

    // ── PUT /foro/{id} ───────────────────────────────────────────────────────

    public function update(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'titulo'    => ['sometimes', 'string', 'min:10', 'max:200'],
            'contenido' => ['sometimes', 'string', 'min:20'],
        ]);

        try {
            $hilo = $this->foroService->editarHilo(
                $id, $data,
                $request->user()->id,
                $request->user()->codigoRol()
            );
            return response()->json(['data' => $hilo]);
        } catch (\Exception $e) {
            return $this->responderError($e);
        }
    }

    // ── POST /foro/{id}/responder ────────────────────────────────────────────

    public function responder(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'contenido' => ['required', 'string', 'min:5'],
        ]);

        try {
            $respuesta = $this->foroService->responder(
                $id,
                $data['contenido'],
                $request->user()->id
            );
            return response()->json(['data' => $respuesta], 201);
        } catch (\Exception $e) {
            return $this->responderError($e);
        }
    }

    // ── DELETE /foro/respuestas/{respuestaId} ────────────────────────────────

    public function eliminarRespuesta(Request $request, int $respuestaId): JsonResponse
    {
        try {
            $this->foroService->eliminarRespuesta(
                $respuestaId,
                $request->user()->id,
                $request->user()->codigoRol()
            );
            return response()->json(['message' => 'Respuesta eliminada.']);
        } catch (\Exception $e) {
            return $this->responderError($e);
        }
    }

    // ── PATCH /foro/{id}/solucion ────────────────────────────────────────────

    public function marcarSolucion(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'respuesta_id' => ['required', 'integer'],
        ]);

        try {
            $hilo = $this->foroService->marcarSolucion(
                $id,
                $data['respuesta_id'],
                $request->user()->id
            );
            return response()->json(['data' => $hilo]);
        } catch (\Exception $e) {
            return $this->responderError($e);
        }
    }

    // ── PATCH /foro/{id}/estado ──────────────────────────────────────────────

    public function cambiarEstado(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'estado' => ['required', Rule::in(['ABIERTO', 'CERRADO', 'ELIMINADO'])],
        ]);

        try {
            $hilo = $this->foroService->cambiarEstado(
                $id,
                $data['estado'],
                $request->user()->id,
                $request->user()->codigoRol()
            );
            return response()->json(['data' => $hilo]);
        } catch (\Exception $e) {
            return $this->responderError($e);
        }
    }

    // ── GET /foro/badge ──────────────────────────────────────────────────────

    public function badge(Request $request): JsonResponse
    {
        try {
            $data = $this->foroService->badgeRespuestasNuevas($request->user()->id);
            return response()->json(['data' => $data]);
        } catch (\Exception $e) {
            return $this->responderError($e);
        }
    }

    // ── Helper ───────────────────────────────────────────────────────────────

    private function responderError(\Exception $e): JsonResponse
    {
        $codigo = in_array($e->getCode(), [400, 403, 404, 422, 500])
            ? $e->getCode() : 500;

        return response()->json(['message' => $e->getMessage()], $codigo);
    }
}