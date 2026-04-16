<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EditarEjercicioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'modulo_id'                => ['sometimes', 'integer', 'exists:modulos_tematicos,id'],
            'subtema_id'               => ['sometimes', 'integer', 'exists:subtemas,id'],
            'nivel_dificultad'         => ['sometimes', 'in:BASICO,INTERMEDIO,AVANZADO,EXAMEN_REAL'],
            'tipo_ejercicio'           => ['sometimes', 'in:OPCION_MULTIPLE,VERDADERO_FALSO,RESPUESTA_NUMERICA,COMPLETAR_ESPACIOS'],
            'enunciado'                => ['sometimes', 'string', 'min:10'],
            'solucion_paso_a_paso'     => ['sometimes', 'string', 'min:10'],
            'tiempo_estimado_minutos'  => ['sometimes', 'integer', 'min:1', 'max:120'],
            'imagen_apoyo_url'         => ['nullable', 'string'],
            'respuesta_correcta_texto' => ['nullable', 'string'],
            'explicacion_conceptual'   => ['nullable', 'string'],
            'opciones'                 => ['sometimes', 'array', 'min:2'],
            'opciones.*.texto_opcion'  => ['required_with:opciones', 'string'],
            'opciones.*.es_correcta'   => ['required_with:opciones', 'boolean'],
        ];
    }
}
