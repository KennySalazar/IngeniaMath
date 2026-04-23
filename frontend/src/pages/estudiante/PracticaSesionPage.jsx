import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MathRenderer from '../../components/ejercicios/MathRenderer';
import { practicaService } from '../../services/practicaService';
import './PracticaSesionPage.css';

export default function PracticaSesionPage() {
  const navigate = useNavigate();
  const { sesionId } = useParams();

  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [opcionId, setOpcionId] = useState(null);
  const [respuestaTexto, setRespuestaTexto] = useState('');
  const [resultado, setResultado] = useState(null);
  const [proximoEjercicio, setProximoEjercicio] = useState(null);
  const [tiempoInicio, setTiempoInicio] = useState(Date.now());
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [avisosSistema, setAvisosSistema] = useState([]);
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [tiempoSesionSegundos, setTiempoSesionSegundos] = useState(0);
  const [procesandoTiempoAgotado, setProcesandoTiempoAgotado] = useState(false);

  useEffect(() => {
    cargarDetalle();
  }, [sesionId]);

  useEffect(() => {
    if (data?.ejercicio_actual?.id) {
      const minutos = Number(data.ejercicio_actual.tiempo_estimado_minutos || 0);

      setOpcionId(null);
      setRespuestaTexto('');
      setResultado(null);
      setProximoEjercicio(null);
      setTiempoInicio(Date.now());
      setMensajeExito('');
      setTiempoRestante(Math.max(0, minutos * 60));
      setProcesandoTiempoAgotado(false);
    } else {
      setTiempoRestante(0);
      setProcesandoTiempoAgotado(false);
    }
  }, [data?.ejercicio_actual?.id]);

  useEffect(() => {
    if (!data?.sesion?.fecha_fin && data?.sesion?.fecha_inicio) {
      const actualizar = () => {
        const inicio = new Date(data.sesion.fecha_inicio).getTime();
        const ahora = Date.now();
        const total = Math.max(0, Math.floor((ahora - inicio) / 1000));
        setTiempoSesionSegundos(total);
      };

      actualizar();
      const intervalo = setInterval(actualizar, 1000);

      return () => clearInterval(intervalo);
    }

    if (data?.sesion?.fecha_fin) {
      const totalMinutos = Number(data?.resumen?.tiempo_total_minutos || 0);
      setTiempoSesionSegundos(totalMinutos * 60);
    }
  }, [data?.sesion?.fecha_inicio, data?.sesion?.fecha_fin, data?.resumen?.tiempo_total_minutos]);

  useEffect(() => {
    if (!data?.ejercicio_actual?.id || resultado || data?.sesion?.fecha_fin) {
      return;
    }

    const intervalo = setInterval(() => {
      setTiempoRestante(prev => {
        if (prev <= 1) {
          clearInterval(intervalo);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalo);
  }, [data?.ejercicio_actual?.id, resultado, data?.sesion?.fecha_fin]);

  useEffect(() => {
    if (
      !data?.ejercicio_actual?.id ||
      data?.sesion?.fecha_fin ||
      resultado ||
      enviando ||
      guardando ||
      finalizando ||
      procesandoTiempoAgotado ||
      tiempoRestante > 0
    ) {
      return;
    }

    omitirPorTiempo();
  }, [
    tiempoRestante,
    data?.ejercicio_actual?.id,
    data?.sesion?.fecha_fin,
    resultado,
    enviando,
    guardando,
    finalizando,
    procesandoTiempoAgotado,
  ]);

  async function cargarDetalle() {
    try {
      setCargando(true);
      const detalle = await practicaService.detalle(sesionId);
      setData(detalle);
      setError('');
      setAvisosSistema([]);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo cargar la sesion.');
    } finally {
      setCargando(false);
    }
  }

  async function guardarParaDespues() {
    if (!data?.ejercicio_actual?.id) {
      return;
    }

    try {
      setGuardando(true);
      setError('');
      setMensajeExito('');
      setAvisosSistema([]);

      const tiempoSegundos = Math.max(1, Math.round((Date.now() - tiempoInicio) / 1000));

      const res = await practicaService.guardarParaDespues({
        sesion_id: Number(sesionId),
        ejercicio_id: data.ejercicio_actual.id,
        tiempo_segundos: tiempoSegundos,
      });

      setAvisosSistema(Array.isArray(res.avisos) ? res.avisos : []);
      setMensajeExito(res.message || 'Ejercicio guardado para revisar despues.');

      if (res.siguiente_ejercicio) {
        setData(prev => ({
          ...prev,
          resumen: res.resumen || prev.resumen,
          ejercicio_actual: res.siguiente_ejercicio,
        }));

        setResultado(null);
        setProximoEjercicio(null);
        setOpcionId(null);
        setRespuestaTexto('');
        setTiempoInicio(Date.now());
      } else {
        setData(prev => ({
          ...prev,
          resumen: res.resumen || prev.resumen,
          ejercicio_actual: null,
        }));
      }
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo guardar el ejercicio.');
    } finally {
      setGuardando(false);
    }
  }

  async function omitirPorTiempo() {
    if (!data?.ejercicio_actual?.id) {
      return;
    }

    try {
      setProcesandoTiempoAgotado(true);
      setError('');
      setMensajeExito('');
      setAvisosSistema([]);

      const tiempoSegundos = Math.max(1, Math.round((Date.now() - tiempoInicio) / 1000));

      const res = await practicaService.omitirPorTiempo(sesionId, {
        ejercicio_id: data.ejercicio_actual.id,
        tiempo_segundos: tiempoSegundos,
      });

      setAvisosSistema(Array.isArray(res.avisos) ? res.avisos : []);
      setMensajeExito(res.message || 'Tiempo agotado. El ejercicio se registro como omitido.');

      if (res.siguiente_ejercicio) {
        setData(prev => ({
          ...prev,
          sesion: res.sesion || prev.sesion,
          resumen: res.resumen || prev.resumen,
          ejercicio_actual: res.siguiente_ejercicio,
        }));

        setResultado(null);
        setProximoEjercicio(null);
        setOpcionId(null);
        setRespuestaTexto('');
        setTiempoInicio(Date.now());
      } else {
        setData(prev => ({
          ...prev,
          sesion: res.sesion || prev.sesion,
          resumen: res.resumen || prev.resumen,
          ejercicio_actual: null,
        }));
      }
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo registrar el tiempo agotado.');
    } finally {
      setProcesandoTiempoAgotado(false);
    }
  }

  async function handleResponder(e) {
    e.preventDefault();

    if (!data?.ejercicio_actual) {
      return;
    }

    const tipo = data.ejercicio_actual.tipo_ejercicio;
    const opciones = Array.isArray(data.ejercicio_actual.opciones) ? data.ejercicio_actual.opciones : [];

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
      setMensajeExito('');
      setAvisosSistema([]);

      const tiempoSegundos = Math.max(1, Math.round((Date.now() - tiempoInicio) / 1000));

      const res = await practicaService.responder(sesionId, {
        ejercicio_id: data.ejercicio_actual.id,
        opcion_id: usaOpciones ? Number(opcionId) : null,
        respuesta_texto: usaOpciones ? null : respuestaTexto.trim(),
        marcado_guardado: false,
        tiempo_segundos: tiempoSegundos,
      });

      setResultado(res);
      setProximoEjercicio(res.siguiente_ejercicio || null);
      setAvisosSistema(Array.isArray(res.avisos) ? res.avisos : []);

      setData(prev => ({
        ...prev,
        sesion: {
          ...prev.sesion,
          nivel_dificultad: res.nivel_actual || prev.sesion.nivel_dificultad,
        },
        resumen: res.resumen || prev.resumen,
      }));
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo registrar la respuesta.');
    } finally {
      setEnviando(false);
    }
  }

  function continuar() {
    setData(prev => ({
      ...prev,
      ejercicio_actual: proximoEjercicio || null,
    }));

    setResultado(null);
    setProximoEjercicio(null);
    setOpcionId(null);
    setRespuestaTexto('');
    setTiempoInicio(Date.now());
    setMensajeExito('');
  }

  async function finalizarSesion() {
    try {
      setFinalizando(true);
      setError('');
      setAvisosSistema([]);

      const res = await practicaService.finalizar(sesionId);

      setData(prev => ({
        ...prev,
        sesion: res.sesion,
        resumen: res.resumen,
        ejercicio_actual: null,
      }));

      setResultado(null);
      setProximoEjercicio(null);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo finalizar la sesion.');
    } finally {
      setFinalizando(false);
    }
  }

  function obtenerMensajeFinal(resumen) {
    if (!resumen) {
      return 'Sesion finalizada.';
    }

    if ((resumen.total_respondidas || 0) === 0 && (resumen.total_omitidas || 0) > 0) {
      return 'Finalizaste la sesion guardando ejercicios para revisarlos despues.';
    }

    if ((resumen.porcentaje_aciertos || 0) >= 80) {
      return 'Cerraste la sesion con muy buen rendimiento.';
    }

    if ((resumen.porcentaje_aciertos || 0) >= 60) {
      return 'Cerraste la sesion con un rendimiento aceptable. Sigue practicando.';
    }

    return 'Cerraste la sesion. Conviene reforzar los subtemas con mas errores.';
  }

  if (cargando) {
    return <div className="practica-sesion-loading">Cargando sesion...</div>;
  }

  if (error && !data) {
    return (
      <div className="practica-sesion-page">
        <div className="practica-sesion-error">{error}</div>
      </div>
    );
  }

  const sesion = data?.sesion;
  const ejercicio = data?.ejercicio_actual;
  const resumen = data?.resumen;

  const usaOpciones = ejercicio && (
    ejercicio.tipo_ejercicio === 'OPCION_MULTIPLE' ||
    (ejercicio.tipo_ejercicio === 'VERDADERO_FALSO' &&
      Array.isArray(ejercicio.opciones) &&
      ejercicio.opciones.length > 0)
  );

  const esVerdaderoFalsoManual = ejercicio &&
    ejercicio.tipo_ejercicio === 'VERDADERO_FALSO' &&
    (!Array.isArray(ejercicio.opciones) || ejercicio.opciones.length === 0);

  return (
    <div className="practica-sesion-page">
      <div className="practica-sesion-top">
        <div>
          <h1 className="practica-sesion-titulo">
            {sesion?.fecha_fin ? 'Resumen final' : 'Sesion de practica'}
          </h1>
          <p className="practica-sesion-subtitulo">
            {sesion?.fecha_fin
              ? 'Aqui puedes revisar el cierre completo de tu sesion.'
              : 'Resuelve ejercicios y recibe retroalimentacion inmediata.'}
          </p>
        </div>

        <div className="practica-sesion-actions">
          <button
            className="practica-sesion-btn practica-sesion-btn-secundario"
            onClick={() => navigate('/estudiante/practica')}
          >
            Volver
          </button>

          {sesion?.fecha_fin ? null : (
            <button
              className="practica-sesion-btn practica-sesion-btn-peligro"
              onClick={finalizarSesion}
              disabled={finalizando}
            >
              {finalizando ? 'Finalizando...' : 'Finalizar sesion'}
            </button>
          )}
        </div>
      </div>

      {error ? <div className="practica-sesion-error">{error}</div> : null}
      {mensajeExito ? <div className="practica-sesion-exito">{mensajeExito}</div> : null}

      {avisosSistema.length > 0 ? (
        <div className="practica-sesion-avisos">
          {avisosSistema.map((aviso, index) => (
            <div
              key={`${aviso.tipo || 'info'}-${index}`}
              className={`practica-sesion-aviso practica-sesion-aviso-${aviso.tipo || 'info'}`}
            >
              {aviso.mensaje}
            </div>
          ))}
        </div>
      ) : null}

      {!sesion?.fecha_fin && ejercicio ? (
        <div className="practica-sesion-timer-wrap">
          <div className={`practica-sesion-timer ${tiempoRestante <= 60 ? 'practica-sesion-timer-alerta' : ''}`}>
            <span>Tiempo restante</span>
            <strong>{formatearTiempoCorto(tiempoRestante)}</strong>
          </div>
        </div>
      ) : null}

      {!sesion?.fecha_fin ? (
        <div className="practica-sesion-resumen-bar">
          <div className="practica-sesion-pill">
            <span>Modo</span>
            <strong>{sesion?.modo}</strong>
          </div>
          <div className="practica-sesion-pill">
            <span>Modulo</span>
            <strong>{sesion?.modulo_nombre || 'N/A'}</strong>
          </div>
          <div className="practica-sesion-pill">
            <span>Subtema</span>
            <strong>{sesion?.subtema_nombre || 'General'}</strong>
          </div>
          <div className="practica-sesion-pill">
            <span>Nivel</span>
            <strong>{sesion?.nivel_dificultad || 'N/A'}</strong>
          </div>
        </div>
      ) : null}

      {!sesion?.fecha_fin ? (
        <div className="practica-sesion-stats">
          <div className="practica-sesion-stat">
            <span>Respondidas</span>
            <strong>{resumen?.total_respondidas || 0}</strong>
          </div>
          <div className="practica-sesion-stat">
            <span>Correctos</span>
            <strong>{resumen?.total_correctos || 0}</strong>
          </div>
          <div className="practica-sesion-stat">
            <span>Omitidas</span>
            <strong>{resumen?.total_omitidas || 0}</strong>
          </div>
          <div className="practica-sesion-stat">
            <span>Guardadas</span>
            <strong>{resumen?.total_guardadas || 0}</strong>
          </div>
          <div className="practica-sesion-stat">
            <span>Aciertos</span>
            <strong>{resumen?.porcentaje_aciertos || 0}%</strong>
          </div>
          <div className="practica-sesion-stat">
            <span>Tiempo total</span>
            <strong>{formatearTiempoLargo(tiempoSesionSegundos)}</strong>
          </div>
        </div>
      ) : null}

      {sesion?.fecha_fin ? (
        <div className="practica-sesion-card">
          <p className="practica-sesion-card-texto">
            Ya puedes iniciar otra practica desde el panel del estudiante.
          </p>

          <div className="practica-sesion-final-mensaje">
            {obtenerMensajeFinal(resumen)}
          </div>

          <div className="practica-sesion-final-grid">
            <div className="practica-sesion-final-item">
              <span>Respondidas</span>
              <strong>{resumen?.total_respondidas || 0}</strong>
            </div>
            <div className="practica-sesion-final-item">
              <span>Correctos</span>
              <strong>{resumen?.total_correctos || 0}</strong>
            </div>
            <div className="practica-sesion-final-item">
              <span>Omitidas</span>
              <strong>{resumen?.total_omitidas || 0}</strong>
            </div>
            <div className="practica-sesion-final-item">
              <span>Guardadas</span>
              <strong>{resumen?.total_guardadas || 0}</strong>
            </div>
            <div className="practica-sesion-final-item">
              <span>Porcentaje</span>
              <strong>{resumen?.porcentaje_aciertos || 0}%</strong>
            </div>
            <div className="practica-sesion-final-item">
              <span>Tiempo total</span>
              <strong>{resumen?.tiempo_total_minutos || 0} min</strong>
            </div>
          </div>

          <div className="practica-sesion-final-grid">
            <div className="practica-sesion-final-item">
              <span>Modulo final</span>
              <strong>{resumen?.modulo_nombre || 'N/A'}</strong>
            </div>
            <div className="practica-sesion-final-item">
              <span>Subtema final</span>
              <strong>{resumen?.subtema_nombre || 'General'}</strong>
            </div>
            <div className="practica-sesion-final-item">
              <span>Nivel final</span>
              <strong>{resumen?.nivel_dificultad || 'N/A'}</strong>
            </div>
            <div className="practica-sesion-final-item">
              <span>Modulos trabajados</span>
              <strong>{resumen?.modulos_trabajados || 0}</strong>
            </div>
          </div>

          <div className="practica-sesion-actions practica-sesion-actions-final">
            <button
              className="practica-sesion-btn practica-sesion-btn-primario"
              onClick={() => navigate('/estudiante/practica')}
            >
              Nueva practica
            </button>
            <button
              className="practica-sesion-btn practica-sesion-btn-secundario"
              onClick={() => navigate('/estudiante/practica/guardados')}
            >
              Ver guardados
            </button>
            <button
              className="practica-sesion-btn practica-sesion-btn-secundario"
              onClick={() => navigate('/estudiante/dashboard')}
            >
              Ir al dashboard
            </button>
          </div>
        </div>
      ) : resultado ? (
        <div className="practica-sesion-card">
          <div className={`practica-resultado ${resultado.es_correcta ? 'practica-resultado-ok' : 'practica-resultado-bad'}`}>
            <h2>{resultado.es_correcta ? 'Respuesta correcta' : 'Respuesta incorrecta'}</h2>
            <p>{resultado.mensaje}</p>
          </div>

          <div className="practica-sesion-bloque">
            <h3>Solucion paso a paso</h3>
            <div className="practica-render-box">
              <MathRenderer texto={resultado.solucion_paso_a_paso || 'No disponible'} />
            </div>
          </div>

          <div className="practica-sesion-bloque">
            <h3>Explicacion conceptual</h3>
            <div className="practica-render-box">
              <MathRenderer texto={resultado.explicacion_conceptual || 'No disponible'} />
            </div>
          </div>

          <div className="practica-sesion-actions">
            {proximoEjercicio ? (
              <button
                className="practica-sesion-btn practica-sesion-btn-primario"
                onClick={continuar}
              >
                Continuar
              </button>
            ) : (
              <button
                className="practica-sesion-btn practica-sesion-btn-peligro"
                onClick={finalizarSesion}
                disabled={finalizando}
              >
                {finalizando ? 'Finalizando...' : 'Finalizar sesion'}
              </button>
            )}
          </div>
        </div>
      ) : ejercicio ? (
        <div className="practica-sesion-card">
          <div className="practica-sesion-ejercicio-top">
            <div>
              <span className="practica-sesion-etiqueta">{ejercicio.tipo_ejercicio}</span>
              <h2 className="practica-sesion-card-titulo">{ejercicio.subtema_nombre || 'Ejercicio'}</h2>
              <p className="practica-sesion-card-texto">
                Tiempo estimado: {ejercicio.tiempo_estimado_minutos || 0} min
              </p>
            </div>
          </div>

          <div className="practica-render-box practica-enunciado">
            <MathRenderer texto={ejercicio.enunciado} />
          </div>

          {ejercicio.imagen_apoyo_url ? (
            <img
              src={ejercicio.imagen_apoyo_url}
              alt="Apoyo"
              className="practica-sesion-imagen"
            />
          ) : null}

          <form className="practica-sesion-form" onSubmit={handleResponder}>
            {usaOpciones ? (
              <div className="practica-sesion-opciones">
                {ejercicio.opciones.map(opcion => (
                  <label
                    key={opcion.id}
                    className={`practica-opcion ${String(opcionId) === String(opcion.id) ? 'practica-opcion-activa' : ''}`}
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
                    <div className="practica-opcion-texto">
                      <MathRenderer texto={opcion.texto_opcion} />
                    </div>
                  </label>
                ))}
              </div>
            ) : esVerdaderoFalsoManual ? (
              <div className="practica-sesion-opciones">
                <label className={`practica-opcion ${respuestaTexto === 'Verdadero' ? 'practica-opcion-activa' : ''}`}>
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
                  <span>Verdadero</span>
                </label>

                <label className={`practica-opcion ${respuestaTexto === 'Falso' ? 'practica-opcion-activa' : ''}`}>
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
                  <span>Falso</span>
                </label>
              </div>
            ) : (
              <div className="practica-sesion-campo">
                <label>Tu respuesta</label>
                <input
                  type="text"
                  value={respuestaTexto}
                  onChange={e => setRespuestaTexto(e.target.value)}
                  placeholder="Escribe tu respuesta"
                />
              </div>
            )}

            <div className="practica-sesion-actions">
              <button
                type="button"
                className="practica-sesion-btn practica-sesion-btn-secundario"
                onClick={guardarParaDespues}
                disabled={guardando || procesandoTiempoAgotado}
              >
                {guardando ? 'Guardando...' : 'Guardar para revisar despues'}
              </button>

              <button
                type="submit"
                className="practica-sesion-btn practica-sesion-btn-primario"
                disabled={enviando || procesandoTiempoAgotado}
              >
                {enviando ? 'Enviando...' : 'Responder'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="practica-sesion-card">
          <h2 className="practica-sesion-card-titulo">No hay mas ejercicios disponibles</h2>
          <p className="practica-sesion-card-texto">
            Finaliza la sesion o inicia otra practica para seguir avanzando.
          </p>

          <div className="practica-sesion-actions">
            <button
              className="practica-sesion-btn practica-sesion-btn-peligro"
              onClick={finalizarSesion}
              disabled={finalizando}
            >
              {finalizando ? 'Finalizando...' : 'Finalizar sesion'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatearTiempoCorto(segundos) {
  const total = Math.max(0, Number(segundos || 0));
  const minutos = Math.floor(total / 60);
  const segundosRestantes = total % 60;

  return `${String(minutos).padStart(2, '0')}:${String(segundosRestantes).padStart(2, '0')}`;
}

function formatearTiempoLargo(segundos) {
  const total = Math.max(0, Number(segundos || 0));
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const segundosRestantes = total % 60;

  return [horas, minutos, segundosRestantes]
    .map(valor => String(valor).padStart(2, '0'))
    .join(':');
}