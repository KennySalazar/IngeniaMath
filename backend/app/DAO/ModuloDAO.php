<?php

namespace App\DAO;

use App\Models\ModuloTematico;
use App\Models\Subtema;

class ModuloDAO
{
    // Devuelve todos los módulos con sus subtemas — para poblar selectores
    public function listarTodos(): \Illuminate\Database\Eloquent\Collection
    {
        return ModuloTematico::with('subtemas')
            ->orderBy('orden')
            ->get();
    }

    public function findById(int $id): ?ModuloTematico
    {
        return ModuloTematico::with('subtemas')->find($id);
    }

    public function listarSubtemasPorModulo(int $moduloId): \Illuminate\Database\Eloquent\Collection
    {
        return Subtema::where('modulo_id', $moduloId)
            ->orderBy('orden_complejidad')
            ->get();
    }
}
