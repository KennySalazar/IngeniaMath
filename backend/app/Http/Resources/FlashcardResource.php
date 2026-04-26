<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FlashcardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'titulo'         => $this->titulo,
            'frente'         => $this->frente,
            'reverso'        => $this->reverso,
            'fecha_creacion' => $this->fecha_creacion?->toIso8601String(),
        ];
    }
}