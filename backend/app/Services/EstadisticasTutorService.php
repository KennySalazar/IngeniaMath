<?php

namespace App\Services;

use App\DAO\EstadisticasTutorDAO;

class EstadisticasTutorService
{
    public function __construct(private EstadisticasTutorDAO $dao) {}

    public function dashboardTutor(int $tutorId): array
    {
        return [
            'metricas'          => $this->dao->metricasGrupales($tutorId),
            'estudiantes'       => $this->dao->estudiantesAsignados($tutorId),
            'modulos_error'     => $this->dao->modulosMayorErrorGrupal($tutorId),
            'ejercicios_dificiles' => $this->dao->ejerciciosMasDificiles($tutorId),
            'progreso_semanal'  => $this->dao->progresoGrupalSemanal($tutorId),
        ];
    }

    // ── Reporte CSV exportable ───────────────────────────────────────────────

    public function generarReporteCsv(int $tutorId): string
    {
        $estudiantes = $this->dao->estudiantesAsignados($tutorId);

        $cabecera = [
            'Nombre', 'Correo', 'Ejercicios resueltos',
            '% Aciertos', 'Simulacros', 'Promedio simulacros',
            'Racha (días)', 'Última actividad',
        ];

        $filas = array_map(fn($e) => [
            $e['nombre'],
            $e['correo'],
            $e['total_ejercicios'],
            $e['porcentaje_aciertos'] . '%',
            $e['total_simulacros'],
            $e['promedio_simulacros'] . '%',
            $e['racha_actual_dias'],
            $e['ultima_actividad']
                ? date('d/m/Y H:i', strtotime($e['ultima_actividad']))
                : 'Sin actividad',
        ], $estudiantes);

        $output  = implode(',', $cabecera) . "\n";
        $output .= implode("\n", array_map(
            fn($f) => implode(',', array_map(
                fn($v) => '"' . str_replace('"', '""', $v) . '"',
                $f
            )),
            $filas
        ));

        return $output;
    }
}