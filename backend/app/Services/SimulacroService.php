<?php

namespace App\Services;

use App\DAO\SimulacroDAO;
use Carbon\Carbon;

class SimulacroService
{
    public function __construct(
        private SimulacroDAO $dao
    ) {}

    public function activa(int $estudianteId): array
    {
        $simulacro = $this->dao->obtenerSimulacroActivo($estudianteId);

        if (!$simulacro) {
            return [
                'simulacro' => null,
                'pregunta_actual' => null,
                'progreso' => null,
                'resultado_final' => null,
            ];
        }

        return $this->detalle($estudianteId, (int) $simulacro->id);
    }

    public function iniciar(int $estudianteId): array
    {
        $activo = $this->dao->obtenerSimulacroActivo($estudianteId);

        if ($activo) {
            return $this->detalle($estudianteId, (int) $activo->id);
        }

        $config = $this->dao->obtenerConfiguracionActiva();

        if (!$config) {
            throw new \Exception('No hay una configuracion activa de simulacro.', 404);
        }

        $distribucion = $this->dao->obtenerDistribucionConfiguracion((int) $config->id);

        if (count($distribucion) === 0) {
            throw new \Exception('La configuracion activa no tiene distribucion por modulo.', 422);
        }

        foreach ($distribucion as $fila) {
            $disponibles = $this->dao->contarEjerciciosPublicadosModulo((int) $fila->modulo_id);

            if ($disponibles < (int) $fila->cantidad_preguntas) {
                throw new \Exception(
                    'No hay suficientes ejercicios publicados en el modulo ' . $fila->modulo_nombre . '.',
                    422
                );
            }
        }

        $simulacroId = $this->dao->crearSimulacro(
            (int) $config->id,
            $estudianteId,
            (float) $config->puntaje_minimo_aprobacion
        );

        $orden = 1;

        foreach ($distribucion as $fila) {
            $ejercicios = $this->dao->obtenerEjerciciosAleatoriosModulo(
                (int) $fila->modulo_id,
                (int) $fila->cantidad_preguntas
            );

            foreach ($ejercicios as $ejercicio) {
                $this->dao->insertarPreguntaSimulacro(
                    $simulacroId,
                    (int) $ejercicio->id,
                    $orden
                );

                $orden++;
            }
        }

        return $this->detalle($estudianteId, $simulacroId);
    }

    public function detalle(int $estudianteId, int $simulacroId): array
    {
        $simulacro = $this->dao->obtenerSimulacroPorId($simulacroId, $estudianteId);

        if (!$simulacro) {
            throw new \Exception('El simulacro no existe.', 404);
        }

        $simulacro = $this->sincronizarEstado($estudianteId, $simulacro);

        $progreso = $this->dao->obtenerProgresoSimulacro((int) $simulacro->id);

        if ($simulacro->estado !== 'EN_PROCESO') {
            return [
                'simulacro' => $this->formatearSimulacro($simulacro),
                'pregunta_actual' => null,
                'progreso' => $this->formatearProgreso($progreso),
                'resultado_final' => $this->obtenerResultadoFinal((int) $simulacro->id, $estudianteId),
            ];
        }

        $pregunta = $this->dao->obtenerPreguntaActual((int) $simulacro->id);

        if (!$pregunta) {
            $this->finalizarInterno($estudianteId, (int) $simulacro->id, 'FINALIZADO');

            $simulacro = $this->dao->obtenerSimulacroPorId($simulacroId, $estudianteId);
            $progreso = $this->dao->obtenerProgresoSimulacro((int) $simulacro->id);

            return [
                'simulacro' => $this->formatearSimulacro($simulacro),
                'pregunta_actual' => null,
                'progreso' => $this->formatearProgreso($progreso),
                'resultado_final' => $this->obtenerResultadoFinal((int) $simulacro->id, $estudianteId),
            ];
        }

        return [
            'simulacro' => $this->formatearSimulacro($simulacro),
            'pregunta_actual' => $this->formatearPregunta($pregunta),
            'progreso' => $this->formatearProgreso($progreso),
            'resultado_final' => null,
        ];
    }

    public function responder(int $estudianteId, int $simulacroId, array $data): array
    {
        $simulacro = $this->dao->obtenerSimulacroPorId($simulacroId, $estudianteId);

        if (!$simulacro) {
            throw new \Exception('El simulacro no existe.', 404);
        }

        $simulacro = $this->sincronizarEstado($estudianteId, $simulacro);

        if ($simulacro->estado !== 'EN_PROCESO') {
            return $this->detalle($estudianteId, $simulacroId);
        }

        $preguntaActual = $this->dao->obtenerPreguntaActual($simulacroId);

        if (!$preguntaActual) {
            return $this->detalle($estudianteId, $simulacroId);
        }

        $ejercicioId = (int) ($data['ejercicio_id'] ?? 0);
        $opcionId = isset($data['opcion_id']) ? (int) $data['opcion_id'] : null;
        $respuestaTexto = isset($data['respuesta_texto']) ? trim((string) $data['respuesta_texto']) : null;

        if (!$ejercicioId) {
            throw new \Exception('El ejercicio es obligatorio.', 422);
        }

        if ((int) $preguntaActual->ejercicio_id !== $ejercicioId) {
            throw new \Exception('Debes responder la pregunta actual del simulacro.', 409);
        }

        $ejercicio = $this->dao->obtenerEjercicioParaEvaluar($ejercicioId);

        if (!$ejercicio) {
            throw new \Exception('El ejercicio no existe o no esta publicado.', 404);
        }

        [$esCorrecta, $respuestaNormalizada] = $this->evaluarRespuesta(
            $ejercicio,
            $opcionId,
            $respuestaTexto
        );

        $this->dao->registrarRespuestaPregunta(
            $simulacroId,
            $ejercicioId,
            $opcionId,
            $respuestaNormalizada,
            $esCorrecta
        );

        return $this->detalle($estudianteId, $simulacroId);
    }

    public function finalizar(int $estudianteId, int $simulacroId): array
    {
        $simulacro = $this->dao->obtenerSimulacroPorId($simulacroId, $estudianteId);

        if (!$simulacro) {
            throw new \Exception('El simulacro no existe.', 404);
        }

        if ($simulacro->estado === 'EN_PROCESO') {
            $this->finalizarInterno($estudianteId, $simulacroId, 'FINALIZADO');
        }

        return $this->detalle($estudianteId, $simulacroId);
    }

  public function historial(int $estudianteId): array
        {
            $items = [];

            foreach ($this->dao->obtenerHistorialSimulacros($estudianteId) as $item) {
                $items[] = $this->formatearHistorial($item);
            }

            $insights = $this->calcularInsightsModulos($estudianteId);

            return [
                'items' => $items,
                'total' => count($items),
                'insights' => $insights,
            ];
        }

    private function sincronizarEstado(int $estudianteId, object $simulacro): object
    {
        if ($simulacro->estado !== 'EN_PROCESO') {
            return $simulacro;
        }

        $finProgramado = Carbon::parse($simulacro->fecha_inicio)->addMinutes((int) $simulacro->duracion_minutos);

        if (now()->greaterThanOrEqualTo($finProgramado)) {
            $this->finalizarInterno($estudianteId, (int) $simulacro->id, 'EXPIRADO');
            return $this->dao->obtenerSimulacroPorId((int) $simulacro->id, $estudianteId);
        }

        return $simulacro;
    }

    private function finalizarInterno(int $estudianteId, int $simulacroId, string $estado): void
    {
        $simulacro = $this->dao->obtenerSimulacroPorId($simulacroId, $estudianteId);

        if (!$simulacro) {
            throw new \Exception('El simulacro no existe.', 404);
        }

        $progreso = $this->dao->obtenerProgresoSimulacro($simulacroId);

        $total = (int) $progreso->total_preguntas;
        $correctas = (int) $progreso->correctas;

        $puntaje = $total > 0
            ? round(($correctas * 100) / $total, 2)
            : 0.00;

        $aprueba = $puntaje >= (float) $simulacro->puntaje_minimo_referencia;

        $duracionMinutosReal = (int) ceil(
            Carbon::parse($simulacro->fecha_inicio)->diffInSeconds(now()) / 60
        );

        $this->dao->eliminarResultadosModulo($simulacroId);

        foreach ($this->dao->obtenerResultadosAgrupadosPorModulo($simulacroId) as $fila) {
            $porcentaje = (int) $fila->total_preguntas > 0
                ? round(((int) $fila->total_correctas * 100) / (int) $fila->total_preguntas, 2)
                : 0.00;

            $this->dao->insertarResultadoModulo(
                $simulacroId,
                (int) $fila->modulo_id,
                (int) $fila->total_preguntas,
                (int) $fila->total_correctas,
                $porcentaje
            );
        }

        $this->dao->cerrarSimulacro(
            $simulacroId,
            $estado,
            $puntaje,
            $aprueba,
            $duracionMinutosReal
        );
    }

    private function evaluarRespuesta(object $ejercicio, ?int $opcionId, ?string $respuestaTexto): array
    {
        if ($ejercicio->tipo_ejercicio === 'OPCION_MULTIPLE') {
            if (!$opcionId) {
                throw new \Exception('Debes seleccionar una opcion.', 422);
            }

            return [$this->dao->opcionEsCorrecta($opcionId), null];
        }

        if ($ejercicio->tipo_ejercicio === 'VERDADERO_FALSO') {
            if ($opcionId) {
                return [$this->dao->opcionEsCorrecta($opcionId), null];
            }

            if ($respuestaTexto === null || trim($respuestaTexto) === '') {
                throw new \Exception('Debes seleccionar Verdadero o Falso.', 422);
            }

            $usuario = $this->normalizarVerdaderoFalso($respuestaTexto);
            $correcta = $this->normalizarVerdaderoFalso((string) $ejercicio->respuesta_correcta_texto);

            return [$usuario === $correcta, $respuestaTexto];
        }

        if ($respuestaTexto === null || trim($respuestaTexto) === '') {
            throw new \Exception('Debes ingresar una respuesta.', 422);
        }

        $normalUsuario = $this->normalizarTexto($respuestaTexto);
        $normalCorrecta = $this->normalizarTexto((string) $ejercicio->respuesta_correcta_texto);

        return [$normalUsuario === $normalCorrecta, $respuestaTexto];
    }

    private function normalizarVerdaderoFalso(string $texto): string
    {
        $valor = $this->normalizarTexto($texto);

        if (in_array($valor, ['verdadero', 'v', 'true', '1', 'si'])) {
            return 'verdadero';
        }

        if (in_array($valor, ['falso', 'f', 'false', '0', 'no'])) {
            return 'falso';
        }

        return $valor;
    }

    private function normalizarTexto(string $texto): string
    {
        $texto = trim(mb_strtolower($texto));
        $texto = str_replace(
            ['á', 'é', 'í', 'ó', 'ú', 'ü', 'ñ'],
            ['a', 'e', 'i', 'o', 'u', 'u', 'n'],
            $texto
        );
        $texto = preg_replace('/\s+/', '', $texto);

        return $texto;
    }

    private function formatearSimulacro(object $simulacro): array
    {
        $finProgramado = Carbon::parse($simulacro->fecha_inicio)->addMinutes((int) $simulacro->duracion_minutos);
        $segundosRestantes = (int) max(0, floor(now()->diffInSeconds($finProgramado, false)));

        return [
            'id' => (int) $simulacro->id,
            'estado' => $simulacro->estado,
            'configuracion_nombre' => $simulacro->configuracion_nombre,
            'duracion_minutos' => (int) $simulacro->duracion_minutos,
            'cantidad_preguntas' => (int) $simulacro->cantidad_preguntas,
            'puntaje_total' => $simulacro->puntaje_total !== null ? (float) $simulacro->puntaje_total : null,
            'puntaje_minimo_referencia' => (float) $simulacro->puntaje_minimo_referencia,
            'aprueba_referencia' => $simulacro->aprueba_referencia !== null ? (bool) $simulacro->aprueba_referencia : null,
            'duracion_minutos_real' => $simulacro->duracion_minutos_real !== null ? (int) $simulacro->duracion_minutos_real : null,
            'fecha_inicio' => $simulacro->fecha_inicio,
            'fecha_fin' => $simulacro->fecha_fin,
            'tiempo_restante_segundos' => $simulacro->estado === 'EN_PROCESO' ? $segundosRestantes : 0,
        ];
    }

    private function formatearPregunta(object $pregunta): array
    {
        $opciones = [];

        if (in_array($pregunta->tipo_ejercicio, ['OPCION_MULTIPLE', 'VERDADERO_FALSO'])) {
            foreach ($this->dao->obtenerOpcionesEjercicio((int) $pregunta->ejercicio_id) as $opcion) {
                $opciones[] = [
                    'id' => (int) $opcion->id,
                    'orden' => (int) $opcion->orden_opcion,
                    'texto_opcion' => $opcion->texto_opcion,
                ];
            }
        }

        return [
            'simulacro_pregunta_id' => (int) $pregunta->simulacro_pregunta_id,
            'ejercicio_id' => (int) $pregunta->ejercicio_id,
            'orden_pregunta' => (int) $pregunta->orden_pregunta,
            'modulo_id' => (int) $pregunta->modulo_id,
            'modulo_nombre' => $pregunta->modulo_nombre,
            'subtema_id' => $pregunta->subtema_id ? (int) $pregunta->subtema_id : null,
            'subtema_nombre' => $pregunta->subtema_nombre,
            'nivel_dificultad' => $pregunta->nivel_dificultad,
            'tipo_ejercicio' => $pregunta->tipo_ejercicio,
            'enunciado' => $pregunta->enunciado,
            'imagen_apoyo_url' => $pregunta->imagen_apoyo_url,
            'tiempo_estimado_minutos' => $pregunta->tiempo_estimado_minutos ? (int) $pregunta->tiempo_estimado_minutos : 0,
            'opciones' => $opciones,
        ];
    }

    private function formatearProgreso(object $progreso): array
    {
        return [
            'total_preguntas' => (int) $progreso->total_preguntas,
            'respondidas' => (int) $progreso->respondidas,
            'correctas' => (int) $progreso->correctas,
            'pendientes' => (int) $progreso->pendientes,
        ];
    }

    private function obtenerResultadoFinal(int $simulacroId, int $estudianteId): array
    {
        $simulacro = $this->dao->obtenerSimulacroPorId($simulacroId, $estudianteId);
        $progreso = $this->dao->obtenerProgresoSimulacro($simulacroId);

        $resultadosModulo = [];
        foreach ($this->dao->obtenerResultadosPorModulo($simulacroId) as $fila) {
            $resultadosModulo[] = [
                'modulo_id' => (int) $fila->modulo_id,
                'modulo_nombre' => $fila->modulo_nombre,
                'total_preguntas' => (int) $fila->total_preguntas,
                'total_correctas' => (int) $fila->total_correctas,
                'puntaje_porcentaje' => (float) $fila->puntaje_porcentaje,
            ];
        }

        $incorrectas = [];
        foreach ($this->dao->obtenerPreguntasIncorrectas($simulacroId) as $fila) {
            $incorrectas[] = [
                'ejercicio_id' => (int) $fila->ejercicio_id,
                'orden_pregunta' => (int) $fila->orden_pregunta,
                'modulo_nombre' => $fila->modulo_nombre,
                'subtema_nombre' => $fila->subtema_nombre,
                'tipo_ejercicio' => $fila->tipo_ejercicio,
                'enunciado' => $fila->enunciado,
                'imagen_apoyo_url' => $fila->imagen_apoyo_url,
                'respuesta_usuario' => $fila->respuesta_usuario,
                'respuesta_correcta_texto' => $fila->respuesta_correcta_texto,
                'solucion_paso_a_paso' => $fila->solucion_paso_a_paso,
                'explicacion_conceptual' => $fila->explicacion_conceptual,
            ];
        }

        return [
            'puntaje_total' => $simulacro->puntaje_total !== null ? (float) $simulacro->puntaje_total : 0.00,
            'puntaje_minimo_referencia' => (float) $simulacro->puntaje_minimo_referencia,
            'aprueba_referencia' => (bool) $simulacro->aprueba_referencia,
            'duracion_minutos_real' => $simulacro->duracion_minutos_real !== null ? (int) $simulacro->duracion_minutos_real : 0,
            'total_preguntas' => (int) $progreso->total_preguntas,
            'respondidas' => (int) $progreso->respondidas,
            'correctas' => (int) $progreso->correctas,
            'resultados_modulo' => $resultadosModulo,
            'preguntas_incorrectas' => $incorrectas,
        ];
    }

    private function formatearHistorial(object $item): array
    {
        return [
            'id' => (int) $item->id,
            'estado' => $item->estado,
            'configuracion_nombre' => $item->configuracion_nombre,
            'duracion_minutos' => (int) $item->duracion_minutos,
            'cantidad_preguntas' => (int) $item->cantidad_preguntas,
            'puntaje_total' => $item->puntaje_total !== null ? (float) $item->puntaje_total : null,
            'puntaje_minimo_referencia' => (float) $item->puntaje_minimo_referencia,
            'aprueba_referencia' => $item->aprueba_referencia !== null ? (bool) $item->aprueba_referencia : null,
            'duracion_minutos_real' => $item->duracion_minutos_real !== null ? (int) $item->duracion_minutos_real : null,
            'fecha_inicio' => $item->fecha_inicio,
            'fecha_fin' => $item->fecha_fin,
        ];
    }

    public function configuracion(): array
{
    $config = $this->dao->obtenerConfiguracionActiva();

    if (!$config) {
        throw new \Exception('No hay una configuracion activa de simulacro.', 404);
    }

    $distribucion = [];

    foreach ($this->dao->obtenerDistribucionConfiguracion((int) $config->id) as $fila) {
        $distribucion[] = [
            'modulo_id' => (int) $fila->modulo_id,
            'modulo_nombre' => $fila->modulo_nombre,
            'cantidad_preguntas' => (int) $fila->cantidad_preguntas,
        ];
    }

    return [
        'id' => (int) $config->id,
        'nombre' => $config->nombre,
        'duracion_minutos' => (int) $config->duracion_minutos,
        'cantidad_preguntas' => (int) $config->cantidad_preguntas,
        'puntaje_minimo_aprobacion' => (float) $config->puntaje_minimo_aprobacion,
        'activa' => (bool) $config->activa,
        'distribucion' => $distribucion,
    ];
}


    public function actualizarConfiguracion(int $adminId, array $data): array
    {
        $config = $this->dao->obtenerConfiguracionActiva();

        if (!$config) {
            throw new \Exception('No hay una configuracion activa de simulacro.', 404);
        }

        $distribucion = $this->dao->obtenerDistribucionConfiguracion((int) $config->id);

        if (count($distribucion) === 0) {
            throw new \Exception('La configuracion activa no tiene distribucion por modulo.', 422);
        }

        $nombre = trim((string) ($data['nombre'] ?? $config->nombre));
        $duracionMinutos = (int) ($data['duracion_minutos'] ?? $config->duracion_minutos);
        $puntajeMinimo = (float) ($data['puntaje_minimo_aprobacion'] ?? $config->puntaje_minimo_aprobacion);

        if ($nombre === '') {
            throw new \Exception('El nombre de la configuracion es obligatorio.', 422);
        }

        if ($duracionMinutos < 1 || $duracionMinutos > 240) {
            throw new \Exception('La duracion debe estar entre 1 y 240 minutos.', 422);
        }

        if ($puntajeMinimo < 0 || $puntajeMinimo > 100) {
            throw new \Exception('El puntaje minimo debe estar entre 0 y 100.', 422);
        }

        $cantidadPreguntas = 0;

        foreach ($distribucion as $fila) {
            $cantidadPreguntas += (int) $fila->cantidad_preguntas;
        }

        $this->dao->crearNuevaConfiguracionActiva(
            $nombre,
            $duracionMinutos,
            $cantidadPreguntas,
            $puntajeMinimo,
            $adminId,
            $distribucion
        );

        return $this->configuracion();
    }
private function calcularInsightsModulos(int $estudianteId): array
{
    $filas = $this->dao->obtenerHistorialResultadosPorModulo($estudianteId);

    if (count($filas) === 0) {
        return [
            'mayor_mejora' => null,
            'debilidad_persistente' => null,
        ];
    }

    $porModulo = [];

    foreach ($filas as $fila) {
        $moduloId = (int) $fila->modulo_id;

        if (!isset($porModulo[$moduloId])) {
            $porModulo[$moduloId] = [
                'modulo_id' => $moduloId,
                'modulo_nombre' => $fila->modulo_nombre,
                'puntajes' => [],
            ];
        }

        $porModulo[$moduloId]['puntajes'][] = (float) $fila->puntaje_porcentaje;
    }

    $mayorMejora = null;
    $debilidadPersistente = null;
    $mejorDelta = null;
    $peorPromedio = null;

    foreach ($porModulo as $modulo) {
        $puntajes = $modulo['puntajes'];
        $cantidad = count($puntajes);
        $promedio = $cantidad > 0 ? array_sum($puntajes) / $cantidad : 0.0;

        if ($cantidad >= 2) {
            $delta = end($puntajes) - reset($puntajes);

            if ($mejorDelta === null || $delta > $mejorDelta) {
                $mejorDelta = $delta;
                $mayorMejora = [
                    'modulo_id' => $modulo['modulo_id'],
                    'modulo_nombre' => $modulo['modulo_nombre'],
                    'puntaje_inicial' => round((float) reset($puntajes), 2),
                    'puntaje_final' => round((float) end($puntajes), 2),
                    'mejora_porcentaje' => round($delta, 2),
                ];
            }
        }

        if ($peorPromedio === null || $promedio < $peorPromedio) {
            $peorPromedio = $promedio;
            $debilidadPersistente = [
                'modulo_id' => $modulo['modulo_id'],
                'modulo_nombre' => $modulo['modulo_nombre'],
                'promedio_porcentaje' => round($promedio, 2),
                'intentos_considerados' => $cantidad,
            ];
        }
    }

    if ($mayorMejora !== null && $mayorMejora['mejora_porcentaje'] <= 0) {
        $mayorMejora = null;
    }

    return [
        'mayor_mejora' => $mayorMejora,
        'debilidad_persistente' => $debilidadPersistente,
    ];
}
}

