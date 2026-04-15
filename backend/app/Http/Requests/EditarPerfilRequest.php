<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EditarPerfilRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombres'                  => ['sometimes', 'string', 'max:100'],
            'apellidos'                => ['sometimes', 'string', 'max:100'],
            'correo'                   => ['sometimes', 'email', 'max:255'],
            'telefono'                 => ['nullable', 'string', 'max:30'],
            'biografia'                => ['nullable', 'string', 'max:500'],
            'foto_perfil_url'          => ['nullable', 'string', 'max:5000'],
            'password'                 => ['sometimes', 'string', 'min:8', 'confirmed'],
            'horas_disponibles_semana' => ['sometimes', 'numeric', 'min:0', 'max:168'],
            'fecha_objetivo_examen'    => ['nullable', 'date'],
        ];
    }
}
