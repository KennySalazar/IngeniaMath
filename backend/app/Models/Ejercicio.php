<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ejercicio extends Model
{
    protected $table      = 'ejercicios';
    protected $primaryKey = 'id';
    public    $timestamps = false;

    protected $fillable = [
        'modulo_id',
        'subtema_id',
        'tutor_id',
        'revisor_id',
        'nivel_dificultad',
        'tipo_ejercicio',
        'enunciado',
        'imagen_apoyo_url',
        'respuesta_correcta_texto',
        'solucion_paso_a_paso',
        'explicacion_conceptual',
        'tiempo_estimado_minutos',
        'estado',
        'advertencia_duplicado',
        'fecha_creacion',
        'fecha_revision',
        'fecha_publicacion',
    ];

    protected $casts = [
        'advertencia_duplicado' => 'boolean',
        'fecha_creacion'        => 'datetime',
        'fecha_revision'        => 'datetime',
        'fecha_publicacion'     => 'datetime',
    ];

    public function modulo()
    {
        return $this->belongsTo(ModuloTematico::class, 'modulo_id');
    }

    public function subtema()
    {
        return $this->belongsTo(Subtema::class, 'subtema_id');
    }

    public function tutor()
    {
        return $this->belongsTo(Usuario::class, 'tutor_id');
    }

    public function revisor()
    {
        return $this->belongsTo(Usuario::class, 'revisor_id');
    }

    public function opciones()
    {
        return $this->hasMany(OpcionEjercicio::class, 'ejercicio_id')
            ->orderBy('orden_opcion');
    }

    public function revisiones()
    {
        return $this->hasMany(RevisionEjercicio::class, 'ejercicio_id')
            ->orderBy('fecha_evento', 'desc');
    }
}
