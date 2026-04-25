import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { practicaService } from '../../services/practicaService';
import './PracticaHistorialPage.css';

export default function PracticaHistorialPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [expandidas, setExpandidas] = useState(new Set());
  const [repitiendo, setRepitiendo] = useState(null);
  const [errorRepetir, setErrorRepetir] = useState('');

  useEffect(() => {
    cargarHistorial();
  }, []);

  async function cargarHistorial() {
    try {
      setCargando(true);
      setError('');

      const data = await practicaService.historial();
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(Number(data.total || 0));
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo cargar el historial de practica.');
    } finally {
      setCargando(false);
    }
  }

  function toggleExpandir(sesionId) {
    setExpandidas(prev => {
      const next = new Set(prev);
      if (next.has(sesionId)) {
        next.delete(sesionId);
      } else {
        next.add(sesionId);
      }
      return next;
    });
  }

  async function repetirDesdeHistorial(item) {
    try {
      setRepitiendo(item.sesion_id);
      setErrorRepetir('');

      const payload = item.modo === 'GUIADA'
        ? { modo: 'GUIADA' }
        : {
            modo: 'LIBRE',
            modulo_id: item.modulo_id || null,
            subtema_id: item.subtema_id || null,
            nivel_dificultad: item.nivel_dificultad || 'BASICO',
          };

      const nuevaSesion = await practicaService.iniciar(payload);
      navigate(`/estudiante/practica/sesion/${nuevaSesion.sesion.id}`);
    } catch (e) {
      setErrorRepetir(e.response?.data?.message || 'No se pudo iniciar la practica. Es posible que ya tengas una sesion activa.');
      setRepitiendo(null);
    }
  }

  function formatearFecha(valor) {
    if (!valor) return 'N/A';
    return new Date(valor).toLocaleString('es-GT', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function colorPorcentaje(pct) {
    if (pct >= 80) return '#10b981';
    if (pct >= 60) return '#f59e0b';
    return '#ef4444';
  }

  function mensajePorcentaje(pct) {
    if (pct >= 80) return 'Excelente';
    if (pct >= 60) return 'Aceptable';
    return 'A mejorar';
  }

  const totalRespondidas = items.reduce((s, i) => s + Number(i.total_respondidas || 0), 0);
  const totalCorrectos   = items.reduce((s, i) => s + Number(i.total_correctos || 0), 0);
  const promedioAciertos = items.length > 0
    ? Math.round(items.reduce((s, i) => s + Number(i.porcentaje_aciertos || 0), 0) / items.length)
    : 0;

  if (cargando) {
    return <div className="practica-historial-loading">Cargando historial...</div>;
  }

  return (
    <div className="practica-historial-page">

      
      <div className="practica-historial-hero">
        <div>
          <h1 className="practica-historial-titulo">Historial de practica</h1>
          <p className="practica-historial-subtitulo">
            Revisa tus sesiones pasadas, tus estadisticas y repite cualquier practica con un clic.
          </p>
        </div>

        <div className="practica-historial-top-actions">
          <button
            className="practica-historial-btn practica-historial-btn-secundario"
            onClick={() => navigate('/estudiante/practica')}
          >
            Ir a practica
          </button>
        </div>
      </div>

      {error ? <div className="practica-historial-error">{error}</div> : null}
      {errorRepetir ? <div className="practica-historial-error">{errorRepetir}</div> : null}

      
      <div className="practica-historial-resumen">
        <div className="practica-historial-stat">
          <span>Sesiones totales</span>
          <strong>{total}</strong>
        </div>
        <div className="practica-historial-stat">
          <span>Ejercicios respondidos</span>
          <strong>{totalRespondidas}</strong>
        </div>
        <div className="practica-historial-stat">
          <span>Ejercicios correctos</span>
          <strong>{totalCorrectos}</strong>
        </div>
        <div className="practica-historial-stat">
          <span>Promedio de aciertos</span>
          <strong style={{ color: colorPorcentaje(promedioAciertos) }}>
            {promedioAciertos}%
          </strong>
        </div>
      </div>

      
      {items.length === 0 ? (
        <div className="practica-historial-empty">
          <h2>No tienes sesiones finalizadas</h2>
          <p>Finaliza una practica para que aparezca en tu historial.</p>
          <button
            className="practica-historial-btn practica-historial-btn-primario"
            onClick={() => navigate('/estudiante/practica')}
          >
            Ir a practicar
          </button>
        </div>
      ) : (

        
        <div className="practica-historial-lista">
          {items.map(item => {
            const abierta = expandidas.has(item.sesion_id);
            const pct = Number(item.porcentaje_aciertos || 0);

            return (
              <div key={item.sesion_id} className="practica-historial-card">

                <div className="practica-historial-card-top">
                  <div className="practica-historial-tags">
                    <span className={`practica-historial-tag practica-tag-modo-${item.modo?.toLowerCase()}`}>
                      {item.modo === 'GUIADA' ? 'Guiada' : 'Libre'}
                    </span>
                    {item.nivel_dificultad ? (
                      <span className="practica-historial-tag">{item.nivel_dificultad}</span>
                    ) : null}
                    {item.modulo_nombre ? (
                      <span className="practica-historial-tag">{item.modulo_nombre}</span>
                    ) : null}
                    {item.subtema_nombre ? (
                      <span className="practica-historial-tag practica-tag-subtema">
                        {item.subtema_nombre}
                      </span>
                    ) : null}
                  </div>

                  <div className="practica-historial-meta">
                    #{item.sesion_id} · {formatearFecha(item.fecha_fin)}
                  </div>
                </div>

                <div className="practica-historial-pct-wrap">
                  <div className="practica-historial-pct-label">
                    <span style={{ color: colorPorcentaje(pct) }}>
                      {mensajePorcentaje(pct)}
                    </span>
                    <strong style={{ color: colorPorcentaje(pct) }}>{pct}%</strong>
                  </div>
                  <div className="practica-historial-pct-bar">
                    <div
                      className="practica-historial-pct-fill"
                      style={{ width: `${Math.min(100, pct)}%`, background: colorPorcentaje(pct) }}
                    />
                  </div>
                </div>

                <div className="practica-historial-stats">
                  <div className="practica-historial-stat-card">
                    <span>Respondidas</span>
                    <strong>{item.total_respondidas}</strong>
                  </div>
                  <div className="practica-historial-stat-card">
                    <span>Correctos</span>
                    <strong style={{ color: '#10b981' }}>{item.total_correctos}</strong>
                  </div>
                  <div className="practica-historial-stat-card">
                    <span>Omitidas</span>
                    <strong>{item.total_omitidas}</strong>
                  </div>
                  <div className="practica-historial-stat-card">
                    <span>Guardadas</span>
                    <strong>{item.total_guardadas}</strong>
                  </div>
                  <div className="practica-historial-stat-card">
                    <span>Aciertos</span>
                    <strong style={{ color: colorPorcentaje(pct) }}>{pct}%</strong>
                  </div>
                  <div className="practica-historial-stat-card">
                    <span>Minutos</span>
                    <strong>{item.tiempo_total_minutos}</strong>
                  </div>
                </div>

                {abierta ? (
                  <div className="practica-historial-detalle">
                    <div className="practica-historial-detalle-grid">
                      <div className="practica-historial-detalle-item">
                        <span>Modo</span>
                        <p>{item.modo}</p>
                      </div>
                      <div className="practica-historial-detalle-item">
                        <span>Modulo</span>
                        <p>{item.modulo_nombre || 'N/A'}</p>
                      </div>
                      <div className="practica-historial-detalle-item">
                        <span>Subtema</span>
                        <p>{item.subtema_nombre || 'General (todos los subtemas)'}</p>
                      </div>
                      <div className="practica-historial-detalle-item">
                        <span>Nivel de dificultad</span>
                        <p>{item.nivel_dificultad || 'N/A'}</p>
                      </div>
                      <div className="practica-historial-detalle-item">
                        <span>Fecha de inicio</span>
                        <p>{formatearFecha(item.fecha_inicio)}</p>
                      </div>
                      <div className="practica-historial-detalle-item">
                        <span>Fecha de fin</span>
                        <p>{formatearFecha(item.fecha_fin)}</p>
                      </div>
                      <div className="practica-historial-detalle-item">
                        <span>Incorrectos</span>
                        <p style={{ color: '#ef4444' }}>
                          {Number(item.total_respondidas || 0) - Number(item.total_correctos || 0)}
                        </p>
                      </div>
                      <div className="practica-historial-detalle-item">
                        <span>Duracion</span>
                        <p>{item.tiempo_total_minutos} minutos</p>
                      </div>
                    </div>

                    <div className="practica-historial-detalle-resumen">
                      <div className="practica-historial-mini-barra">
                        <div
                          className="practica-historial-mini-seg practica-mini-correctos"
                          style={{
                            width: item.total_respondidas > 0
                              ? `${(item.total_correctos / item.total_respondidas) * 100}%`
                              : '0%'
                          }}
                          title={`${item.total_correctos} correctos`}
                        />
                        <div
                          className="practica-historial-mini-seg practica-mini-incorrectos"
                          style={{
                            width: item.total_respondidas > 0
                              ? `${((item.total_respondidas - item.total_correctos) / item.total_respondidas) * 100}%`
                              : '0%'
                          }}
                          title={`${item.total_respondidas - item.total_correctos} incorrectos`}
                        />
                      </div>
                      <div className="practica-historial-mini-leyenda">
                        <span><em className="dot-verde" /> Correctos</span>
                        <span><em className="dot-rojo" /> Incorrectos</span>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="practica-historial-actions">
                  <button
                    className="practica-historial-btn practica-historial-btn-secundario"
                    onClick={() => toggleExpandir(item.sesion_id)}
                  >
                    {abierta ? '▲ Ocultar detalle' : '▼ Ver detalle'}
                  </button>

                  <button
                    className="practica-historial-btn practica-historial-btn-secundario"
                    onClick={() => navigate(`/estudiante/practica/sesion/${item.sesion_id}`)}
                  >
                    Ver resumen
                  </button>

                  <button
                    className="practica-historial-btn practica-historial-btn-repetir"
                    onClick={() => repetirDesdeHistorial(item)}
                    disabled={repitiendo === item.sesion_id}
                  >
                    {repitiendo === item.sesion_id ? 'Iniciando...' : '↺ Repetir practica'}
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
