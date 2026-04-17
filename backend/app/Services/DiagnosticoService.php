<?php

namespace App\Services;

use App\DAO\DiagnosticoDAO;

class DiagnosticoService
{
    public function __construct(
        private DiagnosticoDAO $dao,
        private RutaAprendizajeService  $rutaService
    ) {}

    // Inicia o reanuda el diagnóstico del estudiante
    public function iniciar(int $estudianteId): array
    {
        // Si ya finalizó el diagnóstico, no puede hacerlo de nuevo
        if ($this->dao->tienteIntentFinalizado($estudianteId)) {
            throw new \Exception('Ya completaste el diagnóstico inicial.', 409);
        }

        $test = $this->dao->obtenerTestActivo();
        if (!$test) {
            throw new \Exception('No hay un test diagnóstico activo en este momento.', 404);
        }

        // Si tiene un intento en proceso, lo reanuda
        $intentoExistente = $this->dao->obtenerIntentoEnProceso($estudianteId);
        if ($intentoExistente) {
            $intentoId = $intentoExistente->id;
        } else {
            $intentoId = $this->dao->crearIntento($test->id, $estudianteId);
        }

        $preguntas          = $this->dao->obtenerPreguntasTest($test->id);
        $respuestasGuardadas = $this->dao->obtenerRespuestasGuardadas($intentoId);

        // Índice de respuestas ya guardadas por ejercicio_id
        $respondidas = [];
        foreach ($respuestasGuardadas as $r) {
            $respondidas[$r->ejercicio_id] = [
                'opcion_id'       => $r->opcion_id,
                'respuesta_texto' => $r->respuesta_texto,
                'es_correcta'     => $r->es_correcta,
            ];
        }

        // Formatea las preguntas con sus opciones
        $preguntasFormateadas = [];
        foreach ($preguntas as $p) {
            $opciones = [];
            if ($p->tipo_ejercicio === 'OPCION_MULTIPLE') {
                foreach ($this->dao->obtenerOpciones($p->ejercicio_id) as $op) {
                    $opciones[] = [
                        'id'           => $op->id,
                        'orden'        => $op->orden_opcion,
                        'texto_opcion' => $op->texto_opcion,
                    ];
                }
            }

            $preguntasFormateadas[] = [
                'pregunta_id'              => $p->pregunta_id,
                'orden'                    => $p->orden_pregunta,
                'ejercicio_id'             => $p->ejercicio_id,
                'enunciado'                => $p->enunciado,
                'tipo_ejercicio'           => $p->tipo_ejercicio,
                'imagen_apoyo_url'         => $p->imagen_apoyo_url,
                'tiempo_estimado_minutos'  => $p->tiempo_estimado_minutos,
                'modulo_id'                => $p->modulo_id,
                'modulo_nombre'            => $p->modulo_nombre,
                'opciones'                 => $opciones,
                'ya_respondida'            => isset($respondidas[$p->ejercicio_id]),
                'respuesta_guardada'       => $respondidas[$p->ejercicio_id] ?? null,
            ];
        }

        return [
            'intento_id'        => $intentoId,
            'test_id'           => $test->id,
            'test_nombre'       => $test->nombre,
            'test_descripcion'  => $test->descripcion,
            'total_preguntas'   => count($preguntasFormateadas),
            'respondidas'       => count($respondidas),
            'preguntas'         => $preguntasFormateadas,
        ];
    }

    // Verifica el estado del diagnóstico del estudiante
    public function estado(int $estudianteId): array
    {
        $finalizado = $this->dao->tienteIntentFinalizado($estudianteId);
        $enProceso  = $this->dao->obtenerIntentoEnProceso($estudianteId);

        return [
            'diagnostico_completado' => $finalizado,
            'tiene_intento_activo'   => !is_null($enProceso),
            'intento_id'             => $enProceso?->id,
        ];
    }

    // Guarda la respuesta de una pregunta
    public function responder(
        int $estudianteId,
        int $intentoId,
        int $ejercicioId,
        ?int $opcionId,
        ?string $respuestaTexto
    ): array {
        $intento = $this->dao->obtenerIntentoPorId($intentoId, $estudianteId);

        if (!$intento) {
            throw new \Exception('Intento no encontrado.', 404);
        }
        if ($intento->estado !== 'EN_PROCESO') {
            throw new \Exception('Este intento ya fue finalizado.', 409);
        }

        $ejercicio = $this->dao->obtenerEjercicioParaEvaluar($ejercicioId);
        if (!$ejercicio) {
            throw new \Exception('Ejercicio no encontrado.', 404);
        }

        // Evalúa si la respuesta es correcta según el tipo
        $esCorrecta = $this->evaluarRespuesta(
            $ejercicio,
            $opcionId,
            $respuestaTexto
        );

        $this->dao->guardarRespuesta(
            $intentoId,
            $ejercicioId,
            $opcionId,
            $respuestaTexto,
            $esCorrecta
        );

        return [
            'ejercicio_id' => $ejercicioId,
            'es_correcta'  => $esCorrecta,
            'guardada'     => true,
        ];
    }

    // Finaliza el intento y calcula resultados por módulo
    public function finalizar(int $estudianteId, int $intentoId): array
    {
        $intento = $this->dao->obtenerIntentoPorId($intentoId, $estudianteId);

        if (!$intento) {
            throw new \Exception('Intento no encontrado.', 404);
        }
        if ($intento->estado !== 'EN_PROCESO') {
            throw new \Exception('Este intento ya fue finalizado.', 409);
        }

        $totalPreguntas  = $this->dao->totalPreguntas($intento->test_diagnostico_id);
        $totalRespondidas = $this->dao->totalRespondidas($intentoId);

        if ($totalRespondidas < $totalPreguntas) {
            throw new \Exception(
                "Aún te faltan " . ($totalPreguntas - $totalRespondidas) . " pregunta(s) por responder.",
                422
            );
        }

        // Calcula resultados por módulo
        $resultadosPorModulo = $this->dao->obtenerResultadosPorModulo(
            $intentoId,
            $intento->test_diagnostico_id
        );

        $totalCorrectas   = 0;
        $resultadosGuardados = [];

        foreach ($resultadosPorModulo as $r) {
            $puntaje       = ($r->correctas / $r->total_preguntas) * 100;
            $clasificacion = $this->clasificar($puntaje);

            $this->dao->guardarResultadoModulo(
                $intentoId,
                $r->modulo_id,
                round($puntaje, 2),
                $clasificacion
            );

            $totalCorrectas += $r->correctas;

            $resultadosGuardados[] = [
                'modulo_id'          => $r->modulo_id,
                'modulo_nombre'      => $r->modulo_nombre,
                'total_preguntas'    => $r->total_preguntas,
                'correctas'          => $r->correctas,
                'puntaje_porcentaje' => round($puntaje, 2),
                'clasificacion'      => $clasificacion,
            ];
        }

        // Puntaje total global
        $puntajeTotal = ($totalCorrectas / $totalPreguntas) * 100;

        $this->dao->finalizarIntento($intentoId, round($puntajeTotal, 2));

        // Genera la ruta personalizada automáticamente al finalizar
        $ruta = $this->rutaService->generar($estudianteId, $intentoId);

        return [
            'intento_id'      => $intentoId,
            'puntaje_total'   => round($puntajeTotal, 2),
            'total_preguntas' => $totalPreguntas,
            'total_correctas' => $totalCorrectas,
            'resultados'      => $resultadosGuardados,
            'ruta_generada'   => $ruta,
        ];
    }

    // Obtiene los resultados finales de un intento ya finalizado
    public function verResultados(int $estudianteId, int $intentoId): array
    {
        $intento = $this->dao->obtenerIntentoPorId($intentoId, $estudianteId);

        if (!$intento) {
            throw new \Exception('Intento no encontrado.', 404);
        }
        if ($intento->estado !== 'FINALIZADO') {
            throw new \Exception('El intento aún no ha sido finalizado.', 422);
        }

        return [
            'intento_id'  => $intentoId,
            'resultados'  => $this->dao->obtenerResultadosFinales($intentoId),
        ];
    }

    // Evalúa si la respuesta es correcta según el tipo de ejercicio
    private function evaluarRespuesta(
        object $ejercicio,
        ?int $opcionId,
        ?string $respuestaTexto
    ): bool {
        switch ($ejercicio->tipo_ejercicio) {

            case 'OPCION_MULTIPLE':
                if (!$opcionId) return false;
                return $this->dao->opcionEsCorrecta($opcionId);

            case 'VERDADERO_FALSO':
                if (!$respuestaTexto || !$ejercicio->respuesta_correcta_texto) return false;
                return strtolower(trim($respuestaTexto)) ===
                    strtolower(trim($ejercicio->respuesta_correcta_texto));

            case 'RESPUESTA_NUMERICA':
                if (!$respuestaTexto || !$ejercicio->respuesta_correcta_texto) return false;
                return trim($respuestaTexto) ===
                    trim($ejercicio->respuesta_correcta_texto);

            case 'COMPLETAR_ESPACIOS':
                if (!$respuestaTexto || !$ejercicio->respuesta_correcta_texto) return false;
                $enviadas  = array_map('trim', explode('|', strtolower($respuestaTexto)));
                $correctas = array_map('trim', explode('|', strtolower($ejercicio->respuesta_correcta_texto)));
                return $enviadas === $correctas;

            default:
                return false;
        }
    }

    // Clasifica el puntaje del módulo
    private function clasificar(float $puntaje): string
    {
        if ($puntaje >= 80) return 'DOMINADO';
        if ($puntaje >= 50) return 'EN_DESARROLLO';
        return 'DEFICIENTE';
    }
}
