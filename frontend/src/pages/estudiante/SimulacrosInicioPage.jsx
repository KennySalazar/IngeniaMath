import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { simulacroService } from '../../services/simulacroService';
import './SimulacrosInicioPage.css';

export default function SimulacrosInicioPage() {
  const navigate = useNavigate();

  const [config, setConfig] = useState(null);
  const [activo, setActivo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [iniciando, setIniciando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarTodo();
  }, []);

  async function cargarTodo() {
    try {
      setCargando(true);
      setError('');

      const [configData, activaData] = await Promise.all([
        simulacroService.configuracion(),
        simulacroService.activa(),
      ]);

      setConfig(configData);
      setActivo(activaData?.simulacro || null);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo cargar el modulo de simulacros.');
    } finally {
      setCargando(false);
    }
  }

  async function iniciarOReanudar() {
    try {
      setIniciando(true);
      setError('');

      if (activo?.id) {
        navigate(`/estudiante/simulacros/sesion/${activo.id}`);
        return;
      }

      const data = await simulacroService.iniciar();
      navigate(`/estudiante/simulacros/sesion/${data.simulacro.id}`);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo iniciar el simulacro.');
    } finally {
      setIniciando(false);
    }
  }

  if (cargando) {
    return <div className="simulacros-loading">Cargando simulacros...</div>;
  }

  return (
    <div className="simulacros-inicio-page">
      <div className="simulacros-hero">
        <div>
          <h1 className="simulacros-titulo">Modulo de simulacros</h1>
          <p className="simulacros-subtitulo">
            Simula condiciones cercanas al examen real y revisa tu desempeno al finalizar.
          </p>
        </div>

        <div className="simulacros-hero-actions">
          <button
            className="simulacros-btn simulacros-btn-secundario"
            onClick={() => navigate('/estudiante/simulacros/historial')}
          >
            Ver historial
          </button>
        </div>
      </div>

      {error ? <div className="simulacros-error">{error}</div> : null}

      <div className="simulacros-grid">
        <div className="simulacros-card simulacros-card-main">
          <div className="simulacros-badge">S</div>
          <h2>Configuracion activa</h2>

          {config ? (
            <>
              <div className="simulacros-stats">
                <div className="simulacros-stat">
                  <span>Nombre</span>
                  <strong>{config.nombre}</strong>
                </div>
                <div className="simulacros-stat">
                  <span>Duracion</span>
                  <strong>{config.duracion_minutos} min</strong>
                </div>
                <div className="simulacros-stat">
                  <span>Preguntas</span>
                  <strong>{config.cantidad_preguntas}</strong>
                </div>
                <div className="simulacros-stat">
                  <span>Puntaje minimo</span>
                  <strong>{config.puntaje_minimo_aprobacion}%</strong>
                </div>
              </div>

              <div className="simulacros-box">
                <h3>Distribucion por modulo</h3>
                <div className="simulacros-distribucion">
                  {config.distribucion.map(item => (
                    <div key={item.modulo_id} className="simulacros-distribucion-item">
                      <span>{item.modulo_nombre}</span>
                      <strong>{item.cantidad_preguntas}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="simulacros-muted">No hay configuracion disponible.</p>
          )}

          <div className="simulacros-actions">
            <button
              className="simulacros-btn simulacros-btn-primario"
              onClick={iniciarOReanudar}
              disabled={iniciando}
            >
              {iniciando
                ? 'Procesando...'
                : activo?.id
                  ? 'Reanudar simulacro'
                  : 'Iniciar simulacro'}
            </button>
          </div>
        </div>

        <div className="simulacros-side">
          <div className="simulacros-card">
            <h2>Condiciones</h2>
            <div className="simulacros-lista">
              <span>Tiempo corrido durante todo el intento</span>
              <span>No hay retroalimentacion inmediata</span>
              <span>Se responde una pregunta a la vez</span>
              <span>Si el tiempo termina, el simulacro expira</span>
            </div>
          </div>

          <div className="simulacros-card">
            <h2>Resultado final</h2>
            <div className="simulacros-lista">
              <span>Puntaje total obtenido</span>
              <span>Desglose por modulo</span>
              <span>Comparacion contra puntaje minimo</span>
              <span>Listado de preguntas incorrectas</span>
            </div>
          </div>

          <div className="simulacros-card">
            <h2>Estado actual</h2>
            {activo ? (
              <div className="simulacros-estado-activo">
               <div className="simulacros-estado-pill simulacros-estado-pill-activo">En proceso</div>
                <p>Tienes un simulacro activo pendiente de completar.</p>
                <button
                  className="simulacros-btn simulacros-btn-secundario"
                  onClick={() => navigate(`/estudiante/simulacros/sesion/${activo.id}`)}
                >
                  Ir a simulacro activo
                </button>
              </div>
            ) : (
              <div className="simulacros-estado-activo">
                <div className="simulacros-estado-pill">SIN ACTIVO</div>
                <p>No tienes simulacros en proceso en este momento.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}