<?php

namespace App\Services;

use App\DAO\UsuarioDAO;
use App\Mail\RecuperacionPasswordMail;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PasswordRecuperacionService
{
    public function __construct(private UsuarioDAO $usuarioDAO) {}

    public function solicitarRecuperacion(string $correo): void
    {
        $usuario = $this->usuarioDAO->findByCorreo($correo);

        // Respuesta genérica: no revelamos si el correo existe o no
        if (!$usuario || !$usuario->activo) {
            return;
        }

        $token = Str::random(64);
        $this->usuarioDAO->crearTokenRecuperacion($usuario->id, $token);

        Mail::to($usuario->correo)->send(
            new RecuperacionPasswordMail($usuario->nombres, $token)
        );
    }

    public function validarToken(string $token): bool
    {
        return $this->usuarioDAO->findTokenRecuperacion($token) !== null;
    }

    public function restablecerPassword(string $token, string $nuevaPassword): void
    {
        $registro = $this->usuarioDAO->findTokenRecuperacion($token);

        if (!$registro) {
            throw ValidationException::withMessages([
                'token' => ['El enlace de recuperación es inválido o ha expirado.'],
            ]);
        }

        $this->usuarioDAO->update($registro->usuario_id, [
            'password_hash'       => Hash::make($nuevaPassword),
            'fecha_actualizacion' => now(),
        ]);

        $this->usuarioDAO->invalidarToken($token);
    }
}
