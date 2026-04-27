<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\EstadisticasService;
use App\Services\EstadisticasTutorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class EstadisticasController extends Controller
{
    public function __construct(
        private EstadisticasService      $estudianteService,
        private EstadisticasTutorService $tutorService,
    ) {}

    // ── Estudiante ───────────────────────────────────────────────────────────

    public function estudiante(Request $request): JsonResponse
    {
        try {
            $data = $this->estudianteService->dashboardEstudiante(
                $request->user()->id
            );
            return response()->json(['data' => $data]);
        } catch (\Exception $e) {
            return $this->responderError($e);
        }
    }

    // ── Tutor ────────────────────────────────────────────────────────────────

    public function tutor(Request $request): JsonResponse
    {
        try {
            $data = $this->tutorService->dashboardTutor(
                $request->user()->id
            );
            return response()->json(['data' => $data]);
        } catch (\Exception $e) {
            return $this->responderError($e);
        }
    }

    public function exportarReporteTutor(Request $request): Response
    {
        try {
            $csv      = $this->tutorService->generarReporteCsv($request->user()->id);
            $filename = 'reporte_estudiantes_' . date('Y-m-d') . '.csv';

            return response($csv, 200, [
                'Content-Type'        => 'text/csv; charset=UTF-8',
                'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            ]);
        } catch (\Exception $e) {
            return response($e->getMessage(), 500);
        }
    }

    // ── Helper ───────────────────────────────────────────────────────────────

    private function responderError(\Exception $e): JsonResponse
    {
        $codigo = in_array($e->getCode(), [400, 403, 404, 422, 500])
            ? $e->getCode() : 500;

        return response()->json(['message' => $e->getMessage()], $codigo);
    }
}