<?php

namespace App\DAO;

use Illuminate\Support\Facades\DB;

class ForoDAO
{
    // ── Hilos ────────────────────────────────────────────────────────────────

    public function listarHilos(array $filtros, int $perPage = 15): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = DB::table('hilos_foro as h')
            ->join('usuarios as u',           'u.id', '=', 'h.estudiante_id')
            ->join('modulos_tematicos as m',   'm.id', '=', 'h.modulo_id')
            ->leftJoin('subtemas as s',        's.id', '=', 'h.subtema_id')
            ->leftJoin('respuestas_foro as rf', function ($join) {
                $join->on('rf.hilo_id', '=', 'h.id')
                     ->whereRaw('rf.id = (
                         SELECT MAX(id) FROM respuestas_foro WHERE hilo_id = h.id
                     )');
            })
            ->select([
                'h.id',
                'h.titulo',
                'h.estudiante_id AS autor_id',
                'h.estado',
                'h.fecha_creacion',
                'h.fecha_actualizacion',
                'h.respuesta_aceptada_id',
                DB::raw("CONCAT(u.nombres, ' ', u.apellidos) AS autor_nombre"),
                'u.foto_perfil_url AS autor_foto',
                'm.id AS modulo_id',
                'm.nombre AS modulo_nombre',
                's.id AS subtema_id',
                's.nombre AS subtema_nombre',
                DB::raw('(SELECT COUNT(*) FROM respuestas_foro WHERE hilo_id = h.id) AS total_respuestas'),
                'rf.fecha_creacion AS ultima_respuesta_at',
            ])
            ->whereIn('h.estado', ['ABIERTO', 'RESUELTO', 'CERRADO']);

        if (!empty($filtros['modulo_id'])) {
            $query->where('h.modulo_id', $filtros['modulo_id']);
        }
        if (!empty($filtros['subtema_id'])) {
            $query->where('h.subtema_id', $filtros['subtema_id']);
        }
        if (!empty($filtros['estado'])) {
            $query->where('h.estado', $filtros['estado']);
        }
        if (!empty($filtros['estudiante_id'])) {
            $query->where('h.estudiante_id', $filtros['estudiante_id']);
        }
        if (!empty($filtros['buscar'])) {
            $query->where('h.titulo', 'ilike', '%' . $filtros['buscar'] . '%');
        }

        return $query
            ->orderByDesc('h.fecha_actualizacion')
            ->paginate($perPage);
    }

    public function findHiloById(int $id): ?object
    {
        return DB::table('hilos_foro as h')
            ->join('usuarios as u',         'u.id', '=', 'h.estudiante_id')
            ->join('modulos_tematicos as m', 'm.id', '=', 'h.modulo_id')
            ->leftJoin('subtemas as s',      's.id', '=', 'h.subtema_id')
            ->select([
                'h.*',
                DB::raw("CONCAT(u.nombres, ' ', u.apellidos) AS autor_nombre"),
                'u.foto_perfil_url AS autor_foto',
                'u.id AS autor_id',
                'm.nombre AS modulo_nombre',
                's.nombre AS subtema_nombre',
            ])
            ->where('h.id', $id)
            ->whereIn('h.estado', ['ABIERTO', 'RESUELTO', 'CERRADO'])
            ->first();
    }

    public function crearHilo(array $data): object
    {
        $id = DB::table('hilos_foro')->insertGetId([
            'estudiante_id'      => $data['estudiante_id'],
            'modulo_id'          => $data['modulo_id'],
            'subtema_id'         => $data['subtema_id'] ?? null,
            'titulo'             => $data['titulo'],
            'contenido'          => $data['contenido'],
            'estado'             => 'ABIERTO',
            'fecha_creacion'     => now(),
            'fecha_actualizacion'=> now(),
        ]);

        return $this->findHiloById($id);
    }

    public function actualizarHilo(int $id, array $data): void
    {
        DB::table('hilos_foro')
            ->where('id', $id)
            ->update(array_merge($data, ['fecha_actualizacion' => now()]));
    }

    public function cambiarEstadoHilo(int $id, string $estado): void
    {
        DB::table('hilos_foro')
            ->where('id', $id)
            ->update(['estado' => $estado, 'fecha_actualizacion' => now()]);
    }

    // ── Respuestas ───────────────────────────────────────────────────────────

    public function listarRespuestas(int $hiloId): array
    {
        return DB::table('respuestas_foro as rf')
            ->join('usuarios as u', 'u.id', '=', 'rf.usuario_id')
            ->join('roles as r',    'r.id', '=', 'u.rol_id')
            ->select([
                'rf.id',
                'rf.hilo_id',
                'rf.contenido',
                'rf.es_solucion_aceptada',
                'rf.fecha_creacion',
                'u.id AS autor_id',
                DB::raw("CONCAT(u.nombres, ' ', u.apellidos) AS autor_nombre"),
                'u.foto_perfil_url AS autor_foto',
                'r.codigo AS autor_rol',
            ])
            ->where('rf.hilo_id', $hiloId)
            ->orderBy('rf.fecha_creacion')
            ->get()
            ->toArray();
    }

    public function findRespuestaById(int $id): ?object
    {
        return DB::table('respuestas_foro as rf')
            ->join('usuarios as u', 'u.id', '=', 'rf.usuario_id')
            ->select([
                'rf.*',
                'u.id AS autor_id',
                DB::raw("CONCAT(u.nombres, ' ', u.apellidos) AS autor_nombre"),
            ])
            ->where('rf.id', $id)
            ->first();
    }

    public function crearRespuesta(array $data): object
    {
        $id = DB::table('respuestas_foro')->insertGetId([
            'hilo_id'        => $data['hilo_id'],
            'usuario_id'     => $data['usuario_id'],
            'contenido'      => $data['contenido'],
            'fecha_creacion' => now(),
        ]);

        // Actualizar fecha_actualizacion del hilo
        DB::table('hilos_foro')
            ->where('id', $data['hilo_id'])
            ->update(['fecha_actualizacion' => now()]);

        return $this->findRespuestaById($id);
    }

    public function eliminarRespuesta(int $id): void
    {
        DB::table('respuestas_foro')->where('id', $id)->delete();
    }

    public function marcarSolucion(int $hiloId, int $respuestaId): void
    {
        // Quitar solución anterior si existía
        DB::table('respuestas_foro')
            ->where('hilo_id', $hiloId)
            ->update(['es_solucion_aceptada' => false]);

        // Marcar la nueva solución
        DB::table('respuestas_foro')
            ->where('id', $respuestaId)
            ->update(['es_solucion_aceptada' => true]);

        // Actualizar hilo
        DB::table('hilos_foro')
            ->where('id', $hiloId)
            ->update([
                'estado'               => 'RESUELTO',
                'respuesta_aceptada_id'=> $respuestaId,
                'fecha_actualizacion'  => now(),
            ]);
    }

    // ── Badge: hilos con respuestas nuevas ───────────────────────────────────

    public function contarHilosConRespuestasNuevas(int $estudianteId): int
    {
        return (int) DB::table('hilos_foro as h')
            ->join('respuestas_foro as rf', 'rf.hilo_id', '=', 'h.id')
            ->where('h.estudiante_id', $estudianteId)
            ->where('rf.usuario_id', '!=', $estudianteId)
            ->where('rf.fecha_creacion', '>=',
                DB::raw("(
                    SELECT COALESCE(ultimo_login_at, fecha_creacion)
                    FROM usuarios WHERE id = {$estudianteId}
                )")
            )
            ->distinct('h.id')
            ->count('h.id');
    }
}