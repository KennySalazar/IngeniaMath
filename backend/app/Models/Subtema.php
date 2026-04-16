<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subtema extends Model
{
    protected $table      = 'subtemas';
    protected $primaryKey = 'id';
    public    $timestamps = false;

    protected $fillable = [
        'modulo_id',
        'nombre',
        'descripcion',
        'orden_complejidad',
    ];

    public function modulo()
    {
        return $this->belongsTo(ModuloTematico::class, 'modulo_id');
    }

    public function ejercicios()
    {
        return $this->hasMany(Ejercicio::class, 'subtema_id');
    }
}
