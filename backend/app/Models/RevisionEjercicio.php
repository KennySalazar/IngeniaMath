<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RevisionEjercicio extends Model
{
    protected $table      = 'revisiones_ejercicio';
    protected $primaryKey = 'id';
    public    $timestamps = false;

    protected $fillable = [
        'ejercicio_id',
        'revisor_id',
        'accion',
        'notas',
        'fecha_evento',
    ];

    protected $casts = [
        'fecha_evento' => 'datetime',
    ];

    public function ejercicio()
    {
        return $this->belongsTo(Ejercicio::class, 'ejercicio_id');
    }

    public function revisor()
    {
        return $this->belongsTo(Usuario::class, 'revisor_id');
    }
}
