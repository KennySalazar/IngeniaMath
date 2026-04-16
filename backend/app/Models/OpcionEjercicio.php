<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OpcionEjercicio extends Model
{
    protected $table      = 'opciones_ejercicio';
    protected $primaryKey = 'id';
    public    $timestamps = false;

    protected $fillable = [
        'ejercicio_id',
        'orden_opcion',
        'texto_opcion',
        'es_correcta',
    ];

    protected $casts = [
        'es_correcta' => 'boolean',
    ];

    public function ejercicio()
    {
        return $this->belongsTo(Ejercicio::class, 'ejercicio_id');
    }
}
