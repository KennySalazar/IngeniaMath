import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { simulacroService } from '../../services/simulacroService';
import './SimulacroHistorialPage.css';

export default function SimulacroHistorialPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [insights, setInsights] = useState({
    mayor_mejora: null,
    debilidad_persistente: null,
    });
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');



  useEffect(() => {
    cargarHistorial();
  }, []);

  async function cargarHistorial() {

    const data = await simulacroService.historial();
    const lista = Array.isArray(data.items) ? data.items : [];

    setItems(lista);
    setTotal(Number(data.total || 0));
    setInsights(data.insights || {
    mayor_mejora: null,
    debilidad_persistente: null,
    });
    try {
      setCargando(true);
      setError('');

      const data = await simulacroService.historial();
        const lista = Array.isArray(data.items) ? data.items : [];

        setItems(lista);
        setTotal(Number(data.total || 0));
        setInsights(data.insights || { mayor_mejora: null, debilidad_persistente: null });
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo cargar el historial.');
    } finally {
      setCargando(false);
    }

    
  }

  const resumen = useMemo(() => {
    if (items.length === 0) {
      return {
        mejor: 0,
        promedio: 0,
        aprobados: 0,
      };
    }

    const puntajes = items.map(item => Number(item.puntaje_total || 0));
    const mejor = Math.max(...puntajes);
    const promedio = puntajes.reduce((acc, val) => acc + val, 0) / puntajes.length;
    const aprobados = items.filter(item => item.aprueba_referencia === true).length;

    return {
      mejor: Number(mejor.toFixed(2)),
      promedio: Number(promedio.toFixed(2)),
      aprobados,
    };
  }, [items]);

  if (cargando) {
    return <div className="simulacro-historial-loading">Cargando historial...</div>;
  }

  return (
    <div className="simulacro-historial-page">
      <div className="simulacro-historial-hero">
        <div>
          <h1 className="simulacro-historial-titulo">Historial de simulacros</h1>
          <p className="simulacro-historial-subtitulo">
            Revisa tus intentos anteriores y observa la evolucion de tus puntajes.
          </p>
        </div>

        <button
          className="simulacro-historial-btn simulacro-historial-btn-secundario"
          onClick={() => navigate('/estudiante/simulacros')}
        >
          Volver a simulacros
        </button>
      </div>

      {error ? <div className="simulacro-historial-error">{error}</div> : null}

      <div className="simulacro-historial-resumen-grid">
        <div className="simulacro-historial-stat">
          <span>Total intentos</span>
          <strong>{total}</strong>
        </div>

              <div className="simulacro-historial-insights-grid">
        <div className="simulacro-historial-card">
          <div className="simulacro-historial-card-head">
            <h2>Modulo con mayor mejora</h2>
          </div>

          {insights.mayor_mejora ? (
            <div className="simulacro-historial-insight">
              <strong>{insights.mayor_mejora.modulo_nombre}</strong>
              <p>
                Paso de {insights.mayor_mejora.puntaje_inicial}% a {insights.mayor_mejora.puntaje_final}%
              </p>
              <span>Mejora total: +{insights.mayor_mejora.mejora_porcentaje}%</span>
            </div>
          ) : (
            <p className="simulacro-historial-muted">
              Aun no hay suficientes intentos con mejora clara para mostrar este indicador.
            </p>
          )}
        </div>

        <div className="simulacro-historial-insights-grid">
            <div className="simulacro-historial-card">
                <div className="simulacro-historial-card-head">
                <h2>Modulo con mayor mejora</h2>
                </div>

                {insights.mayor_mejora ? (
                <div className="simulacro-historial-insight">
                    <strong>{insights.mayor_mejora.modulo_nombre}</strong>
                    <p>
                    Paso de {insights.mayor_mejora.puntaje_inicial}% a {insights.mayor_mejora.puntaje_final}%
                    </p>
                    <span>Mejora total: +{insights.mayor_mejora.mejora_porcentaje}%</span>
                </div>
                ) : (
                <p className="simulacro-historial-muted">
                    Aun no hay suficientes intentos con mejora clara para mostrar este indicador.
                </p>
                )}
            </div>

            <div className="simulacro-historial-card">
                <div className="simulacro-historial-card-head">
                <h2>Modulo con debilidad persistente</h2>
                </div>

                {insights.debilidad_persistente ? (
                <div className="simulacro-historial-insight">
                    <strong>{insights.debilidad_persistente.modulo_nombre}</strong>
                    <p>
                    Promedio historico: {insights.debilidad_persistente.promedio_porcentaje}%
                    </p>
                    <span>
                    Intentos considerados: {insights.debilidad_persistente.intentos_considerados}
                    </span>
                </div>
                ) : (
                <p className="simulacro-historial-muted">
                    Aun no hay suficientes datos para detectar una debilidad persistente.
                </p>
                )}
            </div>
            </div>

        <div className="simulacro-historial-card">
          <div className="simulacro-historial-card-head">
            <h2>Modulo con debilidad persistente</h2>
          </div>

          {insights.debilidad_persistente ? (
            <div className="simulacro-historial-insight">
              <strong>{insights.debilidad_persistente.modulo_nombre}</strong>
              <p>
                Promedio historico: {insights.debilidad_persistente.promedio_porcentaje}%
              </p>
              <span>
                Intentos considerados: {insights.debilidad_persistente.intentos_considerados}
              </span>
            </div>
          ) : (
            <p className="simulacro-historial-muted">
              Aun no hay suficientes datos para detectar una debilidad persistente.
            </p>
          )}
        </div>
      </div>

        <div className="simulacro-historial-stat">
          <span>Mejor puntaje</span>
          <strong>{resumen.mejor}%</strong>
        </div>

        <div className="simulacro-historial-stat">
          <span>Promedio</span>
          <strong>{resumen.promedio}%</strong>
        </div>

        <div className="simulacro-historial-stat">
          <span>Aprobados</span>
          <strong>{resumen.aprobados}</strong>
        </div>
      </div>

      <div className="simulacro-historial-card">
        <div className="simulacro-historial-card-head">
          <h2>Evolucion del puntaje</h2>
        </div>

        {items.length === 0 ? (
          <p className="simulacro-historial-muted">Aun no hay datos para graficar.</p>
        ) : (
          <HistorialChart items={[...items].reverse()} />
        )}
      </div>

      {items.length === 0 ? (
        <div className="simulacro-historial-empty">
          <h2>No tienes simulacros registrados</h2>
          <p>Cuando completes tu primer simulacro aparecera aqui.</p>
          <button
            className="simulacro-historial-btn simulacro-historial-btn-primario"
            onClick={() => navigate('/estudiante/simulacros')}
          >
            Ir a iniciar uno
          </button>
        </div>
      ) : (
        <div className="simulacro-historial-lista">
          {items.map((item, index) => (
            <div key={item.id} className="simulacro-historial-card">
              <div className="simulacro-historial-top">
                <div>
                  <div className={`simulacro-historial-pill ${obtenerClaseEstado(item.estado, item.aprueba_referencia)}`}>
                    {obtenerEstadoResultado(item.estado, item.aprueba_referencia)}
                  </div>
                  <h2>{item.configuracion_nombre}</h2>
                  <p>Intento #{items.length - index}</p>
                  <p>Inicio: {formatearFecha(item.fecha_inicio)}</p>
                </div>

                <button
                  className="simulacro-historial-btn simulacro-historial-btn-secundario"
                  onClick={() => navigate(`/estudiante/simulacros/sesion/${item.id}`)}
                >
                  Ver resultado
                </button>
              </div>

              <div className="simulacro-historial-grid">
                <div className="simulacro-historial-item">
                  <span>Puntaje</span>
                  <strong>{Number(item.puntaje_total || 0)}%</strong>
                </div>
                <div className="simulacro-historial-item">
                  <span>Minimo</span>
                  <strong>{item.puntaje_minimo_referencia}%</strong>
                </div>
                <div className="simulacro-historial-item">
                  <span>Duracion</span>
                  <strong>{item.duracion_minutos_real ?? 0} min</strong>
                </div>
                <div className="simulacro-historial-item">
                  <span>Preguntas</span>
                  <strong>{item.cantidad_preguntas}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    
  );
}

function HistorialChart({ items }) {
  const width = 760;
  const height = 240;
  const padding = 28;

  const puntos = items.map((item, index) => {
    const x = items.length === 1
      ? width / 2
      : padding + (index * (width - padding * 2)) / (items.length - 1);

    const puntaje = Number(item.puntaje_total || 0);
    const y = height - padding - ((puntaje / 100) * (height - padding * 2));

    return {
      x,
      y,
      puntaje,
      label: `#${index + 1}`,
    };
  });

  const polyline = puntos.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="simulacro-chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} className="simulacro-chart">
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="simulacro-chart-axis" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} className="simulacro-chart-axis" />

        {[0, 25, 50, 75, 100].map(valor => {
          const y = height - padding - ((valor / 100) * (height - padding * 2));

          return (
            <g key={valor}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} className="simulacro-chart-grid" />
              <text x={6} y={y + 4} className="simulacro-chart-text">{valor}%</text>
            </g>
          );
        })}

        {puntos.length > 1 ? (
          <polyline points={polyline} fill="none" className="simulacro-chart-line" />
        ) : null}

        {puntos.map((punto, index) => (
          <g key={index}>
            <circle cx={punto.x} cy={punto.y} r="5" className="simulacro-chart-point" />
            <text x={punto.x} y={punto.y - 12} textAnchor="middle" className="simulacro-chart-value">
              {punto.puntaje}%
            </text>
            <text x={punto.x} y={height - 8} textAnchor="middle" className="simulacro-chart-text">
              {punto.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function obtenerEstadoResultado(estado, apruebaReferencia) {
  if (estado === 'EXPIRADO') {
    return 'Expirado';
  }

  if (estado === 'FINALIZADO') {
    return apruebaReferencia ? 'Aprobado' : 'No aprobado';
  }

  if (estado === 'EN_PROCESO') {
    return 'En proceso';
  }

  return estado || 'N/A';
}

function obtenerClaseEstado(estado, apruebaReferencia) {
  if (estado === 'EXPIRADO') {
    return 'simulacro-historial-pill-expirado';
  }

  if (estado === 'FINALIZADO' && apruebaReferencia) {
    return 'simulacro-historial-pill-ok';
  }

  if (estado === 'FINALIZADO' && !apruebaReferencia) {
    return 'simulacro-historial-pill-bad';
  }

  if (estado === 'EN_PROCESO') {
    return 'simulacro-historial-pill-proceso';
  }

  return 'simulacro-historial-pill-bad';
}

function formatearFecha(valor) {
  if (!valor) return 'N/A';

  try {
    return new Date(valor).toLocaleString();
  } catch {
    return valor;
  }
}