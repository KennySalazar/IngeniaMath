<?php

namespace App\DAO;

use App\Models\Usuario;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class UsuarioDAO
{
    public function findByCorreo(string $correo): ?Usuario
    {
        return Usuario::with('rol')
            ->where('correo', $correo)
            ->first();
    }

    public function findById(int $id): ?Usuario
    {
        return Usuario::with('rol', 'perfilEstudiante')->find($id);
    }

    public function existeCorreo(string $correo, ?int $exceptoId = null): bool
    {
        $query = Usuario::where('correo', $correo);
        if ($exceptoId) {
            $query->where('id', '!=', $exceptoId);
        }
        return $query->exists();
    }

    public function create(array $data): Usuario
    {
        return Usuario::create($data);
    }

    public function update(int $id, array $data): bool
    {
        return Usuario::where('id', $id)->update($data) > 0;
    }

    public function listarPaginado(array $filtros = [], int $porPagina = 15): LengthAwarePaginator
    {
        $query = Usuario::with('rol');

        if (!empty($filtros['rol_id'])) {
            $query->where('rol_id', $filtros['rol_id']);
        }

        if (!empty($filtros['activo']) && $filtros['activo'] !== 'todos') {
            $query->where('activo', $filtros['activo'] === 'activo');
        }

        if (!empty($filtros['buscar'])) {
            $buscar = $filtros['buscar'];
            $query->where(function ($q) use ($buscar) {
                $q->where('nombres', 'ilike', "%{$buscar}%")
                    ->orWhere('apellidos', 'ilike', "%{$buscar}%")
                    ->orWhere('correo', 'ilike', "%{$buscar}%");
            });
        }

        return $query->orderBy('fecha_creacion', 'desc')->paginate($porPagina);
    }

    public function cambiarEstado(int $id, bool $activo): bool
    {
        return Usuario::where('id', $id)->update([
            'activo'              => $activo,
            'fecha_actualizacion' => now(),
        ]) > 0;
    }

    public function cambiarRol(int $id, int $rolId): bool
    {
        return Usuario::where('id', $id)->update([
            'rol_id'              => $rolId,
            'fecha_actualizacion' => now(),
        ]) > 0;
    }

    public function delete(int $id): bool
    {
        return Usuario::where('id', $id)->delete() > 0;
    }

    public function actualizarUltimoLogin(int $id): void
    {
        Usuario::where('id', $id)->update(['ultimo_login_at' => now()]);
    }

    public function contarPorRol(): array
    {
        return Usuario::selectRaw('rol_id, count(*) as total')
            ->groupBy('rol_id')
            ->with('rol')
            ->get()
            ->map(fn($u) => [
                'rol'    => $u->rol->codigo,
                'nombre' => $u->rol->nombre,
                'total'  => $u->total,
            ])
            ->toArray();
    }

    public function crearTokenRecuperacion(int $usuarioId, string $token): void
    {
        // Invalida tokens anteriores del mismo usuario
        DB::table('math.tokens_recuperacion_password')
            ->where('usuario_id', $usuarioId)
            ->update(['usado' => true]);

        DB::table('math.tokens_recuperacion_password')->insert([
            'usuario_id'     => $usuarioId,
            'token'          => $token,
            'usado'          => false,
            'expira_at'      => now()->addMinutes(60),
            'fecha_creacion' => now(),
        ]);
    }

    public function findTokenRecuperacion(string $token): ?object
    {
        return DB::table('math.tokens_recuperacion_password')
            ->where('token', $token)
            ->where('usado', false)
            ->where('expira_at', '>', now())
            ->first();
    }

    public function invalidarToken(string $token): void
    {
        DB::table('math.tokens_recuperacion_password')
            ->where('token', $token)
            ->update(['usado' => true]);
    }
}
