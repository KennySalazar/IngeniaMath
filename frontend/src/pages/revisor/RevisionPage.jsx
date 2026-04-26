import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ejercicioService } from '../../services/ejercicioService';
import { recursoService } from '../../services/recursoService';
import MathRenderer from '../../components/ejercicios/MathRenderer';
import BadgeEstado from '../../components/ejercicios/BadgeEstado';
import VisualizadorRecurso from '../../components/recursos/VisualizadorRecurso';
import './RevisionPage.css';

const NIVELES = {
  BASICO:      'Básico',
  INTERMEDIO:  'Intermedio',
  AVANZADO:    'Avanzado',
  EXAMEN_REAL: 'Nivel examen real',
};

const ICONOS_TIPO = {
  VIDEO: '🎬', PDF: '📄', FLASHCARD: '🃏', SIMULADOR: '⚙️', ENLACE: '🔗',
};

const COLOR_REVISOR = '#f59e0b';

// ── Modal ejercicios (sin cambios) ────────────────────────────────────────────
function ModalEjercicio({ ejercicio, accion, onConfirmar, onCerrar }) {
  const [notas,    setNotas]    = useState('');
  const [cargando, setCargando] = useState(false);
  const [error,    setError]    = useState('');

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

        <div className="modal-field">
          <label>{esRechazo ? 'Motivo del rechazo *' : 'Notas adicionales (opcional)'}</label>
          <textarea
            value={notas}
            onChange={e => setNotas(e.target.value)}
            rows={esRechazo ? 4 : 3}
            placeholder={
              esRechazo
                ? 'Explica al tutor qué debe corregir en el ejercicio...'
                : 'Comentarios opcionales para el tutor...'
            }
          />
        </div>

        {error && <div className="modal-error">{error}</div>}

        <div className="modal-actions">
          <button className="btn-cancelar-modal" onClick={onCerrar}>Cancelar</button>
          <button
            className={esRechazo ? 'btn-rechazar-confirm' : 'btn-aprobar-confirm'}
            onClick={handleConfirmar}
            disabled={cargando}
          >
            {cargando ? 'Procesando...' : esRechazo ? 'Rechazar ejercicio' : 'Aprobar ejercicio'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal recursos ────────────────────────────────────────────────────────────
function ModalRecurso({ recurso, accion, onConfirmar, onCerrar }) {
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

  const titulo = esRechazo ? 'Rechazar recurso'
    : esPublicar ? 'Publicar recurso'
    : 'Aprobar recurso';

  const btnClass = esRechazo ? 'btn-rechazar-confirm' : 'btn-aprobar-confirm';
  const btnLabel = cargando ? 'Procesando...'
    : esRechazo ? 'Rechazar recurso'
    : esPublicar ? 'Publicar recurso'
    : 'Aprobar recurso';

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h2>{titulo}</h2>

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

        <div className="modal-field">
          <label>
            {esRechazo ? 'Motivo del rechazo *' : 'Notas adicionales (opcional)'}
          </label>
          <textarea
            value={notas}
            onChange={e => setNotas(e.target.value)}
            rows={esRechazo ? 4 : 3}
            placeholder={
              esRechazo
                ? 'Explica al tutor qué debe corregir...'
                : 'Comentarios opcionales...'
            }
          />
        </div>

        {error && <div className="modal-error">{error}</div>}

        <div className="modal-actions">
          <button className="btn-cancelar-modal" onClick={onCerrar}>Cancelar</button>
          <button className={btnClass} onClick={handleConfirmar} disabled={cargando}>
            {btnLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sección Ejercicios (extraída del original) ────────────────────────────────
function SeccionEjercicios() {
  const navigate = useNavigate();

  const [ejercicios,   setEjercicios]   = useState([]);
  const [modulos,      setModulos]      = useState([]);
  const [cargando,     setCargando]     = useState(true);
  const [filtroModulo, setFiltroModulo] = useState('');
  const [modal,        setModal]        = useState(null);

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
    if (accion === 'aprobar') await ejercicioService.aprobar(ejercicio.id, notas);
    else                      await ejercicioService.rechazar(ejercicio.id, notas);
    setModal(null);
    cargar();
  };

  return (
    <>
      <div className="revision-stats">
        <div className="stat-card">
          <span className="stat-num">{ejercicios.length}</span>
          <span className="stat-label">Ejercicios pendientes de revisión</span>
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

              <div className="revision-card-enunciado">
                <MathRenderer texto={e.enunciado.substring(0, 150) + (e.enunciado.length > 150 ? '...' : '')} />
              </div>

              <div className="revision-card-meta">
                <span>{e.modulo?.nombre}</span>
                <span className="meta-sep">›</span>
                <span>{e.subtema?.nombre}</span>
                <span className="meta-sep">·</span>
                <span>{e.tiempo_estimado_minutos} min</span>
                <span className="meta-sep">·</span>
                <span>Tutor: {e.tutor?.nombres} {e.tutor?.apellidos}</span>
              </div>

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

      {modal && (
        <ModalEjercicio
          ejercicio={modal.ejercicio}
          accion={modal.accion}
          onConfirmar={handleAccion}
          onCerrar={() => setModal(null)}
        />
      )}
    </>
  );
}

// ── Sección Recursos ──────────────────────────────────────────────────────────
function SeccionRecursos() {
  const [subTab,          setSubTab]          = useState('en_revision');
  const [recursos,        setRecursos]        = useState([]);
  const [modulos,         setModulos]         = useState([]);
  const [cargando,        setCargando]        = useState(true);
  const [filtroModulo,    setFiltroModulo]    = useState('');
  const [modal,           setModal]           = useState(null);
  const [recursoActivo,   setRecursoActivo]   = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const estadoBuscado = subTab === 'en_revision' ? 'EN_REVISION' : 'APROBADO';

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
    } catch { /* silencioso */ }
    finally { setCargandoDetalle(false); }
  };

  const handleConfirmar = async (notas) => {
    const { recurso, accion } = modal;
    if (accion === 'aprobar')  await recursoService.aprobar(recurso.id);
    if (accion === 'rechazar') await recursoService.rechazar(recurso.id, notas);
    if (accion === 'publicar') await recursoService.publicar(recurso.id);
    setModal(null);
    setRecursoActivo(null);
    cargar();
  };

  return (
    <>
      {/* Sub-tabs: En revisión / Aprobados */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: '1.25rem',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        {[
          { key: 'en_revision', label: 'En revisión' },
          { key: 'aprobados',   label: 'Aprobados — pendientes de publicar' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
            style={{
              padding: '10px 18px', background: 'none', border: 'none',
              borderBottom: subTab === t.key
                ? `2px solid ${COLOR_REVISOR}`
                : '2px solid transparent',
              color: subTab === t.key ? COLOR_REVISOR : 'rgba(255,255,255,0.4)',
              fontSize: 12, fontWeight: subTab === t.key ? 700 : 400,
              cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
              transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}
          >
            {t.label}
            {!cargando && (
              <span style={{
                marginLeft: 7, padding: '2px 7px', borderRadius: 20,
                fontSize: 10, fontWeight: 700,
                background: subTab === t.key
                  ? `${COLOR_REVISOR}22` : 'rgba(255,255,255,0.06)',
                color: subTab === t.key ? COLOR_REVISOR : 'rgba(255,255,255,0.3)',
              }}>
                {recursos.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Stats + filtro */}
      <div className="revision-stats">
        <div className="stat-card">
          <span className="stat-num">{recursos.length}</span>
          <span className="stat-label">
            {subTab === 'en_revision'
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

      {/* Layout lista + panel lateral */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: recursoActivo || cargandoDetalle ? '1fr 380px' : '1fr',
        gap: '1.25rem', alignItems: 'start',
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
                {subTab === 'en_revision'
                  ? 'No hay recursos pendientes de revisión.'
                  : 'No hay recursos aprobados pendientes de publicar.'}
              </p>
            </div>
          ) : (
            <div className="revision-lista">
              {recursos.map(r => {
                const esteActivo = recursoActivo?.id === r.id;
                return (
                  <div
                    key={r.id}
                    className="revision-card"
                    style={{
                      borderColor: esteActivo ? `${COLOR_REVISOR}55` : undefined,
                      background:  esteActivo ? 'rgba(245,158,11,0.04)' : undefined,
                    }}
                  >
                    {/* Header */}
                    <div className="revision-card-header">
                      <div className="revision-card-badges">
                        <span style={{
                          padding: '3px 10px', borderRadius: 20, fontSize: 11,
                          fontWeight: 700,
                          background: 'rgba(245,158,11,0.15)', color: COLOR_REVISOR,
                        }}>
                          {ICONOS_TIPO[r.tipo_recurso]} {r.tipo_recurso}
                        </span>
                        <span style={{
                          padding: '3px 10px', borderRadius: 20, fontSize: 11,
                          fontWeight: 700,
                          background: subTab === 'en_revision'
                            ? 'rgba(245,158,11,0.1)'
                            : 'rgba(99,102,241,0.12)',
                          color: subTab === 'en_revision' ? '#fbbf24' : '#818cf8',
                        }}>
                          {subTab === 'en_revision' ? 'EN REVISIÓN' : 'APROBADO'}
                        </span>
                      </div>
                      <span className="revision-card-id">ID #{r.id}</span>
                    </div>

                    {/* Título */}
                    <div className="revision-card-enunciado">
                      <p style={{ color: 'white', fontSize: 14, fontWeight: 600, margin: 0 }}>
                        {r.titulo}
                      </p>
                      {r.descripcion && (
                        <p style={{
                          color: 'rgba(255,255,255,0.35)', fontSize: 12,
                          margin: '4px 0 0', lineHeight: 1.5,
                        }}>
                          {r.descripcion.length > 100
                            ? r.descripcion.substring(0, 100) + '...'
                            : r.descripcion}
                        </p>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="revision-card-meta">
                      <span>{r.modulo?.nombre ?? '—'}</span>
                      {r.subtema && (
                        <>
                          <span className="meta-sep">›</span>
                          <span>{r.subtema.nombre}</span>
                        </>
                      )}
                      <span className="meta-sep">·</span>
                      <span>Tutor: {r.tutor?.nombre ?? '—'}</span>
                    </div>

                    {/* Acciones */}
                    <div className="revision-card-acciones">
                      <button
                        className="btn-ver-completo"
                        onClick={() => handleVerDetalle(r)}
                        style={{
                          borderColor: esteActivo ? COLOR_REVISOR : undefined,
                          color:       esteActivo ? COLOR_REVISOR : undefined,
                        }}
                      >
                        {esteActivo ? 'Cerrar vista' : 'Ver recurso'}
                      </button>

                      {subTab === 'en_revision' && (
                        <>
                          <button
                            className="btn-rechazar"
                            onClick={() => setModal({ recurso: r, accion: 'rechazar' })}
                          >
                            Rechazar
                          </button>
                          <button
                            className="btn-aprobar"
                            onClick={() => setModal({ recurso: r, accion: 'aprobar' })}
                          >
                            Aprobar
                          </button>
                        </>
                      )}

                      {subTab === 'aprobados' && (
                        <button
                          className="btn-aprobar"
                          style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}
                          onClick={() => setModal({ recurso: r, accion: 'publicar' })}
                        >
                          🚀 Publicar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel lateral visor */}
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
              padding: '12px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: 'rgba(255,255,255,0.35)',
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

                  {/* Botones de acción en el panel */}
                  {subTab === 'en_revision' && (
                    <div style={{
                      display: 'flex', gap: 8, marginTop: '1rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <button
                        className="btn-rechazar"
                        style={{ flex: 1 }}
                        onClick={() => setModal({ recurso: recursoActivo, accion: 'rechazar' })}
                      >
                        Rechazar
                      </button>
                      <button
                        className="btn-aprobar"
                        style={{ flex: 1 }}
                        onClick={() => setModal({ recurso: recursoActivo, accion: 'aprobar' })}
                      >
                        Aprobar
                      </button>
                    </div>
                  )}

                  {subTab === 'aprobados' && (
                    <div style={{
                      marginTop: '1rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <button
                        className="btn-aprobar"
                        style={{ width: '100%', background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}
                        onClick={() => setModal({ recurso: recursoActivo, accion: 'publicar' })}
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
        <ModalRecurso
          recurso={modal.recurso}
          accion={modal.accion}
          onConfirmar={handleConfirmar}
          onCerrar={() => setModal(null)}
        />
      )}
    </>
  );
}

// ── Página principal con tabs ─────────────────────────────────────────────────
export default function RevisionPage() {
  const [tab, setTab] = useState('ejercicios'); // 'ejercicios' | 'recursos'

  return (
    <div className="revision-page">

      {/* Tabs principales */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: '1.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        {[
          { key: 'ejercicios', label: '📝 Ejercicios' },
          { key: 'recursos',   label: '📚 Recursos'   },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '12px 22px', background: 'none', border: 'none',
              borderBottom: tab === t.key
                ? '2px solid #f59e0b'
                : '2px solid transparent',
              color: tab === t.key ? '#f59e0b' : 'rgba(255,255,255,0.4)',
              fontSize: 14, fontWeight: tab === t.key ? 700 : 400,
              cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido según tab activo */}
      {tab === 'ejercicios' ? <SeccionEjercicios /> : <SeccionRecursos />}
    </div>
  );
}