<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UsuarioController;
use App\Http\Controllers\Api\PasswordRecuperacionController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\EjercicioController;
use App\Http\Controllers\Api\DiagnosticoController;
use App\Http\Controllers\Api\RutaAprendizajeController;
use App\Http\Controllers\Api\PlanEstudioController;
use App\Http\Controllers\Api\PracticaController;
use App\Http\Controllers\Api\SimulacroController;
use App\Http\Controllers\Api\RecursoController;


// Ping
Route::get('/ping', fn() => response()->json([
    'status' => 'ok',
    'sistema' => 'IngeniaMath API',
    'version' => '1.0'
]));

// ── Rutas PÚBLICAS (sin token) ───────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/login',    [AuthController::class, 'login']);
    Route::post('/registro', [AuthController::class, 'registro']);
});

// Recuperación de contraseña — también pública
Route::prefix('password')->group(function () {
    Route::post('/solicitar',    [PasswordRecuperacionController::class, 'solicitar']);
    Route::get('/validar-token', [PasswordRecuperacionController::class, 'validarToken']);
    Route::post('/restablecer',  [PasswordRecuperacionController::class, 'restablecer']);
});

// ── Rutas PROTEGIDAS (requieren token) ──────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);

    Route::get('/usuarios/{id}', [UsuarioController::class, 'show']);
    Route::put('/usuarios/{id}', [UsuarioController::class, 'update']);

    Route::middleware('rol:ADMIN')->group(function () {
        Route::get('/usuarios',               [UsuarioController::class, 'index']);
        Route::post('/usuarios',              [UsuarioController::class, 'store']);
        Route::patch('/usuarios/{id}/estado', [UsuarioController::class, 'cambiarEstado']);
        Route::patch('/usuarios/{id}/rol',    [UsuarioController::class, 'cambiarRol']);
        Route::delete('/usuarios/{id}',       [UsuarioController::class, 'destroy']);
        Route::get('/usuarios-resumen',       [UsuarioController::class, 'resumen']);
        Route::get('/admin/simulacros/configuracion', [SimulacroController::class, 'configuracion']);
        Route::put('/admin/simulacros/configuracion', [SimulacroController::class, 'actualizarConfiguracion']);
    });

    // Selectores públicos para formularios — cualquier rol autenticado
    Route::get('/modulos',                  [EjercicioController::class, 'modulos']);
    Route::get('/modulos/{id}/subtemas',    [EjercicioController::class, 'subtemas']);



    Route::prefix('diagnostico')->group(function () {
        Route::get('/estado',                       [DiagnosticoController::class, 'estado']);
        Route::post('/iniciar',                     [DiagnosticoController::class, 'iniciar']);
        Route::post('/{intentoId}/responder',       [DiagnosticoController::class, 'responder']);
        Route::post('/{intentoId}/finalizar',       [DiagnosticoController::class, 'finalizar']);
        Route::get('/{intentoId}/resultados',       [DiagnosticoController::class, 'resultados']);
    });

    Route::prefix('ruta')->group(function () {
        Route::get('/',  [RutaAprendizajeController::class, 'obtener']);
    });

    Route::prefix('plan')->group(function () {
        Route::post('/generar', [PlanEstudioController::class, 'generar']);
        Route::get('/',         [PlanEstudioController::class, 'obtener']);
    });

    // Ejercicios — tutor y admin pueden crear y listar
    Route::middleware('rol:TUTOR,ADMIN,REVISOR,ESTUDIANTE')->group(function () {
        Route::get('/ejercicios',        [EjercicioController::class, 'index']);
        Route::get('/ejercicios/{id}',   [EjercicioController::class, 'show']);
    });

    Route::middleware('rol:TUTOR,ADMIN')->group(function () {
        Route::post('/ejercicios',         [EjercicioController::class, 'store']);
        Route::put('/ejercicios/{id}',     [EjercicioController::class, 'update']);
        Route::post('/ejercicios/{id}/enviar-revision', [EjercicioController::class, 'enviarRevision']);
    });

    // Solo REVISOR puede aprobar y rechazar
    Route::middleware('rol:REVISOR,ADMIN')->group(function () {
        Route::post('/ejercicios/{id}/aprobar',  [EjercicioController::class, 'aprobar']);
        Route::post('/ejercicios/{id}/rechazar', [EjercicioController::class, 'rechazar']);
    });

    // Solo ADMIN puede publicar y deshabilitar
    Route::middleware('rol:ADMIN')->group(function () {
        Route::post('/ejercicios/{id}/publicar',     [EjercicioController::class, 'publicar']);
        Route::post('/ejercicios/{id}/deshabilitar', [EjercicioController::class, 'deshabilitar']);
    });

        Route::middleware('rol:ESTUDIANTE')->prefix('practica')->group(function () {
    Route::get('/activa', [PracticaController::class, 'activa']);
    Route::get('/historial', [PracticaController::class, 'historial']);
    Route::post('/iniciar', [PracticaController::class, 'iniciar']);
    Route::post('/guardados', [PracticaController::class, 'guardarParaDespues']);
    Route::get('/guardados', [PracticaController::class, 'guardados']);
    Route::delete('/guardados/{ejercicioId}', [PracticaController::class, 'eliminarGuardado']);

    Route::get('/{sesionId}', [PracticaController::class, 'detalle']);
    Route::post('/{sesionId}/responder', [PracticaController::class, 'responder']);
    Route::post('/{sesionId}/omitir', [PracticaController::class, 'omitir']);
    Route::post('/{sesionId}/finalizar', [PracticaController::class, 'finalizar']);
    Route::get('/{sesionId}/resumen', [PracticaController::class, 'resumen']);
});

        Route::middleware('rol:ESTUDIANTE')->prefix('simulacros')->group(function () {
        Route::get('/configuracion', [SimulacroController::class, 'configuracion']);
        Route::get('/activa', [SimulacroController::class, 'activa']);
        Route::get('/historial', [SimulacroController::class, 'historial']);
        Route::post('/iniciar', [SimulacroController::class, 'iniciar']);
        Route::get('/{simulacroId}', [SimulacroController::class, 'detalle']);
        Route::post('/{simulacroId}/responder', [SimulacroController::class, 'responder']);
        Route::post('/{simulacroId}/finalizar', [SimulacroController::class, 'finalizar']);
        
    });

    // ── MODULO 5: RECURSOS EDUCATIVOS ─────────────────────────────────────────────

// 1. Acceso Universal (Lectura)
// Estudiantes pueden ver recursos aprobados/publicados. Tutores y Revisores también.
Route::middleware('rol:ESTUDIANTE,TUTOR,REVISOR,ADMIN')->group(function () {
    Route::get('/recursos',                          [RecursoController::class, 'index']);
    Route::get('/recursos/ejercicio/{ejercicioId}',  [RecursoController::class, 'listarPorEjercicio']); // ← primero
    Route::get('/recursos/{id}',                     [RecursoController::class, 'show']);               // ← después
});

// 2. Creación y Edición (Tutor e Instructor)
// Solo ellos cargan contenido y lo envían a revisión.
Route::middleware('rol:TUTOR,ADMIN')->group(function () {
    Route::post('/recursos', [RecursoController::class, 'store']);
    Route::put('/recursos/{id}', [RecursoController::class, 'update']);
    Route::delete('/recursos/{id}', [RecursoController::class, 'destroy']);
    
    Route::patch('/recursos/{id}/enviar-revision', [RecursoController::class, 'enviarRevision']);
    
    // Para vincular un recurso a un ejercicio (Relación m:n)
    Route::post('/recursos/{id}/vincular-ejercicio', [RecursoController::class, 'vincularEjercicio']);
});

// 3. Aprobación y Moderación (Revisor y Moderador)
// Según tu enunciado: "deben ser aprobados por el Revisor antes de publicarse"
Route::middleware('rol:REVISOR,ADMIN')->group(function () {
    Route::patch('/recursos/{id}/aprobar', [RecursoController::class, 'aprobar']);
    Route::patch('/recursos/{id}/rechazar', [RecursoController::class, 'rechazar']);
});

// 4. Publicación Final (Admin o Revisor según tu flujo)
Route::middleware('rol:ADMIN,REVISOR')->group(function () {
    Route::patch('/recursos/{id}/publicar', [RecursoController::class, 'publicar']);
});

});
