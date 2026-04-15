<?php

namespace App\DAO;

use App\Models\Usuario;

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
        return Usuario::with('rol')->find($id);
    }

    public function create(array $data): Usuario
    {
        return Usuario::create($data);
    }

    public function existeCorreo(string $correo): bool
    {
        return Usuario::where('correo', $correo)->exists();
    }

    public function actualizarUltimoLogin(int $id): void
    {
        Usuario::where('id', $id)->update([
            'ultimo_login_at' => now(),
        ]);
    }
}
