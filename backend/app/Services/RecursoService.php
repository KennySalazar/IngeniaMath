<?php

namespace App\Services;

use App\DAO\RecursoDAO;
use Illuminate\Support\Facades\DB;

class RecursoService
{
    public function __construct(private RecursoDAO $recursoDAO) {}

    // ─── LISTAR ─────────────────────────────────────────────────────────────────

    public function listar(array $filtros): array
    {
        $perPage   = isset($filtros['per_page']) ? (int) $filtros['per_page'] : 15;
        $paginator = $this->recursoDAO->listar($filtros, $perPage);

        return [
            'data'  => array_map(fn($r) => $this->formatear($r), $paginator->items()),
            'meta'  => [
                'total'        => $paginator->total(),
                'per_page'     => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
            ],
            'links' => [
                'prev' => $paginator->previousPageUrl(),
                'next' => $paginator->nextPageUrl(),
            ],
        ];
    }

    // ─── OBTENER UNO ─────────────────────────────────────────────────────────────

    public function obtener(int $id): array
    {
        $recurso = $this->recursoDAO->findById($id);

        if (!$recurso) {
            throw new \Exception('Recurso no encontrado.', 404);
        }

        $resultado = $this->formatear($recurso);

        // Adjuntar datos de flashcard si aplica
        if ($recurso->tipo_recurso === 'FLASHCARD') {
            $flashcard = $this->recursoDAO->findFlashcardPorRecurso(
                $recurso->modulo_id,
                $recurso->subtema_id,
                $recurso->tutor_id
            );
            $resultado['flashcard'] = $flashcard ? $this->formatearFlashcard($flashcard) : null;
        }

        return $resultado;
    }

    // ─── CREAR ───────────────────────────────────────────────────────────────────

    public function crear(array $data, int $tutorId): array
    {
        $esFlashcard = $data['tipo_recurso'] === 'FLASHCARD';

        // Validación de negocio: flashcard requiere sus campos
        if ($esFlashcard && empty($data['flashcard'])) {
            throw new \Exception('Los datos de la flashcard son obligatorios para este tipo de recurso.', 422);
        }

        $recurso = DB::transaction(function () use ($data, $tutorId, $esFlashcard) {
            $recurso = $this->recursoDAO->create([
                'modulo_id'    => $data['modulo_id'],
                'subtema_id'   => $data['subtema_id'] ?? null,
                'tutor_id'     => $tutorId,
                'tipo_recurso' => $data['tipo_recurso'],
                'titulo'       => $data['titulo'],
                'descripcion'  => $data['descripcion'] ?? null,
                'url_recurso'  => $data['url_recurso'] ?? null,
                'estado'       => 'BORRADOR',
                'fecha_creacion' => now(),
            ]);

            if ($esFlashcard) {
                $this->recursoDAO->crearFlashcard([
                    'modulo_id'   => $data['modulo_id'],
                    'subtema_id'  => $data['subtema_id'] ?? null,
                    'titulo'      => $data['flashcard']['titulo'],
                    'frente'      => $data['flashcard']['frente'],
                    'reverso'     => $data['flashcard']['reverso'],
                    'creado_por'  => $tutorId,
                    'fecha_creacion' => now(),
                ]);
            }

            return $recurso;
        });

        $recursoCreado = $this->recursoDAO->findById($recurso->id);

        if (!$recursoCreado) {
            throw new \Exception('No se pudo recuperar el recurso recién creado.', 500);
        }

        $resultado = $this->formatear($recursoCreado);

        if ($esFlashcard) {
            $flashcard = $this->recursoDAO->findFlashcardPorRecurso(
                $recursoCreado->modulo_id,
                $recursoCreado->subtema_id,
                $tutorId
            );
            $resultado['flashcard'] = $flashcard ? $this->formatearFlashcard($flashcard) : null;
        }

        return $resultado;
    }

    // ─── EDITAR ──────────────────────────────────────────────────────────────────

    public function editar(int $id, array $data, int $usuarioId, string $rol): array
    {
        $recurso = $this->recursoDAO->findById($id);

        if (!$recurso) {
            throw new \Exception('Recurso no encontrado.', 404);
        }

        // Seguridad: TUTOR solo edita sus propios recursos en BORRADOR
        if ($rol === 'TUTOR') {
            if ($recurso->tutor_id !== $usuarioId) {
                throw new \Exception('No tienes permiso para editar este recurso.', 403);
            }

            if ($recurso->estado !== 'BORRADOR') {
                throw new \Exception('Solo puedes editar recursos en estado BORRADOR.', 422);
            }
        }

        $camposActualizar = array_filter([
            'modulo_id'   => $data['modulo_id']   ?? null,
            'subtema_id'  => $data['subtema_id']  ?? null,
            'titulo'      => $data['titulo']      ?? null,
            'descripcion' => $data['descripcion'] ?? null,
            'url_recurso' => $data['url_recurso'] ?? null,
            // tipo_recurso no se permite cambiar post-creación
        ], fn($v) => $v !== null);

        $this->recursoDAO->update($id, $camposActualizar);

        $recursoActualizado = $this->recursoDAO->findById($id);

        if (!$recursoActualizado) {
            throw new \Exception('No se pudo recuperar el recurso actualizado.', 500);
        }

        return $this->formatear($recursoActualizado);
    }

    // ─── ELIMINAR ────────────────────────────────────────────────────────────────

    public function eliminar(int $id, int $usuarioId, string $rol): void
    {
        $recurso = $this->recursoDAO->findById($id);

        if (!$recurso) {
            throw new \Exception('Recurso no encontrado.', 404);
        }

        if ($rol === 'TUTOR') {
            if ($recurso->tutor_id !== $usuarioId) {
                throw new \Exception('No tienes permiso para eliminar este recurso.', 403);
            }

            if (!in_array($recurso->estado, ['BORRADOR', 'DESHABILITADO'])) {
                throw new \Exception('Solo puedes eliminar recursos en estado BORRADOR o DESHABILITADO.', 422);
            }
        }

        $this->recursoDAO->delete($id);
    }

    // ─── FLUJO DE ESTADOS ────────────────────────────────────────────────────────

    public function enviarARevision(int $id, int $tutorId): array
    {
        $recurso = $this->recursoDAO->findById($id);

        if (!$recurso) {
            throw new \Exception('Recurso no encontrado.', 404);
        }

        if ($recurso->tutor_id !== $tutorId) {
            throw new \Exception('No tienes permiso para enviar este recurso a revisión.', 403);
        }

        if ($recurso->estado !== 'BORRADOR') {
            throw new \Exception('Solo puedes enviar a revisión recursos en estado BORRADOR.', 422);
        }

        $this->recursoDAO->update($id, ['estado' => 'EN_REVISION']);

        $recursoActualizado = $this->recursoDAO->findById($id);

        if (!$recursoActualizado) {
            throw new \Exception('No se pudo recuperar el recurso enviado a revisión.', 500);
        }

        return $this->formatear($recursoActualizado);
    }

    public function aprobar(int $id, int $revisorId, string $rol): array
    {
        $recurso = $this->recursoDAO->findById($id);

        if (!$recurso) {
            throw new \Exception('Recurso no encontrado.', 404);
        }

        if (!in_array($rol, ['REVISOR', 'ADMIN'])) {
            throw new \Exception('No tienes permiso para aprobar recursos.', 403);
        }

        if ($recurso->estado !== 'EN_REVISION') {
            throw new \Exception('Solo puedes aprobar recursos en estado EN_REVISION.', 422);
        }

        // ADMIN aprueba y publica en un solo paso; REVISOR solo aprueba
        $nuevoEstado = $rol === 'ADMIN' ? 'PUBLICADO' : 'APROBADO';

        $updateData = [
            'estado'     => $nuevoEstado,
            'revisor_id' => $revisorId,
        ];

        if ($nuevoEstado === 'PUBLICADO') {
            $updateData['fecha_publicacion'] = now();
        }

        $this->recursoDAO->update($id, $updateData);

        $recursoActualizado = $this->recursoDAO->findById($id);

        if (!$recursoActualizado) {
            throw new \Exception('No se pudo recuperar el recurso aprobado.', 500);
        }

        return $this->formatear($recursoActualizado);
    }

    public function publicar(int $id, int $usuarioId, string $rol): array
    {
        $recurso = $this->recursoDAO->findById($id);

        if (!$recurso) {
            throw new \Exception('Recurso no encontrado.', 404);
        }

        if (!in_array($rol, ['REVISOR', 'ADMIN'])) {
            throw new \Exception('No tienes permiso para publicar recursos.', 403);
        }

        if ($recurso->estado !== 'APROBADO') {
            throw new \Exception('Solo puedes publicar recursos en estado APROBADO.', 422);
        }

        $this->recursoDAO->update($id, [
            'estado'            => 'PUBLICADO',
            'fecha_publicacion' => now(),
        ]);

        $recursoActualizado = $this->recursoDAO->findById($id);

        if (!$recursoActualizado) {
            throw new \Exception('No se pudo recuperar el recurso publicado.', 500);
        }

        return $this->formatear($recursoActualizado);
    }

    // ─── RELACIÓN CON EJERCICIOS ──────────────────────────────────────────────────

    public function sincronizarEjercicio(int $recursoId, int $ejercicioId, string $accion, int $usuarioId, string $rol): void
    {
        $recurso = $this->recursoDAO->findById($recursoId);

        if (!$recurso) {
            throw new \Exception('Recurso no encontrado.', 404);
        }

        // Solo el tutor propietario o roles superiores pueden gestionar la relación
        if ($rol === 'TUTOR' && $recurso->tutor_id !== $usuarioId) {
            throw new \Exception('No tienes permiso para gestionar este recurso.', 403);
        }

        if ($accion === 'adjuntar') {
            $this->recursoDAO->adjuntarEjercicio($recursoId, $ejercicioId);
        } else {
            $this->recursoDAO->desadjuntarEjercicio($recursoId, $ejercicioId);
        }
    }

    // ─── FORMATTERS (privados) ───────────────────────────────────────────────────

    private function formatear($recurso): array
    {
        return [
            'id'                => $recurso->id,
            'tipo_recurso'      => $recurso->tipo_recurso,
            'titulo'            => $recurso->titulo,
            'descripcion'       => $recurso->descripcion,
            'url_recurso'       => $recurso->url_recurso,
            'estado'            => $recurso->estado,
            'fecha_creacion'    => $recurso->fecha_creacion
                                    ? \Carbon\Carbon::parse($recurso->fecha_creacion)->toIso8601String()
                                    : null,
            'fecha_publicacion' => $recurso->fecha_publicacion
                                    ? \Carbon\Carbon::parse($recurso->fecha_publicacion)->toIso8601String()
                                    : null,
            'modulo'   => $recurso->relationLoaded('modulo') && $recurso->modulo ? [
                'id'     => $recurso->modulo->id,
                'nombre' => $recurso->modulo->nombre,
            ] : null,
            'subtema'  => $recurso->relationLoaded('subtema') && $recurso->subtema ? [
                'id'     => $recurso->subtema->id,
                'nombre' => $recurso->subtema->nombre,
            ] : null,
            'tutor'    => $recurso->relationLoaded('tutor') && $recurso->tutor ? [
                'id'     => $recurso->tutor->id,
                'nombre' => trim("{$recurso->tutor->nombres} {$recurso->tutor->apellidos}"),
            ] : null,
            'revisor'  => $recurso->relationLoaded('revisor') && $recurso->revisor ? [
                'id'     => $recurso->revisor->id,
                'nombre' => trim("{$recurso->revisor->nombres} {$recurso->revisor->apellidos}"),
            ] : null,
        ];
    }

    private function formatearFlashcard($flashcard): array
    {
        return [
            'id'             => $flashcard->id,
            'titulo'         => $flashcard->titulo,
            'frente'         => $flashcard->frente,
            'reverso'        => $flashcard->reverso,
            'fecha_creacion' => $flashcard->fecha_creacion
                                    ? \Carbon\Carbon::parse($flashcard->fecha_creacion)->toIso8601String()
                                    : null,
        ];
    }

    public function rechazar(int $id, int $revisorId, string $notas, string $rol): array
{
    $recurso = $this->recursoDAO->findById($id);

    if (!$recurso) {
        throw new \Exception('Recurso no encontrado.', 404);
    }

    if (!in_array($rol, ['REVISOR', 'ADMIN'])) {
        throw new \Exception('No tienes permiso para rechazar recursos.', 403);
    }

    if ($recurso->estado !== 'EN_REVISION') {
        throw new \Exception('Solo puedes rechazar recursos en estado EN_REVISION.', 422);
    }

    $this->recursoDAO->update($id, [
        'estado'     => 'BORRADOR',   // Regresa al tutor para correcciones
        'revisor_id' => $revisorId,
    ]);

    $recursoActualizado = $this->recursoDAO->findById($id);

    if (!$recursoActualizado) {
        throw new \Exception('No se pudo recuperar el recurso rechazado.', 500);
    }

    return $this->formatear($recursoActualizado);
}
}