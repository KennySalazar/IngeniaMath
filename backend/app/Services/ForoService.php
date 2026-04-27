<?php

namespace App\Services;

use App\DAO\ForoDAO;

class ForoService
{
    public function __construct(private ForoDAO $foroDAO) {}

    // ── Listar hilos ─────────────────────────────────────────────────────────

    public function listar(array $filtros): array
    {
        $perPage   = isset($filtros['per_page']) ? (int) $filtros['per_page'] : 15;
        $paginator = $this->foroDAO->listarHilos($filtros, $perPage);

        return [
            'data' => array_map(
                fn($h) => $this->formatearHilo($h),
                $paginator->items()
            ),
            'meta' => [
                'total'        => $paginator->total(),
                'per_page'     => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
            ],
        ];
    }

    // ── Ver hilo con sus respuestas ──────────────────────────────────────────

    public function obtener(int $id): array
    {
        $hilo = $this->foroDAO->findHiloById($id);

        if (!$hilo) {
            throw new \Exception('Hilo no encontrado.', 404);
        }

        $respuestas = $this->foroDAO->listarRespuestas($id);

        return array_merge(
            $this->formatearHilo($hilo),
            ['respuestas' => array_map(fn($r) => $this->formatearRespuesta($r), $respuestas)]
        );
    }

    // ── Crear hilo ───────────────────────────────────────────────────────────

    public function crearHilo(array $data, int $estudianteId): array
    {
        $hilo = $this->foroDAO->crearHilo([
            'estudiante_id' => $estudianteId,
            'modulo_id'     => $data['modulo_id'],
            'subtema_id'    => $data['subtema_id'] ?? null,
            'titulo'        => trim($data['titulo']),
            'contenido'     => trim($data['contenido']),
        ]);

        return array_merge(
            $this->formatearHilo($hilo),
            ['respuestas' => []]
        );
    }

    // ── Editar hilo ──────────────────────────────────────────────────────────

    public function editarHilo(int $id, array $data, int $usuarioId, string $rol): array
    {
        $hilo = $this->foroDAO->findHiloById($id);

        if (!$hilo) {
            throw new \Exception('Hilo no encontrado.', 404);
        }

        if ($rol === 'ESTUDIANTE' && $hilo->estudiante_id !== $usuarioId) {
            throw new \Exception('No tienes permiso para editar este hilo.', 403);
        }

        if ($hilo->estado !== 'ABIERTO') {
            throw new \Exception('Solo puedes editar hilos abiertos.', 422);
        }

        $campos = array_filter([
            'titulo'    => isset($data['titulo'])    ? trim($data['titulo'])    : null,
            'contenido' => isset($data['contenido']) ? trim($data['contenido']) : null,
        ], fn($v) => $v !== null);

        $this->foroDAO->actualizarHilo($id, $campos);

        return $this->obtener($id);
    }

    // ── Responder hilo ───────────────────────────────────────────────────────

    public function responder(int $hiloId, string $contenido, int $usuarioId): array
    {
        $hilo = $this->foroDAO->findHiloById($hiloId);

        if (!$hilo) {
            throw new \Exception('Hilo no encontrado.', 404);
        }

        if ($hilo->estado === 'CERRADO') {
            throw new \Exception('No puedes responder un hilo cerrado.', 422);
        }

        if ($hilo->estado === 'ELIMINADO') {
            throw new \Exception('Hilo no disponible.', 404);
        }

        $respuesta = $this->foroDAO->crearRespuesta([
            'hilo_id'    => $hiloId,
            'usuario_id' => $usuarioId,
            'contenido'  => trim($contenido),
        ]);

        return $this->formatearRespuesta($respuesta);
    }

    // ── Eliminar respuesta ───────────────────────────────────────────────────

    public function eliminarRespuesta(int $respuestaId, int $usuarioId, string $rol): void
    {
        $respuesta = $this->foroDAO->findRespuestaById($respuestaId);

        if (!$respuesta) {
            throw new \Exception('Respuesta no encontrada.', 404);
        }

        // El autor puede eliminar la suya; moderadores pueden eliminar cualquiera
        $puedeEliminar = in_array($rol, ['REVISOR', 'ADMIN'])
            || $respuesta->usuario_id === $usuarioId;

        if (!$puedeEliminar) {
            throw new \Exception('No tienes permiso para eliminar esta respuesta.', 403);
        }

        // No se puede eliminar la solución aceptada
        if ($respuesta->es_solucion_aceptada) {
            throw new \Exception('No puedes eliminar la respuesta marcada como solución.', 422);
        }

        $this->foroDAO->eliminarRespuesta($respuestaId);
    }

    // ── Marcar solución ──────────────────────────────────────────────────────

    public function marcarSolucion(int $hiloId, int $respuestaId, int $usuarioId): array
    {
        $hilo = $this->foroDAO->findHiloById($hiloId);

        if (!$hilo) {
            throw new \Exception('Hilo no encontrado.', 404);
        }

        // Solo el autor del hilo puede marcar la solución
        if ($hilo->estudiante_id !== $usuarioId) {
            throw new \Exception('Solo el autor del hilo puede marcar la solución.', 403);
        }

        $respuesta = $this->foroDAO->findRespuestaById($respuestaId);

        if (!$respuesta || $respuesta->hilo_id !== $hiloId) {
            throw new \Exception('Respuesta no válida para este hilo.', 422);
        }

        $this->foroDAO->marcarSolucion($hiloId, $respuestaId);

        return $this->obtener($hiloId);
    }

    // ── Cambiar estado del hilo (moderación) ─────────────────────────────────

    public function cambiarEstado(int $hiloId, string $nuevoEstado, int $usuarioId, string $rol): array
    {
        $hilo = $this->foroDAO->findHiloById($hiloId);

        if (!$hilo) {
            throw new \Exception('Hilo no encontrado.', 404);
        }

        $estadosPermitidosModerador = ['CERRADO', 'ELIMINADO'];
        $estadosPermitidosEstudiante = ['ABIERTO']; // puede reabrir el suyo

        if (in_array($rol, ['REVISOR', 'ADMIN'])) {
            if (!in_array($nuevoEstado, $estadosPermitidosModerador)) {
                throw new \Exception('Estado no válido para moderadores.', 422);
            }
        } elseif ($rol === 'ESTUDIANTE') {
            if ($hilo->estudiante_id !== $usuarioId) {
                throw new \Exception('No tienes permiso sobre este hilo.', 403);
            }
            if (!in_array($nuevoEstado, $estadosPermitidosEstudiante)) {
                throw new \Exception('No puedes cambiar a ese estado.', 422);
            }
        } else {
            throw new \Exception('No tienes permiso para esta acción.', 403);
        }

        $this->foroDAO->cambiarEstadoHilo($hiloId, $nuevoEstado);

        return $this->obtener($hiloId);
    }

    // ── Badge: respuestas nuevas ─────────────────────────────────────────────

    public function badgeRespuestasNuevas(int $estudianteId): array
    {
        return [
            'total' => $this->foroDAO->contarHilosConRespuestasNuevas($estudianteId),
        ];
    }

    // ── Formatters ───────────────────────────────────────────────────────────

    private function formatearHilo(object $h): array
    {
        return [
            'id'                   => $h->id,
            'titulo'               => $h->titulo,
            'contenido'            => $h->contenido ?? null,
            'estado'               => $h->estado,
            'respuesta_aceptada_id'=> $h->respuesta_aceptada_id ?? null,
            'total_respuestas'     => (int) ($h->total_respuestas ?? 0),
            'fecha_creacion'       => $h->fecha_creacion,
            'fecha_actualizacion'  => $h->fecha_actualizacion,
            'ultima_respuesta_at'  => $h->ultima_respuesta_at ?? null,
            'autor' => [
                'id'     => $h->autor_id ?? $h->estudiante_id,
                'nombre' => $h->autor_nombre,
                'foto'   => $h->autor_foto ?? null,
            ],
            'modulo' => [
                'id'     => $h->modulo_id,
                'nombre' => $h->modulo_nombre,
            ],
            'subtema' => $h->subtema_id ? [
                'id'     => $h->subtema_id,
                'nombre' => $h->subtema_nombre,
            ] : null,
        ];
    }

    private function formatearRespuesta(object $r): array
    {
        return [
            'id'                   => $r->id,
            'hilo_id'              => $r->hilo_id,
            'contenido'            => $r->contenido,
            'es_solucion_aceptada' => (bool) $r->es_solucion_aceptada,
            'fecha_creacion'       => $r->fecha_creacion,
            'autor' => [
                'id'     => $r->autor_id,
                'nombre' => $r->autor_nombre,
                'foto'   => $r->autor_foto ?? null,
                'rol'    => $r->autor_rol  ?? null,
            ],
        ];
    }
}