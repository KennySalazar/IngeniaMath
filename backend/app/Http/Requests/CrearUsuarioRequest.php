<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CrearUsuarioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombres'   => ['required', 'string', 'max:100'],
            'apellidos' => ['required', 'string', 'max:100'],
            'correo'    => ['required', 'email', 'max:255'],
            'password'  => ['required', 'string', 'min:8'],
            'rol_id'    => ['required', 'integer', 'in:1,2,3,4'],
        ];
    }

    public function messages(): array
    {
        return [
            'nombres.required'   => 'El nombre es obligatorio.',
            'apellidos.required' => 'Los apellidos son obligatorios.',
            'correo.required'    => 'El correo es obligatorio.',
            'correo.email'       => 'El correo no tiene un formato válido.',
            'password.min'       => 'La contraseña debe tener al menos 8 caracteres.',
            'rol_id.required'    => 'El rol es obligatorio.',
            'rol_id.in'          => 'El rol seleccionado no es válido.',
        ];
    }
}
