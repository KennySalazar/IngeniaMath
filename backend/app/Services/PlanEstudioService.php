<?php

namespace App\Services;

use App\DAO\DiagnosticoDAO;
use Illuminate\Support\Collection;

class PlanEstudioService
{
    private const DIAS = [
        1 => 'Lunes',
        2 => 'Martes',
        3 => 'Miércoles',
        4 => 'Jueves',
        5 => 'Viernes',
        6 => 'Sábado',
        7 => 'Domingo',
    ];

    private const MINUTOS_POR_EJERCICIO = 5;

    public function __construct(
        private DiagnosticoDAO $dao,
        private RutaAprendizajeService $rutaService
    ) {}

    public function generar(
        int $estudianteId,
        ?string $semanaInicio = null,
        ?float $horasDisponibles = null
    ): array {
        if (!$semanaInicio) {
            $semanaInicio = $this->obtenerLunesActual();
        }

        $ruta = $this->dao->obtenerRutaActiva($estudianteId);
        if (!$ruta) {
            throw new \Exception('No tienes una ruta de aprendizaje activa.', 404);
        }

        if ($horasDisponibles !== null) {
            if ($horasDisponibles <= 0) {
                throw new \Exception('Las horas disponibles por semana deben ser mayores a 0.', 422);
            }

            $this->dao->actualizarHorasDisponibles($estudianteId, $horasDisponibles);
        }

        $horasSemanales = $this->dao->obtenerHorasDisponibles($estudianteId);
        if (!$horasSemanales || $horasSemanales <= 0) {
            $horasSemanales = 10.0;
        }

        $minutosSemanales = (float) $horasSemanales * 60;

        $subtemasPendientes = $this->dao->obtenerSubtemasPendientes($ruta->id);

        if ($subtemasPendientes instanceof Collection) {
            $subtemasPendientes = $subtemasPendientes->values()->all();
        }

        if (empty($subtemasPendientes)) {
            throw new \Exception('No tienes subtemas pendientes en tu ruta.', 422);
        }

        if ($this->dao->planExiste($estudianteId, $semanaInicio)) {
            $this->dao->eliminarPlan($estudianteId, $semanaInicio);
        }

        $planId = $this->dao->crearPlanSemanal($estudianteId, $ruta->id, $semanaInicio);

        $diasPlan = $this->distribuir($subtemasPendientes, $minutosSemanales);

        foreach ($diasPlan as $dia => $info) {
            $this->dao->insertarDiaPlan(
                $planId,
                $dia,
                $info['subtema_id'],
                $info['ejercicios_recomendados'],
                $info['tiempo_estimado_minutos']
            );
        }

        return $this->formatear($planId, $semanaInicio, (float) $horasSemanales);
    }

    public function obtener(int $estudianteId): array
    {
        $plan = $this->dao->obtenerPlanActual($estudianteId);
        if (!$plan) {
            throw new \Exception('No tienes un plan de estudio generado.', 404);
        }

        $horasSemanales = $this->dao->obtenerHorasDisponibles($estudianteId);
        if (!$horasSemanales || $horasSemanales <= 0) {
            $horasSemanales = 10.0;
        }

        return $this->formatear(
            (int) $plan->id,
            (string) $plan->semana_inicio,
            (float) $horasSemanales
        );
    }

    private function distribuir(array $subtemas, float $minutosSemanales): array
    {
        $diasPlan = [];
        $minutosPorDia = max(15, (int) floor($minutosSemanales / 7));
        $indiceSubtema = 0;
        $totalSubtemas = count($subtemas);

        if ($totalSubtemas === 0) {
            return [];
        }

        for ($dia = 1; $dia <= 7; $dia++) {
            if ($indiceSubtema < $totalSubtemas) {
                $subtema = $subtemas[$indiceSubtema];

                $tiempoSubtema = (float) ($subtema->tiempo_estimado_minutos ?? 15);
                $tiempoAsignado = min($tiempoSubtema, $minutosPorDia);

                $ejerciciosAsignados = max(
                    1,
                    (int) floor($tiempoAsignado / self::MINUTOS_POR_EJERCICIO)
                );

                $diasPlan[$dia] = [
                    'subtema_id' => $subtema->subtema_id,
                    'subtema_nombre' => $subtema->subtema_nombre,
                    'modulo_nombre' => $subtema->modulo_nombre,
                    'ejercicios_recomendados' => $ejerciciosAsignados,
                    'tiempo_estimado_minutos' => (int) $tiempoAsignado,
                ];

                $indiceSubtema++;
            } else {
                $subtemaRepaso = $subtemas[($dia - 1) % $totalSubtemas];

                $diasPlan[$dia] = [
                    'subtema_id' => $subtemaRepaso->subtema_id,
                    'subtema_nombre' => $subtemaRepaso->subtema_nombre,
                    'modulo_nombre' => $subtemaRepaso->modulo_nombre,
                    'ejercicios_recomendados' => 3,
                    'tiempo_estimado_minutos' => 15,
                ];
            }
        }

        ksort($diasPlan);

        return $diasPlan;
    }

    private function formatear(int $planId, string $semanaInicio, float $horasSemanales): array
    {
        $dias = $this->dao->obtenerPlanConDias($planId);

        if ($dias instanceof Collection) {
            $dias = $dias->all();
        }

        $diasFormateados = [];

        foreach ($dias as $dia) {
            $diasFormateados[] = [
                'dia_numero' => $dia->dia_semana,
                'dia_nombre' => self::DIAS[$dia->dia_semana] ?? 'Desconocido',
                'subtema_id' => $dia->subtema_id,
                'subtema_nombre' => $dia->subtema_nombre,
                'modulo_nombre' => $dia->modulo_nombre,
                'ejercicios_recomendados' => $dia->ejercicios_recomendados,
                'tiempo_estimado_minutos' => $dia->tiempo_estimado_minutos,
            ];
        }

        $totalEjercicios = array_sum(array_column($diasFormateados, 'ejercicios_recomendados'));
        $totalMinutos = array_sum(array_column($diasFormateados, 'tiempo_estimado_minutos'));

        return [
            'plan_id' => $planId,
            'semana_inicio' => $semanaInicio,
            'horas_disponibles_semana' => $horasSemanales,
            'total_ejercicios_semana' => $totalEjercicios,
            'total_minutos_semana' => $totalMinutos,
            'dias' => $diasFormateados,
        ];
    }

    private function obtenerLunesActual(): string
    {
        $hoy = new \DateTime();
        $diaSemana = (int) $hoy->format('N');
        $hoy->modify('-' . ($diaSemana - 1) . ' days');

        return $hoy->format('Y-m-d');
    }
}
