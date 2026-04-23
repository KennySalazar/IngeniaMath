<?php

namespace App\DAO;

use Illuminate\Support\Facades\DB;

class SimulacroDAO
{
    public function obtenerConfiguracionActiva(): ?object
    {
        return DB::selectOne("
            SELECT
                cs.id,
                cs.nombre,
                cs.duracion_minutos,
                cs.cantidad_preguntas,
                cs.puntaje_minimo_aprobacion,
                cs.activa,
                cs.fecha_creacion
            FROM math.configuraciones_simulacro cs
            WHERE cs.activa = true
            ORDER BY cs.fecha_creacion DESC, cs.id DESC
            LIMIT 1
        ");
    }

    public function obtenerDistribucionConfiguracion(int $configuracionId): array
    {
        return DB::select("
            SELECT
                csm.modulo_id,
                m.nombre AS modulo_nombre,
                csm.cantidad_preguntas
            FROM math.configuracion_simulacro_modulo csm
            JOIN math.modulos_tematicos m ON m.id = csm.modulo_id
            WHERE csm.configuracion_simulacro_id = ?
              AND csm.cantidad_preguntas > 0
            ORDER BY m.id
        ", [$configuracionId]);
    }

    public function contarEjerciciosPublicadosModulo(int $moduloId): int
    {
        $r = DB::selectOne("
            SELECT COUNT(*)::int AS total
            FROM math.ejercicios
            WHERE modulo_id = ?
              AND estado = 'PUBLICADO'
        ", [$moduloId]);

        return (int) ($r->total ?? 0);
    }

    public function obtenerEjerciciosAleatoriosModulo(int $moduloId, int $cantidad): array
    {
        return DB::select("
            SELECT id
            FROM math.ejercicios
            WHERE modulo_id = ?
              AND estado = 'PUBLICADO'
            ORDER BY RANDOM()
            LIMIT ?
        ", [$moduloId, $cantidad]);
    }

    public function crearSimulacro(
        int $configuracionId,
        int $estudianteId,
        float $puntajeMinimoReferencia
    ): int {
        $r = DB::selectOne("
            INSERT INTO math.simulacros
                (configuracion_simulacro_id, estudiante_id, estado, puntaje_minimo_referencia, fecha_inicio)
            VALUES (?, ?, 'EN_PROCESO', ?, NOW())
            RETURNING id
        ", [$configuracionId, $estudianteId, $puntajeMinimoReferencia]);

        return (int) $r->id;
    }

    public function insertarPreguntaSimulacro(int $simulacroId, int $ejercicioId, int $ordenPregunta): void
    {
        DB::statement("
            INSERT INTO math.simulacro_preguntas
                (simulacro_id, ejercicio_id, orden_pregunta)
            VALUES (?, ?, ?)
        ", [$simulacroId, $ejercicioId, $ordenPregunta]);
    }

    public function obtenerSimulacroActivo(int $estudianteId): ?object
    {
        return DB::selectOne("
            SELECT
                s.id,
                s.configuracion_simulacro_id,
                s.estudiante_id,
                s.estado,
                s.puntaje_total,
                s.puntaje_minimo_referencia,
                s.aprueba_referencia,
                s.duracion_minutos_real,
                s.fecha_inicio,
                s.fecha_fin,
                cs.nombre AS configuracion_nombre,
                cs.duracion_minutos,
                cs.cantidad_preguntas
            FROM math.simulacros s
            JOIN math.configuraciones_simulacro cs ON cs.id = s.configuracion_simulacro_id
            WHERE s.estudiante_id = ?
              AND s.estado = 'EN_PROCESO'
              AND s.fecha_fin IS NULL
            ORDER BY s.fecha_inicio DESC
            LIMIT 1
        ", [$estudianteId]);
    }

    public function obtenerSimulacroPorId(int $simulacroId, int $estudianteId): ?object
    {
        return DB::selectOne("
            SELECT
                s.id,
                s.configuracion_simulacro_id,
                s.estudiante_id,
                s.estado,
                s.puntaje_total,
                s.puntaje_minimo_referencia,
                s.aprueba_referencia,
                s.duracion_minutos_real,
                s.fecha_inicio,
                s.fecha_fin,
                cs.nombre AS configuracion_nombre,
                cs.duracion_minutos,
                cs.cantidad_preguntas
            FROM math.simulacros s
            JOIN math.configuraciones_simulacro cs ON cs.id = s.configuracion_simulacro_id
            WHERE s.id = ?
              AND s.estudiante_id = ?
            LIMIT 1
        ", [$simulacroId, $estudianteId]);
    }

    public function obtenerProgresoSimulacro(int $simulacroId): object
    {
        return DB::selectOne("
            SELECT
                COUNT(*)::int AS total_preguntas,
                COALESCE(SUM(CASE WHEN sp.es_correcta IS NOT NULL THEN 1 ELSE 0 END), 0)::int AS respondidas,
                COALESCE(SUM(CASE WHEN sp.es_correcta = true THEN 1 ELSE 0 END), 0)::int AS correctas,
                COALESCE(SUM(CASE WHEN sp.es_correcta IS NULL THEN 1 ELSE 0 END), 0)::int AS pendientes
            FROM math.simulacro_preguntas sp
            WHERE sp.simulacro_id = ?
        ", [$simulacroId]);
    }

    public function obtenerPreguntaActual(int $simulacroId): ?object
    {
        return DB::selectOne("
            SELECT
                sp.id AS simulacro_pregunta_id,
                sp.simulacro_id,
                sp.ejercicio_id,
                sp.orden_pregunta,
                e.modulo_id,
                m.nombre AS modulo_nombre,
                e.subtema_id,
                s.nombre AS subtema_nombre,
                e.nivel_dificultad,
                e.tipo_ejercicio,
                e.enunciado,
                e.imagen_apoyo_url,
                e.tiempo_estimado_minutos
            FROM math.simulacro_preguntas sp
            JOIN math.ejercicios e ON e.id = sp.ejercicio_id
            JOIN math.modulos_tematicos m ON m.id = e.modulo_id
            LEFT JOIN math.subtemas s ON s.id = e.subtema_id
            WHERE sp.simulacro_id = ?
              AND sp.es_correcta IS NULL
            ORDER BY sp.orden_pregunta ASC
            LIMIT 1
        ", [$simulacroId]);
    }

    public function obtenerOpcionesEjercicio(int $ejercicioId): array
    {
        return DB::select("
            SELECT
                id,
                orden_opcion,
                texto_opcion
            FROM math.opciones_ejercicio
            WHERE ejercicio_id = ?
            ORDER BY orden_opcion
        ", [$ejercicioId]);
    }

    public function obtenerEjercicioParaEvaluar(int $ejercicioId): ?object
    {
        return DB::selectOne("
            SELECT
                e.id,
                e.tipo_ejercicio,
                e.respuesta_correcta_texto
            FROM math.ejercicios e
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

    public function registrarRespuestaPregunta(
        int $simulacroId,
        int $ejercicioId,
        ?int $opcionId,
        ?string $respuestaTexto,
        bool $esCorrecta
    ): void {
        DB::update("
            UPDATE math.simulacro_preguntas
            SET
                opcion_id = ?,
                respuesta_texto = ?,
                es_correcta = ?,
                fecha_respuesta = NOW()
            WHERE simulacro_id = ?
              AND ejercicio_id = ?
              AND es_correcta IS NULL
        ", [$opcionId, $respuestaTexto, $esCorrecta, $simulacroId, $ejercicioId]);
    }

    public function eliminarResultadosModulo(int $simulacroId): void
    {
        DB::delete("
            DELETE FROM math.simulacro_resultados_modulo
            WHERE simulacro_id = ?
        ", [$simulacroId]);
    }

    public function obtenerResultadosAgrupadosPorModulo(int $simulacroId): array
    {
        return DB::select("
            SELECT
                e.modulo_id,
                COUNT(*)::int AS total_preguntas,
                COALESCE(SUM(CASE WHEN sp.es_correcta = true THEN 1 ELSE 0 END), 0)::int AS total_correctas
            FROM math.simulacro_preguntas sp
            JOIN math.ejercicios e ON e.id = sp.ejercicio_id
            WHERE sp.simulacro_id = ?
            GROUP BY e.modulo_id
            ORDER BY e.modulo_id
        ", [$simulacroId]);
    }

    public function insertarResultadoModulo(
        int $simulacroId,
        int $moduloId,
        int $totalPreguntas,
        int $totalCorrectas,
        float $puntajePorcentaje
    ): void {
        DB::statement("
            INSERT INTO math.simulacro_resultados_modulo
                (simulacro_id, modulo_id, total_preguntas, total_correctas, puntaje_porcentaje)
            VALUES (?, ?, ?, ?, ?)
        ", [$simulacroId, $moduloId, $totalPreguntas, $totalCorrectas, $puntajePorcentaje]);
    }

    public function cerrarSimulacro(
        int $simulacroId,
        string $estado,
        float $puntajeTotal,
        bool $apruebaReferencia,
        int $duracionMinutosReal
    ): void {
        DB::update("
            UPDATE math.simulacros
            SET
                estado = ?,
                puntaje_total = ?,
                aprueba_referencia = ?,
                duracion_minutos_real = ?,
                fecha_fin = NOW()
            WHERE id = ?
        ", [$estado, $puntajeTotal, $apruebaReferencia, $duracionMinutosReal, $simulacroId]);
    }

    public function obtenerResultadosPorModulo(int $simulacroId): array
    {
        return DB::select("
            SELECT
                srm.modulo_id,
                m.nombre AS modulo_nombre,
                srm.total_preguntas,
                srm.total_correctas,
                srm.puntaje_porcentaje
            FROM math.simulacro_resultados_modulo srm
            JOIN math.modulos_tematicos m ON m.id = srm.modulo_id
            WHERE srm.simulacro_id = ?
            ORDER BY srm.modulo_id
        ", [$simulacroId]);
    }

    public function obtenerPreguntasIncorrectas(int $simulacroId): array
    {
        return DB::select("
            SELECT
                sp.ejercicio_id,
                sp.orden_pregunta,
                e.modulo_id,
                m.nombre AS modulo_nombre,
                e.subtema_id,
                s.nombre AS subtema_nombre,
                e.tipo_ejercicio,
                e.enunciado,
                e.imagen_apoyo_url,
                e.respuesta_correcta_texto,
                e.solucion_paso_a_paso,
                e.explicacion_conceptual,
                COALESCE(oe.texto_opcion, sp.respuesta_texto) AS respuesta_usuario
            FROM math.simulacro_preguntas sp
            JOIN math.ejercicios e ON e.id = sp.ejercicio_id
            JOIN math.modulos_tematicos m ON m.id = e.modulo_id
            LEFT JOIN math.subtemas s ON s.id = e.subtema_id
            LEFT JOIN math.opciones_ejercicio oe ON oe.id = sp.opcion_id
            WHERE sp.simulacro_id = ?
              AND sp.es_correcta = false
            ORDER BY sp.orden_pregunta
        ", [$simulacroId]);
    }

    public function obtenerHistorialSimulacros(int $estudianteId): array
    {
        return DB::select("
            SELECT
                s.id,
                s.estado,
                s.puntaje_total,
                s.puntaje_minimo_referencia,
                s.aprueba_referencia,
                s.duracion_minutos_real,
                s.fecha_inicio,
                s.fecha_fin,
                cs.nombre AS configuracion_nombre,
                cs.duracion_minutos,
                cs.cantidad_preguntas
            FROM math.simulacros s
            JOIN math.configuraciones_simulacro cs ON cs.id = s.configuracion_simulacro_id
            WHERE s.estudiante_id = ?
            ORDER BY s.fecha_inicio DESC, s.id DESC
        ", [$estudianteId]);
    }

    

    public function obtenerHistorialResultadosPorModulo(int $estudianteId): array
{
    return DB::select("
        SELECT
            s.id AS simulacro_id,
            s.estado,
            s.fecha_inicio,
            s.fecha_fin,
            srm.modulo_id,
            m.nombre AS modulo_nombre,
            srm.total_preguntas,
            srm.total_correctas,
            srm.puntaje_porcentaje
        FROM math.simulacro_resultados_modulo srm
        JOIN math.simulacros s ON s.id = srm.simulacro_id
        JOIN math.modulos_tematicos m ON m.id = srm.modulo_id
        WHERE s.estudiante_id = ?
          AND s.fecha_fin IS NOT NULL
          AND s.estado IN ('FINALIZADO', 'EXPIRADO')
        ORDER BY s.fecha_inicio ASC, s.id ASC, srm.modulo_id ASC
    ", [$estudianteId]);
}

    public function historial(int $estudianteId): array
{
    $items = [];

    foreach ($this->dao->obtenerHistorialSimulacros($estudianteId) as $item) {
        $items[] = $this->formatearHistorial($item);
    }

    $insights = $this->calcularInsightsModulos($estudianteId);

    return [
        'items' => $items,
        'total' => count($items),
        'insights' => $insights,
    ];
}



    
}