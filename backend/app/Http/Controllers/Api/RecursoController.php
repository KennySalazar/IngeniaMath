<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\RecursoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RecursoController extends Controller
{
    private const TIPOS_RECURSO = ['VIDEO', 'PDF', 'FLASHCARD', 'SIMULADOR', 'ENLACE'];
    private const ESTADOS       = ['BORRADOR', 'EN_REVISION', 'APROBADO', 'PUBLICADO', 'DESHABILITADO'];

    public function __construct(private RecursoService $recursoService) {}

    // ─── Helper de rol ───────────────────────────────────────────────────────────

    private function rolActual(Request $request): string
{
    return $request->user()->codigoRol(); 
}


    // ─── INDEX ───────────────────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'modulo_id'    => ['nullable', 'integer'],
            'subtema_id'   => ['nullable', 'integer'],
            'tipo_recurso' => ['nullable', Rule::in(self::TIPOS_RECURSO)],
            'estado'       => ['nullable', Rule::in(self::ESTADOS)],
            'per_page'     => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        try {
            $resultado = $this->recursoService->listar($request->only([
                'modulo_id', 'subtema_id', 'tipo_recurso', 'estado', 'per_page',
            ]));

            return response()->json($resultado);
        } catch (\Exception $e) {
            return $this->responderError($e);
        }
    }

    // ─── SHOW ────────────────────────────────────────────────────────────────────

    public function show(int $id): JsonResponse
    {
        try {
            $recurso = $this->recursoService->obtener($id);
            return response()->json(['data' => $recurso]);
        } catch (\Exception $e) {
            return $this->responderError($e);
        }
    }

    // ─── STORE ───────────────────────────────────────────────────────────────────

public function store(Request $request): JsonResponse
{
    $data = $request->validate([
        'modulo_id'        => ['required', 'integer', 'exists:modulos_tematicos,id'],
        'subtema_id'       => ['nullable', 'integer', 'exists:subtemas,id'],
        'tipo_recurso'     => ['required', Rule::in(self::TIPOS_RECURSO)],
        'titulo'           => ['required', 'string', 'max:200'],
        'descripcion'      => ['nullable', 'string'],
        'url_recurso'      => ['nullable', 'url', 'max:2048'],
        'flashcard'        => ['required_if:tipo_recurso,FLASHCARD', 'array'],
        'flashcard.titulo' => ['required_if:tipo_recurso,FLASHCARD', 'string', 'max:150'],
        'flashcard.frente' => ['required_if:tipo_recurso,FLASHCARD', 'string'],
        'flashcard.reverso'=> ['required_if:tipo_recurso,FLASHCARD', 'string'],
    ]);

    try {
        $recurso = $this->recursoService->crear($data, $request->user()->id);
        return response()->json(['data' => $recurso], 201);
    } catch (\Exception $e) {
        return $this->responderError($e);
    }
}

    // ─── UPDATE ──────────────────────────────────────────────────────────────────

    public function update(Request $request, int $id): JsonResponse
{
    $data = $request->validate([
        'modulo_id'   => ['sometimes', 'integer', 'exists:modulos_tematicos,id'],
        'subtema_id'  => ['nullable', 'integer', 'exists:subtemas,id'],
        'titulo'      => ['sometimes', 'string', 'max:200'],
        'descripcion' => ['nullable', 'string'],
        'url_recurso' => ['nullable', 'url', 'max:2048'],
    ]);

    try {
        $recurso = $this->recursoService->editar(
            $id,
            $data,
            $request->user()->id,
            $this->rolActual($request)
        );
        return response()->json(['data' => $recurso]);
    } catch (\Exception $e) {
        return $this->responderError($e);
    }
}

    // ─── DESTROY ─────────────────────────────────────────────────────────────────

    public function destroy(Request $request, int $id): JsonResponse
{
    try {
        $this->recursoService->eliminar(
            $id,
            $request->user()->id,
            $this->rolActual($request)
        );
        return response()->json(['message' => 'Recurso eliminado correctamente.']);
    } catch (\Exception $e) {
        return $this->responderError($e);
    }
}

   // ─── FLUJO DE ESTADOS ────────────────────────────────────────────────────────

public function enviarRevision(Request $request, int $id): JsonResponse
{
    try {
        $recurso = $this->recursoService->enviarARevision($id, $request->user()->id);
        return response()->json(['data' => $recurso]);
    } catch (\Exception $e) {
        return $this->responderError($e);
    }
}

public function aprobar(Request $request, int $id): JsonResponse
{
    try {
        $recurso = $this->recursoService->aprobar(
            $id,
            $request->user()->id,
            $this->rolActual($request)
        );
        return response()->json(['data' => $recurso]);
    } catch (\Exception $e) {
        return $this->responderError($e);
    }
}

public function rechazar(Request $request, int $id): JsonResponse
{
    $data = $request->validate([
        'notas' => ['required', 'string', 'max:1000'],
    ]);

    try {
        $recurso = $this->recursoService->rechazar(
            $id,
            $request->user()->id,
            $data['notas'],
            $this->rolActual($request)
        );
        return response()->json(['data' => $recurso]);
    } catch (\Exception $e) {
        return $this->responderError($e);
    }
}

public function publicar(Request $request, int $id): JsonResponse
{
    try {
        $recurso = $this->recursoService->publicar(
            $id,
            $request->user()->id,
            $this->rolActual($request)
        );
        return response()->json(['data' => $recurso]);
    } catch (\Exception $e) {
        return $this->responderError($e);
    }
}

// ─── EJERCICIOS ──────────────────────────────────────────────────────────────

public function vincularEjercicio(Request $request, int $id): JsonResponse
{
    $data = $request->validate([
        'ejercicio_id' => ['required', 'integer', 'exists:ejercicios,id'],
        'accion'       => ['required', Rule::in(['adjuntar', 'desadjuntar'])],
    ]);

    try {
        $this->recursoService->sincronizarEjercicio(
            $id,
            $data['ejercicio_id'],
            $data['accion'],
            $request->user()->id,
            $this->rolActual($request)
        );

        $mensaje = $data['accion'] === 'adjuntar'
            ? 'Recurso adjuntado al ejercicio.'
            : 'Recurso desadjuntado del ejercicio.';

        return response()->json(['message' => $mensaje]);
    } catch (\Exception $e) {
        return $this->responderError($e);
    }
}
    // ─── HELPER PRIVADO ──────────────────────────────────────────────────────────

    private function responderError(\Exception $e): JsonResponse
    {
        $codigo = in_array($e->getCode(), [400, 403, 404, 422, 500])
            ? $e->getCode()
            : 500;

        return response()->json(['message' => $e->getMessage()], $codigo);
    }
}