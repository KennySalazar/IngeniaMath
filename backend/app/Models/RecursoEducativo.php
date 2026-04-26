<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Builder;

class RecursoEducativo extends Model
{
    // Usamos timestamps propios del schema
    public $timestamps = false;

    protected $table = 'recursos_educativos';

    protected $fillable = [
        'modulo_id',
        'subtema_id',
        'tutor_id',
        'revisor_id',
        'tipo_recurso',
        'titulo',
        'descripcion',
        'url_recurso',
        'estado',
        'fecha_publicacion',
    ];

    protected $casts = [
        'fecha_creacion'   => 'datetime',
        'fecha_publicacion' => 'datetime',
    ];

    // Constantes para evitar magic strings
    const TIPOS = ['VIDEO', 'PDF', 'FLASHCARD', 'SIMULADOR', 'ENLACE'];

    const ESTADOS = [
        'BORRADOR'      => 'BORRADOR',
        'EN_REVISION'   => 'EN_REVISION',
        'APROBADO'      => 'APROBADO',
        'PUBLICADO'     => 'PUBLICADO',
        'DESHABILITADO' => 'DESHABILITADO',
    ];

    // ─── Relaciones ────────────────────────────────────────────────────────────

    public function modulo(): BelongsTo
    {
        return $this->belongsTo(ModuloTematico::class, 'modulo_id');
    }

    public function subtema(): BelongsTo
    {
        return $this->belongsTo(Subtema::class, 'subtema_id');
    }

    public function tutor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'tutor_id');
    }

    public function revisor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'revisor_id');
    }

    public function flashcard(): HasOne
    {
        return $this->hasOne(Flashcard::class, 'modulo_id', 'modulo_id')
                    ->where('subtema_id', $this->subtema_id);
        // Nota: Si quieres un FK directo recurso_id en flashcards, ajusta aquí.
        // La implementación atómica en el controller enlaza por modulo/subtema/tutor.
    }

    public function ejercicios(): BelongsToMany
    {
        return $this->belongsToMany(
            Ejercicio::class,
            'recurso_por_ejercicio',
            'recurso_id',
            'ejercicio_id'
        );
    }

    // ─── Query Scopes ───────────────────────────────────────────────────────────

    public function scopeDeModulo(Builder $query, ?int $moduloId): Builder
    {
        return $moduloId ? $query->where('modulo_id', $moduloId) : $query;
    }

    public function scopeDeSubtema(Builder $query, ?int $subtemaId): Builder
    {
        return $subtemaId ? $query->where('subtema_id', $subtemaId) : $query;
    }

    public function scopeDeTipo(Builder $query, ?string $tipo): Builder
    {
        return $tipo ? $query->where('tipo_recurso', $tipo) : $query;
    }

    public function scopePublicados(Builder $query): Builder
    {
        return $query->where('estado', 'PUBLICADO');
    }
}