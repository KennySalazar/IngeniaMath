<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PerfilEstudiante extends Model
{
    protected $table      = 'perfiles_estudiante';
    protected $primaryKey = 'usuario_id';
    public    $timestamps = false;

    protected $fillable = [
        'usuario_id',
        'horas_disponibles_semana',
        'racha_actual_dias',
        'fecha_objetivo_examen',
    ];
}
