<?php

namespace App\Services;

use App\DAO\EjercicioDAO;
use App\Models\RevisionEjercicio;
use App\Models\Ejercicio;
use Illuminate\Validation\ValidationException;

class EjercicioService
{
    public function __construct(private EjercicioDAO $ejercicioDAO) {}

    // Crea un ejercicio en estado BORRADOR y verifica duplicados
    public function crear(array $data, int $tutorId): array
    {
        // Verificar posibles duplicados antes de guardar
        $similares = $this->ejercicioDAO->buscarSimilares(
            $data['enunciado'],
            $data['modulo_id']
        );

        $hayDuplicado = count($similares) > 0;

        $ejercicio = $this->ejercicioDAO->create([
            'modulo_id'                => $data['modulo_id'],
            'subtema_id'               => $data['subtema_id'],
            'tutor_id'                 => $tutorId,
            'nivel_dificultad'         => $data['nivel_dificultad'],
            'tipo_ejercicio'           => $data['tipo_ejercicio'],
            'enunciado'                => $data['enunciado'],
            'imagen_apoyo_url'         => $data['imagen_apoyo_url']         ?? null,
            'respuesta_correcta_texto' => $data['respuesta_correcta_texto'] ?? null,
            'solucion_paso_a_paso'     => $data['solucion_paso_a_paso'],
            'explicacion_conceptual'   => $data['explicacion_conceptual']   ?? null,
            'tiempo_estimado_minutos'  => $data['tiempo_estimado_minutos'],
            'estado'                   => 'BORRADOR',
            'advertencia_duplicado'    => $hayDuplicado,
            'fecha_creacion'           => now(),
        ]);

        // Si el ejercicio es de opción múltiple, guarda las opciones
        if ($data['tipo_ejercicio'] === 'OPCION_MULTIPLE' && !empty($data['opciones'])) {
            $this->ejercicioDAO->crearOpciones($ejercicio->id, $data['opciones']);
        }

        $resultado = $this->formatear($this->ejercicioDAO->findById($ejercicio->id));

        // Informa al tutor si hay posibles duplicados
        if ($hayDuplicado) {
            $resultado['advertencia'] = 'Se encontraron ejercicios similares en el mismo módulo.';
            $resultado['similares']   = array_map(fn($s) => [
                'id'        => $s['id'],
                'enunciado' => substr($s['enunciado'], 0, 120) . '...',
                'estado'    => $s['estado'],
            ], $similares);
        }

        return $resultado;
    }

    // Edita un ejercicio — solo si está en BORRADOR y pertenece al tutor
    public function editar(int $id, array $data, int $tutorId, string $rol): array
    {
        $ejercicio = $this->ejercicioDAO->findById($id);

        if (!$ejercicio) {
            throw new \Exception('Ejercicio no encontrado.', 404);
        }

        // El tutor solo puede editar sus propios ejercicios en BORRADOR
        if ($rol === 'TUTOR') {
            if ($ejercicio->tutor_id !== $tutorId) {
                throw new \Exception('No tienes permiso para editar este ejercicio.', 403);
            }
            if ($ejercicio->estado !== 'BORRADOR') {
                throw new \Exception('Solo puedes editar ejercicios en estado BORRADOR.', 422);
            }
        }

        $camposActualizar = array_filter([
            'modulo_id'                => $data['modulo_id']                ?? null,
            'subtema_id'               => $data['subtema_id']               ?? null,
            'nivel_dificultad'         => $data['nivel_dificultad']         ?? null,
            'tipo_ejercicio'           => $data['tipo_ejercicio']           ?? null,
            'enunciado'                => $data['enunciado']                ?? null,
            'imagen_apoyo_url'         => $data['imagen_apoyo_url']         ?? null,
            'respuesta_correcta_texto' => $data['respuesta_correcta_texto'] ?? null,
            'solucion_paso_a_paso'     => $data['solucion_paso_a_paso']     ?? null,
            'explicacion_conceptual'   => $data['explicacion_conceptual']   ?? null,
            'tiempo_estimado_minutos'  => $data['tiempo_estimado_minutos']  ?? null,
        ], fn($v) => $v !== null);

        $this->ejercicioDAO->update($id, $camposActualizar);

        // Actualiza opciones si se enviaron
        if (!empty($data['opciones'])) {
            $this->ejercicioDAO->crearOpciones($id, $data['opciones']);
        }

        return $this->formatear($this->ejercicioDAO->findById($id));
    }

    // Envía el ejercicio a revisión — solo el tutor dueño puede hacerlo
    public function enviarARevision(int $id, int $tutorId): array
    {
        $ejercicio = $this->ejercicioDAO->findById($id);

        if (!$ejercicio) {
            throw new \Exception('Ejercicio no encontrado.', 404);
        }

        if ($ejercicio->tutor_id !== $tutorId) {
            throw new \Exception('No tienes permiso para enviar este ejercicio.', 403);
        }

        if ($ejercicio->estado !== 'BORRADOR') {
            throw new \Exception('Solo puedes enviar a revisión ejercicios en estado BORRADOR.', 422);
        }

        $this->ejercicioDAO->update($id, ['estado' => 'EN_REVISION']);

        // Registra el evento en el historial de revisiones
        RevisionEjercicio::create([
            'ejercicio_id' => $id,
            'revisor_id'   => $tutorId,
            'accion'       => 'ENVIADO_REVISION',
            'notas'        => null,
            'fecha_evento' => now(),
        ]);

        return $this->formatear($this->ejercicioDAO->findById($id));
    }

    // Aprobar ejercicio — solo REVISOR
    public function aprobar(int $id, int $revisorId, ?string $notas): array
    {
        $ejercicio = $this->ejercicioDAO->findById($id);

        if (!$ejercicio) {
            throw new \Exception('Ejercicio no encontrado.', 404);
        }

        if ($ejercicio->estado !== 'EN_REVISION') {
            throw new \Exception('Solo puedes aprobar ejercicios en estado EN_REVISION.', 422);
        }

        $this->ejercicioDAO->update($id, [
            'estado'         => 'APROBADO',
            'revisor_id'     => $revisorId,
            'fecha_revision' => now(),
        ]);

        RevisionEjercicio::create([
            'ejercicio_id' => $id,
            'revisor_id'   => $revisorId,
            'accion'       => 'APROBADO',
            'notas'        => $notas,
            'fecha_evento' => now(),
        ]);

        return $this->formatear($this->ejercicioDAO->findById($id));
    }

    // Rechazar ejercicio — solo REVISOR, vuelve a BORRADOR
    public function rechazar(int $id, int $revisorId, string $notas): array
    {
        $ejercicio = $this->ejercicioDAO->findById($id);

        if (!$ejercicio) {
            throw new \Exception('Ejercicio no encontrado.', 404);
        }

        if ($ejercicio->estado !== 'EN_REVISION') {
            throw new \Exception('Solo puedes rechazar ejercicios en estado EN_REVISION.', 422);
        }

        $this->ejercicioDAO->update($id, [
            'estado'         => 'BORRADOR',
            'revisor_id'     => $revisorId,
            'fecha_revision' => now(),
        ]);

        RevisionEjercicio::create([
            'ejercicio_id' => $id,
            'revisor_id'   => $revisorId,
            'accion'       => 'RECHAZADO',
            'notas'        => $notas,
            'fecha_evento' => now(),
        ]);

        return $this->formatear($this->ejercicioDAO->findById($id));
    }

    // Publicar ejercicio — solo ADMIN
    public function publicar(int $id): array
    {
        $ejercicio = $this->ejercicioDAO->findById($id);

        if (!$ejercicio) {
            throw new \Exception('Ejercicio no encontrado.', 404);
        }

        if ($ejercicio->estado !== 'APROBADO') {
            throw new \Exception('Solo puedes publicar ejercicios en estado APROBADO.', 422);
        }

        $this->ejercicioDAO->update($id, [
            'estado'              => 'PUBLICADO',
            'fecha_publicacion'   => now(),
        ]);

        RevisionEjercicio::create([
            'ejercicio_id' => $id,
            'revisor_id'   => null,
            'accion'       => 'PUBLICADO',
            'notas'        => null,
            'fecha_evento' => now(),
        ]);

        return $this->formatear($this->ejercicioDAO->findById($id));
    }

    // Deshabilitar ejercicio — solo ADMIN
    public function deshabilitar(int $id): array
    {
        $ejercicio = $this->ejercicioDAO->findById($id);

        if (!$ejercicio) {
            throw new \Exception('Ejercicio no encontrado.', 404);
        }

        $this->ejercicioDAO->update($id, ['estado' => 'DESHABILITADO']);

        RevisionEjercicio::create([
            'ejercicio_id' => $id,
            'revisor_id'   => null,
            'accion'       => 'DESHABILITADO',
            'notas'        => null,
            'fecha_evento' => now(),
        ]);

        return $this->formatear($this->ejercicioDAO->findById($id));
    }

    // Lista ejercicios según el rol del usuario
    public function listar(array $filtros, int $usuarioId, string $rol): array
    {
        // El tutor solo ve sus propios ejercicios
        if ($rol === 'TUTOR') {
            $filtros['tutor_id'] = $usuarioId;
        }

        // El revisor solo ve los que están EN_REVISION
        if ($rol === 'REVISOR' && empty($filtros['estado'])) {
            $filtros['estado'] = 'EN_REVISION';
        }

        $paginado = $this->ejercicioDAO->listar($filtros);

        return [
            'data'          => collect($paginado->items())->map(fn($e) => $this->formatear($e)),
            'total'         => $paginado->total(),
            'por_pagina'    => $paginado->perPage(),
            'pagina'        => $paginado->currentPage(),
            'ultima_pagina' => $paginado->lastPage(),
        ];
    }

    // Ver detalle de un ejercicio
    public function verDetalle(int $id, string $rol): array
    {
        $ejercicio = $this->ejercicioDAO->findById($id);

        if (!$ejercicio) {
            throw new \Exception('Ejercicio no encontrado.', 404);
        }

        // El estudiante solo puede ver ejercicios publicados
        if ($rol === 'ESTUDIANTE' && $ejercicio->estado !== 'PUBLICADO') {
            throw new \Exception('Este ejercicio no está disponible.', 403);
        }

        return $this->formatear($ejercicio, true);
    }

    // Formato de respuesta estándar del ejercicio
    private function formatear(Ejercicio $e, bool $completo = false): array
    {
        $data = [
            'id'                       => $e->id,
            'modulo'                   => $e->modulo ? ['id' => $e->modulo->id, 'nombre' => $e->modulo->nombre] : null,
            'subtema'                  => $e->subtema ? ['id' => $e->subtema->id, 'nombre' => $e->subtema->nombre] : null,
            'nivel_dificultad'         => $e->nivel_dificultad,
            'tipo_ejercicio'           => $e->tipo_ejercicio,
            'enunciado'                => $e->enunciado,
            'imagen_apoyo_url'         => $e->imagen_apoyo_url,
            'tiempo_estimado_minutos'  => $e->tiempo_estimado_minutos,
            'estado'                   => $e->estado,
            'advertencia_duplicado'    => $e->advertencia_duplicado,
            'fecha_creacion'           => $e->fecha_creacion,
            'tutor'                    => $e->tutor ? [
                'id'       => $e->tutor->id,
                'nombres'  => $e->tutor->nombres,
                'apellidos' => $e->tutor->apellidos,
            ] : null,
        ];

        // Datos completos solo cuando se ve el detalle
        if ($completo) {
            $data['respuesta_correcta_texto'] = $e->respuesta_correcta_texto;
            $data['solucion_paso_a_paso']     = $e->solucion_paso_a_paso;
            $data['explicacion_conceptual']   = $e->explicacion_conceptual;
            $data['opciones']                 = $e->opciones->map(fn($o) => [
                'id'          => $o->id,
                'orden'       => $o->orden_opcion,
                'texto'       => $o->texto_opcion,
                'es_correcta' => $o->es_correcta,
            ]);
            $data['revisiones'] = $e->revisiones->map(fn($r) => [
                'accion'       => $r->accion,
                'notas'        => $r->notas,
                'fecha'        => $r->fecha_evento,
                'revisor'      => $r->revisor ? $r->revisor->nombres . ' ' . $r->revisor->apellidos : 'Sistema',
            ]);
        }

        return $data;
    }
}
