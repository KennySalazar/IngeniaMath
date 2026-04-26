import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { recursoService } from '../../services/recursoService';

const COLOR = '#6366f1';

const BADGE_ESTADOS = {
  BORRADOR:      { label: 'Borrador',      bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' },
  EN_REVISION:   { label: 'En revisión',   bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' },
  APROBADO:      { label: 'Aprobado',      bg: 'rgba(99,102,241,0.15)',  color: '#818cf8' },
  PUBLICADO:     { label: 'Publicado',     bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
  DESHABILITADO: { label: 'Deshabilitado', bg: 'rgba(239,68,68,0.15)',  color: '#f87171' },
};

const ICONOS_TIPO = {
  VIDEO: '🎬', PDF: '📄', FLASHCARD: '🃏', SIMULADOR: '⚙️', ENLACE: '🔗',
};

function BadgeEstado({ estado }) {
  const cfg = BADGE_ESTADOS[estado] || BADGE_ESTADOS.BORRADOR;
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

function BtnAccion({ label, onClick, variante = 'ghost' }) {
  const estilos = {
    primario: {
      background: COLOR, border: 'none', color: 'white',
    },
    peligro: {
      background: 'rgba(239,68,68,0.12)',
      border: '1px solid rgba(239,68,68,0.3)', color: '#f87171',
    },
    ghost: {
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)',
    },
  };

  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 12px', borderRadius: 8, fontSize: 12,
        fontWeight: 600, cursor: 'pointer',
        fontFamily: 'DM Sans, sans-serif', transition: 'opacity 0.15s',
        ...estilos[variante],
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      {label}
    </button>
  );
}

export default function RecursosPage() {
  const navigate = useNavigate();

  const [recursos,  setRecursos]  = useState([]);
  const [meta,      setMeta]      = useState(null);
  const [cargando,  setCargando]  = useState(true);
  const [error,     setError]     = useState('');
  const [accionId,  setAccionId]  = useState(null); // ID del recurso en acción

  const [filtros, setFiltros] = useState({
    tipo_recurso: '', estado: '', page: 1,
  });

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

  const ejecutarAccion = async (id, accion) => {
    setAccionId(id);
    try {
      await accion();
      await cargar();
    } catch (e) {
      alert(e.response?.data?.message || 'Error al realizar la acción.');
    } finally {
      setAccionId(null);
    }
  };

  const setFiltro = (k, v) => setFiltros(f => ({ ...f, [k]: v, page: 1 }));

  return (
    <div>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: '1.5rem',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>

          {/* Filtro tipo */}
          <select
            value={filtros.tipo_recurso}
            onChange={e => setFiltro('tipo_recurso', e.target.value)}
            style={{
              padding: '8px 12px', borderRadius: 9, fontSize: 13,
              background: '#1a1a2e',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'white', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            <option value="">Todos los tipos</option>
            <option value="VIDEO">🎬 Video</option>
            <option value="PDF">📄 PDF</option>
            <option value="FLASHCARD">🃏 Flashcard</option>
            <option value="SIMULADOR">⚙️ Simulador</option>
            <option value="ENLACE">🔗 Enlace</option>
          </select>

          {/* Filtro estado */}
          <select
            value={filtros.estado}
            onChange={e => setFiltro('estado', e.target.value)}
            style={{
              padding: '8px 12px', borderRadius: 9, fontSize: 13,
              background: '#1a1a2e',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'white', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            <option value="">Todos los estados</option>
            <option value="BORRADOR">Borrador</option>
            <option value="EN_REVISION">En revisión</option>
            <option value="APROBADO">Aprobado</option>
            <option value="PUBLICADO">Publicado</option>
            <option value="DESHABILITADO">Deshabilitado</option>
          </select>

        </div>

        <button
          onClick={() => navigate('/tutor/recursos/crear')}
          style={{
            padding: '9px 20px', borderRadius: 10, fontSize: 13,
            fontWeight: 700, background: COLOR, border: 'none',
            color: 'white', cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          + Nuevo recurso
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, marginBottom: '1rem',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {/* Tabla */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, overflow: 'hidden',
      }}>

        {cargando ? (
          <div style={{
            padding: '3rem', textAlign: 'center',
            color: 'rgba(255,255,255,0.3)', fontSize: 14,
          }}>
            Cargando recursos...
          </div>
        ) : recursos.length === 0 ? (
          <div style={{
            padding: '3rem', textAlign: 'center',
            color: 'rgba(255,255,255,0.25)', fontSize: 14,
          }}>
            No hay recursos para mostrar.{' '}
            <span
              style={{ color: COLOR, cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => navigate('/tutor/recursos/crear')}
            >
              Crear el primero
            </span>
          </div>
        ) : (
          <div>
            {/* Cabecera */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '48px 1fr 110px 130px 180px',
              padding: '10px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              fontSize: 11, fontWeight: 700,
              color: 'rgba(255,255,255,0.3)',
              textTransform: 'uppercase', letterSpacing: 0.8,
            }}>
              <span>Tipo</span>
              <span>Título</span>
              <span>Módulo</span>
              <span>Estado</span>
              <span style={{ textAlign: 'right' }}>Acciones</span>
            </div>

            {/* Filas */}
            {recursos.map(r => (
              <div
                key={r.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '48px 1fr 110px 130px 180px',
                  padding: '14px 20px', alignItems: 'center',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Ícono tipo */}
                <span style={{ fontSize: 20 }}>{ICONOS_TIPO[r.tipo_recurso] ?? '📎'}</span>

                {/* Título + subtema */}
                <div>
                  <p style={{
                    color: 'white', fontSize: 14, fontWeight: 600, margin: 0,
                  }}>
                    {r.titulo}
                  </p>
                  {r.subtema && (
                    <p style={{
                      color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: '2px 0 0',
                    }}>
                      {r.subtema.nombre}
                    </p>
                  )}
                </div>

                {/* Módulo */}
                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                  {r.modulo?.nombre ?? '—'}
                </span>

                {/* Estado */}
                <BadgeEstado estado={r.estado} />

                {/* Acciones según estado */}
                <div style={{
                  display: 'flex', gap: 6,
                  justifyContent: 'flex-end', flexWrap: 'wrap',
                }}>
                  {accionId === r.id ? (
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
                      Procesando...
                    </span>
                  ) : (
                    <>
                      {r.estado === 'BORRADOR' && (
                        <>
                          <BtnAccion
                            label="Editar"
                            variante="ghost"
                            onClick={() => navigate(`/tutor/recursos/${r.id}/editar`)}
                          />
                          <BtnAccion
                            label="Enviar revisión"
                            variante="primario"
                            onClick={() => ejecutarAccion(r.id, () => recursoService.enviarRevision(r.id))}
                          />
                        </>
                      )}
                      {r.estado === 'EN_REVISION' && (
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, alignSelf: 'center' }}>
                          Pendiente de revisión
                        </span>
                      )}
                      {r.estado === 'APROBADO' && (
                        <span style={{ color: '#818cf8', fontSize: 12, alignSelf: 'center' }}>
                          ✓ Aprobado
                        </span>
                      )}
                      {r.estado === 'PUBLICADO' && (
                        <span style={{ color: '#10b981', fontSize: 12, alignSelf: 'center' }}>
                          ✓ Publicado
                        </span>
                      )}
                      {r.estado === 'DESHABILITADO' && (
                        <BtnAccion
                          label="Eliminar"
                          variante="peligro"
                          onClick={() => {
                            if (confirm('¿Eliminar este recurso?'))
                              ejecutarAccion(r.id, () => recursoService.eliminar(r.id));
                          }}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Paginación */}
      {meta && meta.last_page > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'center',
          gap: 6, marginTop: '1.5rem',
        }}>
          {Array.from({ length: meta.last_page }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setFiltros(f => ({ ...f, page: p }))}
              style={{
                width: 34, height: 34, borderRadius: 8, fontSize: 13,
                fontWeight: p === filtros.page ? 700 : 400,
                background: p === filtros.page ? COLOR : 'rgba(255,255,255,0.05)',
                border: p === filtros.page ? 'none' : '1px solid rgba(255,255,255,0.1)',
                color: 'white', cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}