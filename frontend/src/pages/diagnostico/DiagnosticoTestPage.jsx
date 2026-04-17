import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { diagnosticoService } from '../../services/diagnosticoService';
import MathRenderer from '../../components/ejercicios/MathRenderer';
import './DiagnosticoPage.css';

export default function DiagnosticoTestPage() {
  const navigate = useNavigate();

  const [intento, setIntento] = useState(null);
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [respuestaTexto, setRespuestaTexto] = useState('');
  const [tiempoRestante, setTiempoRestante] = useState(null);
  const [tiempoAgotado, setTiempoAgotado] = useState(false);

  useEffect(() => {
    diagnosticoService
      .iniciar()
      .then((data) => {
        setIntento(data);

        const guardadas = {};
        data.preguntas.forEach((p) => {
          if (p.ya_respondida && p.respuesta_guardada) {
            guardadas[p.ejercicio_id] = p.respuesta_guardada;
          }
        });

        setRespuestas(guardadas);

        const primeraSinResponder = data.preguntas.findIndex((p) => !p.ya_respondida);
        if (primeraSinResponder !== -1) {
          setPreguntaActual(primeraSinResponder);
        }

        const totalMinutos =
          data.duracion_total_minutos ??
          data.preguntas.reduce(
            (acc, p) => acc + (p.tiempo_estimado_minutos ?? 5),
            0
          );

        setTiempoRestante(totalMinutos * 60);
      })
      .catch(() => setError('Error al cargar el test.'))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    if (cargando || tiempoRestante === null || tiempoRestante <= 0 || finalizando) {
      return;
    }

    const intervalo = setInterval(() => {
      setTiempoRestante((prev) => {
        if (prev <= 1) {
          clearInterval(intervalo);
          setTiempoAgotado(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalo);
  }, [cargando, tiempoRestante, finalizando]);

  useEffect(() => {
    if (!tiempoAgotado || !intento || finalizando) return;

    const finalizarPorTiempo = async () => {
      try {
        setFinalizando(true);
        const resultado = await diagnosticoService.finalizar(intento.intento_id);
        navigate('/diagnostico/resultados', { state: { resultado } });
      } catch {
        setError('Se agotó el tiempo y no se pudo finalizar automáticamente.');
        setFinalizando(false);
      }
    };

    finalizarPorTiempo();
  }, [tiempoAgotado, intento, finalizando, navigate]);

  const pregunta = intento?.preguntas[preguntaActual];
  const totalPreguntas = intento?.preguntas.length ?? 0;
  const respondidas = Object.keys(respuestas).length;

  const handleSeleccionarOpcion = async (opcionId) => {
    if (enviando) return;

    setEnviando(true);
    try {
      await diagnosticoService.responder(intento.intento_id, {
        ejercicio_id: pregunta.ejercicio_id,
        opcion_id: opcionId,
      });

      setRespuestas((prev) => ({
        ...prev,
        [pregunta.ejercicio_id]: { opcion_id: opcionId },
      }));
    } catch {
      setError('Error al guardar la respuesta.');
    } finally {
      setEnviando(false);
    }
  };

  const handleResponderTexto = async () => {
    if (!respuestaTexto.trim() || enviando) return;

    setEnviando(true);
    try {
      await diagnosticoService.responder(intento.intento_id, {
        ejercicio_id: pregunta.ejercicio_id,
        respuesta_texto: respuestaTexto.trim(),
      });

      setRespuestas((prev) => ({
        ...prev,
        [pregunta.ejercicio_id]: { respuesta_texto: respuestaTexto.trim() },
      }));

      setRespuestaTexto('');
    } catch {
      setError('Error al guardar la respuesta.');
    } finally {
      setEnviando(false);
    }
  };

  const handleFinalizar = async () => {
    if (respondidas < totalPreguntas) {
      setError(`Te faltan ${totalPreguntas - respondidas} pregunta(s) por responder.`);
      return;
    }

    setFinalizando(true);
    try {
      const resultado = await diagnosticoService.finalizar(intento.intento_id);
      navigate('/diagnostico/resultados', { state: { resultado } });
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al finalizar.');
      setFinalizando(false);
    }
  };

  const formatearTiempo = (segundos) => {
    if (segundos === null) return '--:--';

    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;

    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const respuestaActual = pregunta ? respuestas[pregunta.ejercicio_id] : null;
  const yaRespondida = !!respuestaActual;

  if (cargando) {
    return <div className="diag-loading">Cargando test...</div>;
  }

  if (error && !intento) {
    return <div className="diag-loading diag-error">{error}</div>;
  }

  if (!intento || !pregunta) {
    return null;
  }

  const porcentaje = Math.round((respondidas / totalPreguntas) * 100);

  return (
    <div className="diag-fullpage diag-test-bg">
      <div className="diag-test-header">
        <div className="diag-test-header-left">
          <span className="diag-logo-icon-sm">∑</span>
          <span className="diag-logo-text-sm">IngeniaMath</span>
        </div>

        <div className="diag-test-header-center">
          <span className="diag-test-modulo">{pregunta.modulo_nombre}</span>
        </div>

        <div className="diag-test-header-right">
          <span className="diag-test-contador">
            {respondidas}/{totalPreguntas} respondidas
          </span>
        </div>
      </div>

      <div className="diag-progreso-wrapper">
        <div className="diag-progreso-bar">
          <div
            className="diag-progreso-fill"
            style={{ width: `${porcentaje}%` }}
          />
        </div>
        <span className="diag-progreso-pct">{porcentaje}%</span>
      </div>

      <div className="diag-nav-preguntas">
        {intento.preguntas.map((p, i) => {
          const respondida = !!respuestas[p.ejercicio_id];
          const activa = i === preguntaActual;

          return (
            <button
              key={i}
              className={`diag-nav-dot ${activa ? 'activa' : ''} ${respondida ? 'respondida' : ''}`}
              onClick={() => setPreguntaActual(i)}
              title={`Pregunta ${i + 1}`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <div className="diag-pregunta-card">
        <div className="diag-pregunta-header">
          <span className="diag-pregunta-numero">
            Pregunta {preguntaActual + 1} de {totalPreguntas}
          </span>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span className="diag-pregunta-tiempo">
              ⏱ Restante: {formatearTiempo(tiempoRestante)}
            </span>
            
          </div>
        </div>

        <div className="diag-enunciado">
          <MathRenderer texto={pregunta.enunciado} />
        </div>

        {pregunta.imagen_apoyo_url && (
          <img
            src={pregunta.imagen_apoyo_url}
            alt="Imagen de apoyo"
            className="diag-imagen"
          />
        )}

        {pregunta.tipo_ejercicio === 'OPCION_MULTIPLE' && (
          <div className="diag-opciones">
            {pregunta.opciones.map((op, i) => {
              const seleccionada = respuestaActual?.opcion_id === op.id;

              return (
                <button
                  key={op.id}
                  className={`diag-opcion ${seleccionada ? 'seleccionada' : ''}`}
                  onClick={() => handleSeleccionarOpcion(op.id)}
                  disabled={enviando || finalizando}
                >
                  <span className="diag-opcion-letra">
                    {String.fromCharCode(65 + i)}
                  </span>

                  <span className="diag-opcion-texto">
                    <MathRenderer texto={op.texto_opcion} />
                  </span>

                  {seleccionada && <span className="diag-opcion-check">✓</span>}
                </button>
              );
            })}
          </div>
        )}

        {pregunta.tipo_ejercicio === 'VERDADERO_FALSO' && (
          <div className="diag-opciones diag-vf">
            {['Verdadero', 'Falso'].map((opcion) => {
              const seleccionada = respuestaActual?.respuesta_texto === opcion;

              return (
                <button
                  key={opcion}
                  className={`diag-opcion diag-opcion-vf ${seleccionada ? 'seleccionada' : ''}`}
                  onClick={async () => {
                    if (enviando || finalizando) return;

                    setEnviando(true);
                    try {
                      await diagnosticoService.responder(intento.intento_id, {
                        ejercicio_id: pregunta.ejercicio_id,
                        respuesta_texto: opcion,
                      });

                      setRespuestas((prev) => ({
                        ...prev,
                        [pregunta.ejercicio_id]: { respuesta_texto: opcion },
                      }));
                    } finally {
                      setEnviando(false);
                    }
                  }}
                  disabled={enviando || finalizando}
                >
                  <span className="diag-vf-icono">
                    {opcion === 'Verdadero' ? '✓' : '✗'}
                  </span>
                  {opcion}
                  {seleccionada && <span className="diag-opcion-check">●</span>}
                </button>
              );
            })}
          </div>
        )}

        {pregunta.tipo_ejercicio === 'RESPUESTA_NUMERICA' && (
          <div className="diag-respuesta-numerica">
            {yaRespondida ? (
              <div className="diag-respuesta-guardada">
                <span>Respuesta guardada:</span>
                <strong>{respuestaActual.respuesta_texto}</strong>
                <button
                  className="diag-btn-editar-respuesta"
                  onClick={() => {
                    setRespuestaTexto(respuestaActual.respuesta_texto);
                    setRespuestas((prev) => {
                      const nuevo = { ...prev };
                      delete nuevo[pregunta.ejercicio_id];
                      return nuevo;
                    });
                  }}
                  disabled={finalizando}
                >
                  Editar
                </button>
              </div>
            ) : (
              <div className="diag-input-grupo">
                <input
                  type="text"
                  className="diag-input-respuesta"
                  value={respuestaTexto}
                  onChange={(e) => setRespuestaTexto(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleResponderTexto()}
                  placeholder="Escribe tu respuesta numérica..."
                  disabled={enviando || finalizando}
                />
                <button
                  className="diag-btn-confirmar"
                  onClick={handleResponderTexto}
                  disabled={!respuestaTexto.trim() || enviando || finalizando}
                >
                  Confirmar
                </button>
              </div>
            )}
          </div>
        )}

        {error && <div className="diag-error-inline">{error}</div>}

        <div className="diag-nav-botones">
          <button
            className="diag-btn-nav"
            onClick={() => setPreguntaActual((p) => Math.max(0, p - 1))}
            disabled={preguntaActual === 0 || finalizando}
          >
            ← Anterior
          </button>

          {preguntaActual < totalPreguntas - 1 ? (
            <button
              className="diag-btn-nav diag-btn-siguiente"
              onClick={() => setPreguntaActual((p) => p + 1)}
              disabled={finalizando}
            >
              Siguiente →
            </button>
          ) : (
            <button
              className="diag-btn-finalizar"
              onClick={handleFinalizar}
              disabled={finalizando || respondidas < totalPreguntas}
            >
              {finalizando
                ? 'Calculando resultados...'
                : respondidas < totalPreguntas
                  ? `Faltan ${totalPreguntas - respondidas} preguntas`
                  : 'Finalizar diagnóstico'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}