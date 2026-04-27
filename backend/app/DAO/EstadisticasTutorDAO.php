<?php

namespace App\DAO;

use Illuminate\Support\Facades\DB;

class EstadisticasTutorDAO
{
    // ── Estudiantes asignados al tutor ───────────────────────────────────────

    public function estudiantesAsignados(int $tutorId): array
    {
        $rows = DB::select("
            SELECT
                u.id,
                u.nombres,
                u.apellidos,
                u.correo,
                u.foto_perfil_url,
                pe.racha_actual_dias,

                -- Total ejercicios resueltos
                (
                    SELECT COUNT(rp.id)
                    FROM respuestas_practica rp
                    JOIN sesiones_practica sp ON sp.id = rp.sesion_practica_id
                    WHERE sp.estudiante_id = u.id
                ) AS total_ejercicios,

                -- Porcentaje de aciertos global
                (
                    SELECT ROUND(
                        COUNT(CASE WHEN rp.es_correcta THEN 1 END) * 100.0
                        / NULLIF(COUNT(rp.id), 0)
                    , 2)
                    FROM respuestas_practica rp
                    JOIN sesiones_practica sp ON sp.id = rp.sesion_practica_id
                    WHERE sp.estudiante_id = u.id
                ) AS porcentaje_aciertos,

                -- Simulacros finalizados
                (
                    SELECT COUNT(*)
                    FROM simulacros s
                    WHERE s.estudiante_id = u.id
                      AND s.estado = 'FINALIZADO'
                ) AS total_simulacros,

                -- Promedio puntaje simulacros
                (
                    SELECT ROUND(AVG(s.puntaje_total), 2)
                    FROM simulacros s
                    WHERE s.estudiante_id = u.id
                      AND s.estado = 'FINALIZADO'
                ) AS promedio_simulacros,

                -- Última actividad
                (
                    SELECT MAX(sp.fecha_inicio)
                    FROM sesiones_practica sp
                    WHERE sp.estudiante_id = u.id
                ) AS ultima_actividad

            FROM tutor_estudiante te
            JOIN usuarios u ON u.id = te.estudiante_id
            LEFT JOIN perfiles_estudiante pe ON pe.usuario_id = u.id
            WHERE te.tutor_id = ?
              AND te.activo   = TRUE
              AND u.activo    = TRUE
            ORDER BY u.apellidos, u.nombres
        ", [$tutorId]);

        return array_map(fn($r) => [
            'id'                 => $r->id,
            'nombre'             => trim("{$r->nombres} {$r->apellidos}"),
            'correo'             => $r->correo,
            'foto_perfil_url'    => $r->foto_perfil_url,
            'racha_actual_dias'  => (int)   ($r->racha_actual_dias  ?? 0),
            'total_ejercicios'   => (int)   ($r->total_ejercicios   ?? 0),
            'porcentaje_aciertos'=> (float) ($r->porcentaje_aciertos ?? 0),
            'total_simulacros'   => (int)   ($r->total_simulacros    ?? 0),
            'promedio_simulacros'=> (float) ($r->promedio_simulacros  ?? 0),
            'ultima_actividad'   => $r->ultima_actividad,
        ], $rows);
    }

    // ── Métricas grupales ────────────────────────────────────────────────────

    public function metricasGrupales(int $tutorId): array
    {
        $row = DB::selectOne("
            SELECT
                COUNT(DISTINCT te.estudiante_id) AS total_estudiantes,

                ROUND(AVG(
                    (
                        SELECT COUNT(CASE WHEN rp.es_correcta THEN 1 END) * 100.0
                               / NULLIF(COUNT(rp.id), 0)
                        FROM respuestas_practica rp
                        JOIN sesiones_practica sp ON sp.id = rp.sesion_practica_id
                        WHERE sp.estudiante_id = te.estudiante_id
                    )
                ), 2) AS promedio_aciertos_grupal,

                ROUND(AVG(
                    (
                        SELECT COALESCE(AVG(s.puntaje_total), 0)
                        FROM simulacros s
                        WHERE s.estudiante_id = te.estudiante_id
                          AND s.estado = 'FINALIZADO'
                    )
                ), 2) AS promedio_simulacros_grupal,

                SUM(
                    (
                        SELECT COUNT(rp.id)
                        FROM respuestas_practica rp
                        JOIN sesiones_practica sp ON sp.id = rp.sesion_practica_id
                        WHERE sp.estudiante_id = te.estudiante_id
                    )
                ) AS total_ejercicios_grupal

            FROM tutor_estudiante te
            WHERE te.tutor_id = ?
              AND te.activo   = TRUE
        ", [$tutorId]);

        return [
            'total_estudiantes'       => (int)   ($row->total_estudiantes        ?? 0),
            'promedio_aciertos_grupal'=> (float) ($row->promedio_aciertos_grupal  ?? 0),
            'promedio_simulacros'     => (float) ($row->promedio_simulacros_grupal ?? 0),
            'total_ejercicios_grupal' => (int)   ($row->total_ejercicios_grupal   ?? 0),
        ];
    }

    // ── Módulos con mayor tasa de error grupal ───────────────────────────────

    public function modulosMayorErrorGrupal(int $tutorId): array
    {
        $rows = DB::select("
            SELECT
                m.id             AS modulo_id,
                m.nombre         AS modulo_nombre,
                COUNT(rp.id)     AS total_respuestas,
                COUNT(CASE WHEN NOT rp.es_correcta THEN 1 END) AS total_errores,
                ROUND(
                    COUNT(CASE WHEN NOT rp.es_correcta THEN 1 END) * 100.0
                    / NULLIF(COUNT(rp.id), 0)
                , 2) AS tasa_error
            FROM modulos_tematicos m
            JOIN ejercicios ej         ON ej.modulo_id = m.id
            JOIN respuestas_practica rp ON rp.ejercicio_id = ej.id
            JOIN sesiones_practica sp   ON sp.id = rp.sesion_practica_id
            JOIN tutor_estudiante te    ON te.estudiante_id = sp.estudiante_id
                AND te.tutor_id = ? AND te.activo = TRUE
            GROUP BY m.id, m.nombre, m.orden
            HAVING COUNT(rp.id) >= 3
            ORDER BY tasa_error DESC
        ", [$tutorId]);

        return array_map(fn($r) => [
            'modulo_id'       => $r->modulo_id,
            'modulo_nombre'   => $r->modulo_nombre,
            'total_respuestas'=> (int)   $r->total_respuestas,
            'total_errores'   => (int)   $r->total_errores,
            'tasa_error'      => (float) $r->tasa_error,
        ], $rows);
    }

    // ── Ejercicios con mayor % de respuestas incorrectas ────────────────────

    public function ejerciciosMasDificiles(int $tutorId, int $limite = 10): array
    {
        $rows = DB::select("
            SELECT
                ej.id           AS ejercicio_id,
                ej.enunciado,
                ej.nivel_dificultad,
                m.nombre        AS modulo_nombre,
                st.nombre       AS subtema_nombre,
                COUNT(rp.id)    AS total_respuestas,
                COUNT(CASE WHEN NOT rp.es_correcta THEN 1 END) AS total_incorrectas,
                ROUND(
                    COUNT(CASE WHEN NOT rp.es_correcta THEN 1 END) * 100.0
                    / NULLIF(COUNT(rp.id), 0)
                , 2) AS tasa_error
            FROM ejercicios ej
            JOIN modulos_tematicos m    ON m.id = ej.modulo_id
            JOIN subtemas st            ON st.id = ej.subtema_id
            JOIN respuestas_practica rp ON rp.ejercicio_id = ej.id
            JOIN sesiones_practica sp   ON sp.id = rp.sesion_practica_id
            JOIN tutor_estudiante te    ON te.estudiante_id = sp.estudiante_id
                AND te.tutor_id = ? AND te.activo = TRUE
            WHERE ej.tutor_id = ?
            GROUP BY ej.id, ej.enunciado, ej.nivel_dificultad, m.nombre, st.nombre
            HAVING COUNT(rp.id) >= 3
            ORDER BY tasa_error DESC
            LIMIT ?
        ", [$tutorId, $tutorId, $limite]);

        return array_map(fn($r) => [
            'ejercicio_id'      => $r->ejercicio_id,
            'enunciado'         => mb_substr($r->enunciado, 0, 120) . '...',
            'nivel_dificultad'  => $r->nivel_dificultad,
            'modulo_nombre'     => $r->modulo_nombre,
            'subtema_nombre'    => $r->subtema_nombre,
            'total_respuestas'  => (int)   $r->total_respuestas,
            'total_incorrectas' => (int)   $r->total_incorrectas,
            'tasa_error'        => (float) $r->tasa_error,
        ], $rows);
    }

    // ── Progreso grupal semanal ──────────────────────────────────────────────

    public function progresoGrupalSemanal(int $tutorId, int $semanas = 8): array
    {
        $rows = DB::select("
            SELECT
                DATE_TRUNC('week', sp.fecha_inicio) AS semana,
                ROUND(AVG(sp.porcentaje_aciertos), 2) AS promedio_aciertos,
                COUNT(DISTINCT sp.estudiante_id) AS estudiantes_activos,
                COUNT(sp.id) AS total_sesiones
            FROM sesiones_practica sp
            JOIN tutor_estudiante te ON te.estudiante_id = sp.estudiante_id
                AND te.tutor_id = ? AND te.activo = TRUE
            WHERE sp.fecha_fin IS NOT NULL
              AND sp.fecha_inicio >= NOW() - INTERVAL '{$semanas} weeks'
            GROUP BY DATE_TRUNC('week', sp.fecha_inicio)
            ORDER BY semana ASC
        ", [$tutorId]);

        return array_map(fn($r) => [
            'semana'             => date('d/m', strtotime($r->semana)),
            'promedio_aciertos'  => (float) ($r->promedio_aciertos   ?? 0),
            'estudiantes_activos'=> (int)   ($r->estudiantes_activos  ?? 0),
            'total_sesiones'     => (int)   ($r->total_sesiones       ?? 0),
        ], $rows);
    }
}