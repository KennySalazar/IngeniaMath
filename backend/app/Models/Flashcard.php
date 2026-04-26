<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Flashcard extends Model
{
    public $timestamps = false;

    protected $table = 'flashcards';

    protected $fillable = [
        'modulo_id',
        'subtema_id',
        'titulo',
        'frente',
        'reverso',
        'creado_por',
    ];

    protected $casts = [
        'fecha_creacion' => 'datetime',
    ];

    // ─── Relaciones ─────────────────────────────────────────────────────────────

    public function modulo(): BelongsTo
    {
        return $this->belongsTo(ModuloTematico::class, 'modulo_id');
    }

    public function subtema(): BelongsTo
    {
        return $this->belongsTo(Subtema::class, 'subtema_id');
    }

    public function creadoPor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'creado_por');
    }
}