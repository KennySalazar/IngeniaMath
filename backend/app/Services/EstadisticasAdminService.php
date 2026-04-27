<?php

namespace App\Services;

use App\DAO\EstadisticasAdminDAO;

class EstadisticasAdminService
{
    public function __construct(private EstadisticasAdminDAO $dao) {}

    public function dashboardAdmin(): array
    {
        return [
            'metricas'           => $this->dao->metricasGlobales(),
            'usuarios_por_rol'   => $this->dao->usuariosPorRol(),
            'actividad_reciente' => $this->dao->actividadReciente(),
            'crecimiento'        => $this->dao->crecimientoUsuarios(),
            'actividad_diaria'   => $this->dao->actividadDiaria30Dias(),
        ];
    }

    public function generarReporteCsv(): string
    {
        $filas = $this->dao->reporteUsoCompleto();

        $cabecera = [
            'ID', 'Nombres', 'Apellidos', 'Correo', 'Rol', 'Activo',
            'Fecha registro', 'Último login',
            'Sesiones práctica', 'Simulacros', 'Ejercicios publicados',
        ];

        $lineas = array_map(fn($r) => implode(',', array_map(
            fn($v) => '"' . str_replace('"', '""', (string) $v) . '"',
            [
                $r->id,
                $r->nombres,
                $r->apellidos,
                $r->correo,
                $r->rol,
                $r->activo ? 'Sí' : 'No',
                $r->fecha_creacion
                    ? date('d/m/Y', strtotime($r->fecha_creacion)) : '',
                $r->ultimo_login_at
                    ? date('d/m/Y H:i', strtotime($r->ultimo_login_at)) : 'Nunca',
                $r->sesiones_practica,
                $r->simulacros_finalizados,
                $r->ejercicios_publicados,
            ]
        )), $filas);

        return implode(',', $cabecera) . "\n" . implode("\n", $lineas);
    }
}