import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ejercicioService } from '../../services/ejercicioService';
import MathRenderer from '../../components/ejercicios/MathRenderer';
import BadgeEstado from '../../components/ejercicios/BadgeEstado';
import './RevisionPage.css';

const NIVELES = {
  BASICO:      'Básico',
  INTERMEDIO:  'Intermedio',
  AVANZADO:    'Avanzado',
  EXAMEN_REAL: 'Nivel examen real',
};

// Modal de acción: aprobar o rechazar
function ModalAccion({ ejercicio, accion, onConfirmar, onCerrar }) {
  const [notas, setNotas]       = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError]       = useState('');

  const esRechazo = accion === 'rechazar';

  const handleConfirmar = async () => {
    if (esRechazo && notas.trim().length < 5) {
      setError('Debes explicar el motivo del rechazo (mínimo 5 caracteres).');
      return;
    }
    setCargando(true);
    try {
      await onConfirmar(notas);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al procesar la acción.');
      setCargando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h2>{esRechazo ? 'Rechazar ejercicio' : 'Aprobar ejercicio'}</h2>

        <div className="modal-ejercicio-info">
          <p className="modal-enunciado">
            <MathRenderer texto={ejercicio.enunciado.substring(0, 100) + '...'} />
          </p>
          <p className="modal-meta">
            {ejercicio.modulo?.nombre} › {ejercicio.subtema?.nombre} · {NIVELES[ejercicio.nivel_dificultad]}
          </p>
        </div>

        {esRechazo ? (
          <div className="modal-field">
            <label>Motivo del rechazo *</label>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              rows={4}
              placeholder="Explica al tutor qué debe corregir en el ejercicio..."
            />
          </div>
        ) : (
          <div className="modal-field">
            <label>Notas adicionales (opcional)</label>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              rows={3}
              placeholder="Comentarios opcionales para el tutor..."
            />
          </div>
        )}

        {error && <div className="modal-error">{error}</div>}

        <div className="modal-actions">
          <button className="btn-cancelar-modal" onClick={onCerrar}>
            Cancelar
          </button>
          <button
            className={esRechazo ? 'btn-rechazar-confirm' : 'btn-aprobar-confirm'}
            onClick={handleConfirmar}
            disabled={cargando}
          >
            {cargando
              ? 'Procesando...'
              : esRechazo ? 'Rechazar ejercicio' : 'Aprobar ejercicio'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RevisionPage() {
  const navigate = useNavigate();

  const [ejercicios, setEjercicios] = useState([]);
  const [modulos,    setModulos]    = useState([]);
  const [cargando,   setCargando]   = useState(true);
  const [filtroModulo, setFiltroModulo] = useState('');
  const [modal, setModal] = useState(null); // { ejercicio, accion }

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const data = await ejercicioService.listar({
        estado:    'EN_REVISION',
        modulo_id: filtroModulo,
      });
      setEjercicios(data.data ?? []);
    } catch {
      setEjercicios([]);
    } finally {
      setCargando(false);
    }
  }, [filtroModulo]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    ejercicioService.listarModulos().then(setModulos).catch(() => {});
  }, []);

  const handleAccion = async (notas) => {
    const { ejercicio, accion } = modal;
    if (accion === 'aprobar') {
      await ejercicioService.aprobar(ejercicio.id, notas);
    } else {
      await ejercicioService.rechazar(ejercicio.id, notas);
    }
    setModal(null);
    cargar();
  };

  return (
    <div className="revision-page">

      {/* Contador */}
      <div className="revision-stats">
        <div className="stat-card">
          <span className="stat-num">{ejercicios.length}</span>
          <span className="stat-label">Pendientes de revisión</span>
        </div>
      </div>

      {/* Filtro */}
      <div className="revision-toolbar">
        <select
          className="toolbar-select"
          value={filtroModulo}
          onChange={e => setFiltroModulo(e.target.value)}
        >
          <option value="">Todos los módulos</option>
          {modulos.map(m => (
            <option key={m.id} value={m.id}>{m.nombre}</option>
          ))}
        </select>
      </div>

      {/* Lista de ejercicios para revisar */}
      {cargando ? (
        <div className="revision-cargando">Cargando ejercicios...</div>
      ) : ejercicios.length === 0 ? (
        <div className="revision-vacia">
          <div className="revision-vacia-icono">✓</div>
          <p>No hay ejercicios pendientes de revisión.</p>
        </div>
      ) : (
        <div className="revision-lista">
          {ejercicios.map(e => (
            <div key={e.id} className="revision-card">
              {/* Cabecera de la card */}
              <div className="revision-card-header">
                <div className="revision-card-badges">
                  <BadgeEstado estado={e.estado} />
                  <span className="badge-nivel-small">{NIVELES[e.nivel_dificultad]}</span>
                  {e.advertencia_duplicado && (
                    <span className="badge-duplicado">posible duplicado</span>
                  )}
                </div>
                <span className="revision-card-id">ID #{e.id}</span>
              </div>

              {/* Enunciado */}
              <div className="revision-card-enunciado">
                <MathRenderer texto={e.enunciado.substring(0, 150) + (e.enunciado.length > 150 ? '...' : '')} />
              </div>

              {/* Meta */}
              <div className="revision-card-meta">
                <span>{e.modulo?.nombre}</span>
                <span className="meta-sep">›</span>
                <span>{e.subtema?.nombre}</span>
                <span className="meta-sep">·</span>
                <span>{e.tiempo_estimado_minutos} min</span>
                <span className="meta-sep">·</span>
                <span>Tutor: {e.tutor?.nombres} {e.tutor?.apellidos}</span>
              </div>

              {/* Acciones */}
              <div className="revision-card-acciones">
                <button
                  className="btn-ver-completo"
                  onClick={() => navigate(`/tutor/ejercicios/${e.id}`)}
                >
                  Ver completo
                </button>
                <button
                  className="btn-rechazar"
                  onClick={() => setModal({ ejercicio: e, accion: 'rechazar' })}
                >
                  Rechazar
                </button>
                <button
                  className="btn-aprobar"
                  onClick={() => setModal({ ejercicio: e, accion: 'aprobar' })}
                >
                  Aprobar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal aprobar/rechazar */}
      {modal && (
        <ModalAccion
          ejercicio={modal.ejercicio}
          accion={modal.accion}
          onConfirmar={handleAccion}
          onCerrar={() => setModal(null)}
        />
      )}
    </div>
  );
}