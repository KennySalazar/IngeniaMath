<?php

namespace App\Services;

use App\DAO\EstadisticasDAO;

class EstadisticasService
{
    public function __construct(private EstadisticasDAO $dao) {}

    public function dashboardEstudiante(int $estudianteId): array
    {
        return [
            // ── Métricas numéricas ─────────────────────────────────────────
            'metricas' => [
                'total_ejercicios_resueltos' => $this->dao->totalEjerciciosResueltos($estudianteId),
                'total_simulacros'           => $this->dao->totalSimulacrosRealizados($estudianteId),
                'promedio_simulacros'        => $this->dao->puntajePromedioSimulacros($estudianteId),
                'racha_actual_dias'          => $this->dao->rachaActual($estudianteId),
                'modulos_ruta'               => $this->dao->modulosRuta($estudianteId),
            ],

            // ── Gráficos ──────────────────────────────────────────────────
            'radar'           => $this->dao->dominioporModulo($estudianteId),
            'progreso_semanal' => $this->formatearProgresoSemanal(
                                    $this->dao->progresoSemanal($estudianteId)
                                  ),
            'actividad_diaria' => $this->dao->actividadDiaria($estudianteId),
            'aciertos_modulo'  => $this->dao->aciertosporModulo($estudianteId),
            'top_errores'      => $this->dao->topModulosConError($estudianteId),
        ];
    }

    private function formatearProgresoSemanal(array $rows): array
    {
        return array_map(fn($r) => [
            'semana'            => date('d/m', strtotime($r->semana)),
            'promedio_aciertos' => (float) $r->promedio_aciertos,
            'total_sesiones'    => (int)   $r->total_sesiones,
        ], $rows);
    }
}