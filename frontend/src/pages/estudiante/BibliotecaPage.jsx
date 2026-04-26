import { useState, useEffect, useCallback } from 'react';
import { recursoService } from '../../services/recursoService';
import { ejercicioService } from '../../services/ejercicioService';
import VisualizadorRecurso from '../../components/recursos/VisualizadorRecurso';

const COLOR = '#10b981';

const TIPOS = [
  { value: '',          label: '📚 Todos'      },
  { value: 'VIDEO',     label: '🎬 Videos'     },
  { value: 'PDF',       label: '📄 PDFs'       },
  { value: 'FLASHCARD', label: '🃏 Flashcards' },
  { value: 'SIMULADOR', label: '⚙️ Simuladores'},
  { value: 'ENLACE',    label: '🔗 Enlaces'    },
];

const ICONOS = {
  VIDEO: '🎬', PDF: '📄', FLASHCARD: '🃏', SIMULADOR: '⚙️', ENLACE: '🔗',
};

// ── Skeleton loader ───────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14, padding: '1.25rem', animationName: 'pulse',
      animationDuration: '1.5s', animationIterationCount: 'infinite',
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.06)', marginBottom: 12 }} />
      <div style={{ height: 14, borderRadius: 6, background: 'rgba(255,255,255,0.06)', marginBottom: 8, width: '75%' }} />
      <div style={{ height: 11, borderRadius: 6, background: 'rgba(255,255,255,0.04)', width: '50%' }} />
    </div>
  );
}

// ── Tarjeta de recurso en el grid ─────────────────────────────────────────────
function RecursoCard({ recurso, onClick, activo }) {
  return (
    <button
      onClick={() => onClick(recurso)}
      style={{
        width: '100%', textAlign: 'left',
        background: activo
          ? `${COLOR}14`
          : 'rgba(255,255,255,0.02)',
        border: activo
          ? `1.5px solid ${COLOR}55`
          : '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, padding: '1.25rem',
        cursor: 'pointer', transition: 'all 0.2s',
        fontFamily: 'DM Sans, sans-serif',
      }}
      onMouseEnter={e => {
        if (!activo) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
        }
      }}
      onMouseLeave={e => {
        if (!activo) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
        }
      }}
    >
      {/* Ícono tipo */}
      <div style={{
        width: 40, height: 40, borderRadius: 10, marginBottom: 12,
        background: activo ? `${COLOR}22` : 'rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20,
      }}>
        {ICONOS[recurso.tipo_recurso] ?? '📎'}
      </div>

      {/* Título */}
      <p style={{
        color: 'white', fontSize: 13, fontWeight: 600,
        margin: '0 0 6px', lineHeight: 1.4,
        display: '-webkit-box', WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {recurso.titulo}
      </p>

      {/* Módulo */}
      {recurso.modulo && (
        <p style={{
          fontSize: 11, color: 'rgba(255,255,255,0.3)',
          margin: '0 0 4px',
          display: '-webkit-box', WebkitLineClamp: 1,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {recurso.modulo.nombre}
        </p>
      )}

      {/* Subtema */}
      {recurso.subtema && (
        <p style={{
          fontSize: 10, color: 'rgba(255,255,255,0.2)', margin: 0,
        }}>
          {recurso.subtema.nombre}
        </p>
      )}
    </button>
  );
}

// ── Estado vacío ──────────────────────────────────────────────────────────────
function EstadoVacio({ filtroTipo, filtroModulo }) {
  const hayFiltros = filtroTipo || filtroModulo;
  return (
    <div style={{
      padding: '3rem 1rem', textAlign: 'center',
      color: 'rgba(255,255,255,0.25)',
    }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
      <p style={{ fontSize: 14, margin: '0 0 6px' }}>
        {hayFiltros
          ? 'No hay recursos con estos filtros.'
          : 'Aún no hay recursos publicados.'}
      </p>
      {hayFiltros && (
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)' }}>
          Intenta cambiar el tipo o el módulo.
        </p>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function BibliotecaPage() {
  const [recursos,       setRecursos]       = useState([]);
  const [meta,           setMeta]           = useState(null);
  const [modulos,        setModulos]        = useState([]);
  const [recursoActivo,  setRecursoActivo]  = useState(null);
  const [cargando,       setCargando]       = useState(true);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [error,          setError]          = useState('');

  const [filtros, setFiltros] = useState({
    tipo_recurso: '',
    modulo_id:    '',
    estado:       'PUBLICADO', // Estudiante solo ve publicados
    page:         1,
    per_page:     18,
  });

  // Cargar módulos una vez
  useEffect(() => {
    ejercicioService.listarModulos()
      .then(setModulos)
      .catch(() => {});
  }, []);

  // Cargar recursos cuando cambian filtros
  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      setError('');
      const res = await recursoService.listar(filtros);
      setRecursos(res.data ?? []);
      setMeta(res.meta ?? null);
    } catch {
      setError('No se pudieron cargar los recursos.');
    } finally {
      setCargando(false);
    }
  }, [filtros]);

  useEffect(() => { cargar(); }, [cargar]);

  // Al seleccionar una tarjeta, carga el detalle completo (con flashcard si aplica)
  const seleccionar = async (recurso) => {
    if (recursoActivo?.id === recurso.id) {
      setRecursoActivo(null); // toggle: cerrar si ya está abierto
      return;
    }
    try {
      setCargandoDetalle(true);
      setRecursoActivo(null);
      const detalle = await recursoService.verDetalle(recurso.id);
      setRecursoActivo(detalle);
    } catch {
      setError('No se pudo cargar el recurso.');
    } finally {
      setCargandoDetalle(false);
    }
  };

  const setFiltro = (k, v) =>
    setFiltros(f => ({ ...f, [k]: v, page: 1 }));

  return (
    <div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* ── Barra de filtros ────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: '1.5rem',
        flexWrap: 'wrap', alignItems: 'center',
      }}>

        {/* Chips de tipo */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {TIPOS.map(t => {
            const activo = filtros.tipo_recurso === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setFiltro('tipo_recurso', t.value)}
                style={{
                  padding: '7px 14px', borderRadius: 20, fontSize: 12,
                  fontWeight: activo ? 700 : 400,
                  cursor: 'pointer', transition: 'all 0.15s',
                  border: activo
                    ? `1.5px solid ${COLOR}`
                    : '1.5px solid rgba(255,255,255,0.1)',
                  background: activo ? `${COLOR}22` : 'rgba(255,255,255,0.03)',
                  color: activo ? COLOR : 'rgba(255,255,255,0.45)',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Selector de módulo */}
        <select
          value={filtros.modulo_id}
          onChange={e => setFiltro('modulo_id', e.target.value)}
          style={{
            padding: '7px 12px', borderRadius: 20, fontSize: 12,
            background: '#1a1a2e',
            border: filtros.modulo_id
              ? `1.5px solid ${COLOR}`
              : '1.5px solid rgba(255,255,255,0.1)',
            color: filtros.modulo_id ? COLOR : 'rgba(255,255,255,0.45)',
            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
            outline: 'none',
          }}
        >
          <option value="">Todos los módulos</option>
          {modulos.map(m => (
            <option key={m.id} value={m.id}>{m.nombre}</option>
          ))}
        </select>

        {/* Contador */}
        {meta && (
          <span style={{
            marginLeft: 'auto', fontSize: 12,
            color: 'rgba(255,255,255,0.25)',
          }}>
            {meta.total} recurso{meta.total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── Error ───────────────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, marginBottom: '1rem',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          color: '#f87171', fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {/* ── Layout: grid + visor ────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: recursoActivo ? '1fr 420px' : '1fr',
        gap: '1.5rem',
        alignItems: 'start',
        transition: 'grid-template-columns 0.3s ease',
      }}>

        {/* Grid de tarjetas */}
        <div>
          {cargando ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 12,
            }}>
              {Array.from({ length: 9 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : recursos.length === 0 ? (
            <EstadoVacio
              filtroTipo={filtros.tipo_recurso}
              filtroModulo={filtros.modulo_id}
            />
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 12,
            }}>
              {recursos.map(r => (
                <RecursoCard
                  key={r.id}
                  recurso={r}
                  activo={recursoActivo?.id === r.id}
                  onClick={seleccionar}
                />
              ))}
            </div>
          )}

          {/* Paginación */}
          {meta && meta.last_page > 1 && (
            <div style={{
              display: 'flex', justifyContent: 'center',
              gap: 6, marginTop: '1.5rem',
            }}>
              <button
                onClick={() => setFiltros(f => ({ ...f, page: Math.max(1, f.page - 1) }))}
                disabled={filtros.page === 1}
                style={{
                  padding: '7px 14px', borderRadius: 8, fontSize: 12,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: filtros.page === 1 ? 'rgba(255,255,255,0.2)' : 'white',
                  cursor: filtros.page === 1 ? 'not-allowed' : 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                ← Anterior
              </button>

              <span style={{
                padding: '7px 14px', fontSize: 12,
                color: 'rgba(255,255,255,0.4)',
                display: 'flex', alignItems: 'center',
              }}>
                {filtros.page} / {meta.last_page}
              </span>

              <button
                onClick={() => setFiltros(f => ({ ...f, page: Math.min(meta.last_page, f.page + 1) }))}
                disabled={filtros.page === meta.last_page}
                style={{
                  padding: '7px 14px', borderRadius: 8, fontSize: 12,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: filtros.page === meta.last_page ? 'rgba(255,255,255,0.2)' : 'white',
                  cursor: filtros.page === meta.last_page ? 'not-allowed' : 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>

        {/* ── Panel visor lateral ──────────────────────────────────────────── */}
        {(recursoActivo || cargandoDetalle) && (
          <div style={{
            position: 'sticky', top: 80,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, overflow: 'hidden',
          }}>
            {/* Header del panel */}
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
                  color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
                  fontSize: 18, lineHeight: 1, padding: 4,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'white'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
              >
                ✕
              </button>
            </div>

            {/* Contenido */}
            <div style={{ padding: '1.25rem' }}>
              {cargandoDetalle ? (
                <div style={{
                  padding: '2rem', textAlign: 'center',
                  color: 'rgba(255,255,255,0.3)', fontSize: 13,
                }}>
                  Cargando recurso...
                </div>
              ) : (
                <VisualizadorRecurso recurso={recursoActivo} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}