<?php

namespace App\Services;

use App\DAO\DiagnosticoDAO;

class RutaAprendizajeService
{
    public function __construct(
        private DiagnosticoDAO $dao
    ) {}

    // Genera la ruta personalizada a partir del diagnóstico finalizado
    public function generar(int $estudianteId, int $intentoId): array
    {
        $clasificaciones = $this->dao->obtenerClasificacionesPorModulo($intentoId);

        if (empty($clasificaciones)) {
            throw new \Exception('No se encontraron resultados del diagnóstico.', 422);
        }

        // Cancela rutas anteriores
        $this->dao->desactivarRutasAnteriores($estudianteId);

        // Crea la nueva ruta
        $rutaId = $this->dao->crearRuta($estudianteId, $intentoId);

        // Subtemas ya incluidos para no duplicar (clave: subtema_id)
        $subtemasProcesados = [];
        $prioridadModulo    = 1;

        foreach ($clasificaciones as $clasificacion) {

            // Módulos DOMINADOS no necesitan trabajo — los saltamos
            if ($clasificacion->clasificacion === 'DOMINADO') {
                continue;
            }

            $subtemas        = $this->dao->obtenerSubtemasModulo($clasificacion->modulo_id);
            $prioridadSubtema = 1;

            foreach ($subtemas as $subtema) {

                // Verifica e inserta prerrequisitos primero
                $prioridadSubtema = $this->procesarPrerrequisitos(
                    $rutaId,
                    $subtema->id,
                    $prioridadModulo,
                    $prioridadSubtema,
                    $subtemasProcesados,
                    $clasificacion->modulo_id
                );

                // Inserta el subtema si no fue procesado aún
                if (!isset($subtemasProcesados[$subtema->id])) {
                    $this->dao->insertarDetalleRuta(
                        $rutaId,
                        $clasificacion->modulo_id,
                        $subtema->id,
                        $prioridadModulo,
                        $prioridadSubtema,
                        'DIRECTO'
                    );
                    $subtemasProcesados[$subtema->id] = true;
                    $prioridadSubtema++;
                }
            }

            $prioridadModulo++;
        }

        return $this->formatear($rutaId, $estudianteId);
    }

    // Obtiene la ruta activa del estudiante
    public function obtener(int $estudianteId): array
    {
        $ruta = $this->dao->obtenerRutaActiva($estudianteId);

        if (!$ruta) {
            throw new \Exception('No tienes una ruta de aprendizaje activa.', 404);
        }

        return $this->formatear($ruta->id, $estudianteId);
    }

    // Procesa los prerrequisitos de un subtema recursivamente
    private function procesarPrerrequisitos(
        int   $rutaId,
        int   $subtemaId,
        int   $prioridadModulo,
        int   $prioridadSubtema,
        array &$subtemasProcesados,
        int   $moduloId
    ): int {
        $prerrequisitos = $this->dao->obtenerPrerrequisitos($subtemaId);

        foreach ($prerrequisitos as $prereq) {
            if (isset($subtemasProcesados[$prereq->id])) {
                continue;
            }

            // Recursivo: procesa prerrequisitos del prerrequisito
            $prioridadSubtema = $this->procesarPrerrequisitos(
                $rutaId,
                $prereq->id,
                $prioridadModulo,
                $prioridadSubtema,
                $subtemasProcesados,
                $moduloId
            );

            // Obtiene el módulo del prerrequisito
            $modSubtema = $this->dao->obtenerModuloDeSubtema($prereq->id);

            $this->dao->insertarDetalleRuta(
                $rutaId,
                $modSubtema->modulo_id,
                $prereq->id,
                $prioridadModulo,
                $prioridadSubtema,
                'PRERREQUISITO'
            );
            $subtemasProcesados[$prereq->id] = true;
            $prioridadSubtema++;
        }

        return $prioridadSubtema;
    }

    // Formatea la ruta para devolver al frontend
    private function formatear(int $rutaId, int $estudianteId): array
    {
        $detalle = $this->dao->obtenerDetalleRuta($rutaId);

        // Agrupa por módulo para presentación
        $modulos = [];
        foreach ($detalle as $item) {
            if (!isset($modulos[$item->modulo_id])) {
                $modulos[$item->modulo_id] = [
                    'modulo_id'        => $item->modulo_id,
                    'modulo_nombre'    => $item->modulo_nombre,
                    'prioridad_modulo' => $item->prioridad_modulo,
                    'subtemas'         => [],
                ];
            }
            $modulos[$item->modulo_id]['subtemas'][] = [
                'detalle_id'       => $item->id,
                'subtema_id'       => $item->subtema_id,
                'subtema_nombre'   => $item->subtema_nombre,
                'prioridad'        => $item->prioridad_subtema,
                'origen'           => $item->origen,
                'estado'           => $item->estado,
                'fecha_completado' => $item->fecha_completado,
            ];
        }

        return [
            'ruta_id'          => $rutaId,
            'total_modulos'    => count($modulos),
            'total_subtemas'   => count($detalle),
            'modulos'          => array_values($modulos),
        ];
    }
}
