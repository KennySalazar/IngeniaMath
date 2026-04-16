<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CrearEjercicioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'modulo_id'                => ['required', 'integer', 'exists:modulos_tematicos,id'],
            'subtema_id'               => ['required', 'integer', 'exists:subtemas,id'],
            'nivel_dificultad'         => ['required', 'in:BASICO,INTERMEDIO,AVANZADO,EXAMEN_REAL'],
            'tipo_ejercicio'           => ['required', 'in:OPCION_MULTIPLE,VERDADERO_FALSO,RESPUESTA_NUMERICA,COMPLETAR_ESPACIOS'],
            'enunciado'                => ['required', 'string', 'min:10'],
            'solucion_paso_a_paso'     => ['required', 'string', 'min:10'],
            'tiempo_estimado_minutos'  => ['required', 'integer', 'min:1', 'max:120'],
            'imagen_apoyo_url'         => ['nullable', 'string'],
            'respuesta_correcta_texto' => ['nullable', 'string'],
            'explicacion_conceptual'   => ['nullable', 'string'],
            'opciones'                 => ['required_if:tipo_ejercicio,OPCION_MULTIPLE', 'array', 'min:2'],
            'opciones.*.texto_opcion'  => ['required_with:opciones', 'string'],
            'opciones.*.es_correcta'   => ['required_with:opciones', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'modulo_id.required'              => 'El módulo temático es obligatorio.',
            'subtema_id.required'             => 'El subtema es obligatorio.',
            'nivel_dificultad.required'       => 'El nivel de dificultad es obligatorio.',
            'nivel_dificultad.in'             => 'El nivel debe ser BASICO, INTERMEDIO, AVANZADO o EXAMEN_REAL.',
            'tipo_ejercicio.required'         => 'El tipo de ejercicio es obligatorio.',
            'enunciado.required'              => 'El enunciado es obligatorio.',
            'enunciado.min'                   => 'El enunciado debe tener al menos 10 caracteres.',
            'solucion_paso_a_paso.required'   => 'La solución paso a paso es obligatoria.',
            'tiempo_estimado_minutos.required' => 'El tiempo estimado es obligatorio.',
            'opciones.required_if'            => 'Las opciones son obligatorias para ejercicios de opción múltiple.',
        ];
    }
}
