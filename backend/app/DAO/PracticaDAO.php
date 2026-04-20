<?php

namespace App\DAO;

use Illuminate\Support\Facades\DB;

class PracticaDAO
{
    public function obtenerSesionActiva(int $estudianteId): ?object
    {
        return DB::selectOne("
            SELECT
                sp.id,
                sp.estudiante_id,
                sp.modo,
                sp.modulo_id,
                m.nombre AS modulo_nombre,
                sp.subtema_id,
                s.nombre AS subtema_nombre,
                sp.nivel_dificultad,
                sp.ruta_id,
                sp.total_ejercicios,
                sp.total_correctos,
                sp.porcentaje_aciertos,
                sp.tiempo_total_minutos,
                sp.fecha_inicio,
                sp.fecha_fin
            FROM math.sesiones_practica sp
            LEFT JOIN math.modulos_tematicos m ON m.id = sp.modulo_id
            LEFT JOIN math.subtemas s ON s.id = sp.subtema_id
            WHERE sp.estudiante_id = ?
              AND sp.fecha_fin IS NULL
            ORDER BY sp.fecha_inicio DESC
            LIMIT 1
        ", [$estudianteId]);
    }

    public function obtenerSesionPorId(int $sesionId, int $estudianteId): ?object
    {
        return DB::selectOne("
            SELECT
                sp.id,
                sp.estudiante_id,
                sp.modo,
                sp.modulo_id,
                m.nombre AS modulo_nombre,
                sp.subtema_id,
                s.nombre AS subtema_nombre,
                sp.nivel_dificultad,
                sp.ruta_id,
                sp.total_ejercicios,
                sp.total_correctos,
                sp.porcentaje_aciertos,
                sp.tiempo_total_minutos,
                sp.fecha_inicio,
                sp.fecha_fin
            FROM math.sesiones_practica sp
            LEFT JOIN math.modulos_tematicos m ON m.id = sp.modulo_id
            LEFT JOIN math.subtemas s ON s.id = sp.subtema_id
            WHERE sp.id = ?
              AND sp.estudiante_id = ?
            LIMIT 1
        ", [$sesionId, $estudianteId]);
    }

    public function crearSesion(
        int $estudianteId,
        string $modo,
        ?int $moduloId,
        ?int $subtemaId,
        ?string $nivelDificultad,
        ?int $rutaId
    ): int {
        $r = DB::selectOne("
            INSERT INTO math.sesiones_practica
                (estudiante_id, modo, modulo_id, subtema_id, nivel_dificultad, ruta_id, fecha_inicio)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
            RETURNING id
        ", [$estudianteId, $modo, $moduloId, $subtemaId, $nivelDificultad, $rutaId]);

        return (int) $r->id;
    }

    public function actualizarObjetivoSesion(
        int $sesionId,
        ?int $moduloId,
        ?int $subtemaId,
        ?string $nivelDificultad
    ): void {
        DB::update("
            UPDATE math.sesiones_practica
            SET modulo_id = ?, subtema_id = ?, nivel_dificultad = ?
            WHERE id = ?
        ", [$moduloId, $subtemaId, $nivelDificultad, $sesionId]);
    }

    public function cerrarSesion(int $sesionId): void
    {
        DB::update("
            UPDATE math.sesiones_practica
            SET fecha_fin = NOW()
            WHERE id = ?
              AND fecha_fin IS NULL
        ", [$sesionId]);

        $this->actualizarResumenSesion($sesionId);
    }

    public function obtenerRutaActiva(int $estudianteId): ?object
    {
        return DB::selectOne("
            SELECT id
            FROM math.rutas_aprendizaje
            WHERE estudiante_id = ?
              AND activa = true
            ORDER BY fecha_generacion DESC
            LIMIT 1
        ", [$estudianteId]);
    }

    public function obtenerSubtemaGuiado(
        int $estudianteId,
        int $rutaId,
        ?int $subtemaExcluir = null
    ): ?object {
        $sql = "
            SELECT
                rad.modulo_id,
                rad.subtema_id,
                m.nombre AS modulo_nombre,
                s.nombre AS subtema_nombre,
                COALESCE((
                    SELECT ROUND(
                        (SUM(CASE WHEN rp.es_correcta THEN 1 ELSE 0 END)::numeric * 100.0)
                        / NULLIF(COUNT(*), 0),
                        2
                    )
                    FROM math.respuestas_practica rp
                    JOIN math.sesiones_practica sp ON sp.id = rp.sesion_practica_id
                    JOIN math.ejercicios e ON e.id = rp.ejercicio_id
                    WHERE sp.estudiante_id = ?
                    AND e.subtema_id = rad.subtema_id
                    AND COALESCE(rp.omitida, false) = false
                ), 0) AS porcentaje_historico
            FROM math.ruta_aprendizaje_detalle rad
            JOIN math.modulos_tematicos m ON m.id = rad.modulo_id
            JOIN math.subtemas s ON s.id = rad.subtema_id
            WHERE rad.ruta_id = ?
              AND rad.estado = 'PENDIENTE'
        ";

        $params = [$estudianteId, $rutaId];

        if ($subtemaExcluir !== null) {
            $sql .= " AND rad.subtema_id <> ? ";
            $params[] = $subtemaExcluir;
        }

        $sql .= "
            ORDER BY porcentaje_historico ASC, rad.prioridad_modulo ASC, rad.prioridad_subtema ASC
            LIMIT 1
        ";

        return DB::selectOne($sql, $params);
    }

    public function buscarEjercicioDisponible(
        int $estudianteId,
        int $sesionId,
        int $moduloId,
        ?int $subtemaId,
        string $nivelDificultad
    ): ?object {
        $sql = "
            SELECT
                e.id,
                e.modulo_id,
                e.subtema_id,
                e.nivel_dificultad,
                e.tipo_ejercicio,
                e.enunciado,
                e.imagen_apoyo_url,
                e.respuesta_correcta_texto,
                e.solucion_paso_a_paso,
                e.explicacion_conceptual,
                e.tiempo_estimado_minutos,
                m.nombre AS modulo_nombre,
                s.nombre AS subtema_nombre
            FROM math.ejercicios e
            JOIN math.modulos_tematicos m ON m.id = e.modulo_id
            LEFT JOIN math.subtemas s ON s.id = e.subtema_id
            WHERE e.estado = 'PUBLICADO'
              AND e.modulo_id = ?
              AND e.nivel_dificultad = ?
              AND NOT EXISTS (
                  SELECT 1
                  FROM math.respuestas_practica rp0
                  WHERE rp0.sesion_practica_id = ?
                    AND rp0.ejercicio_id = e.id
              )
              AND NOT EXISTS (
                  SELECT 1
                  FROM math.respuestas_practica rp
                  JOIN math.sesiones_practica sp ON sp.id = rp.sesion_practica_id
                  WHERE sp.estudiante_id = ?
                    AND rp.ejercicio_id = e.id
                    AND rp.es_correcta = true
                    AND rp.fecha_respuesta >= NOW() - INTERVAL '7 days'
              )
        ";

        $params = [$moduloId, $nivelDificultad, $sesionId, $estudianteId];

        if ($subtemaId !== null) {
            $sql .= " AND e.subtema_id = ? ";
            $params[] = $subtemaId;
        }

        $sql .= " ORDER BY RANDOM() LIMIT 1 ";

        return DB::selectOne($sql, $params);
    }

    public function obtenerOpciones(int $ejercicioId): array
    {
        return DB::select("
            SELECT id, orden_opcion, texto_opcion
            FROM math.opciones_ejercicio
            WHERE ejercicio_id = ?
            ORDER BY orden_opcion
        ", [$ejercicioId]);
    }

    public function obtenerEjercicioPorId(int $ejercicioId): ?object
    {
        return DB::selectOne("
            SELECT
                e.id,
                e.modulo_id,
                e.subtema_id,
                e.nivel_dificultad,
                e.tipo_ejercicio,
                e.enunciado,
                e.imagen_apoyo_url,
                e.respuesta_correcta_texto,
                e.solucion_paso_a_paso,
                e.explicacion_conceptual,
                e.tiempo_estimado_minutos,
                m.nombre AS modulo_nombre,
                s.nombre AS subtema_nombre
            FROM math.ejercicios e
            JOIN math.modulos_tematicos m ON m.id = e.modulo_id
            LEFT JOIN math.subtemas s ON s.id = e.subtema_id
            WHERE e.id = ?
              AND e.estado = 'PUBLICADO'
            LIMIT 1
        ", [$ejercicioId]);
    }

    public function opcionEsCorrecta(int $opcionId): bool
    {
        $r = DB::selectOne("
            SELECT es_correcta
            FROM math.opciones_ejercicio
            WHERE id = ?
            LIMIT 1
        ", [$opcionId]);

        return (bool) ($r->es_correcta ?? false);
    }

        public function guardarRespuesta(
        int $sesionId,
        int $ejercicioId,
        ?int $opcionId,
        ?string $respuestaTexto,
        bool $esCorrecta,
        bool $marcadoGuardado,
        ?int $tiempoSegundos
    ): void {
        DB::statement("
            INSERT INTO math.respuestas_practica
                (sesion_practica_id, ejercicio_id, opcion_id, respuesta_texto, es_correcta, marcado_guardado, tiempo_segundos, omitida, fecha_respuesta)
            VALUES (?, ?, ?, ?, ?, ?, ?, false, NOW())
            ON CONFLICT (sesion_practica_id, ejercicio_id)
            DO UPDATE SET
                opcion_id = EXCLUDED.opcion_id,
                respuesta_texto = EXCLUDED.respuesta_texto,
                es_correcta = EXCLUDED.es_correcta,
                marcado_guardado = EXCLUDED.marcado_guardado,
                tiempo_segundos = EXCLUDED.tiempo_segundos,
                omitida = false,
                fecha_respuesta = NOW()
        ", [
            $sesionId,
            $ejercicioId,
            $opcionId,
            $respuestaTexto,
            $esCorrecta,
            $marcadoGuardado,
            $tiempoSegundos
        ]);
    }

        public function omitirEjercicio(int $sesionId, int $ejercicioId, ?int $tiempoSegundos = null): void
    {
        DB::statement("
            INSERT INTO math.respuestas_practica
                (sesion_practica_id, ejercicio_id, opcion_id, respuesta_texto, es_correcta, marcado_guardado, tiempo_segundos, omitida, fecha_respuesta)
            VALUES (?, ?, NULL, NULL, false, true, ?, true, NOW())
            ON CONFLICT (sesion_practica_id, ejercicio_id)
            DO UPDATE SET
                opcion_id = NULL,
                respuesta_texto = NULL,
                es_correcta = false,
                marcado_guardado = true,
                tiempo_segundos = EXCLUDED.tiempo_segundos,
                omitida = true,
                fecha_respuesta = NOW()
        ", [$sesionId, $ejercicioId, $tiempoSegundos]);
    }

    public function guardarEjercicio(int $estudianteId, int $ejercicioId): void
    {
        DB::statement("
            INSERT INTO math.ejercicios_guardados
                (estudiante_id, ejercicio_id, fecha_guardado)
            VALUES (?, ?, NOW())
            ON CONFLICT (estudiante_id, ejercicio_id)
            DO UPDATE SET
                fecha_guardado = NOW()
        ", [$estudianteId, $ejercicioId]);
    }

    public function actualizarResumenSesion(int $sesionId): void
{
    DB::update("
        UPDATE math.sesiones_practica sp
        SET
            total_ejercicios = COALESCE((
                SELECT COUNT(*)::int
                FROM math.respuestas_practica rp
                WHERE rp.sesion_practica_id = sp.id
                  AND COALESCE(rp.omitida, false) = false
            ), 0),
            total_correctos = COALESCE((
                SELECT SUM(CASE WHEN rp.es_correcta THEN 1 ELSE 0 END)::int
                FROM math.respuestas_practica rp
                WHERE rp.sesion_practica_id = sp.id
                  AND COALESCE(rp.omitida, false) = false
            ), 0),
            porcentaje_aciertos = COALESCE((
                SELECT ROUND(
                    (SUM(CASE WHEN rp.es_correcta THEN 1 ELSE 0 END)::numeric * 100.0)
                    / NULLIF(COUNT(*), 0),
                    2
                )
                FROM math.respuestas_practica rp
                WHERE rp.sesion_practica_id = sp.id
                  AND COALESCE(rp.omitida, false) = false
            ), 0),
            tiempo_total_minutos = COALESCE((
                SELECT CEIL(COALESCE(SUM(rp.tiempo_segundos), 0) / 60.0)::int
                FROM math.respuestas_practica rp
                WHERE rp.sesion_practica_id = sp.id
                  AND COALESCE(rp.omitida, false) = false
            ), 0)
        WHERE sp.id = ?
    ", [$sesionId]);
}

    public function obtenerResumenSesion(int $sesionId, int $estudianteId): ?object
{
    return DB::selectOne("
        SELECT
            sp.id,
            sp.modo,
            sp.modulo_id,
            m.nombre AS modulo_nombre,
            sp.subtema_id,
            s.nombre AS subtema_nombre,
            sp.nivel_dificultad,
            COALESCE(agg.total_respondidas, 0) AS total_ejercicios,
            COALESCE(agg.total_respondidas, 0) AS total_respondidas,
            COALESCE(agg.total_correctos, 0) AS total_correctos,
            COALESCE(agg.total_omitidas, 0) AS total_omitidas,
            COALESCE(agg.total_guardadas, 0) AS total_guardadas,
            COALESCE(agg.total_interacciones, 0) AS total_interacciones,
            COALESCE(agg.porcentaje_aciertos, 0) AS porcentaje_aciertos,
            COALESCE(agg.tiempo_total_minutos, 0) AS tiempo_total_minutos,
            sp.fecha_inicio,
            sp.fecha_fin,
            (
                SELECT COUNT(DISTINCT e.modulo_id)
                FROM math.respuestas_practica rp
                JOIN math.ejercicios e ON e.id = rp.ejercicio_id
                WHERE rp.sesion_practica_id = sp.id
            ) AS modulos_trabajados
        FROM math.sesiones_practica sp
        LEFT JOIN math.modulos_tematicos m ON m.id = sp.modulo_id
        LEFT JOIN math.subtemas s ON s.id = sp.subtema_id
        LEFT JOIN LATERAL (
            SELECT
                COUNT(*) FILTER (WHERE COALESCE(rp.omitida, false) = false)::int AS total_respondidas,
                COUNT(*) FILTER (WHERE COALESCE(rp.omitida, false) = true)::int AS total_omitidas,
                COUNT(*) FILTER (WHERE COALESCE(rp.marcado_guardado, false) = true)::int AS total_guardadas,
                COUNT(*)::int AS total_interacciones,
                COALESCE(SUM(
                    CASE
                        WHEN COALESCE(rp.omitida, false) = false AND rp.es_correcta THEN 1
                        ELSE 0
                    END
                ), 0)::int AS total_correctos,
                COALESCE(
                    ROUND(
                        (
                            SUM(
                                CASE
                                    WHEN COALESCE(rp.omitida, false) = false AND rp.es_correcta THEN 1
                                    ELSE 0
                                END
                            )::numeric * 100.0
                        ) / NULLIF(
                            COUNT(*) FILTER (WHERE COALESCE(rp.omitida, false) = false),
                            0
                        ),
                        2
                    ),
                    0
                ) AS porcentaje_aciertos,
                CEIL(
                    COALESCE(
                        SUM(
                            CASE
                                WHEN COALESCE(rp.omitida, false) = false THEN COALESCE(rp.tiempo_segundos, 0)
                                ELSE 0
                            END
                        ),
                        0
                    ) / 60.0
                )::int AS tiempo_total_minutos
            FROM math.respuestas_practica rp
            WHERE rp.sesion_practica_id = sp.id
        ) agg ON true
        WHERE sp.id = ?
          AND sp.estudiante_id = ?
        LIMIT 1
    ", [$sesionId, $estudianteId]);
}

    public function obtenerRendimientoNivelSubtema(
        int $estudianteId,
        int $subtemaId,
        string $nivelDificultad
    ): object {
        return DB::selectOne("
            SELECT
                COUNT(*)::int AS total,
                COALESCE(SUM(CASE WHEN rp.es_correcta THEN 1 ELSE 0 END), 0)::int AS correctos,
                COALESCE(SUM(CASE WHEN rp.es_correcta = false THEN 1 ELSE 0 END), 0)::int AS incorrectos,
                COALESCE(
                    ROUND(
                        (SUM(CASE WHEN rp.es_correcta = false THEN 1 ELSE 0 END)::numeric * 100.0)
                        / NULLIF(COUNT(*), 0),
                        2
                    ),
                    0
                ) AS porcentaje_error
            FROM math.respuestas_practica rp
            JOIN math.sesiones_practica sp ON sp.id = rp.sesion_practica_id
            JOIN math.ejercicios e ON e.id = rp.ejercicio_id
            WHERE sp.estudiante_id = ?
            AND e.subtema_id = ?
            AND sp.nivel_dificultad = ?
            AND COALESCE(rp.omitida, false) = false
        ", [$estudianteId, $subtemaId, $nivelDificultad]);
    }

    public function obtenerHistorialRespuestasSubtema(
        int $estudianteId,
        int $subtemaId,
        ?string $nivelDificultad = null,
        int $limite = 10
    ): array {
        $sql = "
            SELECT rp.es_correcta
            FROM math.respuestas_practica rp
            JOIN math.sesiones_practica sp ON sp.id = rp.sesion_practica_id
            JOIN math.ejercicios e ON e.id = rp.ejercicio_id
            WHERE sp.estudiante_id = ?
            AND e.subtema_id = ?
            AND COALESCE(rp.omitida, false) = false
        ";

        $params = [$estudianteId, $subtemaId];

        if ($nivelDificultad !== null) {
            $sql .= " AND sp.nivel_dificultad = ? ";
            $params[] = $nivelDificultad;
        }

        $sql .= " ORDER BY rp.fecha_respuesta DESC LIMIT " . (int) $limite;

        return DB::select($sql, $params);
    }

    public function marcarSubtemaCompletado(int $rutaId, int $subtemaId): void
    {
        DB::update("
            UPDATE math.ruta_aprendizaje_detalle
            SET estado = 'COMPLETADO',
                fecha_completado = NOW()
            WHERE ruta_id = ?
              AND subtema_id = ?
              AND estado <> 'COMPLETADO'
        ", [$rutaId, $subtemaId]);
    }

        public function obtenerEjerciciosGuardados(int $estudianteId): array
    {
        return DB::select("
            SELECT
                eg.ejercicio_id,
                eg.fecha_guardado,
                e.modulo_id,
                m.nombre AS modulo_nombre,
                e.subtema_id,
                s.nombre AS subtema_nombre,
                e.nivel_dificultad,
                e.tipo_ejercicio,
                e.enunciado,
                e.imagen_apoyo_url,
                e.respuesta_correcta_texto,
                e.solucion_paso_a_paso,
                e.explicacion_conceptual,
                e.tiempo_estimado_minutos
            FROM math.ejercicios_guardados eg
            JOIN math.ejercicios e ON e.id = eg.ejercicio_id
            JOIN math.modulos_tematicos m ON m.id = e.modulo_id
            LEFT JOIN math.subtemas s ON s.id = e.subtema_id
            WHERE eg.estudiante_id = ?
              AND e.estado = 'PUBLICADO'
            ORDER BY eg.fecha_guardado DESC, eg.ejercicio_id DESC
        ", [$estudianteId]);
    }

    public function eliminarEjercicioGuardado(int $estudianteId, int $ejercicioId): int
    {
        return DB::delete("
            DELETE FROM math.ejercicios_guardados
            WHERE estudiante_id = ?
              AND ejercicio_id = ?
        ", [$estudianteId, $ejercicioId]);
    }

    public function obtenerHistorialSesiones(int $estudianteId): array
{
    return DB::select("
        SELECT
            sp.id AS sesion_id,
            sp.modo,
            sp.modulo_id,
            m.nombre AS modulo_nombre,
            sp.subtema_id,
            s.nombre AS subtema_nombre,
            sp.nivel_dificultad,
            sp.fecha_inicio,
            sp.fecha_fin,
            COALESCE(agg.total_respondidas, 0) AS total_respondidas,
            COALESCE(agg.total_correctos, 0) AS total_correctos,
            COALESCE(agg.total_omitidas, 0) AS total_omitidas,
            COALESCE(agg.total_guardadas, 0) AS total_guardadas,
            COALESCE(agg.porcentaje_aciertos, 0) AS porcentaje_aciertos,
            COALESCE(agg.tiempo_total_minutos, 0) AS tiempo_total_minutos
        FROM math.sesiones_practica sp
        LEFT JOIN math.modulos_tematicos m ON m.id = sp.modulo_id
        LEFT JOIN math.subtemas s ON s.id = sp.subtema_id
        LEFT JOIN LATERAL (
            SELECT
                COUNT(*) FILTER (WHERE COALESCE(rp.omitida, false) = false)::int AS total_respondidas,
                COUNT(*) FILTER (WHERE COALESCE(rp.omitida, false) = true)::int AS total_omitidas,
                COUNT(*) FILTER (WHERE COALESCE(rp.marcado_guardado, false) = true)::int AS total_guardadas,
                COALESCE(SUM(
                    CASE
                        WHEN COALESCE(rp.omitida, false) = false AND rp.es_correcta THEN 1
                        ELSE 0
                    END
                ), 0)::int AS total_correctos,
                COALESCE(
                    ROUND(
                        (
                            SUM(
                                CASE
                                    WHEN COALESCE(rp.omitida, false) = false AND rp.es_correcta THEN 1
                                    ELSE 0
                                END
                            )::numeric * 100.0
                        ) / NULLIF(
                            COUNT(*) FILTER (WHERE COALESCE(rp.omitida, false) = false),
                            0
                        ),
                        2
                    ),
                    0
                ) AS porcentaje_aciertos,
                CEIL(
                    COALESCE(
                        SUM(
                            CASE
                                WHEN COALESCE(rp.omitida, false) = false THEN COALESCE(rp.tiempo_segundos, 0)
                                ELSE 0
                            END
                        ),
                        0
                    ) / 60.0
                )::int AS tiempo_total_minutos
            FROM math.respuestas_practica rp
            WHERE rp.sesion_practica_id = sp.id
        ) agg ON true
        WHERE sp.estudiante_id = ?
          AND sp.fecha_fin IS NOT NULL
        ORDER BY sp.fecha_fin DESC, sp.id DESC
    ", [$estudianteId]);
}
}