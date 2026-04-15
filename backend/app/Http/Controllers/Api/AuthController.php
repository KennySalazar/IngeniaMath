<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegistroRequest;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(private AuthService $authService) {}

    // POST /api/auth/login
    public function login(LoginRequest $request): JsonResponse
    {
        $resultado = $this->authService->login(
            $request->correo,
            $request->password
        );

        return response()->json([
            'success' => true,
            'data'    => $resultado,
        ], 200);
    }

    // POST /api/auth/registro
    public function registro(RegistroRequest $request): JsonResponse
    {
        $resultado = $this->authService->registro($request->validated());

        return response()->json([
            'success' => true,
            'data'    => $resultado,
        ], 201);
    }

    // POST /api/auth/logout
    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return response()->json([
            'success' => true,
            'message' => 'Sesión cerrada correctamente.',
        ]);
    }

    // GET /api/auth/me
    public function me(Request $request): JsonResponse
    {
        $usuario = $this->authService->me($request->user());

        return response()->json([
            'success' => true,
            'data'    => $usuario,
        ]);
    }
}
