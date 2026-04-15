<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Usuario extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table      = 'usuarios';
    protected $primaryKey = 'id';
    public    $timestamps = false;

    protected $fillable = [
        'rol_id',
        'nombres',
        'apellidos',
        'correo',
        'password_hash',
        'foto_perfil_url',
        'telefono',
        'biografia',
        'activo',
    ];

    protected $hidden = [];

    // Sanctum usa 'password' internamente — mapeamos a password_hash
    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }

    // Relación con roles
    public function rol()
    {
        return $this->belongsTo(Rol::class, 'rol_id');
    }

    // Relación perfil estudiante
    public function perfilEstudiante()
    {
        return $this->hasOne(PerfilEstudiante::class, 'usuario_id');
    }

    // Helper: devuelve el código del rol (ADMIN, ESTUDIANTE, TUTOR, REVISOR)
    public function codigoRol(): string
    {
        return $this->rol->codigo ?? '';
    }

    public function getAuthIdentifierName(): string
    {
        return 'correo';
    }

    public function toArray(): array
    {
        $array = parent::toArray();
        unset($array['password_hash']);
        return $array;
    }
}
