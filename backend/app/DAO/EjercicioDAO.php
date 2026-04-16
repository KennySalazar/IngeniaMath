<?php

namespace App\DAO;

use App\Models\Ejercicio;
use App\Models\OpcionEjercicio;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class EjercicioDAO
{
    // Crea el ejercicio y devuelve la instancia con relaciones cargadas
    public function create(array $data): Ejercicio
    {
        return Ejercicio::create($data);
    }

    // Actualiza un ejercicio por ID
    public function update(int $id, array $data): bool
    {
        return Ejercicio::where('id', $id)->update($data) > 0;
    }

    // Busca un ejercicio por ID con todas sus relaciones
    public function findById(int $id): ?Ejercicio
    {
        return Ejercicio::with([
            'modulo',
            'subtema',
            'tutor',
            'revisor',
            'opciones',
            'revisiones.revisor',
        ])->find($id);
    }

    // Lista ejercicios con filtros y paginación
    public function listar(array $filtros = [], int $porPagina = 15): LengthAwarePaginator
    {
        $query = Ejercicio::with(['modulo', 'subtema', 'tutor']);

        if (!empty($filtros['tutor_id'])) {
            $query->where('tutor_id', $filtros['tutor_id']);
        }

        if (!empty($filtros['modulo_id'])) {
            $query->where('modulo_id', $filtros['modulo_id']);
        }

        if (!empty($filtros['subtema_id'])) {
            $query->where('subtema_id', $filtros['subtema_id']);
        }

        if (!empty($filtros['nivel_dificultad'])) {
            $query->where('nivel_dificultad', $filtros['nivel_dificultad']);
        }

        if (!empty($filtros['tipo_ejercicio'])) {
            $query->where('tipo_ejercicio', $filtros['tipo_ejercicio']);
        }

        if (!empty($filtros['estado'])) {
            $query->where('estado', $filtros['estado']);
        }

        if (!empty($filtros['buscar'])) {
            $query->where('enunciado', 'ilike', '%' . $filtros['buscar'] . '%');
        }

        return $query->orderBy('fecha_creacion', 'desc')->paginate($porPagina);
    }

    // Lista ejercicios publicados — para uso de diagnóstico, práctica y simulacros
    public function listarPublicados(array $filtros = []): \Illuminate\Database\Eloquent\Collection
    {
        $query = Ejercicio::with(['modulo', 'subtema', 'opciones'])
            ->where('estado', 'PUBLICADO');

        if (!empty($filtros['modulo_id'])) {
            $query->where('modulo_id', $filtros['modulo_id']);
        }

        if (!empty($filtros['subtema_id'])) {
            $query->where('subtema_id', $filtros['subtema_id']);
        }

        if (!empty($filtros['nivel_dificultad'])) {
            $query->where('nivel_dificultad', $filtros['nivel_dificultad']);
        }

        return $query->get();
    }

    // Busca ejercicios similares para detectar posibles duplicados
    public function buscarSimilares(string $enunciado, int $moduloId, ?int $exceptoId = null): array
    {
        $palabrasClave = $this->extraerPalabrasClave($enunciado);

        if (empty($palabrasClave)) {
            return [];
        }

        $query = Ejercicio::with(['modulo', 'subtema'])
            ->where('modulo_id', $moduloId)
            ->whereIn('estado', ['BORRADOR', 'EN_REVISION', 'APROBADO', 'PUBLICADO']);

        if ($exceptoId) {
            $query->where('id', '!=', $exceptoId);
        }

        // Busca coincidencia con al menos una palabra clave del enunciado
        $query->where(function ($q) use ($palabrasClave) {
            foreach ($palabrasClave as $palabra) {
                $q->orWhere('enunciado', 'ilike', '%' . $palabra . '%');
            }
        });

        return $query->limit(5)->get()->toArray();
    }

    // Crea las opciones de un ejercicio de opción múltiple
    public function crearOpciones(int $ejercicioId, array $opciones): void
    {
        // Elimina opciones anteriores si existen
        OpcionEjercicio::where('ejercicio_id', $ejercicioId)->delete();

        foreach ($opciones as $index => $opcion) {
            OpcionEjercicio::create([
                'ejercicio_id' => $ejercicioId,
                'orden_opcion' => $index + 1,
                'texto_opcion' => $opcion['texto_opcion'],
                'es_correcta'  => $opcion['es_correcta'] ?? false,
            ]);
        }
    }

    // Verifica que el ejercicio pertenece al tutor indicado
    public function perteneceATutor(int $ejercicioId, int $tutorId): bool
    {
        return Ejercicio::where('id', $ejercicioId)
            ->where('tutor_id', $tutorId)
            ->exists();
    }

    // Extrae palabras clave significativas del enunciado para comparación
    private function extraerPalabrasClave(string $texto): array
    {
        // Convierte a minúsculas y elimina caracteres especiales
        $texto = strtolower($texto);
        $texto = preg_replace('/[^a-záéíóúüñ\s]/u', ' ', $texto);

        $palabras = explode(' ', $texto);

        // Filtra palabras cortas y palabras vacías comunes en español
        $stopwords = [
            'de',
            'la',
            'el',
            'en',
            'un',
            'una',
            'es',
            'se',
            'los',
            'las',
            'con',
            'por',
            'para',
            'que',
            'del',
            'al',
            'si',
            'no',
            'su',
            'sus',
            'le',
            'ya'
        ];

        return array_values(array_filter($palabras, function ($p) use ($stopwords) {
            return strlen($p) > 3 && !in_array($p, $stopwords);
        }));
    }
}
