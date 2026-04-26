<?php

namespace App\DAO;

use App\Models\Flashcard;
use App\Models\RecursoEducativo;
use Illuminate\Support\Facades\DB;

class RecursoDAO
{
    // ─── recursos_educativos ────────────────────────────────────────────────────

    public function findById(int $id): ?RecursoEducativo
    {
        return RecursoEducativo::with(['modulo', 'subtema', 'tutor', 'revisor'])
            ->find($id);
    }

    public function listar(array $filtros, int $perPage = 15): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = RecursoEducativo::with(['modulo', 'subtema', 'tutor', 'revisor'])
            ->orderByDesc('fecha_creacion');

        if (!empty($filtros['modulo_id'])) {
            $query->where('modulo_id', $filtros['modulo_id']);
        }

        if (!empty($filtros['subtema_id'])) {
            $query->where('subtema_id', $filtros['subtema_id']);
        }

        if (!empty($filtros['tipo_recurso'])) {
            $query->where('tipo_recurso', $filtros['tipo_recurso']);
        }

        if (!empty($filtros['estado'])) {
            $query->where('estado', $filtros['estado']);
        }

        return $query->paginate($perPage);
    }

    public function create(array $data): RecursoEducativo
    {
        return RecursoEducativo::create($data);
    }

    public function update(int $id, array $data): bool
    {
        return RecursoEducativo::where('id', $id)->update($data);
    }

    public function delete(int $id): bool
    {
        return RecursoEducativo::where('id', $id)->delete();
    }

    // ─── flashcards ─────────────────────────────────────────────────────────────

    public function crearFlashcard(array $data): Flashcard
    {
        return Flashcard::create($data);
    }

    public function findFlashcardPorRecurso(int $moduloId, ?int $subtemaId, int $creadoPor): ?Flashcard
    {
        return Flashcard::where('modulo_id', $moduloId)
            ->where('subtema_id', $subtemaId)
            ->where('creado_por', $creadoPor)
            ->latest('fecha_creacion')
            ->first();
    }

    // ─── recurso_por_ejercicio ───────────────────────────────────────────────────

    public function adjuntarEjercicio(int $recursoId, int $ejercicioId): void
    {
        DB::table('recurso_por_ejercicio')->insertOrIgnore([
            'recurso_id'   => $recursoId,
            'ejercicio_id' => $ejercicioId,
        ]);
    }

    public function desadjuntarEjercicio(int $recursoId, int $ejercicioId): void
    {
        DB::table('recurso_por_ejercicio')
            ->where('recurso_id', $recursoId)
            ->where('ejercicio_id', $ejercicioId)
            ->delete();
    }
}