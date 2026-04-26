<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RecursoEducativoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'tipo_recurso'      => $this->tipo_recurso,
            'titulo'            => $this->titulo,
            'descripcion'       => $this->descripcion,
            'url_recurso'       => $this->url_recurso,
            'estado'            => $this->estado,
            'fecha_creacion'    => $this->fecha_creacion?->toIso8601String(),
            'fecha_publicacion' => $this->fecha_publicacion?->toIso8601String(),

            // Relaciones eager-loaded
            'modulo' => $this->whenLoaded('modulo', fn() => [
                'id'     => $this->modulo->id,
                'nombre' => $this->modulo->nombre,
            ]),
            'subtema' => $this->whenLoaded('subtema', fn() => [
                'id'     => $this->subtema->id,
                'nombre' => $this->subtema->nombre,
            ]),
            'tutor' => $this->whenLoaded('tutor', fn() => [
                'id'       => $this->tutor->id,
                'nombre'   => trim("{$this->tutor->nombres} {$this->tutor->apellidos}"),
            ]),
            'revisor' => $this->whenLoaded('revisor', fn() => $this->revisor ? [
                'id'     => $this->revisor->id,
                'nombre' => trim("{$this->revisor->nombres} {$this->revisor->apellidos}"),
            ] : null),

            // Solo aparece si el recurso es FLASHCARD y está cargado
            'flashcard' => $this->when(
                $this->tipo_recurso === 'FLASHCARD',
                fn() => new FlashcardResource($this->whenLoaded('flashcard'))
            ),
        ];
    }
}