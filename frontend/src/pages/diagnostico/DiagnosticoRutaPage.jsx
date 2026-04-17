import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { diagnosticoService } from '../../services/diagnosticoService';
import './DiagnosticoPage.css';

const PRIORIDAD_LABEL = {
  1: 'Alta prioridad',
  2: 'Media prioridad',
  3: 'Baja prioridad',
  4: 'Opcional',
};

export default function DiagnosticoRutaPage() {
  const navigate = useNavigate();
  const [ruta, setRuta] = useState(null);
  const [plan, setPlan] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [generandoPlan, setGenerandoPlan] = useState(false);
  const [horas, setHoras] = useState(10);
  const [errorPlan, setErrorPlan] = useState('');

  useEffect(() => {
    Promise.all([
      diagnosticoService.obtenerRuta(),
      diagnosticoService.obtenerPlan().catch(() => null),
    ])
      .then(([rutaData, planData]) => {
        setRuta(rutaData);
        setPlan(planData);

        if (planData?.horas_disponibles_semana) {
          setHoras(planData.horas_disponibles_semana);
        }
      })
      .finally(() => setCargando(false));
  }, []);

  const handleGenerarPlan = async () => {
    if (!horas || Number(horas) <= 0) {
      setErrorPlan('Ingresa una cantidad válida de horas por semana.');
      return;
    }

    setErrorPlan('');
    setGenerandoPlan(true);

    try {
      const nuevoPlan = await diagnosticoService.generarPlan({
        horas_disponibles_semana: Number(horas),
      });

      setPlan(nuevoPlan);
    } catch (err) {
      setErrorPlan(err.response?.data?.message ?? 'No se pudo generar el plan.');
    } finally {
      setGenerandoPlan(false);
    }
  };

  if (cargando) {
    return <div className="diag-loading">Cargando tu ruta...</div>;
  }

  if (!ruta) {
    return <div className="diag-loading diag-error">No se encontró la ruta.</div>;
  }

  const DIAS = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="diag-fullpage diag-ruta-bg">
      <div className="diag-ruta-container">
        <div className="diag-ruta-header">
          <div className="diag-logo">
            <span className="diag-logo-icon">∑</span>
            <span className="diag-logo-text">IngeniaMath</span>
          </div>

          <h1 className="diag-ruta-titulo">Tu ruta de aprendizaje</h1>

          <p className="diag-ruta-subtitulo">
            Basada en tu diagnóstico, esta es la ruta personalizada para prepararte
            para el examen USAC.
          </p>

          <div className="diag-ruta-stats">
            <span>{ruta.total_modulos} módulos</span>
            <span className="diag-sep">·</span>
            <span>{ruta.total_subtemas} subtemas</span>
          </div>
        </div>

        <div className="diag-ruta-modulos">
          {ruta.modulos.map((modulo) => (
            <div key={modulo.modulo_id} className="diag-ruta-modulo">
              <div className="diag-ruta-modulo-header">
                <div className="diag-ruta-prioridad-badge">
                  {PRIORIDAD_LABEL[modulo.prioridad_modulo] ??
                    `Prioridad ${modulo.prioridad_modulo}`}
                </div>

                <h3 className="diag-ruta-modulo-nombre">{modulo.modulo_nombre}</h3>

                <span className="diag-ruta-subtemas-count">
                  {modulo.subtemas.length} subtema
                  {modulo.subtemas.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="diag-ruta-subtemas">
                {modulo.subtemas.map((s, si) => (
                  <div key={s.detalle_id} className="diag-ruta-subtema">
                    <div className="diag-ruta-subtema-num">{si + 1}</div>

                    <div className="diag-ruta-subtema-info">
                      <span className="diag-ruta-subtema-nombre">
                        {s.subtema_nombre}
                      </span>

                      {s.origen === 'PRERREQUISITO' && (
                        <span className="diag-badge-prereq">prerrequisito</span>
                      )}
                    </div>

                    <div
                      className={`diag-ruta-estado diag-estado-${s.estado.toLowerCase()}`}
                    >
                      {s.estado === 'PENDIENTE'
                        ? '○'
                        : s.estado === 'EN_PROCESO'
                          ? '◑'
                          : '●'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {!plan && (
          <div className="diag-plan-card">
            <h2 className="diag-plan-titulo">Configura tu plan semanal</h2>

            <p className="diag-plan-subtitulo">
              Indica cuántas horas por semana puedes dedicar al estudio para generar
              tu plan personalizado.
            </p>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 20, flexWrap: 'wrap' }}>
              <input
                type="number"
                min="1"
                max="60"
                value={horas}
                onChange={(e) => setHoras(e.target.value)}
                style={{
                  width: 180,
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'white',
                  fontSize: 14,
                  outline: 'none',
                }}
                placeholder="Horas por semana"
              />

              <button
                className="diag-btn-iniciar"
                onClick={handleGenerarPlan}
                disabled={generandoPlan}
              >
                {generandoPlan ? 'Generando plan...' : 'Generar plan semanal'}
              </button>
            </div>

            {errorPlan && (
              <div className="diag-error-inline" style={{ marginTop: 14 }}>
                {errorPlan}
              </div>
            )}
          </div>
        )}

        {plan && (
          <div className="diag-plan-card">
            <h2 className="diag-plan-titulo">Plan de esta semana</h2>

            <p className="diag-plan-subtitulo">
              Basado en tus {plan.horas_disponibles_semana} horas disponibles por
              semana
            </p>

            <div className="diag-plan-dias">
              {plan.dias.map((dia) => (
                <div key={dia.dia_numero} className="diag-plan-dia">
                  <span className="diag-plan-dia-nombre">{DIAS[dia.dia_numero]}</span>

                  <div className="diag-plan-dia-contenido">
                    <span className="diag-plan-subtema">{dia.subtema_nombre}</span>
                    <span className="diag-plan-modulo">{dia.modulo_nombre}</span>
                  </div>

                  <div className="diag-plan-dia-meta">
                    <span className="diag-plan-ejs">
                      {dia.ejercicios_recomendados} ej.
                    </span>
                    <span className="diag-plan-min">
                      {dia.tiempo_estimado_minutos} min
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          className="diag-btn-iniciar"
          onClick={() => navigate('/estudiante/dashboard')}
        >
          Ir al dashboard →
        </button>
      </div>
    </div>
  );
}