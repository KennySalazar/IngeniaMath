<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PasswordRecuperacionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PasswordRecuperacionController extends Controller
{
    public function __construct(
        private PasswordRecuperacionService $service
    ) {}

    // POST /api/password/solicitar
    public function solicitar(Request $request): JsonResponse
    {
        $request->validate([
            'correo' => ['required', 'email'],
        ]);

        $this->service->solicitarRecuperacion($request->correo);

        return response()->json([
            'success' => true,
            'message' => 'Si el correo está registrado, recibirás un enlace en los próximos minutos.',
        ]);
    }

    // GET /api/password/validar-token?token=xxx
    public function validarToken(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
        ]);

        return response()->json([
            'success' => true,
            'valido'  => $this->service->validarToken($request->token),
        ]);
    }

    // POST /api/password/restablecer
    public function restablecer(Request $request): JsonResponse
    {
        $request->validate([
            'token'    => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        try {
            $this->service->restablecerPassword($request->token, $request->password);
            return response()->json([
                'success' => true,
                'message' => 'Contraseña restablecida correctamente. Ya puedes iniciar sesión.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
