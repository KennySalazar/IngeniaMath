<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

// ── Ping ────────────────────────────────────────────────────────────────
Route::get('/ping', fn() => response()->json([
    'status'  => 'ok',
    'sistema' => 'IngeniaMath API',
    'version' => '1.0',
]));

// ── Autenticación pública ────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/login',    [AuthController::class, 'login']);
    Route::post('/registro', [AuthController::class, 'registro']);
});

// ── Rutas protegidas (requieren token Sanctum) ───────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);

    // Ejemplo de ruta solo para ADMIN:
    // Route::middleware('rol:ADMIN')->group(function () {
    //     Route::get('/admin/usuarios', [UsuarioController::class, 'index']);
    // });

    // Ejemplo de ruta para TUTOR y ADMIN:
    // Route::middleware('rol:TUTOR,ADMIN')->group(function () {
    //     Route::post('/ejercicios', [EjercicioController::class, 'store']);
    // });
});
