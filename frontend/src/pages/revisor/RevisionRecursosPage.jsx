import { useState, useEffect, useCallback } from 'react';
import { recursoService } from '../../services/recursoService';
import { ejercicioService } from '../../services/ejercicioService';
import VisualizadorRecurso from '../../components/recursos/VisualizadorRecurso';
import './RevisionPage.css'; // Reutiliza los mismos estilos

const ICONOS_TIPO = {
  VIDEO: '🎬', PDF: '📄', FLASHCARD: '🃏', SIMULADOR: '⚙️', ENLACE: '🔗',
};

const COLOR_REVISOR = '#f59e0b';

// ── Modal aprobar / rechazar ──────────────────────────────────────────────────
function ModalAccion({ recurso, accion, onConfirmar, onCerrar }) {
  const [notas,    setNotas]    = useState('');
  const [cargando, setCargando] = useState(false);
  const [error,    setError]    = useState('');

  const esRechazo  = accion === 'rechazar';
  const esPublicar = accion === 'publicar';

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

  const CONFIG = {
    rechazar: {
      titulo:      'Rechazar recurso',
      btnLabel:    'Rechazar recurso',
      btnClass:    'btn-rechazar-confirm',
      notasLabel:  'Motivo del rechazo *',
      placeholder: 'Explica al tutor qué debe corregir...',
      obligatorio: true,
    },
    aprobar: {
      titulo:      'Aprobar recurso',
      btnLabel:    'Aprobar recurso',
      btnClass:    'btn-aprobar-confirm',
      notasLabel:  'Notas adicionales (opcional)',
      placeholder: 'Comentarios opcionales para el tutor...',
      obligatorio: false,
    },
    publicar: {
      titulo:      'Publicar recurso',
      btnLabel:    'Publicar recurso',
      btnClass:    'btn-aprobar-confirm',
      notasLabel:  'Notas adicionales (opcional)',
      placeholder: 'Comentarios opcionales...',
      obligatorio: false,
    },
  };

  const cfg = CONFIG[accion];

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h2>{cfg.titulo}</h2>

        {/* Info del recurso */}
        <div className="modal-ejercicio-info">
          <p className="modal-enunciado" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>{ICONOS_TIPO[recurso.tipo_recurso]}</span>
            <strong style={{ color: 'white' }}>{recurso.titulo}</strong>
          </p>
          <p className="modal-meta">
            {recurso.modulo?.nombre}
            {recurso.subtema ? ` › ${recurso.subtema.nombre}` : ''}
            {' · '}Tutor: {recurso.tutor?.nombre ?? '—'}
          </p>
        </div>

        {/* Campo de notas */}
        <div className="modal-field">
          <label>{cfg.notasLabel}</label>
          <textarea
            value={notas}
            onChange={e => setNotas(e.target.value)}
            rows={esRechazo ? 4 : 3}
            placeholder={cfg.placeholder}
          />
        </div>

        {error && <div className="modal-error">{error}</div>}

        <div className="modal-actions">
          <button className="btn-cancelar-modal" onClick={onCerrar}>
            Cancelar
          </button>
          <button
            className={cfg.btnClass}
            onClick={handleConfirmar}
            disabled={cargando}
          >
            {cargando ? 'Procesando...' : cfg.btnLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Card de un recurso pendiente ──────────────────────────────────────────────
function RecursoRevisionCard({ recurso, onAccion, onVerDetalle, recursoActivo }) {
  const esteActivo = recursoActivo?.id === recurso.id;

  return (
    <div
      className="revision-card"
      style={{
        borderColor: esteActivo ? `${COLOR_REVISOR}55` : undefined,
        background: esteActivo ? 'rgba(245,158,11,0.04)' : undefined,
      }}
    >
      {/* Cabecera */}
      <div className="revision-card-header">
        <div className="revision-card-badges">
          {/* Badge tipo */}
          <span style={{
            padding: '3px 10px', borderRadius: 20, fontSize: 11,
            fontWeight: 700,
            background: 'rgba(245,158,11,0.15)', color: COLOR_REVISOR,
          }}>
            {ICONOS_TIPO[recurso.tipo_recurso]} {recurso.tipo_recurso}
          </span>

          {/* Badge estado */}
          <span style={{
            padding: '3px 10px', borderRadius: 20, fontSize: 11,
            fontWeight: 700,
            background: 'rgba(245,158,11,0.1)', color: '#fbbf24',
          }}>
            EN REVISIÓN
          </span>
        </div>
        <span className="revision-card-id">ID #{recurso.id}</span>
      </div>

      {/* Título */}
      <div className="revision-card-enunciado">
        <p style={{ color: 'white', fontSize: 15, fontWeight: 600, margin: 0 }}>
          {recurso.titulo}
        </p>
        {recurso.descripcion && (
          <p style={{
            color: 'rgba(255,255,255,0.4)', fontSize: 13,
            margin: '4px 0 0', lineHeight: 1.5,
          }}>
            {recurso.descripcion.length > 120
              ? recurso.descripcion.substring(0, 120) + '...'
              : recurso.descripcion}
          </p>
        )}
      </div>

      {/* Meta */}
      <div className="revision-card-meta">
        <span>{recurso.modulo?.nombre ?? '—'}</span>
        {recurso.subtema && (
          <>
            <span className="meta-sep">›</span>
            <span>{recurso.subtema.nombre}</span>
          </>
        )}
        <span className="meta-sep">·</span>
        <span>Tutor: {recurso.tutor?.nombre ?? '—'}</span>
      </div>

      {/* Acciones */}
      <div className="revision-card-acciones">
        <button
          className="btn-ver-completo"
          onClick={() => onVerDetalle(recurso)}
          style={{
            borderColor: esteActivo ? COLOR_REVISOR : undefined,
            color: esteActivo ? COLOR_REVISOR : undefined,
          }}
        >
          {esteActivo ? 'Cerrar vista' : 'Ver recurso'}
        </button>
        <button
          className="btn-rechazar"
          onClick={() => onAccion(recurso, 'rechazar')}
        >
          Rechazar
        </button>
        <button
          className="btn-aprobar"
          onClick={() => onAccion(recurso, 'aprobar')}
        >
          Aprobar
        </button>
      </div>
    </div>
  );
}

// ── Card de recursos aprobados (pendientes de publicar) ───────────────────────
function RecursoAprobadoCard({ recurso, onPublicar }) {
  return (
    <div className="revision-card" style={{
      borderColor: 'rgba(99,102,241,0.3)',
      background: 'rgba(99,102,241,0.03)',
    }}>
      <div className="revision-card-header">
        <div className="revision-card-badges">
          <span style={{
            padding: '3px 10px', borderRadius: 20, fontSize: 11,
            fontWeight: 700,
            background: 'rgba(99,102,241,0.15)', color: '#818cf8',
          }}>
            {ICONOS_TIPO[recurso.tipo_recurso]} {recurso.tipo_recurso}
          </span>
          <span style={{
            padding: '3px 10px', borderRadius: 20, fontSize: 11,
            fontWeight: 700,
            background: 'rgba(99,102,241,0.12)', color: '#818cf8',
          }}>
            APROBADO
          </span>
        </div>
        <span className="revision-card-id">ID #{recurso.id}</span>
      </div>

      <div className="revision-card-enunciado">
        <p style={{ color: 'white', fontSize: 15, fontWeight: 600, margin: 0 }}>
          {recurso.titulo}
        </p>
      </div>

      <div className="revision-card-meta">
        <span>{recurso.modulo?.nombre ?? '—'}</span>
        {recurso.subtema && (
          <>
            <span className="meta-sep">›</span>
            <span>{recurso.subtema.nombre}</span>
          </>
        )}
        <span className="meta-sep">·</span>
        <span>Tutor: {recurso.tutor?.nombre ?? '—'}</span>
      </div>

      <div className="revision-card-acciones">
        <button
          className="btn-aprobar"
          style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}
          onClick={() => onPublicar(recurso)}
        >
          🚀 Publicar
        </button>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function RevisionRecursosPage() {
  const [tab,           setTab]           = useState('revision');  // 'revision' | 'aprobados'
  const [recursos,      setRecursos]      = useState([]);
  const [modulos,       setModulos]       = useState([]);
  const [filtroModulo,  setFiltroModulo]  = useState('');
  const [cargando,      setCargando]      = useState(true);
  const [modal,         setModal]         = useState(null); // { recurso, accion }
  const [recursoActivo, setRecursoActivo] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const estadoBuscado = tab === 'revision' ? 'EN_REVISION' : 'APROBADO';

  const cargar = useCallback(async () => {
    setCargando(true);
    setRecursoActivo(null);
    try {
      const res = await recursoService.listar({
        estado:    estadoBuscado,
        modulo_id: filtroModulo,
        per_page:  50,
      });
      setRecursos(res.data ?? []);
    } catch {
      setRecursos([]);
    } finally {
      setCargando(false);
    }
  }, [estadoBuscado, filtroModulo]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    ejercicioService.listarModulos().then(setModulos).catch(() => {});
  }, []);

  // Ver detalle del recurso en panel lateral
  const handleVerDetalle = async (recurso) => {
    if (recursoActivo?.id === recurso.id) {
      setRecursoActivo(null);
      return;
    }
    try {
      setCargandoDetalle(true);
      setRecursoActivo(null);
      const detalle = await recursoService.verDetalle(recurso.id);
      setRecursoActivo(detalle);
    } catch {
      /* silencioso */
    } finally {
      setCargandoDetalle(false);
    }
  };

  // Confirmar acción del modal
  const handleConfirmar = async (notas) => {
    const { recurso, accion } = modal;

    if (accion === 'aprobar')   await recursoService.aprobar(recurso.id);
    if (accion === 'rechazar')  await recursoService.rechazar(recurso.id, notas);
    if (accion === 'publicar')  await recursoService.publicar(recurso.id);

    setModal(null);
    setRecursoActivo(null);
    cargar();
  };

  return (
    <div className="revision-page">

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 0,
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        marginBottom: '1.5rem',
      }}>
        {[
          { key: 'revision',  label: 'En revisión'  },
          { key: 'aprobados', label: 'Aprobados'    },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '11px 20px', background: 'none', border: 'none',
              borderBottom: tab === t.key
                ? `2px solid ${COLOR_REVISOR}`
                : '2px solid transparent',
              color: tab === t.key ? COLOR_REVISOR : 'rgba(255,255,255,0.4)',
              fontSize: 13, fontWeight: tab === t.key ? 700 : 400,
              cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
            {/* Contador en el tab */}
            {!cargando && (
              <span style={{
                marginLeft: 8, padding: '2px 8px', borderRadius: 20,
                fontSize: 11, fontWeight: 700,
                background: tab === t.key
                  ? `${COLOR_REVISOR}22`
                  : 'rgba(255,255,255,0.06)',
                color: tab === t.key ? COLOR_REVISOR : 'rgba(255,255,255,0.3)',
              }}>
                {recursos.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Stats + Filtro ────────────────────────────────────────────────── */}
      <div className="revision-stats" style={{ marginBottom: '1rem' }}>
        <div className="stat-card">
          <span className="stat-num">{recursos.length}</span>
          <span className="stat-label">
            {tab === 'revision'
              ? 'Recursos pendientes de revisión'
              : 'Recursos aprobados pendientes de publicar'}
          </span>
        </div>
      </div>

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

      {/* ── Layout: lista + panel lateral ─────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: recursoActivo || cargandoDetalle ? '1fr 400px' : '1fr',
        gap: '1.5rem', alignItems: 'start',
        transition: 'grid-template-columns 0.3s ease',
      }}>

        {/* Lista */}
        <div>
          {cargando ? (
            <div className="revision-cargando">Cargando recursos...</div>
          ) : recursos.length === 0 ? (
            <div className="revision-vacia">
              <div className="revision-vacia-icono">✓</div>
              <p>
                {tab === 'revision'
                  ? 'No hay recursos pendientes de revisión.'
                  : 'No hay recursos aprobados pendientes de publicar.'}
              </p>
            </div>
          ) : (
            <div className="revision-lista">
              {tab === 'revision'
                ? recursos.map(r => (
                    <RecursoRevisionCard
                      key={r.id}
                      recurso={r}
                      recursoActivo={recursoActivo}
                      onAccion={(recurso, accion) => setModal({ recurso, accion })}
                      onVerDetalle={handleVerDetalle}
                    />
                  ))
                : recursos.map(r => (
                    <RecursoAprobadoCard
                      key={r.id}
                      recurso={r}
                      onPublicar={recurso => setModal({ recurso, accion: 'publicar' })}
                    />
                  ))
              }
            </div>
          )}
        </div>

        {/* Panel lateral con el visualizador */}
        {(recursoActivo || cargandoDetalle) && (
          <div style={{
            position: 'sticky', top: 80,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <span style={{
                fontSize: 12, fontWeight: 700,
                color: 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase', letterSpacing: 1,
              }}>
                Vista previa
              </span>
              <button
                onClick={() => setRecursoActivo(null)}
                style={{
                  background: 'none', border: 'none',
                  color: 'rgba(255,255,255,0.3)',
                  cursor: 'pointer', fontSize: 18, padding: 4,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'white'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1.25rem' }}>
              {cargandoDetalle ? (
                <div style={{
                  padding: '2rem', textAlign: 'center',
                  color: 'rgba(255,255,255,0.3)', fontSize: 13,
                }}>
                  Cargando recurso...
                </div>
              ) : (
                <>
                  <VisualizadorRecurso recurso={recursoActivo} />

                  {/* Botones de acción dentro del panel */}
                  {tab === 'revision' && recursoActivo && (
                    <div style={{
                      display: 'flex', gap: 8, marginTop: '1.25rem',
                      paddingTop: '1.25rem',
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <button
                        onClick={() => setModal({ recurso: recursoActivo, accion: 'rechazar' })}
                        className="btn-rechazar"
                        style={{ flex: 1 }}
                      >
                        Rechazar
                      </button>
                      <button
                        onClick={() => setModal({ recurso: recursoActivo, accion: 'aprobar' })}
                        className="btn-aprobar"
                        style={{ flex: 1 }}
                      >
                        Aprobar
                      </button>
                    </div>
                  )}

                  {tab === 'aprobados' && recursoActivo && (
                    <div style={{
                      marginTop: '1.25rem',
                      paddingTop: '1.25rem',
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <button
                        onClick={() => setModal({ recurso: recursoActivo, accion: 'publicar' })}
                        className="btn-aprobar"
                        style={{ width: '100%' }}
                      >
                        🚀 Publicar recurso
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <ModalAccion
          recurso={modal.recurso}
          accion={modal.accion}
          onConfirmar={handleConfirmar}
          onCerrar={() => setModal(null)}
        />
      )}
    </div>
  );
}