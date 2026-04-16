<?php

namespace App\Services;

use App\DAO\EjercicioDAO;
use App\Models\RevisionEjercicio;
use App\Models\Ejercicio;
use Illuminate\Support\Facades\DB;

class EjercicioService
{
    public function __construct(private EjercicioDAO $ejercicioDAO) {}

    public function crear(array $data, int $tutorId): array
    {
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
            'imagen_apoyo_url'         => $data['imagen_apoyo_url'] ?? null,
            'respuesta_correcta_texto' => $data['respuesta_correcta_texto'] ?? null,
            'solucion_paso_a_paso'     => $data['solucion_paso_a_paso'],
            'explicacion_conceptual'   => $data['explicacion_conceptual'] ?? null,
            'tiempo_estimado_minutos'  => $data['tiempo_estimado_minutos'],
            'estado'                   => 'BORRADOR',
            'advertencia_duplicado'    => $hayDuplicado,
            'fecha_creacion'           => now(),
        ]);

        if ($data['tipo_ejercicio'] === 'OPCION_MULTIPLE' && !empty($data['opciones'])) {
            $this->ejercicioDAO->crearOpciones($ejercicio->id, $data['opciones']);
        }

        $ejercicioCreado = $this->ejercicioDAO->findById($ejercicio->id);

        if (!$ejercicioCreado) {
            throw new \Exception('No se pudo recuperar el ejercicio recién creado.', 500);
        }

        $resultado = $this->formatear($ejercicioCreado);

        if ($hayDuplicado) {
            $resultado['advertencia'] = 'Se encontraron ejercicios similares en el mismo módulo.';
            $resultado['similares'] = array_map(fn($s) => [
                'id'        => $s['id'],
                'enunciado' => substr($s['enunciado'], 0, 120) . '...',
                'estado'    => $s['estado'],
            ], $similares);
        }

        return $resultado;
    }

    public function editar(int $id, array $data, int $tutorId, string $rol): array
    {
        $ejercicio = $this->ejercicioDAO->findById($id);

        if (!$ejercicio) {
            throw new \Exception('Ejercicio no encontrado.', 404);
        }

        if ($rol === 'TUTOR') {
            if ($ejercicio->tutor_id !== $tutorId) {
                throw new \Exception('No tienes permiso para editar este ejercicio.', 403);
            }

            if ($ejercicio->estado !== 'BORRADOR') {
                throw new \Exception('Solo puedes editar ejercicios en estado BORRADOR.', 422);
            }
        }

        $camposActualizar = array_filter([
            'modulo_id'                => $data['modulo_id'] ?? null,
            'subtema_id'               => $data['subtema_id'] ?? null,
            'nivel_dificultad'         => $data['nivel_dificultad'] ?? null,
            'tipo_ejercicio'           => $data['tipo_ejercicio'] ?? null,
            'enunciado'                => $data['enunciado'] ?? null,
            'imagen_apoyo_url'         => $data['imagen_apoyo_url'] ?? null,
            'respuesta_correcta_texto' => $data['respuesta_correcta_texto'] ?? null,
            'solucion_paso_a_paso'     => $data['solucion_paso_a_paso'] ?? null,
            'explicacion_conceptual'   => $data['explicacion_conceptual'] ?? null,
            'tiempo_estimado_minutos'  => $data['tiempo_estimado_minutos'] ?? null,
        ], fn($v) => $v !== null);

        $this->ejercicioDAO->update($id, $camposActualizar);

        if (!empty($data['opciones'])) {
            $this->ejercicioDAO->crearOpciones($id, $data['opciones']);
        }

        $ejercicioActualizado = $this->ejercicioDAO->findById($id);

        if (!$ejercicioActualizado) {
            throw new \Exception('No se pudo recuperar el ejercicio actualizado.', 500);
        }

        return $this->formatear($ejercicioActualizado);
    }

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

        DB::transaction(function () use ($id, $tutorId) {
            $this->ejercicioDAO->update($id, ['estado' => 'EN_REVISION']);

            RevisionEjercicio::create([
                'ejercicio_id' => $id,
                'revisor_id'   => $tutorId,
                'accion'       => 'ENVIADO_REVISION',
                'notas'        => null,
                'fecha_evento' => now(),
            ]);
        });

        $ejercicioActualizado = $this->ejercicioDAO->findById($id);

        if (!$ejercicioActualizado) {
            throw new \Exception('No se pudo recuperar el ejercicio enviado a revisión.', 500);
        }

        return $this->formatear($ejercicioActualizado);
    }

    public function aprobar(int $id, int $revisorId, ?string $notas, string $rol = 'REVISOR'): array
    {
        $ejercicio = $this->ejercicioDAO->findById($id);

        if (!$ejercicio) {
            throw new \Exception('Ejercicio no encontrado.', 404);
        }

        if ($ejercicio->estado !== 'EN_REVISION') {
            throw new \Exception('Solo puedes aprobar ejercicios en estado EN_REVISION.', 422);
        }

        $nuevoEstado = $rol === 'ADMIN' ? 'PUBLICADO' : 'APROBADO';

        DB::transaction(function () use ($id, $revisorId, $notas, $nuevoEstado) {
            $updateData = [
                'estado'         => $nuevoEstado,
                'revisor_id'     => $revisorId,
                'fecha_revision' => now(),
            ];

            if ($nuevoEstado === 'PUBLICADO') {
                $updateData['fecha_publicacion'] = now();
            }

            $this->ejercicioDAO->update($id, $updateData);

            RevisionEjercicio::create([
                'ejercicio_id' => $id,
                'revisor_id'   => $revisorId,
                'accion'       => 'APROBADO',
                'notas'        => $notas,
                'fecha_evento' => now(),
            ]);

            if ($nuevoEstado === 'PUBLICADO') {
                RevisionEjercicio::create([
                    'ejercicio_id' => $id,
                    'revisor_id'   => $revisorId,
                    'accion'       => 'PUBLICADO',
                    'notas'        => null,
                    'fecha_evento' => now(),
                ]);
            }
        });

        $ejercicioActualizado = $this->ejercicioDAO->findById($id);

        if (!$ejercicioActualizado) {
            throw new \Exception('No se pudo recuperar el ejercicio aprobado.', 500);
        }

        return $this->formatear($ejercicioActualizado);
    }

    public function rechazar(int $id, int $revisorId, string $notas): array
    {
        $ejercicio = $this->ejercicioDAO->findById($id);

        if (!$ejercicio) {
            throw new \Exception('Ejercicio no encontrado.', 404);
        }

        if ($ejercicio->estado !== 'EN_REVISION') {
            throw new \Exception('Solo puedes rechazar ejercicios en estado EN_REVISION.', 422);
        }

        DB::transaction(function () use ($id, $revisorId, $notas) {
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
        });

        $ejercicioActualizado = $this->ejercicioDAO->findById($id);

        if (!$ejercicioActualizado) {
            throw new \Exception('No se pudo recuperar el ejercicio rechazado.', 500);
        }

        return $this->formatear($ejercicioActualizado);
    }

    public function publicar(int $id, int $actorId): array
    {
        $ejercicio = $this->ejercicioDAO->findById($id);

        if (!$ejercicio) {
            throw new \Exception('Ejercicio no encontrado.', 404);
        }

        if (!in_array($ejercicio->estado, ['APROBADO', 'DESHABILITADO'])) {
            throw new \Exception('Solo puedes publicar ejercicios en estado APROBADO o DESHABILITADO.', 422);
        }

        DB::transaction(function () use ($id, $actorId) {
            $this->ejercicioDAO->update($id, [
                'estado'            => 'PUBLICADO',
                'fecha_publicacion' => now(),
            ]);

            RevisionEjercicio::create([
                'ejercicio_id' => $id,
                'revisor_id'   => $actorId,
                'accion'       => 'PUBLICADO',
                'notas'        => null,
                'fecha_evento' => now(),
            ]);
        });

        $ejercicioActualizado = $this->ejercicioDAO->findById($id);

        if (!$ejercicioActualizado) {
            throw new \Exception('No se pudo recuperar el ejercicio publicado.', 500);
        }

        return $this->formatear($ejercicioActualizado);
    }

    public function deshabilitar(int $id, int $actorId): array
    {
        $ejercicio = $this->ejercicioDAO->findById($id);

        if (!$ejercicio) {
            throw new \Exception('Ejercicio no encontrado.', 404);
        }

        DB::transaction(function () use ($id, $actorId) {
            $this->ejercicioDAO->update($id, [
                'estado' => 'DESHABILITADO',
            ]);

            RevisionEjercicio::create([
                'ejercicio_id' => $id,
                'revisor_id'   => $actorId,
                'accion'       => 'DESHABILITADO',
                'notas'        => null,
                'fecha_evento' => now(),
            ]);
        });

        $ejercicioActualizado = $this->ejercicioDAO->findById($id);

        if (!$ejercicioActualizado) {
            throw new \Exception('No se pudo recuperar el ejercicio deshabilitado.', 500);
        }

        return $this->formatear($ejercicioActualizado);
    }

    public function listar(array $filtros, int $usuarioId, string $rol): array
    {
        if ($rol === 'TUTOR') {
            $filtros['tutor_id'] = $usuarioId;
        }

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

    public function verDetalle(int $id, string $rol): array
    {
        $ejercicio = $this->ejercicioDAO->findById($id);

        if (!$ejercicio) {
            throw new \Exception('Ejercicio no encontrado.', 404);
        }

        if ($rol === 'ESTUDIANTE' && $ejercicio->estado !== 'PUBLICADO') {
            throw new \Exception('Este ejercicio no está disponible.', 403);
        }

        return $this->formatear($ejercicio, true);
    }

    private function formatear(Ejercicio $e, bool $completo = false): array
    {
        $data = [
            'id'                      => $e->id,
            'modulo'                  => $e->modulo ? ['id' => $e->modulo->id, 'nombre' => $e->modulo->nombre] : null,
            'subtema'                 => $e->subtema ? ['id' => $e->subtema->id, 'nombre' => $e->subtema->nombre] : null,
            'nivel_dificultad'        => $e->nivel_dificultad,
            'tipo_ejercicio'          => $e->tipo_ejercicio,
            'enunciado'               => $e->enunciado,
            'imagen_apoyo_url'        => $e->imagen_apoyo_url,
            'tiempo_estimado_minutos' => $e->tiempo_estimado_minutos,
            'estado'                  => $e->estado,
            'advertencia_duplicado'   => $e->advertencia_duplicado,
            'fecha_creacion'          => $e->fecha_creacion,
            'tutor'                   => $e->tutor ? [
                'id'        => $e->tutor->id,
                'nombres'   => $e->tutor->nombres,
                'apellidos' => $e->tutor->apellidos,
            ] : null,
        ];

        if ($completo) {
            $data['respuesta_correcta_texto'] = $e->respuesta_correcta_texto;
            $data['solucion_paso_a_paso'] = $e->solucion_paso_a_paso;
            $data['explicacion_conceptual'] = $e->explicacion_conceptual;
            $data['opciones'] = $e->opciones->map(fn($o) => [
                'id'          => $o->id,
                'orden'       => $o->orden_opcion,
                'texto'       => $o->texto_opcion,
                'es_correcta' => $o->es_correcta,
            ]);
            $data['revisiones'] = $e->revisiones->map(fn($r) => [
                'accion'  => $r->accion,
                'notas'   => $r->notas,
                'fecha'   => $r->fecha_evento,
                'revisor' => $r->revisor ? $r->revisor->nombres . ' ' . $r->revisor->apellidos : 'Sistema',
            ]);
        }

        return $data;
    }
}
