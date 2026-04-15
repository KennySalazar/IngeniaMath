<?php

namespace App\Services;

use App\DAO\UsuarioDAO;
use App\Models\PerfilEstudiante;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class UsuarioService
{
    public function __construct(private UsuarioDAO $usuarioDAO) {}

    // Lista paginada de usuarios — solo ADMIN
    public function listar(array $filtros): array
    {
        $paginado = $this->usuarioDAO->listarPaginado($filtros);

        return [
            'data'       => collect($paginado->items())->map(fn($u) => $this->formatear($u)),
            'total'      => $paginado->total(),
            'por_pagina' => $paginado->perPage(),
            'pagina'     => $paginado->currentPage(),
            'ultima_pagina' => $paginado->lastPage(),
        ];
    }

    // Ver perfil de cualquier usuario
    public function verPerfil(int $id): array
    {
        $usuario = $this->usuarioDAO->findById($id);

        if (!$usuario) {
            throw new \Exception('Usuario no encontrado.', 404);
        }

        return $this->formatear($usuario);
    }

    // Editar perfil propio (o admin editando cualquiera)
    public function editarPerfil(int $id, array $data, int $solicitanteId, string $rolSolicitante): array
    {
        // Solo el propio usuario o un admin puede editar
        if ($solicitanteId !== $id && $rolSolicitante !== 'ADMIN') {
            throw new \Exception('No tienes permiso para editar este perfil.', 403);
        }

        if (isset($data['correo'])) {
            if ($this->usuarioDAO->existeCorreo($data['correo'], $id)) {
                throw ValidationException::withMessages([
                    'correo' => ['Este correo ya está en uso por otro usuario.'],
                ]);
            }
        }

        // Si viene nueva contraseña, hashearla
        if (!empty($data['password'])) {
            $data['password_hash'] = Hash::make($data['password']);
            unset($data['password']);
        }

        $data['fecha_actualizacion'] = now();
        $this->usuarioDAO->update($id, $data);

        // Si es estudiante, actualizar perfil de estudiante
        if (isset($data['horas_disponibles_semana'])) {
            PerfilEstudiante::where('usuario_id', $id)->update([
                'horas_disponibles_semana' => $data['horas_disponibles_semana'],
                'fecha_actualizacion'      => now(),
            ]);
        }

        return $this->verPerfil($id);
    }

    // Crear usuario desde el admin (cualquier rol)
    public function crearDesdeAdmin(array $data): array
    {
        if ($this->usuarioDAO->existeCorreo($data['correo'])) {
            throw ValidationException::withMessages([
                'correo' => ['Este correo ya está registrado.'],
            ]);
        }

        $usuario = $this->usuarioDAO->create([
            'rol_id'              => $data['rol_id'],
            'nombres'             => $data['nombres'],
            'apellidos'           => $data['apellidos'],
            'correo'              => $data['correo'],
            'password_hash'       => Hash::make($data['password']),
            'activo'              => true,
            'fecha_creacion'      => now(),
            'fecha_actualizacion' => now(),
        ]);

        // Si es estudiante, crear perfil automáticamente
        if ((int)$data['rol_id'] === 2) {
            PerfilEstudiante::create([
                'usuario_id'               => $usuario->id,
                'horas_disponibles_semana' => 0,
                'racha_actual_dias'        => 0,
                'fecha_creacion'           => now(),
                'fecha_actualizacion'      => now(),
            ]);
        }

        $usuario->load('rol');
        return $this->formatear($usuario);
    }

    // Cambiar estado activo/inactivo — solo ADMIN
    public function cambiarEstado(int $id, bool $activo): array
    {
        $usuario = $this->usuarioDAO->findById($id);
        if (!$usuario) {
            throw new \Exception('Usuario no encontrado.', 404);
        }

        $this->usuarioDAO->cambiarEstado($id, $activo);
        return $this->verPerfil($id);
    }

    // Cambiar rol — solo ADMIN
    public function cambiarRol(int $id, int $rolId): array
    {
        $usuario = $this->usuarioDAO->findById($id);
        if (!$usuario) {
            throw new \Exception('Usuario no encontrado.', 404);
        }

        $this->usuarioDAO->cambiarRol($id, $rolId);

        // Si el nuevo rol es estudiante y no tiene perfil, crearlo
        if ($rolId === 2) {
            PerfilEstudiante::firstOrCreate(
                ['usuario_id' => $id],
                [
                    'horas_disponibles_semana' => 0,
                    'racha_actual_dias'        => 0,
                    'fecha_creacion'           => now(),
                    'fecha_actualizacion'      => now(),
                ]
            );
        }

        return $this->verPerfil($id);
    }

    // Eliminar usuario — solo ADMIN
    public function eliminar(int $id, int $solicitanteId): void
    {
        if ($id === $solicitanteId) {
            throw new \Exception('No puedes eliminar tu propia cuenta.', 400);
        }

        $usuario = $this->usuarioDAO->findById($id);
        if (!$usuario) {
            throw new \Exception('Usuario no encontrado.', 404);
        }

        $this->usuarioDAO->delete($id);
    }

    // Resumen de usuarios por rol — para dashboard admin
    public function resumenPorRol(): array
    {
        return $this->usuarioDAO->contarPorRol();
    }

    // Formato de respuesta estándar
    private function formatear($usuario): array
    {
        $data = [
            'id'             => $usuario->id,
            'nombres'        => $usuario->nombres,
            'apellidos'      => $usuario->apellidos,
            'correo'         => $usuario->correo,
            'telefono'       => $usuario->telefono,
            'biografia'      => $usuario->biografia,
            'foto_perfil_url' => $usuario->foto_perfil_url,
            'activo'         => $usuario->activo,
            'ultimo_login_at' => $usuario->ultimo_login_at,
            'fecha_creacion' => $usuario->fecha_creacion,
            'rol' => [
                'id'     => $usuario->rol->id,
                'codigo' => $usuario->rol->codigo,
                'nombre' => $usuario->rol->nombre,
            ],
        ];

        if ($usuario->perfilEstudiante) {
            $data['perfil_estudiante'] = [
                'horas_disponibles_semana' => $usuario->perfilEstudiante->horas_disponibles_semana,
                'racha_actual_dias'        => $usuario->perfilEstudiante->racha_actual_dias,
                'fecha_objetivo_examen'    => $usuario->perfilEstudiante->fecha_objetivo_examen,
            ];
        }

        return $data;
    }
}
