<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UsuarioController;
use App\Http\Controllers\Api\PasswordRecuperacionController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\EjercicioController;

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
    });

    // Selectores públicos para formularios — cualquier rol autenticado
    Route::get('/modulos',                  [EjercicioController::class, 'modulos']);
    Route::get('/modulos/{id}/subtemas',    [EjercicioController::class, 'subtemas']);

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
});
