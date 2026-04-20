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

  function formatearFecha(valor) {
    if (!valor) {
      return 'N/A';
    }

    return new Date(valor).toLocaleString();
  }

  if (cargando) {
    return <div className="practica-historial-loading">Cargando historial...</div>;
  }

  return (
    <div className="practica-historial-page">
      <div className="practica-historial-hero">
        <div>
          <h1 className="practica-historial-titulo">Historial de practica</h1>
          <p className="practica-historial-subtitulo">
            Aqui puedes revisar tus sesiones finalizadas de practica.
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

      <div className="practica-historial-resumen">
        <div className="practica-historial-stat">
          <span>Total sesiones</span>
          <strong>{total}</strong>
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
          {items.map(item => (
            <div key={item.sesion_id} className="practica-historial-card">
              <div className="practica-historial-card-top">
                <div className="practica-historial-tags">
                  <span className="practica-historial-tag">{item.modo}</span>
                  <span className="practica-historial-tag">{item.nivel_dificultad}</span>
                  <span className="practica-historial-tag">{item.modulo_nombre || 'Modulo'}</span>
                  {item.subtema_nombre ? (
                    <span className="practica-historial-tag">{item.subtema_nombre}</span>
                  ) : null}
                </div>

                <div className="practica-historial-meta">
                  Finalizada: {formatearFecha(item.fecha_fin)}
                </div>
              </div>

              <div className="practica-historial-stats">
                <div className="practica-historial-stat-card">
                  <span>Respondidas</span>
                  <strong>{item.total_respondidas}</strong>
                </div>
                <div className="practica-historial-stat-card">
                  <span>Correctos</span>
                  <strong>{item.total_correctos}</strong>
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
                  <strong>{item.porcentaje_aciertos}%</strong>
                </div>
                <div className="practica-historial-stat-card">
                  <span>Minutos</span>
                  <strong>{item.tiempo_total_minutos}</strong>
                </div>
              </div>

              <div className="practica-historial-actions">
                <button
                  className="practica-historial-btn practica-historial-btn-primario"
                  onClick={() => navigate(`/estudiante/practica/sesion/${item.sesion_id}`)}
                >
                  Ver resumen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}