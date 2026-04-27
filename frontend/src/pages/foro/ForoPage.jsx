import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { foroService } from '../../services/foroService';
import { ejercicioService } from '../../services/ejercicioService';

const COLORES_ESTADO = {
  ABIERTO:  { bg: 'rgba(16,185,129,0.15)',  color: '#10b981', label: 'Abierto'  },
  RESUELTO: { bg: 'rgba(99,102,241,0.15)',  color: '#818cf8', label: 'Resuelto' },
  CERRADO:  { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8', label: 'Cerrado'  },
};

const COLORES_ROL = {
  TUTOR:      { bg: 'rgba(99,102,241,0.15)',  color: '#818cf8' },
  REVISOR:    { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' },
  ADMIN:      { bg: 'rgba(239,68,68,0.15)',   color: '#f87171' },
  ESTUDIANTE: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
};

const COLOR = '#6366f1';

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ nombre, foto, rol, size = 36 }) {
  const cfg   = COLORES_ROL[rol] ?? COLORES_ROL.ESTUDIANTE;
  const inits = (nombre ?? '?')
    .split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: cfg.bg, border: `1.5px solid ${cfg.color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, overflow: 'hidden',
    }}>
      {foto ? (
        <img src={foto} alt={nombre}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { e.target.style.display = 'none'; }}
        />
      ) : (
        <span style={{ fontSize: size * 0.35, fontWeight: 700, color: cfg.color }}>
          {inits}
        </span>
      )}
    </div>
  );
}

// ── Badge estado ──────────────────────────────────────────────────────────────
function BadgeEstado({ estado }) {
  const cfg = COLORES_ESTADO[estado] ?? COLORES_ESTADO.ABIERTO;
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 20, fontSize: 11,
      fontWeight: 700, background: cfg.bg, color: cfg.color,
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonHilo() {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14, padding: '1.25rem',
      animation: 'pulse 1.5s infinite',
    }}>
      <div style={{ height: 16, borderRadius: 6, background: 'rgba(255,255,255,0.06)', width: '65%', marginBottom: 10 }} />
      <div style={{ height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.04)', width: '40%', marginBottom: 8 }} />
      <div style={{ height: 11, borderRadius: 6, background: 'rgba(255,255,255,0.03)', width: '30%' }} />
    </div>
  );
}

// ── Card de hilo ──────────────────────────────────────────────────────────────
function HiloCard({ hilo, onClick }) {
  const tieneRespuestas = hilo.total_respuestas > 0;
  const resuelto        = hilo.estado === 'RESUELTO';

  return (
    <button
      onClick={() => onClick(hilo.id)}
      style={{
        width: '100%', textAlign: 'left',
        background: resuelto
          ? 'rgba(99,102,241,0.04)'
          : 'rgba(255,255,255,0.02)',
        border: resuelto
          ? '1px solid rgba(99,102,241,0.2)'
          : '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, padding: '1.25rem',
        cursor: 'pointer', transition: 'all 0.18s',
        fontFamily: 'DM Sans, sans-serif',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = resuelto
          ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.04)';
        e.currentTarget.style.borderColor = resuelto
          ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.15)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = resuelto
          ? 'rgba(99,102,241,0.04)' : 'rgba(255,255,255,0.02)';
        e.currentTarget.style.borderColor = resuelto
          ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.07)';
      }}
    >
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <Avatar
          nombre={hilo.autor.nombre}
          foto={hilo.autor.foto}
          rol="ESTUDIANTE"
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Título */}
          <p style={{
            color: 'white', fontSize: 14, fontWeight: 600,
            margin: '0 0 6px', lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {resuelto && <span style={{ color: '#818cf8', marginRight: 6 }}>✓</span>}
            {hilo.titulo}
          </p>

          {/* Módulo + subtema */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            <span style={{
              padding: '2px 8px', borderRadius: 20, fontSize: 11,
              background: `${COLOR}18`, color: COLOR, fontWeight: 600,
            }}>
              {hilo.modulo.nombre}
            </span>
            {hilo.subtema && (
              <span style={{
                padding: '2px 8px', borderRadius: 20, fontSize: 11,
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.4)',
              }}>
                {hilo.subtema.nombre}
              </span>
            )}
            <BadgeEstado estado={hilo.estado} />
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex', alignItems: 'center',
            gap: 12, flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
              {hilo.autor.nombre}
            </span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
              {new Date(hilo.fecha_creacion).toLocaleDateString('es-GT')}
            </span>
            <span style={{
              fontSize: 11,
              color: tieneRespuestas ? '#10b981' : 'rgba(255,255,255,0.25)',
              fontWeight: tieneRespuestas ? 600 : 400,
            }}>
              💬 {hilo.total_respuestas} respuesta{hilo.total_respuestas !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Modal nuevo hilo ──────────────────────────────────────────────────────────
function ModalNuevoHilo({ onCrear, onCerrar }) {
  const [form, setForm]         = useState({ modulo_id: '', subtema_id: '', titulo: '', contenido: '' });
  const [modulos,  setModulos]  = useState([]);
  const [subtemas, setSubtemas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    ejercicioService.listarModulos().then(setModulos).catch(() => {});
  }, []);

  useEffect(() => {
    setForm(f => ({ ...f, subtema_id: '' }));
    setSubtemas([]);
    if (!form.modulo_id) return;
    ejercicioService.listarSubtemas(form.modulo_id)
      .then(setSubtemas).catch(() => {});
  }, [form.modulo_id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError('');
    if (!form.modulo_id)           return setError('Selecciona un módulo.');
    if (form.titulo.trim().length < 10)
      return setError('El título debe tener al menos 10 caracteres.');
    if (form.contenido.trim().length < 20)
      return setError('Describe tu duda con al menos 20 caracteres.');

    setCargando(true);
    try {
      const hilo = await foroService.crearHilo({
        modulo_id:  parseInt(form.modulo_id),
        subtema_id: form.subtema_id ? parseInt(form.subtema_id) : null,
        titulo:     form.titulo.trim(),
        contenido:  form.contenido.trim(),
      });
      onCrear(hilo.id);
    } catch (e) {
      setError(e.response?.data?.message ?? 'Error al publicar la duda.');
    } finally {
      setCargando(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, color: 'white', fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
    fontFamily: 'DM Sans, sans-serif',
  };

  const selectStyle = {
    ...inputStyle,
    background: '#1a1a2e', cursor: 'pointer',
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onCerrar}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0f0f1a',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 18, padding: '2rem',
          width: '100%', maxWidth: 560,
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <h2 style={{
          fontSize: 18, fontWeight: 800, color: 'white',
          margin: '0 0 1.5rem', fontFamily: 'Syne, sans-serif',
        }}>
          📢 Publicar una duda
        </h2>

        {/* Módulo */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'block', fontSize: 11, fontWeight: 700,
            color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6,
          }}>
            Módulo *
          </label>
          <select
            value={form.modulo_id}
            onChange={e => set('modulo_id', e.target.value)}
            style={selectStyle}
          >
            <option value="">— Selecciona un módulo —</option>
            {modulos.map(m => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
        </div>

        {/* Subtema */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'block', fontSize: 11, fontWeight: 700,
            color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6,
          }}>
            Subtema (opcional)
          </label>
          <select
            value={form.subtema_id}
            onChange={e => set('subtema_id', e.target.value)}
            disabled={!form.modulo_id}
            style={{ ...selectStyle, opacity: form.modulo_id ? 1 : 0.5 }}
          >
            <option value="">— Sin subtema específico —</option>
            {subtemas.map(s => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        </div>

        {/* Título */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'block', fontSize: 11, fontWeight: 700,
            color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6,
          }}>
            Título de tu duda *
          </label>
          <input
            type="text"
            value={form.titulo}
            onChange={e => set('titulo', e.target.value)}
            placeholder="Ej: ¿Cómo se resuelve una integral por partes?"
            maxLength={200}
            style={inputStyle}
          />
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>
            {form.titulo.length}/200
          </p>
        </div>

        {/* Contenido */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{
            display: 'block', fontSize: 11, fontWeight: 700,
            color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6,
          }}>
            Descripción detallada *
          </label>
          <textarea
            value={form.contenido}
            onChange={e => set('contenido', e.target.value)}
            placeholder="Explica tu duda con detalle. Incluye lo que ya intentaste..."
            rows={5}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 120 }}
          />
        </div>

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

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCerrar}
            style={{
              padding: '10px 20px', borderRadius: 10, fontSize: 13,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={cargando}
            style={{
              padding: '10px 24px', borderRadius: 10, fontSize: 13,
              fontWeight: 700, background: cargando ? `${COLOR}66` : COLOR,
              border: 'none', color: 'white',
              cursor: cargando ? 'not-allowed' : 'pointer',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            {cargando ? 'Publicando...' : 'Publicar duda'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function ForoPage() {
  const navigate        = useNavigate();
  const { usuario }     = useAuth();
  const rol             = usuario?.rol?.codigo;
  const esEstudiante    = rol === 'ESTUDIANTE';

  const [hilos,        setHilos]        = useState([]);
  const [meta,         setMeta]         = useState(null);
  const [modulos,      setModulos]      = useState([]);
  const [cargando,     setCargando]     = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [error,        setError]        = useState('');

  const [filtros, setFiltros] = useState({
    modulo_id: '', estado: '', buscar: '', page: 1,
  });

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const res = await foroService.listar({ ...filtros, per_page: 20 });
      setHilos(res.data ?? []);
      setMeta(res.meta ?? null);
    } catch {
      setError('No se pudieron cargar los hilos.');
    } finally {
      setCargando(false);
    }
  }, [filtros]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    ejercicioService.listarModulos().then(setModulos).catch(() => {});
  }, []);

  const setFiltro = (k, v) =>
    setFiltros(f => ({ ...f, [k]: v, page: 1 }));

  const handleCrear = (hiloId) => {
    setModalAbierto(false);
    navigate(`/foro/${hiloId}`);
  };

  return (
    <div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>

      {/* ── Barra superior ──────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 10, marginBottom: '1.5rem',
        flexWrap: 'wrap', alignItems: 'center',
      }}>

        {/* Búsqueda */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <span style={{
            position: 'absolute', left: 12, top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(255,255,255,0.3)', fontSize: 14,
          }}>
            🔍
          </span>
          <input
            type="text"
            value={filtros.buscar}
            onChange={e => setFiltro('buscar', e.target.value)}
            placeholder="Buscar en el foro..."
            style={{
              width: '100%', padding: '9px 14px 9px 36px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 10, color: 'white', fontSize: 13,
              outline: 'none', boxSizing: 'border-box',
              fontFamily: 'DM Sans, sans-serif',
            }}
          />
        </div>

        {/* Filtro módulo */}
        <select
          value={filtros.modulo_id}
          onChange={e => setFiltro('modulo_id', e.target.value)}
          style={{
            padding: '9px 12px', borderRadius: 10, fontSize: 12,
            background: '#1a1a2e',
            border: filtros.modulo_id
              ? `1px solid ${COLOR}`
              : '1px solid rgba(255,255,255,0.09)',
            color: filtros.modulo_id ? COLOR : 'rgba(255,255,255,0.45)',
            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', outline: 'none',
          }}
        >
          <option value="">Todos los módulos</option>
          {modulos.map(m => (
            <option key={m.id} value={m.id}>{m.nombre}</option>
          ))}
        </select>

        {/* Filtro estado */}
        {['', 'ABIERTO', 'RESUELTO', 'CERRADO'].map(est => (
          <button
            key={est}
            onClick={() => setFiltro('estado', est)}
            style={{
              padding: '7px 14px', borderRadius: 20, fontSize: 12,
              fontWeight: filtros.estado === est ? 700 : 400,
              cursor: 'pointer', transition: 'all 0.15s',
              border: filtros.estado === est
                ? `1.5px solid ${COLOR}`
                : '1.5px solid rgba(255,255,255,0.09)',
              background: filtros.estado === est
                ? `${COLOR}22` : 'rgba(255,255,255,0.03)',
              color: filtros.estado === est ? COLOR : 'rgba(255,255,255,0.4)',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            {est === '' ? 'Todos' : COLORES_ESTADO[est]?.label}
          </button>
        ))}

        {/* Botón nueva duda — solo estudiantes */}
        {esEstudiante && (
          <button
            onClick={() => setModalAbierto(true)}
            style={{
              marginLeft: 'auto',
              padding: '9px 20px', borderRadius: 10, fontSize: 13,
              fontWeight: 700, background: COLOR, border: 'none',
              color: 'white', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            + Nueva duda
          </button>
        )}
      </div>

      {/* Contador */}
      {meta && (
        <p style={{
          fontSize: 12, color: 'rgba(255,255,255,0.25)',
          marginBottom: '1rem',
        }}>
          {meta.total} hilo{meta.total !== 1 ? 's' : ''}
        </p>
      )}

      {/* Error */}
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

      {/* Lista */}
      {cargando ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonHilo key={i} />)}
        </div>
      ) : hilos.length === 0 ? (
        <div style={{
          padding: '3rem', textAlign: 'center',
          color: 'rgba(255,255,255,0.25)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
          <p style={{ fontSize: 14, margin: '0 0 6px' }}>
            {filtros.buscar || filtros.modulo_id || filtros.estado
              ? 'No hay hilos con estos filtros.'
              : 'Aún no hay preguntas en el foro.'}
          </p>
          {esEstudiante && !filtros.buscar && (
            <button
              onClick={() => setModalAbierto(true)}
              style={{
                marginTop: 12, padding: '9px 20px',
                borderRadius: 10, fontSize: 13, fontWeight: 700,
                background: COLOR, border: 'none', color: 'white',
                cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
              }}
            >
              Sé el primero en preguntar
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {hilos.map(h => (
            <HiloCard
              key={h.id}
              hilo={h}
              onClick={id => navigate(`/foro/${id}`)}
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
              padding: '7px 16px', borderRadius: 8, fontSize: 12,
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
              padding: '7px 16px', borderRadius: 8, fontSize: 12,
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

      {/* Modal */}
      {modalAbierto && (
        <ModalNuevoHilo
          onCrear={handleCrear}
          onCerrar={() => setModalAbierto(false)}
        />
      )}
    </div>
  );
}