<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ModuloTematico extends Model
{
    protected $table      = 'modulos_tematicos';
    protected $primaryKey = 'id';
    public    $timestamps = false;

    protected $fillable = ['nombre', 'descripcion', 'orden'];

    public function subtemas()
    {
        return $this->hasMany(Subtema::class, 'modulo_id')
            ->orderBy('orden_complejidad');
    }

    public function ejercicios()
    {
        return $this->hasMany(Ejercicio::class, 'modulo_id');
    }
}
