import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ejercicioService } from '../../services/ejercicioService';
import MathRenderer from '../../components/ejercicios/MathRenderer';
import BadgeEstado from '../../components/ejercicios/BadgeEstado';
import './DetalleEjercicioPage.css';

const NIVELES = {
  BASICO:      'Básico',
  INTERMEDIO:  'Intermedio',
  AVANZADO:    'Avanzado',
  EXAMEN_REAL: 'Nivel examen real',
};

const TIPOS = {
  OPCION_MULTIPLE:    'Opción múltiple',
  VERDADERO_FALSO:    'Verdadero / Falso',
  RESPUESTA_NUMERICA: 'Respuesta numérica',
  COMPLETAR_ESPACIOS: 'Completar espacios',
};

export default function DetalleEjercicioPage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [ejercicio, setEjercicio] = useState(null);
  const [cargando,  setCargando]  = useState(true);
  const [error,     setError]     = useState('');
  const [enviando,  setEnviando]  = useState(false);
  const [confirmEnviar, setConfirmEnviar] = useState(false);

  useEffect(() => {
    ejercicioService.verDetalle(id)
      .then(setEjercicio)
      .catch(() => setError('No se pudo cargar el ejercicio.'))
      .finally(() => setCargando(false));
  }, [id]);

  const handleEnviarRevision = async () => {
    setEnviando(true);
    try {
      const actualizado = await ejercicioService.enviarRevision(id);
      setEjercicio(actualizado);
      setConfirmEnviar(false);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al enviar a revisión.');
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) return (
    <div style={{ padding: '3rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans, sans-serif' }}>
      Cargando ejercicio...
    </div>
  );

  if (error) return (
    <div style={{ padding: '3rem', color: '#f87171', fontFamily: 'DM Sans, sans-serif' }}>
      {error}
    </div>
  );

  if (!ejercicio) return null;

  return (
    <div className="detalle-page">

      {/* Cabecera */}
      <div className="detalle-header">
        <button className="btn-volver" onClick={() => navigate(-1)}>
          ← Volver
        </button>
        <div className="detalle-header-info">
          <div className="detalle-badges">
            <BadgeEstado estado={ejercicio.estado} />
            <span className="badge-nivel">{NIVELES[ejercicio.nivel_dificultad]}</span>
            <span className="badge-tipo">{TIPOS[ejercicio.tipo_ejercicio]}</span>
            {ejercicio.advertencia_duplicado && (
              <span className="badge-duplicado">posible duplicado</span>
            )}
          </div>
          <div className="detalle-meta">
            <span>{ejercicio.modulo?.nombre}</span>
            <span className="meta-sep">›</span>
            <span>{ejercicio.subtema?.nombre}</span>
            <span className="meta-sep">·</span>
            <span>{ejercicio.tiempo_estimado_minutos} min</span>
            <span className="meta-sep">·</span>
            <span>ID #{ejercicio.id}</span>
          </div>
        </div>

        {/* Acciones según estado */}
        {ejercicio.estado === 'BORRADOR' && (
          <div className="detalle-acciones">
            <button
              className="btn-editar"
              onClick={() => navigate(`/tutor/ejercicios/crear?editar=${id}`)}
            >
              Editar
            </button>
            <button
              className="btn-enviar"
              onClick={() => setConfirmEnviar(true)}
            >
              Enviar a revisión
            </button>
          </div>
        )}
      </div>

      {/* Enunciado */}
      <div className="detalle-seccion">
        <h3 className="detalle-seccion-titulo">Enunciado</h3>
        <div className="detalle-enunciado">
          <MathRenderer texto={ejercicio.enunciado} />
        </div>
        {ejercicio.imagen_apoyo_url && (
          <img
            src={ejercicio.imagen_apoyo_url}
            alt="Imagen de apoyo"
            className="detalle-imagen"
          />
        )}
      </div>

      {/* Opciones para opción múltiple */}
      {ejercicio.opciones?.length > 0 && (
        <div className="detalle-seccion">
          <h3 className="detalle-seccion-titulo">Opciones de respuesta</h3>
          <div className="detalle-opciones">
            {ejercicio.opciones.map((op, i) => (
              <div
                key={i}
                className={`opcion-item ${op.es_correcta ? 'correcta' : ''}`}
              >
                <span className="opcion-letra">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="opcion-texto">
                  <MathRenderer texto={op.texto} />
                </span>
                {op.es_correcta && (
                  <span className="opcion-correcta-badge">Correcta</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Respuesta correcta para otros tipos */}
      {ejercicio.respuesta_correcta_texto && (
        <div className="detalle-seccion">
          <h3 className="detalle-seccion-titulo">Respuesta correcta</h3>
          <div className="detalle-respuesta">
            <MathRenderer texto={ejercicio.respuesta_correcta_texto} />
          </div>
        </div>
      )}

      {/* Solución paso a paso */}
      <div className="detalle-seccion">
        <h3 className="detalle-seccion-titulo">Solución paso a paso</h3>
        <div className="detalle-solucion">
          <MathRenderer texto={ejercicio.solucion_paso_a_paso} />
        </div>
      </div>

      {/* Explicación conceptual */}
      {ejercicio.explicacion_conceptual && (
        <div className="detalle-seccion">
          <h3 className="detalle-seccion-titulo">Explicación conceptual</h3>
          <div className="detalle-conceptual">
            <MathRenderer texto={ejercicio.explicacion_conceptual} />
          </div>
        </div>
      )}

      {/* Historial de revisiones */}
      {ejercicio.revisiones?.length > 0 && (
        <div className="detalle-seccion">
          <h3 className="detalle-seccion-titulo">Historial de revisiones</h3>
          <div className="detalle-revisiones">
            {ejercicio.revisiones.map((r, i) => (
              <div key={i} className="revision-item">
                <div className="revision-accion">
                  <BadgeEstado estado={r.accion === 'ENVIADO_REVISION' ? 'EN_REVISION' : r.accion} />
                  <span className="revision-quien">{r.revisor}</span>
                </div>
                {r.notas && (
                  <p className="revision-notas">{r.notas}</p>
                )}
                <span className="revision-fecha">
                  {new Date(r.fecha).toLocaleDateString('es-GT', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal confirmación enviar */}
      {confirmEnviar && (
        <div className="modal-overlay" onClick={() => setConfirmEnviar(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2>Enviar a revisión</h2>
            <p>
              Una vez enviado, no podrás editar este ejercicio hasta que el revisor
              lo apruebe o rechace. ¿Deseas continuar?
            </p>
            <div className="modal-actions">
              <button
                className="btn-cancelar-modal"
                onClick={() => setConfirmEnviar(false)}
              >
                Cancelar
              </button>
              <button
                className="btn-confirmar"
                onClick={handleEnviarRevision}
                disabled={enviando}
              >
                {enviando ? 'Enviando...' : 'Sí, enviar a revisión'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}