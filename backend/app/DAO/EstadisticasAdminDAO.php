<?php

namespace App\DAO;

use Illuminate\Support\Facades\DB;

class EstadisticasAdminDAO
{
    // ── Métricas globales ────────────────────────────────────────────────────

    public function metricasGlobales(): array
    {
        $usuarios = DB::selectOne("
            SELECT
                COUNT(*)                                          AS total,
                COUNT(CASE WHEN activo = TRUE  THEN 1 END)       AS activos,
                COUNT(CASE WHEN activo = FALSE THEN 1 END)       AS inactivos,
                COUNT(CASE WHEN fecha_creacion >= NOW() - INTERVAL '30 days' THEN 1 END)
                                                                  AS nuevos_30_dias
            FROM usuarios
        ");

        $ejercicios = DB::selectOne("
            SELECT
                COUNT(*)                                                        AS total,
                COUNT(CASE WHEN estado = 'PUBLICADO'    THEN 1 END)            AS publicados,
                COUNT(CASE WHEN estado = 'EN_REVISION'  THEN 1 END)            AS en_revision,
                COUNT(CASE WHEN estado = 'BORRADOR'     THEN 1 END)            AS borradores,
                COUNT(CASE WHEN estado = 'DESHABILITADO' THEN 1 END)           AS deshabilitados,
                COUNT(CASE WHEN estado = 'APROBADO'     THEN 1 END)            AS aprobados
            FROM ejercicios
        ");

        $practica = DB::selectOne("
            SELECT
                COUNT(rp.id)  AS total_respuestas,
                COUNT(sp.id)  AS total_sesiones,
                COUNT(DISTINCT sp.estudiante_id) AS estudiantes_activos
            FROM sesiones_practica sp
            LEFT JOIN respuestas_practica rp ON rp.sesion_practica_id = sp.id
            WHERE sp.fecha_inicio >= NOW() - INTERVAL '30 days'
        ");

        $simulacros = DB::selectOne("
            SELECT
                COUNT(*)                                                AS total,
                COUNT(CASE WHEN estado = 'FINALIZADO' THEN 1 END)      AS finalizados,
                ROUND(AVG(CASE WHEN estado = 'FINALIZADO'
                    THEN puntaje_total END), 2)                         AS promedio_puntaje
            FROM simulacros
        ");

        $recursos = DB::selectOne("
            SELECT
                COUNT(*) AS total,
                COUNT(CASE WHEN estado = 'PUBLICADO'   THEN 1 END) AS publicados,
                COUNT(CASE WHEN estado = 'EN_REVISION' THEN 1 END) AS en_revision,
                COUNT(CASE WHEN estado = 'BORRADOR'    THEN 1 END) AS borradores
            FROM recursos_educativos
        ");

        return [
            'usuarios' => [
                'total'        => (int) $usuarios->total,
                'activos'      => (int) $usuarios->activos,
                'inactivos'    => (int) $usuarios->inactivos,
                'nuevos_30_dias' => (int) $usuarios->nuevos_30_dias,
            ],
            'ejercicios' => [
                'total'          => (int) $ejercicios->total,
                'publicados'     => (int) $ejercicios->publicados,
                'en_revision'    => (int) $ejercicios->en_revision,
                'borradores'     => (int) $ejercicios->borradores,
                'deshabilitados' => (int) $ejercicios->deshabilitados,
                'aprobados'      => (int) $ejercicios->aprobados,
            ],
            'practica_30_dias' => [
                'total_respuestas'   => (int) $practica->total_respuestas,
                'total_sesiones'     => (int) $practica->total_sesiones,
                'estudiantes_activos'=> (int) $practica->estudiantes_activos,
            ],
            'simulacros' => [
                'total'           => (int)   $simulacros->total,
                'finalizados'     => (int)   $simulacros->finalizados,
                'promedio_puntaje'=> (float) ($simulacros->promedio_puntaje ?? 0),
            ],
            'recursos' => [
                'total'       => (int) $recursos->total,
                'publicados'  => (int) $recursos->publicados,
                'en_revision' => (int) $recursos->en_revision,
                'borradores'  => (int) $recursos->borradores,
            ],
        ];
    }

    // ── Usuarios por rol ─────────────────────────────────────────────────────

    public function usuariosPorRol(): array
    {
        $rows = DB::select("
            SELECT
                r.codigo,
                r.nombre,
                COUNT(u.id)                                              AS total,
                COUNT(CASE WHEN u.activo = TRUE THEN 1 END)             AS activos,
                COUNT(CASE WHEN u.fecha_creacion >= NOW() - INTERVAL '30 days'
                    THEN 1 END)                                          AS nuevos_30_dias
            FROM roles r
            LEFT JOIN usuarios u ON u.rol_id = r.id
            GROUP BY r.id, r.codigo, r.nombre
            ORDER BY total DESC
        ");

        return array_map(fn($r) => [
            'codigo'        => $r->codigo,
            'nombre'        => $r->nombre,
            'total'         => (int) $r->total,
            'activos'       => (int) $r->activos,
            'nuevos_30_dias'=> (int) $r->nuevos_30_dias,
        ], $rows);
    }

    // ── Actividad reciente del sistema ───────────────────────────────────────

    public function actividadReciente(int $limite = 20): array
    {
        $rows = DB::select("
            SELECT
                aa.id,
                aa.entidad,
                aa.accion,
                aa.fecha_evento,
                aa.detalle,
                u.nombres,
                u.apellidos,
                r.codigo AS rol_codigo
            FROM auditoria_actividad aa
            LEFT JOIN usuarios u ON u.id = aa.usuario_id
            LEFT JOIN roles r   ON r.id = u.rol_id
            ORDER BY aa.fecha_evento DESC
            LIMIT ?
        ", [$limite]);

        return array_map(fn($r) => [
            'id'          => $r->id,
            'entidad'     => $r->entidad,
            'accion'      => $r->accion,
            'fecha_evento'=> $r->fecha_evento,
            'usuario'     => $r->nombres
                ? trim("{$r->nombres} {$r->apellidos}")
                : 'Sistema',
            'rol'         => $r->rol_codigo ?? '—',
            'detalle'     => $r->detalle ? json_decode($r->detalle, true) : null,
        ], $rows);
    }

    // ── Crecimiento de usuarios semana a semana ──────────────────────────────

    public function crecimientoUsuarios(int $semanas = 12): array
    {
        $rows = DB::select("
            SELECT
                DATE_TRUNC('week', fecha_creacion) AS semana,
                COUNT(*)                            AS nuevos_usuarios,
                COUNT(CASE WHEN r.codigo = 'ESTUDIANTE' THEN 1 END) AS estudiantes,
                COUNT(CASE WHEN r.codigo = 'TUTOR'      THEN 1 END) AS tutores
            FROM usuarios u
            JOIN roles r ON r.id = u.rol_id
            WHERE fecha_creacion >= NOW() - INTERVAL '{$semanas} weeks'
            GROUP BY DATE_TRUNC('week', fecha_creacion)
            ORDER BY semana ASC
        ");

        return array_map(fn($r) => [
            'semana'          => date('d/m', strtotime($r->semana)),
            'nuevos_usuarios' => (int) $r->nuevos_usuarios,
            'estudiantes'     => (int) $r->estudiantes,
            'tutores'         => (int) $r->tutores,
        ], $rows);
    }

    // ── Actividad de práctica diaria (últimos 30 días) ───────────────────────

    public function actividadDiaria30Dias(): array
    {
        $rows = DB::select("
            SELECT
                DATE(sp.fecha_inicio)               AS fecha,
                COUNT(sp.id)                        AS total_sesiones,
                COUNT(DISTINCT sp.estudiante_id)    AS estudiantes_unicos,
                COUNT(rp.id)                        AS total_respuestas
            FROM sesiones_practica sp
            LEFT JOIN respuestas_practica rp ON rp.sesion_practica_id = sp.id
            WHERE sp.fecha_inicio >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(sp.fecha_inicio)
            ORDER BY fecha ASC
        ");

        return array_map(fn($r) => [
            'fecha'              => date('d/m', strtotime($r->fecha)),
            'total_sesiones'     => (int) $r->total_sesiones,
            'estudiantes_unicos' => (int) $r->estudiantes_unicos,
            'total_respuestas'   => (int) $r->total_respuestas,
        ], $rows);
    }

    // ── Reporte CSV de uso por rol ───────────────────────────────────────────

    public function reporteUsoCompleto(): array
    {
        return DB::select("
            SELECT
                u.id,
                u.nombres,
                u.apellidos,
                u.correo,
                r.nombre        AS rol,
                u.activo,
                u.fecha_creacion,
                u.ultimo_login_at,
                (
                    SELECT COUNT(sp.id)
                    FROM sesiones_practica sp
                    WHERE sp.estudiante_id = u.id
                      AND sp.fecha_fin IS NOT NULL
                ) AS sesiones_practica,
                (
                    SELECT COUNT(s.id)
                    FROM simulacros s
                    WHERE s.estudiante_id = u.id
                      AND s.estado = 'FINALIZADO'
                ) AS simulacros_finalizados,
                (
                    SELECT COUNT(ej.id)
                    FROM ejercicios ej
                    WHERE ej.tutor_id = u.id
                      AND ej.estado = 'PUBLICADO'
                ) AS ejercicios_publicados
            FROM usuarios u
            JOIN roles r ON r.id = u.rol_id
            ORDER BY r.nombre, u.apellidos, u.nombres
        ");
    }
}