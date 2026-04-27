import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { diagnosticoService } from '../../services/diagnosticoService';
import './DashboardEstudiantePage.css';
import { practicaService } from '../../services/practicaService';

const CLASIFICACION = {
  DOMINADO:      { color: '#10b981', label: 'Dominado' },
  EN_DESARROLLO: { color: '#f59e0b', label: 'En desarrollo' },
  DEFICIENTE:    { color: '#ef4444', label: 'Deficiente' },
};

const DIAS = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function DashboardEstudiantePage() {
  const navigate = useNavigate();

  const [estado, setEstado] = useState(null);
  const [ruta, setRuta] = useState(null);
  const [plan, setPlan] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [sesionActiva, setSesionActiva] = useState(null);
  const [resumenPractica, setResumenPractica] = useState(null);

  useEffect(() => {
    Promise.allSettled([
      diagnosticoService.estado(),
      diagnosticoService.obtenerRuta(),
      diagnosticoService.obtenerPlan(),
      practicaService.activa(),
    ]).then(([estadoRes, rutaRes, planRes, practicaRes]) => {
      if (estadoRes.status === 'fulfilled') setEstado(estadoRes.value);
      if (rutaRes.status === 'fulfilled') setRuta(rutaRes.value);
      if (planRes.status === 'fulfilled') setPlan(planRes.value);

      if (practicaRes.status === 'fulfilled' && practicaRes.value?.activa) {
        setSesionActiva(practicaRes.value.sesion);
        setResumenPractica(practicaRes.value.resumen);
      }
    }).finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return (
      <div className="dash-loading">Cargando tu panel...</div>
    );
  }

  const hoy = new Date().getDay();
  const diaHoy = hoy === 0 ? 7 : hoy;
  const temaHoy = plan?.dias?.find(d => d.dia_numero === diaHoy);

  const irADiagnostico = () => {
    navigate(estado?.diagnostico_completado ? '/diagnostico/ruta' : '/diagnostico/inicio');
  };

  return (
    <div className="dash-page">
      <div className="dash-bienvenida">
        <div>
          <h1 className="dash-titulo">Panel del estudiante</h1>
          <p className="dash-subtitulo">
            Aqui puedes ver tu progreso, tu ruta de aprendizaje y tu plan semanal.
          </p>
        </div>
      </div>

      <div className="dash-grid">
        <div className="dash-card dash-card-diagnostico">
          <div className="dash-card-header">
            <div className="dash-card-icono dash-icono-diag">D</div>
            <div>
              <h2 className="dash-card-titulo">Diagnóstico inicial</h2>
              <p className="dash-card-subtitulo">Tu nivel por módulo</p>
            </div>
          </div>

          {estado?.diagnostico_completado ? (
            <>
              {ruta && (
                <div className="dash-modulos-resumen">
                  {ruta.modulos.map(m => (
                    <div key={m.modulo_id} className="dash-modulo-chip">
                      <span className="dash-modulo-chip-nombre">{m.modulo_nombre}</span>
                      <span
                        className="dash-modulo-chip-badge"
                        style={{
                          background: 'rgba(245,158,11,0.15)',
                          color: '#fbbf24',
                        }}
                      >
                        En ruta
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <button
                className="dash-btn-secundario"
                onClick={() => navigate('/diagnostico/ruta')}
              >
                Ver resultados completos
              </button>
            </>
          ) : (
            <div className="dash-sin-datos">
              <p>No has completado el diagnóstico.</p>
              <button
                className="dash-btn-primario"
                onClick={() => navigate('/diagnostico/inicio')}
              >
                Iniciar diagnóstico
              </button>
            </div>
          )}
        </div>

        <div className="dash-card dash-card-ruta">
          <div className="dash-card-header">
            <div className="dash-card-icono dash-icono-ruta">R</div>
            <div>
              <h2 className="dash-card-titulo">Ruta de aprendizaje</h2>
              <p className="dash-card-subtitulo">Personalizada para ti</p>
            </div>
          </div>

          {ruta ? (
            <>
              <div className="dash-stats-fila">
                <div className="dash-stat">
                  <span className="dash-stat-num">{ruta.total_modulos}</span>
                  <span className="dash-stat-label">Módulos</span>
                </div>
                <div className="dash-stat">
                  <span className="dash-stat-num">{ruta.total_subtemas}</span>
                  <span className="dash-stat-label">Subtemas</span>
                </div>
                <div className="dash-stat">
                  <span className="dash-stat-num">
                    {ruta.modulos.reduce((acc, m) =>
                      acc + m.subtemas.filter(s => s.estado === 'PENDIENTE').length, 0
                    )}
                  </span>
                  <span className="dash-stat-label">Pendientes</span>
                </div>
              </div>

              {ruta.modulos[0]?.subtemas[0] && (
                <div className="dash-proximo">
                  <span className="dash-proximo-label">Siguiente a estudiar</span>
                  <span className="dash-proximo-subtema">
                    {ruta.modulos[0].subtemas[0].subtema_nombre}
                  </span>
                  <span className="dash-proximo-modulo">
                    {ruta.modulos[0].modulo_nombre}
                  </span>
                </div>
              )}

              <button
                className="dash-btn-secundario"
                onClick={() => navigate('/diagnostico/ruta')}
              >
                Ver ruta completa
              </button>
            </>
          ) : (
            <div className="dash-sin-datos">
              <p>Tu ruta se generara al completar el diagnostico.</p>
            </div>
          )}
        </div>

        <div className="dash-card dash-card-plan dash-card-ancha">
          <div className="dash-card-header">
            <div className="dash-card-icono dash-icono-plan">P</div>
            <div>
              <h2 className="dash-card-titulo">Plan de estudio semanal</h2>
              <p className="dash-card-subtitulo">
                {plan
                  ? `${plan.horas_disponibles_semana} horas disponibles por semana`
                  : 'Basado en tus horas disponibles'}
              </p>
            </div>
          </div>

          {plan ? (
            <>
              <div className="dash-stats-fila">
                <div className="dash-stat">
                  <span className="dash-stat-num">{plan.horas_disponibles_semana}h</span>
                  <span className="dash-stat-label">Por semana</span>
                </div>
                <div className="dash-stat">
                  <span className="dash-stat-num">{plan.total_ejercicios_semana}</span>
                  <span className="dash-stat-label">Ejercicios</span>
                </div>
                <div className="dash-stat">
                  <span className="dash-stat-num">{plan.total_minutos_semana}</span>
                  <span className="dash-stat-label">Minutos</span>
                </div>
              </div>

              {temaHoy && (
                <div className="dash-tema-hoy">
                  <span className="dash-tema-hoy-label">Tema de hoy</span>
                  <div className="dash-tema-hoy-contenido">
                    <div>
                      <p className="dash-tema-hoy-subtema">{temaHoy.subtema_nombre}</p>
                      <p className="dash-tema-hoy-modulo">{temaHoy.modulo_nombre}</p>
                    </div>
                    <div className="dash-tema-hoy-meta">
                      <span className="dash-tema-hoy-ejs">{temaHoy.ejercicios_recomendados} ej.</span>
                      <span className="dash-tema-hoy-min">{temaHoy.tiempo_estimado_minutos} min</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="dash-semana">
                {plan.dias.map(dia => {
                  const esHoy = dia.dia_numero === diaHoy;
                  return (
                    <div
                      key={dia.dia_numero}
                      className={`dash-dia ${esHoy ? 'dash-dia-hoy' : ''}`}
                    >
                      <span className="dash-dia-nombre">{DIAS[dia.dia_numero]}</span>
                      <span className="dash-dia-subtema">{dia.subtema_nombre}</span>
                      <span className="dash-dia-min">{dia.tiempo_estimado_minutos}m</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="dash-sin-datos">
              <p>El plan se generara al completar el diagnostico.</p>
            </div>
          )}
        </div>

        <div className="dash-card dash-card-practica dash-card-ancha">
          <div className="dash-card-header">
            <div className="dash-card-icono dash-icono-practica">E</div>
            <div>
              <h2 className="dash-card-titulo">Practica</h2>
              <p className="dash-card-subtitulo">
                {sesionActiva ? 'Tienes una sesion lista para continuar' : 'Inicia una practica libre o guiada'}
              </p>
            </div>
          </div>

          {sesionActiva ? (
            <>
              <div className="dash-stats-fila">
                <div className="dash-stat">
                  <span className="dash-stat-num">{resumenPractica?.total_ejercicios || 0}</span>
                  <span className="dash-stat-label">Total</span>
                </div>
                <div className="dash-stat">
                  <span className="dash-stat-num">{resumenPractica?.total_correctos || 0}</span>
                  <span className="dash-stat-label">Correctos</span>
                </div>
                <div className="dash-stat">
                  <span className="dash-stat-num">{resumenPractica?.porcentaje_aciertos || 0}%</span>
                  <span className="dash-stat-label">Aciertos</span>
                </div>
                <div className="dash-stat">
                  <span className="dash-stat-num">{resumenPractica?.tiempo_total_minutos || 0}</span>
                  <span className="dash-stat-label">Minutos</span>
                </div>
              </div>

              <div className="dash-proximo dash-proximo-practica">
                <span className="dash-proximo-label">Sesion activa</span>
                <span className="dash-proximo-subtema">
                  {sesionActiva.subtema_nombre || 'Practica general'}
                </span>
                <span className="dash-proximo-modulo">
                  {sesionActiva.modo} · {sesionActiva.modulo_nombre || 'Modulo'} · {sesionActiva.nivel_dificultad || 'N/A'}
                </span>
              </div>

              <button
                className="dash-btn-secundario"
                onClick={() => navigate(`/estudiante/practica/sesion/${sesionActiva.id}`)}
              >
                Continuar sesion
              </button>
            </>
          ) : (
            <div className="dash-sin-datos">
              <p>No tienes una sesion de practica activa.</p>
              <button
                className="dash-btn-primario"
                onClick={() => navigate('/estudiante/practica')}
              >
                Ir a practica
              </button>
            </div>
          )}
        </div>

          {/* ── Biblioteca de recursos ─────────────────────────────────────── */}
        <div className="dash-card dash-card-ancha">
          <div className="dash-card-header">
            <div
              className="dash-card-icono"
              style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}
            >
              📚
            </div>
            <div>
              <h2 className="dash-card-titulo">Biblioteca de recursos</h2>
              <p className="dash-card-subtitulo">
                Videos, PDFs, Flashcards y simuladores de apoyo
              </p>
            </div>
          </div>

          <div className="dash-stats-fila">
            {[
              { icono: '🎬', label: 'Videos'      },
              { icono: '📄', label: 'PDFs'        },
              { icono: '🃏', label: 'Flashcards'  },
              { icono: '⚙️', label: 'Simuladores' },
            ].map(t => (
              <div key={t.label} className="dash-stat">
                <span className="dash-stat-num">{t.icono}</span>
                <span className="dash-stat-label">{t.label}</span>
              </div>
            ))}
          </div>

          <div className="dash-sin-datos" style={{ marginTop: 0 }}>
            <button
              className="dash-btn-primario"
              onClick={() => navigate('/estudiante/biblioteca')}
            >
              Explorar recursos
            </button>
          </div>
        </div>

        <div className="dash-card dash-card-accesos dash-card-ancha">
          <h2 className="dash-card-titulo" style={{ marginBottom: '1.25rem' }}>
            Accesos rapidos
          </h2>

          <div className="dash-accesos-grid">
            <button
              className="dash-acceso"
              onClick={irADiagnostico}
            >
              <div
                className="dash-acceso-icono"
                style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}
              >
                D
              </div>
              <span className="dash-acceso-label">Resultados del diagnostico</span>
              <span className="dash-acceso-flecha">→</span>
            </button>

            <button
              className="dash-acceso"
              onClick={() => navigate('/diagnostico/ruta')}
            >
              <div
                className="dash-acceso-icono"
                style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}
              >
                R
              </div>
              <span className="dash-acceso-label">Mi ruta de aprendizaje</span>
              <span className="dash-acceso-flecha">→</span>
            </button>

            <button
              className="dash-acceso"
              onClick={() => navigate('/diagnostico/ruta')}
            >
              <div
                className="dash-acceso-icono"
                style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}
              >
                P
              </div>
              <span className="dash-acceso-label">Plan semanal</span>
              <span className="dash-acceso-flecha">→</span>
            </button>

            <button
              className="dash-acceso"
              onClick={() => navigate(sesionActiva ? `/estudiante/practica/sesion/${sesionActiva.id}` : '/estudiante/practica')}
            >
              <div
                className="dash-acceso-icono"
                style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}
              >
                E
              </div>
              <span className="dash-acceso-label">
                {sesionActiva ? 'Continuar practica' : 'Practica'}
              </span>
              <span className="dash-acceso-flecha">→</span>
            </button>

            <button
              className="dash-acceso"
              onClick={() => navigate('/estudiante/simulacros')}
            >
              <div
                className="dash-acceso-icono"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}
              >
                S
              </div>
              <span className="dash-acceso-label">Simulacros</span>
              <span className="dash-acceso-flecha">→</span>
            </button>
            <button
              className="dash-acceso"
              onClick={() => navigate('/estudiante/biblioteca')}
            >
              <div
                className="dash-acceso-icono"
                style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}
              >
                📚
              </div>
              <span className="dash-acceso-label">Biblioteca de recursos</span>
              <span className="dash-acceso-flecha">→</span>
            </button>
            <button
              className="dash-acceso"
              onClick={() => navigate('/estudiante/estadisticas')}
            >
              <div
                className="dash-acceso-icono"
                style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}
              >
                📈
              </div>
              <span className="dash-acceso-label">Mis estadísticas</span>
              <span className="dash-acceso-flecha">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}