<?php

namespace App\Services;

use App\DAO\UsuarioDAO;
use App\Models\PerfilEstudiante;
use App\Models\Usuario;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function __construct(private UsuarioDAO $usuarioDAO) {}

    public function login(string $correo, string $password): array
    {
        $usuario = $this->usuarioDAO->findByCorreo($correo);

        if (!$usuario) {
            throw ValidationException::withMessages([
                'correo' => ['Las credenciales no son correctas.'],
            ]);
        }

        $hashGuardado = $usuario->getAttributes()['password_hash'];

        // Usamos password_verify nativo de PHP (compatible con $2y$ bcrypt)
        if (!password_verify($password, $hashGuardado)) {
            throw ValidationException::withMessages([
                'correo' => ['Las credenciales no son correctas.'],
            ]);
        }

        if (!$usuario->activo) {
            throw ValidationException::withMessages([
                'correo' => ['Tu cuenta está desactivada.'],
            ]);
        }

        $this->usuarioDAO->actualizarUltimoLogin($usuario->id);
        $usuario->tokens()->delete();
        $token = $usuario->createToken('auth_token')->plainTextToken;

        return [
            'token'   => $token,
            'usuario' => $this->formatearUsuario($usuario),
        ];
    }

    public function registro(array $data): array
    {
        if ($this->usuarioDAO->existeCorreo($data['correo'])) {
            throw ValidationException::withMessages([
                'correo' => ['Este correo ya está registrado.'],
            ]);
        }

        // ROL 2 = ESTUDIANTE (siempre al registrarse)
        $usuario = $this->usuarioDAO->create([
            'rol_id'        => 2,
            'nombres'       => $data['nombres'],
            'apellidos'     => $data['apellidos'],
            'correo'        => $data['correo'],
            'password_hash' => Hash::make($data['password']),
            'activo'        => true,
            'fecha_creacion'      => now(),
            'fecha_actualizacion' => now(),
        ]);

        // Crear perfil de estudiante vacío automáticamente
        PerfilEstudiante::create([
            'usuario_id'               => $usuario->id,
            'horas_disponibles_semana' => 0,
            'racha_actual_dias'        => 0,
            'fecha_creacion'           => now(),
            'fecha_actualizacion'      => now(),
        ]);

        $usuario->load('rol');
        $token = $usuario->createToken('auth_token')->plainTextToken;

        return [
            'token'   => $token,
            'usuario' => $this->formatearUsuario($usuario),
        ];
    }

    public function logout(Usuario $usuario): void
    {
        $usuario->tokens()->delete();
    }

    public function me(Usuario $usuario): array
    {
        $usuario->load('rol');
        return $this->formatearUsuario($usuario);
    }

    private function formatearUsuario(Usuario $usuario): array
    {
        return [
            'id'        => $usuario->id,
            'nombres'   => $usuario->nombres,
            'apellidos' => $usuario->apellidos,
            'correo'    => $usuario->correo,
            'rol'       => [
                'id'     => $usuario->rol->id,
                'codigo' => $usuario->rol->codigo,
                'nombre' => $usuario->rol->nombre,
            ],
            'foto_perfil_url' => $usuario->foto_perfil_url,
            'activo'          => $usuario->activo,
        ];
    }
}
