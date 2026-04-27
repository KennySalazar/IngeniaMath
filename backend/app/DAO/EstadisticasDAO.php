<?php

namespace App\DAO;

use Illuminate\Support\Facades\DB;

class EstadisticasDAO
{
    // ── Métricas numéricas generales ─────────────────────────────────────────

    public function totalEjerciciosResueltos(int $estudianteId): int
    {
        return (int) DB::table('respuestas_practica as rp')
            ->join('sesiones_practica as sp', 'rp.sesion_practica_id', '=', 'sp.id')
            ->where('sp.estudiante_id', $estudianteId)
            ->count('rp.id');
    }

    public function totalSimulacrosRealizados(int $estudianteId): int
    {
        return (int) DB::table('simulacros')
            ->where('estudiante_id', $estudianteId)
            ->where('estado', 'FINALIZADO')
            ->count();
    }

    public function puntajePromedioSimulacros(int $estudianteId): float
    {
        $promedio = DB::table('simulacros')
            ->where('estudiante_id', $estudianteId)
            ->where('estado', 'FINALIZADO')
            ->whereNotNull('puntaje_total')
            ->avg('puntaje_total');

        return round((float) ($promedio ?? 0), 2);
    }

    public function rachaActual(int $estudianteId): int
    {
        return (int) DB::table('perfiles_estudiante')
            ->where('usuario_id', $estudianteId)
            ->value('racha_actual_dias') ?? 0;
    }

    public function modulosRuta(int $estudianteId): array
    {
        $ruta = DB::table('rutas_aprendizaje')
            ->where('estudiante_id', $estudianteId)
            ->where('activa', true)
            ->first();

        if (!$ruta) return ['completados' => 0, 'pendientes' => 0, 'total' => 0];

        $completados = DB::table('ruta_aprendizaje_detalle')
            ->where('ruta_id', $ruta->id)
            ->where('estado', 'COMPLETADO')
            ->distinct('modulo_id')
            ->count('modulo_id');

        $total = DB::table('ruta_aprendizaje_detalle')
            ->where('ruta_id', $ruta->id)
            ->distinct('modulo_id')
            ->count('modulo_id');

        return [
            'completados' => $completados,
            'pendientes'  => $total - $completados,
            'total'       => $total,
        ];
    }

    // ── Radar: dominio por módulo ─────────────────────────────────────────────

    public function dominioporModulo(int $estudianteId): array
{
    $rows = DB::select("
        SELECT
            m.id   AS modulo_id,
            m.nombre AS modulo_nombre,
            COALESCE(
                ROUND(
                    COUNT(CASE WHEN rp.es_correcta THEN 1 END) * 100.0
                    / NULLIF(COUNT(rp.id), 0)
                , 2)
            , 0) AS porcentaje_dominio
        FROM modulos_tematicos m
        LEFT JOIN ejercicios ej      ON ej.modulo_id = m.id
        LEFT JOIN respuestas_practica rp ON rp.ejercicio_id = ej.id
        LEFT JOIN sesiones_practica sp   ON sp.id = rp.sesion_practica_id
            AND sp.estudiante_id = ?
        GROUP BY m.id, m.nombre, m.orden
        ORDER BY m.orden
    ", [$estudianteId]);

    return array_map(fn($r) => [
        'modulo_id'          => $r->modulo_id,
        'modulo_nombre'      => $r->modulo_nombre,
        'porcentaje_dominio' => (float) $r->porcentaje_dominio,
    ], $rows);
}

    // ── Línea de tiempo: progreso semanal ────────────────────────────────────

    public function progresoSemanal(int $estudianteId, int $semanas = 10): array
    {
        return DB::select("
            SELECT
                DATE_TRUNC('week', sp.fecha_inicio) AS semana,
                ROUND(AVG(sp.porcentaje_aciertos), 2) AS promedio_aciertos,
                COUNT(sp.id) AS total_sesiones
            FROM sesiones_practica sp
            WHERE sp.estudiante_id = ?
              AND sp.fecha_fin IS NOT NULL
              AND sp.fecha_inicio >= NOW() - INTERVAL '{$semanas} weeks'
            GROUP BY DATE_TRUNC('week', sp.fecha_inicio)
            ORDER BY semana ASC
        ", [$estudianteId]);
    }

    // ── Heatmap: actividad diaria últimos 365 días ───────────────────────────

    public function actividadDiaria(int $estudianteId): array
    {
        $rows = DB::select("
            SELECT
                DATE(sp.fecha_inicio) AS fecha,
                COUNT(rp.id)          AS total_respuestas,
                COUNT(CASE WHEN rp.es_correcta THEN 1 END) AS correctas
            FROM sesiones_practica sp
            JOIN respuestas_practica rp ON rp.sesion_practica_id = sp.id
            WHERE sp.estudiante_id = ?
              AND sp.fecha_inicio >= NOW() - INTERVAL '365 days'
            GROUP BY DATE(sp.fecha_inicio)
            ORDER BY fecha ASC
        ", [$estudianteId]);

        return array_map(fn($r) => [
            'fecha'             => $r->fecha,
            'total_respuestas'  => (int) $r->total_respuestas,
            'correctas'         => (int) $r->correctas,
            // Nivel de intensidad 0-4 para el heatmap
            'nivel' => match(true) {
                $r->total_respuestas === 0  => 0,
                $r->total_respuestas <= 5   => 1,
                $r->total_respuestas <= 15  => 2,
                $r->total_respuestas <= 30  => 3,
                default                     => 4,
            },
        ], $rows);
    }

    // ── Barras: aciertos por módulo ──────────────────────────────────────────

    public function aciertosporModulo(int $estudianteId): array
    {
        return DB::select("
            SELECT
                m.id   AS modulo_id,
                m.nombre AS modulo_nombre,
                COUNT(rp.id) AS total_respuestas,
                COUNT(CASE WHEN rp.es_correcta THEN 1 END) AS total_correctas,
                ROUND(
                    COUNT(CASE WHEN rp.es_correcta THEN 1 END) * 100.0
                    / NULLIF(COUNT(rp.id), 0)
                , 2) AS porcentaje_aciertos
            FROM modulos_tematicos m
            LEFT JOIN ejercicios ej ON ej.modulo_id = m.id
            LEFT JOIN respuestas_practica rp ON rp.ejercicio_id = ej.id
            LEFT JOIN sesiones_practica sp ON sp.id = rp.sesion_practica_id
                AND sp.estudiante_id = ?
            GROUP BY m.id, m.nombre, m.orden
            ORDER BY m.orden
        ", [$estudianteId]);
    }

    // ── Top 3 módulos con mayor tasa de error ────────────────────────────────

    public function topModulosConError(int $estudianteId, int $top = 3): array
    {
        $rows = DB::select("
            SELECT
                m.id   AS modulo_id,
                m.nombre AS modulo_nombre,
                COUNT(rp.id) AS total_respuestas,
                COUNT(CASE WHEN NOT rp.es_correcta THEN 1 END) AS total_errores,
                ROUND(
                    COUNT(CASE WHEN NOT rp.es_correcta THEN 1 END) * 100.0
                    / NULLIF(COUNT(rp.id), 0)
                , 2) AS tasa_error
            FROM modulos_tematicos m
            JOIN ejercicios ej ON ej.modulo_id = m.id
            JOIN respuestas_practica rp ON rp.ejercicio_id = ej.id
            JOIN sesiones_practica sp ON sp.id = rp.sesion_practica_id
                AND sp.estudiante_id = ?
            GROUP BY m.id, m.nombre
            HAVING COUNT(rp.id) >= 5
            ORDER BY tasa_error DESC
            LIMIT ?
        ", [$estudianteId, $top]);

        return array_map(fn($r) => [
            'modulo_id'     => $r->modulo_id,
            'modulo_nombre' => $r->modulo_nombre,
            'total_errores' => (int) $r->total_errores,
            'tasa_error'    => (float) $r->tasa_error,
        ], $rows);
    }
}