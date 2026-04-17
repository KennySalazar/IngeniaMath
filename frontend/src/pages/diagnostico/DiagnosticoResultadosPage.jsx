import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './DiagnosticoPage.css';

const CLASIFICACION_CONFIG = {
  DOMINADO: {
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    icono: '✓',
    label: 'Dominado',
  },
  EN_DESARROLLO: {
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    icono: '↗',
    label: 'En desarrollo',
  },
  DEFICIENTE: {
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
    icono: '!',
    label: 'Deficiente',
  },
};

export default function DiagnosticoResultadosPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [resultado] = useState(location.state?.resultado ?? null);

  const handleVerRuta = () => {
    navigate('/diagnostico/ruta');
  };

  if (!resultado) {
    return <div className="diag-loading">Cargando resultados...</div>;
  }

  const dominados = resultado.resultados.filter(
    (r) => r.clasificacion === 'DOMINADO'
  ).length;

  const enDesarrollo = resultado.resultados.filter(
    (r) => r.clasificacion === 'EN_DESARROLLO'
  ).length;

  const deficientes = resultado.resultados.filter(
    (r) => r.clasificacion === 'DEFICIENTE'
  ).length;

  return (
    <div className="diag-fullpage">
      <div className="diag-resultados-card">
        <div className="diag-resultados-header">
          <div className="diag-logo">
            <span className="diag-logo-icon">∑</span>
            <span className="diag-logo-text">IngeniaMath</span>
          </div>

          <h1 className="diag-resultados-titulo">Resultados del diagnóstico</h1>

          <div className="diag-puntaje-global">
            <span className="diag-puntaje-num">{resultado.puntaje_total}%</span>
            <span className="diag-puntaje-label">Puntaje global</span>
          </div>
        </div>

        <div className="diag-resumen-grid">
          <div className="diag-resumen-item" style={{ borderColor: '#10b981' }}>
            <span className="diag-resumen-num" style={{ color: '#10b981' }}>
              {dominados}
            </span>
            <span className="diag-resumen-label">Dominados</span>
          </div>

          <div className="diag-resumen-item" style={{ borderColor: '#f59e0b' }}>
            <span className="diag-resumen-num" style={{ color: '#f59e0b' }}>
              {enDesarrollo}
            </span>
            <span className="diag-resumen-label">En desarrollo</span>
          </div>

          <div className="diag-resumen-item" style={{ borderColor: '#ef4444' }}>
            <span className="diag-resumen-num" style={{ color: '#ef4444' }}>
              {deficientes}
            </span>
            <span className="diag-resumen-label">Deficientes</span>
          </div>
        </div>

        <div className="diag-modulos-lista">
          {resultado.resultados.map((r) => {
            const config = CLASIFICACION_CONFIG[r.clasificacion];

            return (
              <div
                key={r.modulo_id}
                className="diag-modulo-item"
                style={{ borderColor: config.color, background: config.bg }}
              >
                <div className="diag-modulo-info">
                  <span
                    className="diag-modulo-icono"
                    style={{ background: config.color }}
                  >
                    {config.icono}
                  </span>

                  <div>
                    <p className="diag-modulo-nombre">{r.modulo_nombre}</p>
                    <p
                      className="diag-modulo-clasificacion"
                      style={{ color: config.color }}
                    >
                      {config.label}
                    </p>
                  </div>
                </div>

                <div className="diag-modulo-puntaje">
                  <span
                    className="diag-modulo-pct"
                    style={{ color: config.color }}
                  >
                    {r.puntaje_porcentaje}%
                  </span>

                  <div className="diag-modulo-barra-bg">
                    <div
                      className="diag-modulo-barra-fill"
                      style={{
                        width: `${r.puntaje_porcentaje}%`,
                        background: config.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          className="diag-btn-iniciar"
          onClick={handleVerRuta}
        >
          Ver mi ruta de aprendizaje →
        </button>
      </div>
    </div>
  );
}