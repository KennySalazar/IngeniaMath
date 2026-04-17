<?php

namespace App\DAO;

use Illuminate\Support\Facades\DB;

class DiagnosticoDAO
{
    // Obtiene el test diagnóstico activo
    public function obtenerTestActivo(): ?object
    {
        return DB::selectOne("
            SELECT id, nombre, descripcion
            FROM math.tests_diagnostico
            WHERE activo = true
            ORDER BY fecha_creacion DESC
            LIMIT 1
        ");
    }

    // Obtiene las preguntas del test con datos del ejercicio
    public function obtenerPreguntasTest(int $testId): array
    {
        return DB::select("
            SELECT
                tdp.id            AS pregunta_id,
                tdp.orden_pregunta,
                e.id              AS ejercicio_id,
                e.enunciado,
                e.tipo_ejercicio,
                e.imagen_apoyo_url,
                e.tiempo_estimado_minutos,
                e.modulo_id,
                m.nombre          AS modulo_nombre
            FROM math.test_diagnostico_preguntas tdp
            JOIN math.ejercicios e   ON e.id = tdp.ejercicio_id
            JOIN math.modulos_tematicos m ON m.id = e.modulo_id
            WHERE tdp.test_diagnostico_id = ?
              AND e.estado = 'PUBLICADO'
            ORDER BY tdp.orden_pregunta
        ", [$testId]);
    }

    // Obtiene las opciones de un ejercicio
    public function obtenerOpciones(int $ejercicioId): array
    {
        return DB::select("
            SELECT id, orden_opcion, texto_opcion
            FROM math.opciones_ejercicio
            WHERE ejercicio_id = ?
            ORDER BY orden_opcion
        ", [$ejercicioId]);
    }

    // Verifica si el estudiante ya tiene un intento finalizado
    public function tienteIntentFinalizado(int $estudianteId): bool
    {
        $resultado = DB::selectOne("
            SELECT COUNT(*) AS total
            FROM math.intentos_diagnostico
            WHERE estudiante_id = ?
              AND estado = 'FINALIZADO'
        ", [$estudianteId]);

        return $resultado->total > 0;
    }

    // Verifica si el estudiante tiene un intento en proceso
    public function obtenerIntentoEnProceso(int $estudianteId): ?object
    {
        return DB::selectOne("
            SELECT id, test_diagnostico_id, fecha_inicio
            FROM math.intentos_diagnostico
            WHERE estudiante_id = ?
              AND estado = 'EN_PROCESO'
            ORDER BY fecha_inicio DESC
            LIMIT 1
        ", [$estudianteId]);
    }

    // Crea un nuevo intento diagnóstico
    public function crearIntento(int $testId, int $estudianteId): int
    {
        $resultado = DB::selectOne("
            INSERT INTO math.intentos_diagnostico
                (test_diagnostico_id, estudiante_id, estado, fecha_inicio)
            VALUES (?, ?, 'EN_PROCESO', NOW())
            RETURNING id
        ", [$testId, $estudianteId]);

        return $resultado->id;
    }

    // Obtiene las respuestas ya guardadas de un intento
    public function obtenerRespuestasGuardadas(int $intentoId): array
    {
        return DB::select("
            SELECT ejercicio_id, opcion_id, respuesta_texto, es_correcta
            FROM math.respuestas_diagnostico
            WHERE intento_diagnostico_id = ?
        ", [$intentoId]);
    }

    // Guarda o actualiza una respuesta del estudiante
    public function guardarRespuesta(
        int $intentoId,
        int $ejercicioId,
        ?int $opcionId,
        ?string $respuestaTexto,
        bool $esCorrecta
    ): void {
        DB::statement("
        INSERT INTO math.respuestas_diagnostico
            (intento_diagnostico_id, ejercicio_id, opcion_id, respuesta_texto, es_correcta, fecha_respuesta)
        VALUES (?, ?, ?, ?, ?, NOW())
        ON CONFLICT (intento_diagnostico_id, ejercicio_id)
        DO UPDATE SET
            opcion_id        = EXCLUDED.opcion_id,
            respuesta_texto  = EXCLUDED.respuesta_texto,
            es_correcta      = EXCLUDED.es_correcta,
            fecha_respuesta  = NOW()
    ", [$intentoId, $ejercicioId, $opcionId, $respuestaTexto, $esCorrecta]);
    }

    // Obtiene el ejercicio completo para evaluar la respuesta
    public function obtenerEjercicioParaEvaluar(int $ejercicioId): ?object
    {
        return DB::selectOne("
        SELECT
            e.id,
            e.tipo_ejercicio,
            e.respuesta_correcta_texto,
            e.modulo_id
        FROM math.ejercicios e
        WHERE e.id = ?
    ", [$ejercicioId]);
    }

    // Verifica si una opción es correcta
    public function opcionEsCorrecta(int $opcionId): bool
    {
        $op = DB::selectOne("
        SELECT es_correcta
        FROM math.opciones_ejercicio
        WHERE id = ?
    ", [$opcionId]);

        return $op?->es_correcta ?? false;
    }

    // Verifica si el intento pertenece al estudiante y está EN_PROCESO
    public function obtenerIntentoPorId(int $intentoId, int $estudianteId): ?object
    {
        return DB::selectOne("
        SELECT id, test_diagnostico_id, estado
        FROM math.intentos_diagnostico
        WHERE id = ?
          AND estudiante_id = ?
    ", [$intentoId, $estudianteId]);
    }

    // Cuenta total de preguntas del test
    public function totalPreguntas(int $testId): int
    {
        $r = DB::selectOne("
        SELECT COUNT(*) AS total
        FROM math.test_diagnostico_preguntas
        WHERE test_diagnostico_id = ?
    ", [$testId]);
        return (int) $r->total;
    }

    // Cuenta respuestas guardadas en el intento
    public function totalRespondidas(int $intentoId): int
    {
        $r = DB::selectOne("
        SELECT COUNT(*) AS total
        FROM math.respuestas_diagnostico
        WHERE intento_diagnostico_id = ?
    ", [$intentoId]);
        return (int) $r->total;
    }

    // Obtiene resultados agrupados por módulo para calcular puntaje
    public function obtenerResultadosPorModulo(int $intentoId, int $testId): array
    {
        return DB::select("
        SELECT
            e.modulo_id,
            m.nombre          AS modulo_nombre,
            COUNT(*)          AS total_preguntas,
            SUM(CASE WHEN rd.es_correcta THEN 1 ELSE 0 END) AS correctas
        FROM math.respuestas_diagnostico rd
        JOIN math.ejercicios e ON e.id = rd.ejercicio_id
        JOIN math.modulos_tematicos m ON m.id = e.modulo_id
        JOIN math.test_diagnostico_preguntas tdp
            ON tdp.ejercicio_id = rd.ejercicio_id
            AND tdp.test_diagnostico_id = ?
        WHERE rd.intento_diagnostico_id = ?
        GROUP BY e.modulo_id, m.nombre
        ORDER BY e.modulo_id
    ", [$testId, $intentoId]);
    }

    // Guarda el resultado por módulo
    public function guardarResultadoModulo(
        int $intentoId,
        int $moduloId,
        float $puntaje,
        string $clasificacion
    ): void {
        DB::statement("
        INSERT INTO math.resultados_diagnostico_modulo
            (intento_diagnostico_id, modulo_id, puntaje_porcentaje, clasificacion)
        VALUES (?, ?, ?, ?)
        ON CONFLICT (intento_diagnostico_id, modulo_id)
        DO UPDATE SET
            puntaje_porcentaje = EXCLUDED.puntaje_porcentaje,
            clasificacion      = EXCLUDED.clasificacion
    ", [$intentoId, $moduloId, $puntaje, $clasificacion]);
    }

    // Finaliza el intento con puntaje total
    public function finalizarIntento(int $intentoId, float $puntajeTotal): void
    {
        DB::statement("
        UPDATE math.intentos_diagnostico
        SET estado        = 'FINALIZADO',
            puntaje_total = ?,
            fecha_fin     = NOW()
        WHERE id = ?
    ", [$puntajeTotal, $intentoId]);
    }

    // Obtiene los resultados finales del intento para mostrar al estudiante
    public function obtenerResultadosFinales(int $intentoId): array
    {
        return DB::select("
        SELECT
            rdm.modulo_id,
            m.nombre       AS modulo_nombre,
            rdm.puntaje_porcentaje,
            rdm.clasificacion
        FROM math.resultados_diagnostico_modulo rdm
        JOIN math.modulos_tematicos m ON m.id = rdm.modulo_id
        WHERE rdm.intento_diagnostico_id = ?
        ORDER BY m.orden
    ", [$intentoId]);
    }

    // Obtiene los resultados por módulo de un intento finalizado
    public function obtenerClasificacionesPorModulo(int $intentoId): array
    {
        return DB::select("
        SELECT
            rdm.modulo_id,
            rdm.puntaje_porcentaje,
            rdm.clasificacion,
            m.orden         AS orden_modulo
        FROM math.resultados_diagnostico_modulo rdm
        JOIN math.modulos_tematicos m ON m.id = rdm.modulo_id
        WHERE rdm.intento_diagnostico_id = ?
        ORDER BY
            CASE rdm.clasificacion
                WHEN 'DEFICIENTE'    THEN 1
                WHEN 'EN_DESARROLLO' THEN 2
                WHEN 'DOMINADO'      THEN 3
            END,
            m.orden
    ", [$intentoId]);
    }

    // Obtiene subtemas de un módulo ordenados por complejidad
    public function obtenerSubtemasModulo(int $moduloId): array
    {
        return DB::select("
        SELECT id, nombre, orden_complejidad
        FROM math.subtemas
        WHERE modulo_id = ?
        ORDER BY orden_complejidad
    ", [$moduloId]);
    }

    // Obtiene los prerrequisitos de un subtema
    public function obtenerPrerrequisitos(int $subtemaId): array
    {
        return DB::select("
        SELECT subtema_prerrequisito_id AS id
        FROM math.prerrequisitos_subtema
        WHERE subtema_id = ?
    ", [$subtemaId]);
    }

    // Obtiene el módulo de un subtema
    public function obtenerModuloDeSubtema(int $subtemaId): ?object
    {
        return DB::selectOne("
        SELECT modulo_id
        FROM math.subtemas
        WHERE id = ?
    ", [$subtemaId]);
    }

    // Cancela cualquier ruta activa anterior del estudiante
    public function desactivarRutasAnteriores(int $estudianteId): void
    {
        DB::statement("
        UPDATE math.rutas_aprendizaje
        SET activa = false,
            fecha_actualizacion = NOW()
        WHERE estudiante_id = ?
          AND activa = true
    ", [$estudianteId]);
    }

    // Crea la cabecera de la ruta
    public function crearRuta(int $estudianteId, int $intentoId): int
    {
        $r = DB::selectOne("
        INSERT INTO math.rutas_aprendizaje
            (estudiante_id, intento_diagnostico_id, activa, fecha_generacion, fecha_actualizacion)
        VALUES (?, ?, true, NOW(), NOW())
        RETURNING id
    ", [$estudianteId, $intentoId]);

        return $r->id;
    }

    // Inserta un ítem en el detalle de la ruta
    public function insertarDetalleRuta(
        int    $rutaId,
        int    $moduloId,
        int    $subtemaId,
        int    $prioridadModulo,
        int    $prioridadSubtema,
        string $origen
    ): void {
        DB::statement("
        INSERT INTO math.ruta_aprendizaje_detalle
            (ruta_id, modulo_id, subtema_id, prioridad_modulo, prioridad_subtema, origen, estado)
        VALUES (?, ?, ?, ?, ?, ?, 'PENDIENTE')
        ON CONFLICT DO NOTHING
    ", [$rutaId, $moduloId, $subtemaId, $prioridadModulo, $prioridadSubtema, $origen]);
    }

    // Obtiene la ruta activa de un estudiante con su detalle
    public function obtenerRutaActiva(int $estudianteId): ?object
    {
        return DB::selectOne("
        SELECT id, intento_diagnostico_id, fecha_generacion
        FROM math.rutas_aprendizaje
        WHERE estudiante_id = ?
          AND activa = true
        ORDER BY fecha_generacion DESC
        LIMIT 1
    ", [$estudianteId]);
    }

    // Obtiene el detalle de una ruta
    public function obtenerDetalleRuta(int $rutaId): array
    {
        return DB::select("
        SELECT
            rad.id,
            rad.modulo_id,
            m.nombre    AS modulo_nombre,
            rad.subtema_id,
            s.nombre    AS subtema_nombre,
            rad.prioridad_modulo,
            rad.prioridad_subtema,
            rad.origen,
            rad.estado,
            rad.fecha_completado
        FROM math.ruta_aprendizaje_detalle rad
        JOIN math.modulos_tematicos m ON m.id = rad.modulo_id
        JOIN math.subtemas s          ON s.id = rad.subtema_id
        WHERE rad.ruta_id = ?
        ORDER BY rad.prioridad_modulo, rad.prioridad_subtema
    ", [$rutaId]);
    }

    // Obtiene las horas disponibles por semana del estudiante
    public function obtenerHorasDisponibles(int $estudianteId): float
    {
        $r = DB::selectOne("
        SELECT horas_disponibles_semana
        FROM math.perfiles_estudiante
        WHERE usuario_id = ?
    ", [$estudianteId]);

        return $r ? (float) $r->horas_disponibles_semana : 10.0;
    }

    public function actualizarHorasDisponibles(int $estudianteId, float $horas): void
    {
        DB::update("
        UPDATE math.perfiles_estudiante
        SET horas_disponibles_semana = ?
        WHERE usuario_id = ?
    ", [$horas, $estudianteId]);
    }

    // Obtiene los subtemas PENDIENTES de la ruta activa
    public function obtenerSubtemasPendientes(int $rutaId): array
    {
        return DB::select("
        SELECT
            rad.id          AS detalle_id,
            rad.subtema_id,
            s.nombre        AS subtema_nombre,
            rad.modulo_id,
            m.nombre        AS modulo_nombre,
            rad.prioridad_modulo,
            rad.prioridad_subtema,
            s.orden_complejidad,
            COALESCE(
                (SELECT AVG(e.tiempo_estimado_minutos) * 5
                 FROM math.ejercicios e
                 WHERE e.subtema_id = rad.subtema_id
                   AND e.estado = 'PUBLICADO'),
                30
            ) AS tiempo_estimado_minutos
        FROM math.ruta_aprendizaje_detalle rad
        JOIN math.subtemas s
            ON s.id = rad.subtema_id
        JOIN math.modulos_tematicos m
            ON m.id = rad.modulo_id
        WHERE rad.ruta_id = ?
          AND rad.estado = 'PENDIENTE'
        ORDER BY rad.prioridad_modulo, rad.prioridad_subtema
    ", [$rutaId]);
    }

    // Verifica si ya existe un plan para esa semana
    public function planExiste(int $estudianteId, string $semanaInicio): bool
    {
        $r = DB::selectOne("
        SELECT id FROM math.planes_estudio_semanal
        WHERE estudiante_id = ?
          AND semana_inicio  = ?
    ", [$estudianteId, $semanaInicio]);

        return !is_null($r);
    }

    // Elimina el plan existente para regenerarlo
    public function eliminarPlan(int $estudianteId, string $semanaInicio): void
    {
        DB::statement("
        DELETE FROM math.planes_estudio_semanal
        WHERE estudiante_id = ?
          AND semana_inicio  = ?
    ", [$estudianteId, $semanaInicio]);
    }

    // Crea la cabecera del plan semanal
    public function crearPlanSemanal(int $estudianteId, int $rutaId, string $semanaInicio): int
    {
        $r = DB::selectOne("
        INSERT INTO math.planes_estudio_semanal
            (estudiante_id, ruta_id, semana_inicio, fecha_generacion)
        VALUES (?, ?, ?, NOW())
        RETURNING id
    ", [$estudianteId, $rutaId, $semanaInicio]);

        return $r->id;
    }

    // Inserta un día del plan
    public function insertarDiaPlan(
        int $planId,
        int $diaSemana,
        int $subtemaId,
        int $ejerciciosRecomendados,
        int $tiempoEstimado
    ): void {
        DB::statement("
        INSERT INTO math.plan_estudio_dia
            (plan_id, dia_semana, subtema_id, ejercicios_recomendados, tiempo_estimado_minutos)
        VALUES (?, ?, ?, ?, ?)
    ", [$planId, $diaSemana, $subtemaId, $ejerciciosRecomendados, $tiempoEstimado]);
    }

    // Obtiene el plan semanal con sus días
    public function obtenerPlanConDias(int $planId): array
    {
        return DB::select("
        SELECT
            ped.dia_semana,
            ped.subtema_id,
            s.nombre AS subtema_nombre,
            s.modulo_id AS modulo_id,
            m.nombre AS modulo_nombre,
            ped.ejercicios_recomendados,
            ped.tiempo_estimado_minutos
        FROM math.plan_estudio_dia ped
        JOIN math.subtemas s
            ON s.id = ped.subtema_id
        JOIN math.modulos_tematicos m
            ON m.id = s.modulo_id
        WHERE ped.plan_id = ?
        ORDER BY ped.dia_semana
    ", [$planId]);
    }

    // Obtiene el plan activo de la semana actual
    public function obtenerPlanActual(int $estudianteId): ?object
    {
        return DB::selectOne("
        SELECT id, ruta_id, semana_inicio, fecha_generacion
        FROM math.planes_estudio_semanal
        WHERE estudiante_id = ?
        ORDER BY semana_inicio DESC
        LIMIT 1
    ", [$estudianteId]);
    }
}
