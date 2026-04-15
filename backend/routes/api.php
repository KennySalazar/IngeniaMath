<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UsuarioController;
use App\Http\Controllers\Api\PasswordRecuperacionController;
use Illuminate\Support\Facades\Route;

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
});
