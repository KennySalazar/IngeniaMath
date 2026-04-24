<?php

namespace App\Services;

use App\DAO\PracticaDAO;

class PracticaService
{
    private const NIVELES = ['BASICO', 'INTERMEDIO', 'AVANZADO', 'EXAMEN_REAL'];

    public function __construct(
        private PracticaDAO $dao
    ) {}

    public function iniciar(int $estudianteId, array $data): array
    {
        $sesionActiva = $this->dao->obtenerSesionActiva($estudianteId);

        if ($sesionActiva) {
            return $this->detalle($estudianteId, (int) $sesionActiva->id);
        }

        $modo = strtoupper(trim((string) ($data['modo'] ?? '')));

        if (!in_array($modo, ['LIBRE', 'GUIADA'])) {
            throw new \Exception('El modo de practica es invalido.', 422);
        }

        $moduloId = null;
        $subtemaId = null;
        $nivel = null;
        $rutaId = null;

        if ($modo === 'LIBRE') {
            $moduloId = isset($data['modulo_id']) ? (int) $data['modulo_id'] : null;
            $subtemaId = isset($data['subtema_id']) ? (int) $data['subtema_id'] : null;
            $nivel = strtoupper(trim((string) ($data['nivel_dificultad'] ?? '')));

            if (!$moduloId) {
                throw new \Exception('Debes seleccionar un modulo.', 422);
            }

            if (!in_array($nivel, self::NIVELES)) {
                throw new \Exception('Debes seleccionar un nivel valido.', 422);
            }
        }

        if ($modo === 'GUIADA') {
            $ruta = $this->dao->obtenerRutaActiva($estudianteId);

            if (!$ruta) {
                throw new \Exception('No tienes una ruta de aprendizaje activa.', 404);
            }

            $objetivo = $this->dao->obtenerSubtemaGuiado($estudianteId, (int) $ruta->id);

            if (!$objetivo) {
                throw new \Exception('No tienes subtemas pendientes en tu ruta.', 422);
            }

            $moduloId = (int) $objetivo->modulo_id;
            $subtemaId = (int) $objetivo->subtema_id;
            $rutaId = (int) $ruta->id;
            $nivel = 'BASICO';
        }

        $sesionId = $this->dao->crearSesion(
            $estudianteId,
            $modo,
            $moduloId,
            $subtemaId,
            $nivel,
            $rutaId
        );

        return $this->detalle($estudianteId, $sesionId);
    }

        public function guardados(int $estudianteId): array
    {
        $items = [];

        foreach ($this->dao->obtenerEjerciciosGuardados($estudianteId) as $item) {
            $items[] = $this->formatearGuardado($item);
        }

        return [
            'items' => $items,
            'total' => count($items),
        ];
    }

    public function eliminarGuardado(int $estudianteId, int $ejercicioId): array
    {
        $eliminados = $this->dao->eliminarEjercicioGuardado($estudianteId, $ejercicioId);

        if ($eliminados === 0) {
            throw new \Exception('El ejercicio guardado no existe.', 404);
        }

        return [
            'message' => 'Ejercicio eliminado de guardados.',
        ];
    }

    public function detalle(int $estudianteId, int $sesionId): array
    {
        $sesion = $this->dao->obtenerSesionPorId($sesionId, $estudianteId);

        if (!$sesion) {
            throw new \Exception('La sesion no existe.', 404);
        }

        $ejercicio = null;

        if ($sesion->fecha_fin === null) {
            $ejercicio = $this->buscarSiguienteEjercicio($estudianteId, $sesion);
        }

        return [
            'sesion' => $this->formatearSesion($sesion),
            'ejercicio_actual' => $ejercicio,
            'resumen' => $this->formatearResumen(
                $this->dao->obtenerResumenSesion($sesionId, $estudianteId)
            ),
        ];
    }

    public function responder(int $estudianteId, int $sesionId, array $data): array
    {
        $sesionAntes = $this->dao->obtenerSesionPorId($sesionId, $estudianteId);

        if (!$sesionAntes) {
            throw new \Exception('La sesion no existe.', 404);
        }

        if ($sesionAntes->fecha_fin !== null) {
            throw new \Exception('La sesion ya fue finalizada.', 409);
        }

        $ejercicioId = (int) ($data['ejercicio_id'] ?? 0);
        $opcionId = isset($data['opcion_id']) ? (int) $data['opcion_id'] : null;
        $respuestaTexto = isset($data['respuesta_texto']) ? trim((string) $data['respuesta_texto']) : null;
        $marcadoGuardado = (bool) ($data['marcado_guardado'] ?? false);
        $tiempoSegundos = isset($data['tiempo_segundos']) ? (int) $data['tiempo_segundos'] : null;

        if (!$ejercicioId) {
            throw new \Exception('El ejercicio es obligatorio.', 422);
        }

        $ejercicio = $this->dao->obtenerEjercicioPorId($ejercicioId);

        if (!$ejercicio) {
            throw new \Exception('El ejercicio no existe o no esta publicado.', 404);
        }

        [$esCorrecta, $respuestaNormalizada] = $this->evaluarRespuesta(
            $ejercicio,
            $opcionId,
            $respuestaTexto
        );

        $this->dao->guardarRespuesta(
            $sesionId,
            $ejercicioId,
            $opcionId,
            $respuestaNormalizada,
            $esCorrecta,
            $marcadoGuardado,
            $tiempoSegundos
        );

        if ($marcadoGuardado) {
            $this->dao->guardarEjercicio($estudianteId, $ejercicioId);
        }

        $this->dao->actualizarResumenSesion($sesionId);

        $avisos = [];
        $sesionActual = $this->dao->obtenerSesionPorId($sesionId, $estudianteId);

        if ($sesionAntes->subtema_id) {
            $nivelBase = $sesionAntes->nivel_dificultad ?: 'BASICO';

                $nivelRecalculado = $this->recalcularNivel(
                    $sesionId,
                    (int) $sesionAntes->subtema_id,
                    $nivelBase,
                    $esCorrecta
                );

            if ($nivelRecalculado !== $sesionActual->nivel_dificultad) {
                $this->dao->actualizarObjetivoSesion(
                    $sesionId,
                    $sesionActual->modulo_id ? (int) $sesionActual->modulo_id : null,
                    $sesionActual->subtema_id ? (int) $sesionActual->subtema_id : null,
                    $nivelRecalculado
                );

                $avisos = array_merge(
                    $avisos,
                    $this->construirAvisoCambioNivel(
                        (string) $sesionActual->nivel_dificultad,
                        (string) $nivelRecalculado
                    )
                );
            }

            if ($sesionActual->ruta_id && $this->debeCompletarSubtema($estudianteId, (int) $sesionActual->subtema_id)) {
                $this->dao->marcarSubtemaCompletado((int) $sesionActual->ruta_id, (int) $sesionActual->subtema_id);
            }
        }

        $sesionParaBuscar = $this->dao->obtenerSesionPorId($sesionId, $estudianteId);
        $siguiente = $this->buscarSiguienteEjercicio($estudianteId, $sesionParaBuscar);
        $sesionDespues = $this->dao->obtenerSesionPorId($sesionId, $estudianteId);

        $avisos = array_merge(
            $avisos,
            $this->construirAvisosTransicion($sesionAntes, $sesionDespues, $siguiente)
        );

        return [
            'es_correcta' => $esCorrecta,
            'mensaje' => $esCorrecta ? 'Respuesta correcta.' : 'Respuesta incorrecta.',
            'solucion_paso_a_paso' => $ejercicio->solucion_paso_a_paso,
            'explicacion_conceptual' => $ejercicio->explicacion_conceptual,
            'nivel_actual' => $sesionDespues->nivel_dificultad,
            'siguiente_ejercicio' => $siguiente,
            'resumen' => $this->formatearResumen(
                $this->dao->obtenerResumenSesion($sesionId, $estudianteId)
            ),
            'avisos' => $avisos,
        ];
    }


    public function finalizar(int $estudianteId, int $sesionId): array
    {
        $sesion = $this->dao->obtenerSesionPorId($sesionId, $estudianteId);

        if (!$sesion) {
            throw new \Exception('La sesion no existe.', 404);
        }

        if ($sesion->fecha_fin === null) {
            $this->dao->cerrarSesion($sesionId);
        }

        $sesion = $this->dao->obtenerSesionPorId($sesionId, $estudianteId);

        return [
            'sesion' => $this->formatearSesion($sesion),
            'resumen' => $this->formatearResumen(
                $this->dao->obtenerResumenSesion($sesionId, $estudianteId)
            ),
        ];
    }

    public function historial(int $estudianteId): array
{
    $items = [];

    foreach ($this->dao->obtenerHistorialSesiones($estudianteId) as $item) {
        $items[] = $this->formatearHistorialSesion($item);
    }

    return [
        'items' => $items,
        'total' => count($items),
    ];
}

    public function activa(int $estudianteId): array
{
    $sesion = $this->dao->obtenerSesionActiva($estudianteId);

    if (!$sesion) {
        return [
            'activa' => false,
            'sesion' => null,
            'resumen' => null,
        ];
    }

    return [
        'activa' => true,
        'sesion' => $this->formatearSesion($sesion),
        'resumen' => $this->formatearResumen(
            $this->dao->obtenerResumenSesion((int) $sesion->id, $estudianteId)
        ),
    ];
}

    public function resumen(int $estudianteId, int $sesionId): array
    {
        $sesion = $this->dao->obtenerSesionPorId($sesionId, $estudianteId);

        if (!$sesion) {
            throw new \Exception('La sesion no existe.', 404);
        }

        return [
            'sesion' => $this->formatearSesion($sesion),
            'resumen' => $this->formatearResumen(
                $this->dao->obtenerResumenSesion($sesionId, $estudianteId)
            ),
        ];
    }
        public function guardarParaDespues(int $estudianteId, array $data): array
{
    $ejercicioId = (int) ($data['ejercicio_id'] ?? 0);
    $sesionId = (int) ($data['sesion_id'] ?? 0);
    $tiempoSegundos = isset($data['tiempo_segundos']) ? (int) $data['tiempo_segundos'] : null;

    if (!$ejercicioId) {
        throw new \Exception('El ejercicio es obligatorio.', 422);
    }

    $ejercicio = $this->dao->obtenerEjercicioPorId($ejercicioId);

    if (!$ejercicio) {
        throw new \Exception('El ejercicio no existe o no esta publicado.', 404);
    }

    $this->dao->guardarEjercicio($estudianteId, $ejercicioId);

    if (!$sesionId) {
        return [
            'message' => 'Ejercicio guardado para revisar despues.',
            'avisos' => [],
        ];
    }

    $sesionAntes = $this->dao->obtenerSesionPorId($sesionId, $estudianteId);

    if (!$sesionAntes) {
        throw new \Exception('La sesion no existe.', 404);
    }

    if ($sesionAntes->fecha_fin !== null) {
        throw new \Exception('La sesion ya fue finalizada.', 409);
    }

    $this->dao->omitirEjercicio($sesionId, $ejercicioId, $tiempoSegundos);
    $this->dao->actualizarResumenSesion($sesionId);

    $sesionParaBuscar = $this->dao->obtenerSesionPorId($sesionId, $estudianteId);
    $siguiente = $this->buscarSiguienteEjercicio($estudianteId, $sesionParaBuscar);
    $sesionDespues = $this->dao->obtenerSesionPorId($sesionId, $estudianteId);

    return [
        'message' => 'Ejercicio guardado para revisar despues.',
        'siguiente_ejercicio' => $siguiente,
        'resumen' => $this->formatearResumen(
            $this->dao->obtenerResumenSesion($sesionId, $estudianteId)
        ),
        'avisos' => $this->construirAvisosTransicion($sesionAntes, $sesionDespues, $siguiente),
    ];
}

public function omitirPorTiempo(int $estudianteId, int $sesionId, array $data): array
{
    $ejercicioId = (int) ($data['ejercicio_id'] ?? 0);
    $tiempoSegundos = isset($data['tiempo_segundos']) ? (int) $data['tiempo_segundos'] : null;

    if (!$ejercicioId) {
        throw new \Exception('El ejercicio es obligatorio.', 422);
    }

    $sesionAntes = $this->dao->obtenerSesionPorId($sesionId, $estudianteId);

    if (!$sesionAntes) {
        throw new \Exception('La sesion no existe.', 404);
    }

    if ($sesionAntes->fecha_fin !== null) {
        throw new \Exception('La sesion ya fue finalizada.', 409);
    }

    $ejercicio = $this->dao->obtenerEjercicioPorId($ejercicioId);

    if (!$ejercicio) {
        throw new \Exception('El ejercicio no existe o no esta publicado.', 404);
    }

    $this->dao->omitirPorTiempo($sesionId, $ejercicioId, $tiempoSegundos);
    $this->dao->actualizarResumenSesion($sesionId);

    $sesionParaBuscar = $this->dao->obtenerSesionPorId($sesionId, $estudianteId);
    $siguiente = $this->buscarSiguienteEjercicio($estudianteId, $sesionParaBuscar);
    $sesionDespues = $this->dao->obtenerSesionPorId($sesionId, $estudianteId);

    $avisos = [
        [
            'tipo' => 'warning',
            'mensaje' => 'Tiempo agotado. El ejercicio se registro como omitido.',
        ],
    ];

    $avisos = array_merge(
        $avisos,
        $this->construirAvisosTransicion($sesionAntes, $sesionDespues, $siguiente)
    );

    return [
        'message' => 'Tiempo agotado. El ejercicio se registro como omitido.',
        'siguiente_ejercicio' => $siguiente,
        'resumen' => $this->formatearResumen(
            $this->dao->obtenerResumenSesion($sesionId, $estudianteId)
        ),
        'avisos' => $avisos,
        'sesion' => $this->formatearSesion($sesionDespues),
    ];
}



    private function buscarSiguienteEjercicio(int $estudianteId, object $sesion): ?array
    {
        $niveles = $this->nivelesCandidatos((string) ($sesion->nivel_dificultad ?: 'BASICO'));

        foreach ($niveles as $nivel) {
            $ejercicio = $this->dao->buscarEjercicioDisponible(
                $estudianteId,
                (int) $sesion->id,
                (int) $sesion->modulo_id,
                $sesion->subtema_id ? (int) $sesion->subtema_id : null,
                $nivel
            );

            if ($ejercicio) {
                return $this->formatearEjercicio($ejercicio);
            }
        }

        if ($sesion->modo === 'GUIADA' && $sesion->ruta_id) {
            $nuevoObjetivo = $this->dao->obtenerSubtemaGuiado(
                $estudianteId,
                (int) $sesion->ruta_id,
                $sesion->subtema_id ? (int) $sesion->subtema_id : null
            );

            if ($nuevoObjetivo) {
                $this->dao->actualizarObjetivoSesion(
                    (int) $sesion->id,
                    (int) $nuevoObjetivo->modulo_id,
                    (int) $nuevoObjetivo->subtema_id,
                    (string) ($sesion->nivel_dificultad ?: 'BASICO')
                );

                $sesion = $this->dao->obtenerSesionPorId((int) $sesion->id, $estudianteId);
                $niveles = $this->nivelesCandidatos((string) ($sesion->nivel_dificultad ?: 'BASICO'));

                foreach ($niveles as $nivel) {
                    $ejercicio = $this->dao->buscarEjercicioDisponible(
                        $estudianteId,
                        (int) $sesion->id,
                        (int) $sesion->modulo_id,
                        $sesion->subtema_id ? (int) $sesion->subtema_id : null,
                        $nivel
                    );

                    if ($ejercicio) {
                        return $this->formatearEjercicio($ejercicio);
                    }
                }
            }
        }

        return null;
    }

    private function indiceNivel(string $nivel): ?int
{
    $indice = array_search($nivel, self::NIVELES, true);

    return $indice === false ? null : $indice;
}

private function construirAvisoCambioNivel(string $nivelAntes, string $nivelDespues): array
{
    $indiceAntes = $this->indiceNivel($nivelAntes);
    $indiceDespues = $this->indiceNivel($nivelDespues);

    if ($indiceAntes === null || $indiceDespues === null || $nivelAntes === $nivelDespues) {
        return [];
    }

    if ($indiceDespues > $indiceAntes) {
        return [[
            'tipo' => 'success',
            'mensaje' => 'Subiste a nivel ' . $nivelDespues . '.',
        ]];
    }

    return [[
        'tipo' => 'warning',
        'mensaje' => 'Bajaste a nivel ' . $nivelDespues . ' para reforzar fundamentos.',
    ]];
}

private function construirAvisosTransicion(?object $sesionAntes, ?object $sesionDespues, ?array $siguienteEjercicio): array
{
    $avisos = [];

    if ($sesionAntes && $sesionDespues) {
        if ((int) ($sesionAntes->subtema_id ?? 0) !== (int) ($sesionDespues->subtema_id ?? 0) && !empty($sesionDespues->subtema_nombre)) {
            $avisos[] = [
                'tipo' => 'info',
                'mensaje' => 'Ahora continuaras con el subtema: ' . $sesionDespues->subtema_nombre . '.',
            ];
        }
    }

    if ($siguienteEjercicio === null) {
        $avisos[] = [
            'tipo' => 'info',
            'mensaje' => 'Ya no hay mas ejercicios disponibles en esta sesion.',
        ];
    }

    return $avisos;
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

    if ($respuestaTexto === null || $respuestaTexto === '') {
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

   private function recalcularNivel(int $sesionId, int $subtemaId, ?string $nivelActual, bool $respuestaActualCorrecta): string
{
    $nivelActual = $nivelActual ?: 'BASICO';

    $historial = $this->dao->obtenerUltimasRespuestasSesionSubtema(
        $sesionId,
        $subtemaId,
        20
    );

    if ($respuestaActualCorrecta) {
        $rachaCorrectas = 0;

        foreach ($historial as $item) {
            if ($this->valorBooleano($item->es_correcta)) {
                $rachaCorrectas++;
            } else {
                break;
            }
        }

        if ($rachaCorrectas >= 3 && $rachaCorrectas % 3 === 0) {
            return $this->subirNivel($nivelActual);
        }

        return $nivelActual;
    }

    $ultimasCinco = array_slice($historial, 0, 5);

    if (count($ultimasCinco) < 3) {
        return $nivelActual;
    }

    $incorrectas = 0;

    foreach ($ultimasCinco as $item) {
        if (!$this->valorBooleano($item->es_correcta)) {
            $incorrectas++;
        }
    }

    $porcentajeError = ($incorrectas * 100) / count($ultimasCinco);

    if ($porcentajeError > 60) {
        return $this->bajarNivel($nivelActual);
    }

    return $nivelActual;
}

    private function debeCompletarSubtema(int $estudianteId, int $subtemaId): bool
    {
        $historial = $this->dao->obtenerHistorialRespuestasSubtema($estudianteId, $subtemaId, null, 3);

        if (count($historial) < 3) {
            return false;
        }

        foreach ($historial as $item) {
            if (!$this->valorBooleano($item->es_correcta)) {
                return false;
            }
        }

        return true;
    }

    private function subirNivel(string $nivel): string
    {
        $indice = array_search($nivel, self::NIVELES, true);

        if ($indice === false || $indice >= count(self::NIVELES) - 1) {
            return $nivel;
        }

        return self::NIVELES[$indice + 1];
    }

    private function bajarNivel(string $nivel): string
    {
        $indice = array_search($nivel, self::NIVELES, true);

        if ($indice === false || $indice <= 0) {
            return $nivel;
        }

        return self::NIVELES[$indice - 1];
    }

    private function nivelesCandidatos(string $nivelActual): array
{
    return match ($nivelActual) {
        'BASICO' => ['BASICO', 'INTERMEDIO', 'AVANZADO', 'EXAMEN_REAL'],
        'INTERMEDIO' => ['INTERMEDIO', 'AVANZADO', 'EXAMEN_REAL'],
        'AVANZADO' => ['AVANZADO', 'EXAMEN_REAL'],
        'EXAMEN_REAL' => ['EXAMEN_REAL'],
        default => ['BASICO', 'INTERMEDIO', 'AVANZADO', 'EXAMEN_REAL'],
    };
}

    private function valorBooleano(mixed $valor): bool
    {
        return in_array($valor, [true, 1, '1', 't', 'true', 'TRUE'], true);
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

    private function formatearSesion(object $sesion): array
    {
        return [
            'id' => (int) $sesion->id,
            'modo' => $sesion->modo,
            'modulo_id' => $sesion->modulo_id ? (int) $sesion->modulo_id : null,
            'modulo_nombre' => $sesion->modulo_nombre,
            'subtema_id' => $sesion->subtema_id ? (int) $sesion->subtema_id : null,
            'subtema_nombre' => $sesion->subtema_nombre,
            'nivel_dificultad' => $sesion->nivel_dificultad,
            'ruta_id' => $sesion->ruta_id ? (int) $sesion->ruta_id : null,
            'fecha_inicio' => $sesion->fecha_inicio,
            'fecha_fin' => $sesion->fecha_fin,
        ];
    }

    private function formatearEjercicio(object $ejercicio): array
    {
        $opciones = [];

        if (in_array($ejercicio->tipo_ejercicio, ['OPCION_MULTIPLE', 'VERDADERO_FALSO'])) {
            foreach ($this->dao->obtenerOpciones((int) $ejercicio->id) as $opcion) {
                $opciones[] = [
                    'id' => (int) $opcion->id,
                    'orden' => (int) $opcion->orden_opcion,
                    'texto_opcion' => $opcion->texto_opcion,
                ];
            }
        }

        return [
            'id' => (int) $ejercicio->id,
            'modulo_id' => (int) $ejercicio->modulo_id,
            'modulo_nombre' => $ejercicio->modulo_nombre,
            'subtema_id' => $ejercicio->subtema_id ? (int) $ejercicio->subtema_id : null,
            'subtema_nombre' => $ejercicio->subtema_nombre,
            'nivel_dificultad' => $ejercicio->nivel_dificultad,
            'tipo_ejercicio' => $ejercicio->tipo_ejercicio,
            'enunciado' => $ejercicio->enunciado,
            'imagen_apoyo_url' => $ejercicio->imagen_apoyo_url,
            'solucion_paso_a_paso' => $ejercicio->solucion_paso_a_paso,
            'explicacion_conceptual' => $ejercicio->explicacion_conceptual,
            'tiempo_estimado_minutos' => $ejercicio->tiempo_estimado_minutos,
            'opciones' => $opciones,
        ];
    }

    private function formatearResumen(?object $resumen): ?array
{
    if (!$resumen) {
        return null;
    }

    return [
        'sesion_id' => (int) $resumen->id,
        'modo' => $resumen->modo,
        'modulo_nombre' => $resumen->modulo_nombre,
        'subtema_nombre' => $resumen->subtema_nombre,
        'nivel_dificultad' => $resumen->nivel_dificultad,
        'total_ejercicios' => (int) $resumen->total_ejercicios,
        'total_respondidas' => (int) $resumen->total_respondidas,
        'total_correctos' => (int) $resumen->total_correctos,
        'total_omitidas' => (int) $resumen->total_omitidas,
        'total_guardadas' => (int) $resumen->total_guardadas,
        'total_interacciones' => (int) $resumen->total_interacciones,
        'porcentaje_aciertos' => (float) $resumen->porcentaje_aciertos,
        'tiempo_total_minutos' => (int) $resumen->tiempo_total_minutos,
        'modulos_trabajados' => (int) $resumen->modulos_trabajados,
        'fecha_inicio' => $resumen->fecha_inicio,
        'fecha_fin' => $resumen->fecha_fin,
    ];
}

        private function formatearGuardado(object $item): array
    {
        return [
            'ejercicio_id' => (int) $item->ejercicio_id,
            'fecha_guardado' => $item->fecha_guardado,
            'modulo_id' => (int) $item->modulo_id,
            'modulo_nombre' => $item->modulo_nombre,
            'subtema_id' => $item->subtema_id ? (int) $item->subtema_id : null,
            'subtema_nombre' => $item->subtema_nombre,
            'nivel_dificultad' => $item->nivel_dificultad,
            'tipo_ejercicio' => $item->tipo_ejercicio,
            'enunciado' => $item->enunciado,
            'imagen_apoyo_url' => $item->imagen_apoyo_url,
            'respuesta_correcta_texto' => $item->respuesta_correcta_texto,
            'solucion_paso_a_paso' => $item->solucion_paso_a_paso,
            'explicacion_conceptual' => $item->explicacion_conceptual,
            'tiempo_estimado_minutos' => $item->tiempo_estimado_minutos ? (int) $item->tiempo_estimado_minutos : 0,
        ];
    }


    private function formatearHistorialSesion(object $item): array
{
    return [
        'sesion_id' => (int) $item->sesion_id,
        'modo' => $item->modo,
        'modulo_id' => $item->modulo_id ? (int) $item->modulo_id : null,
        'modulo_nombre' => $item->modulo_nombre,
        'subtema_id' => $item->subtema_id ? (int) $item->subtema_id : null,
        'subtema_nombre' => $item->subtema_nombre,
        'nivel_dificultad' => $item->nivel_dificultad,
        'fecha_inicio' => $item->fecha_inicio,
        'fecha_fin' => $item->fecha_fin,
        'total_respondidas' => (int) $item->total_respondidas,
        'total_correctos' => (int) $item->total_correctos,
        'total_omitidas' => (int) $item->total_omitidas,
        'total_guardadas' => (int) $item->total_guardadas,
        'porcentaje_aciertos' => (float) $item->porcentaje_aciertos,
        'tiempo_total_minutos' => (int) $item->tiempo_total_minutos,
    ];
}

    
}