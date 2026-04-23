import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MathRenderer from '../../components/ejercicios/MathRenderer';
import { simulacroService } from '../../services/simulacroService';
import './SimulacroSesionPage.css';

export default function SimulacroSesionPage() {
  const { simulacroId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [opcionId, setOpcionId] = useState(null);
  const [respuestaTexto, setRespuestaTexto] = useState('');
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [abiertoIncorrecta, setAbiertoIncorrecta] = useState(null);

  useEffect(() => {
    cargarDetalle();
  }, [simulacroId]);

  useEffect(() => {
    if (data?.simulacro?.estado === 'EN_PROCESO') {
      setTiempoRestante(Number(data.simulacro.tiempo_restante_segundos || 0));
    }
  }, [data?.simulacro?.id, data?.simulacro?.tiempo_restante_segundos, data?.simulacro?.estado]);

  useEffect(() => {
    if (!data?.simulacro || data.simulacro.estado !== 'EN_PROCESO') {
      return;
    }

    const intervalo = setInterval(() => {
      setTiempoRestante(prev => {
        if (prev <= 1) {
          clearInterval(intervalo);
          cargarDetalle();
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalo);
  }, [data?.simulacro?.id, data?.simulacro?.estado]);

  useEffect(() => {
    setOpcionId(null);
    setRespuestaTexto('');
  }, [data?.pregunta_actual?.simulacro_pregunta_id]);

  useEffect(() => {
    if (!data?.simulacro || data.simulacro.estado !== 'EN_PROCESO') {
      return;
    }

    const bloquearRecarga = e => {
      e.preventDefault();
      e.returnValue = '';
    };

    const bloquearAtras = () => {
      window.history.pushState(null, '', window.location.href);
      setError('Debes finalizar el simulacro antes de salir de esta pantalla.');
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('beforeunload', bloquearRecarga);
    window.addEventListener('popstate', bloquearAtras);

    return () => {
      window.removeEventListener('beforeunload', bloquearRecarga);
      window.removeEventListener('popstate', bloquearAtras);
    };
  }, [data?.simulacro?.estado]);

  async function cargarDetalle() {
    try {
      setCargando(true);
      setError('');

      const detalle = await simulacroService.detalle(simulacroId);
      setData(detalle);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo cargar el simulacro.');
    } finally {
      setCargando(false);
    }
  }

  async function responder(e) {
    e.preventDefault();

    if (!data?.pregunta_actual) {
      return;
    }

    const tipo = data.pregunta_actual.tipo_ejercicio;
    const opciones = Array.isArray(data.pregunta_actual.opciones) ? data.pregunta_actual.opciones : [];

    const usaOpciones =
      tipo === 'OPCION_MULTIPLE' ||
      (tipo === 'VERDADERO_FALSO' && opciones.length > 0);

    const esVerdaderoFalsoManual =
      tipo === 'VERDADERO_FALSO' && opciones.length === 0;

    if (usaOpciones && !opcionId) {
      setError('Debes seleccionar una opcion.');
      return;
    }

    if (esVerdaderoFalsoManual && !respuestaTexto.trim()) {
      setError('Debes seleccionar Verdadero o Falso.');
      return;
    }

    if (!usaOpciones && !esVerdaderoFalsoManual && !respuestaTexto.trim()) {
      setError('Debes ingresar una respuesta.');
      return;
    }

    try {
      setEnviando(true);
      setError('');

      const res = await simulacroService.responder(simulacroId, {
        ejercicio_id: data.pregunta_actual.ejercicio_id,
        opcion_id: usaOpciones ? Number(opcionId) : null,
        respuesta_texto: usaOpciones ? null : respuestaTexto.trim(),
      });

      setData(res);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo registrar la respuesta.');
    } finally {
      setEnviando(false);
    }
  }

  async function finalizar() {
    try {
      setFinalizando(true);
      setError('');

      const res = await simulacroService.finalizar(simulacroId);
      setData(res);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo finalizar el simulacro.');
    } finally {
      setFinalizando(false);
    }
  }

  function toggleIncorrecta(index) {
    setAbiertoIncorrecta(prev => (prev === index ? null : index));
  }

  const pregunta = data?.pregunta_actual || null;
  const simulacro = data?.simulacro || null;
  const progreso = data?.progreso || null;
  const resultadoFinal = data?.resultado_final || null;

  const usaOpcionesRender = useMemo(() => {
    if (!pregunta) return false;

    const opciones = Array.isArray(pregunta.opciones) ? pregunta.opciones : [];

    return (
      pregunta.tipo_ejercicio === 'OPCION_MULTIPLE' ||
      (pregunta.tipo_ejercicio === 'VERDADERO_FALSO' && opciones.length > 0)
    );
  }, [pregunta]);

  const esVerdaderoFalsoManual = useMemo(() => {
    if (!pregunta) return false;

    const opciones = Array.isArray(pregunta.opciones) ? pregunta.opciones : [];
    return pregunta.tipo_ejercicio === 'VERDADERO_FALSO' && opciones.length === 0;
  }, [pregunta]);

  if (cargando) {
    return <div className="simulacro-sesion-loading">Cargando simulacro...</div>;
  }

  if (error && !data) {
    return (
      <div className="simulacro-sesion-page">
        <div className="simulacro-sesion-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="simulacro-sesion-page">
      <div className="simulacro-sesion-top">
        <div>
          <h1 className="simulacro-sesion-titulo">
            {simulacro?.estado === 'EN_PROCESO' ? 'Simulacro en curso' : 'Resultado del simulacro'}
          </h1>
          <p className="simulacro-sesion-subtitulo">
            {simulacro?.configuracion_nombre || 'Simulacro'}
          </p>
        </div>

        <div className="simulacro-sesion-top-right">
          {simulacro?.estado === 'EN_PROCESO' ? (
            <div className="simulacro-cronometro">
              <span>Tiempo restante</span>
              <strong>{formatearTiempo(tiempoRestante)}</strong>
            </div>
          ) : (
            <div className={`simulacro-estado-pill ${simulacro?.aprueba_referencia ? 'simulacro-estado-pill-ok' : 'simulacro-estado-pill-bad'}`}>
              {obtenerEstadoResultado(simulacro?.estado, simulacro?.aprueba_referencia)}
            </div>
          )}

          <div className="simulacro-actions">
            {simulacro?.estado !== 'EN_PROCESO' ? (
              <button
                className="simulacro-btn simulacro-btn-secundario"
                onClick={() => navigate('/estudiante/simulacros')}
              >
                Volver
              </button>
            ) : null}

            {simulacro?.estado === 'EN_PROCESO' ? (
              <button
                className="simulacro-btn simulacro-btn-peligro"
                onClick={finalizar}
                disabled={finalizando}
              >
                {finalizando ? 'Finalizando...' : 'Finalizar simulacro'}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {error ? <div className="simulacro-sesion-error">{error}</div> : null}

      {simulacro?.estado === 'EN_PROCESO' ? (
        <div className="simulacro-sesion-info">
          Durante el simulacro no se puede pausar ni salir. Puedes finalizar manualmente o esperar a que el tiempo termine.
        </div>
      ) : null}

      <div className="simulacro-resumen-bar">
        <div className="simulacro-pill">
          <span>Estado</span>
          <strong>{obtenerEstadoLegible(simulacro?.estado)}</strong>
        </div>
        <div className="simulacro-pill">
          <span>Preguntas</span>
          <strong>{simulacro?.cantidad_preguntas || 0}</strong>
        </div>
        <div className="simulacro-pill">
          <span>Respondidas</span>
          <strong>{progreso?.respondidas || 0}</strong>
        </div>
        <div className="simulacro-pill">
          <span>Pendientes</span>
          <strong>{progreso?.pendientes || 0}</strong>
        </div>
      </div>

      {simulacro?.estado === 'EN_PROCESO' && pregunta ? (
        <div className="simulacro-card">
          <div className="simulacro-card-head">
            <div>
              <span className="simulacro-etiqueta">{pregunta.tipo_ejercicio}</span>
              <h2>{pregunta.modulo_nombre}</h2>
              <p>{pregunta.subtema_nombre || 'Sin subtema'}</p>
            </div>

            <div className="simulacro-orden">
              Pregunta {pregunta.orden_pregunta} de {simulacro.cantidad_preguntas}
            </div>
          </div>

          <div className="simulacro-render-box">
            <MathRenderer texto={pregunta.enunciado} />
          </div>

          {pregunta.imagen_apoyo_url ? (
            <img
              src={pregunta.imagen_apoyo_url}
              alt="Apoyo"
              className="simulacro-imagen"
            />
          ) : null}

          <form className="simulacro-form" onSubmit={responder}>
            {usaOpcionesRender ? (
              <div className="simulacro-opciones">
                {pregunta.opciones.map(opcion => (
                  <label
                    key={opcion.id}
                    className={`simulacro-opcion ${String(opcionId) === String(opcion.id) ? 'simulacro-opcion-activa' : ''}`}
                  >
                    <input
                      type="radio"
                      name="opcion_id"
                      value={opcion.id}
                      checked={String(opcionId) === String(opcion.id)}
                      onChange={() => {
                        setOpcionId(opcion.id);
                        setRespuestaTexto('');
                      }}
                    />
                    <div className="simulacro-opcion-texto">
                      <MathRenderer texto={opcion.texto_opcion} />
                    </div>
                  </label>
                ))}
              </div>
            ) : esVerdaderoFalsoManual ? (
              <div className="simulacro-opciones">
                <label className={`simulacro-opcion ${respuestaTexto === 'Verdadero' ? 'simulacro-opcion-activa' : ''}`}>
                  <input
                    type="radio"
                    name="respuesta_vf"
                    value="Verdadero"
                    checked={respuestaTexto === 'Verdadero'}
                    onChange={() => {
                      setRespuestaTexto('Verdadero');
                      setOpcionId(null);
                    }}
                  />
                  <div className="simulacro-opcion-texto">Verdadero</div>
                </label>

                <label className={`simulacro-opcion ${respuestaTexto === 'Falso' ? 'simulacro-opcion-activa' : ''}`}>
                  <input
                    type="radio"
                    name="respuesta_vf"
                    value="Falso"
                    checked={respuestaTexto === 'Falso'}
                    onChange={() => {
                      setRespuestaTexto('Falso');
                      setOpcionId(null);
                    }}
                  />
                  <div className="simulacro-opcion-texto">Falso</div>
                </label>
              </div>
            ) : (
              <div className="simulacro-campo">
                <label>Tu respuesta</label>
                <input
                  type="text"
                  value={respuestaTexto}
                  onChange={e => setRespuestaTexto(e.target.value)}
                  placeholder="Escribe tu respuesta"
                />
              </div>
            )}

            <div className="simulacro-actions">
              <button
                type="submit"
                className="simulacro-btn simulacro-btn-primario"
                disabled={enviando}
              >
                {enviando ? 'Enviando...' : 'Responder y continuar'}
              </button>
            </div>
          </form>
        </div>
      ) : resultadoFinal ? (
        <div className="simulacro-resultado-page">
          <div className="simulacro-resultado-main">
            <div className={`simulacro-resultado-hero ${resultadoFinal.aprueba_referencia ? 'simulacro-resultado-hero-ok' : 'simulacro-resultado-hero-bad'}`}>
              <h2>{resultadoFinal.aprueba_referencia ? 'Referencia alcanzada' : 'Referencia no alcanzada'}</h2>
              <p>
                Puntaje total {resultadoFinal.puntaje_total}% | Puntaje minimo {resultadoFinal.puntaje_minimo_referencia}%
              </p>
            </div>

            <div className="simulacro-resultado-stats">
              <div className="simulacro-resultado-stat">
                <span>Puntaje total</span>
                <strong>{resultadoFinal.puntaje_total}%</strong>
              </div>
              <div className="simulacro-resultado-stat">
                <span>Correctas</span>
                <strong>{resultadoFinal.correctas}</strong>
              </div>
              <div className="simulacro-resultado-stat">
                <span>Respondidas</span>
                <strong>{resultadoFinal.respondidas}</strong>
              </div>
              <div className="simulacro-resultado-stat">
                <span>Duracion real</span>
                <strong>{resultadoFinal.duracion_minutos_real} min</strong>
              </div>
            </div>
          </div>

          <div className="simulacro-card">
            <h2 className="simulacro-seccion-titulo">Resultados por modulo</h2>
            <div className="simulacro-modulos-grid">
              {resultadoFinal.resultados_modulo.map(item => (
                <div key={item.modulo_id} className="simulacro-modulo-card">
                  <span>{item.modulo_nombre}</span>
                  <strong>{item.puntaje_porcentaje}%</strong>
                  <small>{item.total_correctas} de {item.total_preguntas}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="simulacro-card">
            <div className="simulacro-historial-head">
              <h2 className="simulacro-seccion-titulo">Preguntas incorrectas</h2>
              <button
                className="simulacro-btn simulacro-btn-secundario"
                onClick={() => navigate('/estudiante/simulacros/historial')}
              >
                Ver historial
              </button>
            </div>

            {resultadoFinal.preguntas_incorrectas.length === 0 ? (
              <p className="simulacro-muted">No hubo preguntas incorrectas en este intento.</p>
            ) : (
              <div className="simulacro-incorrectas-lista">
                {resultadoFinal.preguntas_incorrectas.map((item, index) => {
                  const abierto = abiertoIncorrecta === index;

                  return (
                    <div key={`${item.ejercicio_id}-${index}`} className="simulacro-incorrecta-card">
                      <div className="simulacro-incorrecta-top">
                        <div>
                          <span className="simulacro-etiqueta">Pregunta {item.orden_pregunta}</span>
                          <h3>{item.modulo_nombre}</h3>
                          <p>{item.subtema_nombre || 'Sin subtema'}</p>
                        </div>

                        <button
                          className="simulacro-btn simulacro-btn-secundario"
                          onClick={() => toggleIncorrecta(index)}
                        >
                          {abierto ? 'Ocultar detalle' : 'Ver detalle'}
                        </button>
                      </div>

                      <div className="simulacro-render-box">
                        <MathRenderer texto={item.enunciado} />
                      </div>

                      {abierto ? (
                        <div className="simulacro-detalle-grid">
                          <div className="simulacro-detalle-bloque">
                            <h4>Tu respuesta</h4>
                            <div className="simulacro-render-box">
                              <MathRenderer texto={item.respuesta_usuario || 'Sin respuesta'} />
                            </div>
                          </div>

                          <div className="simulacro-detalle-bloque">
                            <h4>Respuesta correcta</h4>
                            <div className="simulacro-render-box">
                              <MathRenderer texto={item.respuesta_correcta_texto || 'No disponible'} />
                            </div>
                          </div>

                          <div className="simulacro-detalle-bloque">
                            <h4>Solucion paso a paso</h4>
                            <div className="simulacro-render-box">
                              <MathRenderer texto={item.solucion_paso_a_paso || 'No disponible'} />
                            </div>
                          </div>

                          <div className="simulacro-detalle-bloque">
                            <h4>Explicacion conceptual</h4>
                            <div className="simulacro-render-box">
                              <MathRenderer texto={item.explicacion_conceptual || 'No disponible'} />
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="simulacro-actions">
            <button
              className="simulacro-btn simulacro-btn-primario"
              onClick={() => navigate('/estudiante/simulacros')}
            >
              Nuevo simulacro
            </button>

            <button
              className="simulacro-btn simulacro-btn-secundario"
              onClick={() => navigate('/estudiante/dashboard')}
            >
              Ir al dashboard
            </button>
          </div>
        </div>
      ) : (
        <div className="simulacro-card">
          <p className="simulacro-muted">No hay informacion disponible para este simulacro.</p>
        </div>
      )}
    </div>
  );
}

function formatearTiempo(segundos) {
  const total = Math.max(0, Math.floor(Number(segundos || 0)));
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  return [horas, minutos, secs]
    .map(valor => String(valor).padStart(2, '0'))
    .join(':');
}

function obtenerEstadoLegible(estado) {
  switch (estado) {
    case 'EN_PROCESO':
      return 'En proceso';
    case 'FINALIZADO':
      return 'Finalizado';
    case 'EXPIRADO':
      return 'Expirado';
    default:
      return estado || 'N/A';
  }
}

function obtenerEstadoResultado(estado, apruebaReferencia) {
  if (estado === 'EXPIRADO') {
    return 'Expirado';
  }

  if (estado === 'FINALIZADO') {
    return apruebaReferencia ? 'Aprobado de referencia' : 'No alcanza referencia';
  }

  if (estado === 'EN_PROCESO') {
    return 'En proceso';
  }

  return estado || 'N/A';
}