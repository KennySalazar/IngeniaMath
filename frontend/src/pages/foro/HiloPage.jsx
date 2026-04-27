import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { foroService } from '../../services/foroService';

const COLOR = '#6366f1';

const COLORES_ROL = {
  TUTOR:      { bg: 'rgba(99,102,241,0.15)',  color: '#818cf8', label: 'Tutor'    },
  REVISOR:    { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b', label: 'Revisor'  },
  ADMIN:      { bg: 'rgba(239,68,68,0.15)',   color: '#f87171', label: 'Admin'    },
  ESTUDIANTE: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', label: 'Estudiante'},
};

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ nombre, foto, rol, size = 38 }) {
  const cfg   = COLORES_ROL[rol] ?? COLORES_ROL.ESTUDIANTE;
  const inits = (nombre ?? '?')
    .split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: cfg.bg, border: `1.5px solid ${cfg.color}55`,
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', overflow: 'hidden',
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

// ── Badge rol ─────────────────────────────────────────────────────────────────
function BadgeRol({ rol }) {
  const cfg = COLORES_ROL[rol];
  if (!cfg || rol === 'ESTUDIANTE') return null;
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 20, fontSize: 10,
      fontWeight: 700, background: cfg.bg, color: cfg.color,
    }}>
      {cfg.label}
    </span>
  );
}

// ── Tarjeta de respuesta ──────────────────────────────────────────────────────
function TarjetaRespuesta({
  respuesta, esSolucion, puedeMarcar,
  puedeBorrar, onMarcar, onEliminar,
}) {
  const [confirmando, setConfirmando] = useState(false);

  return (
    <div style={{
      background: esSolucion
        ? 'rgba(99,102,241,0.06)'
        : 'rgba(255,255,255,0.02)',
      border: esSolucion
        ? '1px solid rgba(99,102,241,0.3)'
        : '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: '1.25rem',
      transition: 'border-color 0.2s',
    }}>
      {/* Badge solución */}
      {esSolucion && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 12px', borderRadius: 20, marginBottom: 12,
          background: 'rgba(99,102,241,0.2)',
          border: '1px solid rgba(99,102,241,0.4)',
        }}>
          <span style={{ fontSize: 13 }}>✓</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#818cf8' }}>
            Solución aceptada
          </span>
        </div>
      )}

      {/* Autor */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <Avatar
          nombre={respuesta.autor.nombre}
          foto={respuesta.autor.foto}
          rol={respuesta.autor.rol}
        />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>
              {respuesta.autor.nombre}
            </span>
            <BadgeRol rol={respuesta.autor.rol} />
          </div>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
            {new Date(respuesta.fecha_creacion).toLocaleString('es-GT', {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </span>
        </div>
      </div>

      {/* Contenido */}
      <p style={{
        color: 'rgba(255,255,255,0.85)', fontSize: 14,
        lineHeight: 1.7, margin: '0 0 12px',
        whiteSpace: 'pre-wrap',
      }}>
        {respuesta.contenido}
      </p>

      {/* Acciones */}
      {(puedeMarcar || puedeBorrar) && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {puedeMarcar && !esSolucion && (
            <button
              onClick={() => onMarcar(respuesta.id)}
              style={{
                padding: '5px 14px', borderRadius: 8, fontSize: 12,
                fontWeight: 600, cursor: 'pointer',
                background: 'rgba(99,102,241,0.12)',
                border: '1px solid rgba(99,102,241,0.3)',
                color: '#818cf8', fontFamily: 'DM Sans, sans-serif',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.12)'}
            >
              ✓ Marcar como solución
            </button>
          )}

          {puedeBorrar && !esSolucion && (
            confirmando ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                  ¿Eliminar?
                </span>
                <button
                  onClick={() => { onEliminar(respuesta.id); setConfirmando(false); }}
                  style={{
                    padding: '4px 12px', borderRadius: 8, fontSize: 12,
                    fontWeight: 600, cursor: 'pointer',
                    background: 'rgba(239,68,68,0.15)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    color: '#f87171', fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  Sí
                </button>
                <button
                  onClick={() => setConfirmando(false)}
                  style={{
                    padding: '4px 12px', borderRadius: 8, fontSize: 12,
                    cursor: 'pointer',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.4)',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmando(true)}
                style={{
                  padding: '5px 14px', borderRadius: 8, fontSize: 12,
                  cursor: 'pointer',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  color: '#f87171', fontFamily: 'DM Sans, sans-serif',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
              >
                Eliminar
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ── Formulario de respuesta ───────────────────────────────────────────────────
function FormRespuesta({ onResponder, hiloEstado }) {
  const [texto,    setTexto]    = useState('');
  const [cargando, setCargando] = useState(false);
  const [error,    setError]    = useState('');

  const cerrado = hiloEstado === 'CERRADO';

  const handleSubmit = async () => {
    setError('');
    if (texto.trim().length < 5)
      return setError('La respuesta debe tener al menos 5 caracteres.');

    setCargando(true);
    try {
      await onResponder(texto.trim());
      setTexto('');
    } catch (e) {
      setError(e.response?.data?.message ?? 'Error al enviar la respuesta.');
    } finally {
      setCargando(false);
    }
  };

  if (cerrado) {
    return (
      <div style={{
        padding: '1rem 1.25rem', borderRadius: 12,
        background: 'rgba(148,163,184,0.06)',
        border: '1px solid rgba(148,163,184,0.15)',
        color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center',
      }}>
        🔒 Este hilo está cerrado. No se pueden agregar más respuestas.
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14, padding: '1.25rem',
    }}>
      <p style={{
        fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 10px',
      }}>
        Tu respuesta
      </p>
      <textarea
        value={texto}
        onChange={e => setTexto(e.target.value)}
        placeholder="Escribe tu respuesta aquí..."
        rows={4}
        style={{
          width: '100%', padding: '10px 14px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 10, color: 'white', fontSize: 14,
          outline: 'none', resize: 'vertical', minHeight: 100,
          boxSizing: 'border-box', fontFamily: 'DM Sans, sans-serif',
          lineHeight: 1.6,
        }}
      />

      {error && (
        <p style={{ color: '#f87171', fontSize: 12, margin: '6px 0 0' }}>{error}</p>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
        <button
          onClick={handleSubmit}
          disabled={cargando || !texto.trim()}
          style={{
            padding: '9px 22px', borderRadius: 10, fontSize: 13,
            fontWeight: 700,
            background: cargando || !texto.trim() ? `${COLOR}44` : COLOR,
            border: 'none', color: 'white',
            cursor: cargando || !texto.trim() ? 'not-allowed' : 'pointer',
            fontFamily: 'DM Sans, sans-serif', transition: 'background 0.2s',
          }}
        >
          {cargando ? 'Enviando...' : 'Enviar respuesta'}
        </button>
      </div>
    </div>
  );
}

// ── Panel de moderación ───────────────────────────────────────────────────────
function PanelModeracion({ hilo, onCambiarEstado }) {
  const [cargando, setCargando] = useState(false);

  const acciones = hilo.estado !== 'CERRADO'
    ? [{ estado: 'CERRADO', label: '🔒 Cerrar hilo', color: '#94a3b8' }]
    : [{ estado: 'ABIERTO', label: '🔓 Reabrir hilo', color: '#10b981' }];

  if (hilo.estado !== 'ELIMINADO') {
    acciones.push({
      estado: 'ELIMINADO', label: '🗑 Eliminar hilo', color: '#f87171',
    });
  }

  const handleAccion = async (estado) => {
    setCargando(true);
    try { await onCambiarEstado(estado); }
    finally { setCargando(false); }
  };

  return (
    <div style={{
      padding: '1rem 1.25rem', borderRadius: 12,
      background: 'rgba(245,158,11,0.05)',
      border: '1px solid rgba(245,158,11,0.2)',
      marginBottom: '1.5rem',
    }}>
      <p style={{
        fontSize: 11, fontWeight: 700, color: '#f59e0b',
        textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px',
      }}>
        ⚙️ Moderación
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {acciones.map(a => (
          <button
            key={a.estado}
            onClick={() => handleAccion(a.estado)}
            disabled={cargando}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12,
              fontWeight: 600, cursor: cargando ? 'not-allowed' : 'pointer',
              background: `${a.color}18`,
              border: `1px solid ${a.color}44`,
              color: a.color, fontFamily: 'DM Sans, sans-serif',
              transition: 'all 0.15s',
            }}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Página del hilo ───────────────────────────────────────────────────────────
export default function HiloPage() {
  const { id }          = useParams();
  const navigate        = useNavigate();
  const { usuario }     = useAuth();
  const rol             = usuario?.rol?.codigo;
  const usuarioId       = usuario?.id;

  const [hilo,     setHilo]     = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error,    setError]    = useState('');

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const data = await foroService.verHilo(id);
      setHilo(data);
    } catch {
      setError('No se pudo cargar el hilo.');
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleResponder = async (contenido) => {
    const respuesta = await foroService.responder(parseInt(id), contenido);
    setHilo(h => ({ ...h, respuestas: [...(h.respuestas ?? []), respuesta] }));
  };

  const handleMarcarSolucion = async (respuestaId) => {
    const hiloActualizado = await foroService.marcarSolucion(parseInt(id), respuestaId);
    setHilo(hiloActualizado);
  };

  const handleEliminarRespuesta = async (respuestaId) => {
    await foroService.eliminarRespuesta(respuestaId);
    setHilo(h => ({
      ...h,
      respuestas: h.respuestas.filter(r => r.id !== respuestaId),
    }));
  };

  const handleCambiarEstado = async (nuevoEstado) => {
    const hiloActualizado = await foroService.cambiarEstado(parseInt(id), nuevoEstado);
    if (nuevoEstado === 'ELIMINADO') {
      navigate('/foro');
      return;
    }
    setHilo(hiloActualizado);
  };

  const esModerador   = ['REVISOR', 'ADMIN'].includes(rol);
  const esAutorHilo   = hilo?.autor?.id === usuarioId;
  const puedeResponder= ['TUTOR', 'REVISOR', 'ADMIN', 'ESTUDIANTE'].includes(rol);

  if (cargando) {
    return (
      <div style={{
        padding: '3rem', textAlign: 'center',
        color: 'rgba(255,255,255,0.3)', fontSize: 14,
      }}>
        Cargando hilo...
      </div>
    );
  }

  if (error || !hilo) {
    return (
      <div style={{
        padding: '3rem', textAlign: 'center',
        color: '#f87171', fontSize: 14,
      }}>
        {error || 'Hilo no encontrado.'}
      </div>
    );
  }

  const respuestas   = hilo.respuestas ?? [];
  const totalResp    = respuestas.length;

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>

      {/* ── Panel moderación ──────────────────────────────────────────────── */}
      {esModerador && (
        <PanelModeracion hilo={hilo} onCambiarEstado={handleCambiarEstado} />
      )}

      {/* ── Cabecera del hilo ─────────────────────────────────────────────── */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16, padding: '1.75rem',
        marginBottom: '1.5rem',
      }}>
        {/* Módulo + subtema */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          <span style={{
            padding: '3px 10px', borderRadius: 20, fontSize: 11,
            background: `${COLOR}18`, color: COLOR, fontWeight: 600,
          }}>
            {hilo.modulo.nombre}
          </span>
          {hilo.subtema && (
            <span style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 11,
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.4)',
            }}>
              {hilo.subtema.nombre}
            </span>
          )}
          {/* Badge estado */}
          {{
            ABIERTO:  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>Abierto</span>,
            RESUELTO: <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>✓ Resuelto</span>,
            CERRADO:  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(148,163,184,0.12)', color: '#94a3b8' }}>🔒 Cerrado</span>,
          }[hilo.estado]}
        </div>

        {/* Título */}
        <h1 style={{
          fontSize: 20, fontWeight: 800, color: 'white',
          margin: '0 0 16px', lineHeight: 1.4,
          fontFamily: 'Syne, sans-serif',
        }}>
          {hilo.titulo}
        </h1>

        {/* Autor + fecha */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Avatar nombre={hilo.autor.nombre} foto={hilo.autor.foto} rol="ESTUDIANTE" />
          <div>
            <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>
              {hilo.autor.nombre}
            </span>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: '2px 0 0' }}>
              {new Date(hilo.fecha_creacion).toLocaleString('es-GT', {
                day: '2-digit', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        {/* Divisor */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 16 }} />

        {/* Contenido */}
        <p style={{
          color: 'rgba(255,255,255,0.8)', fontSize: 15,
          lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap',
        }}>
          {hilo.contenido}
        </p>
      </div>

      {/* ── Respuestas ────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{
          fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase', letterSpacing: 1,
          margin: '0 0 1rem',
        }}>
          {totalResp} respuesta{totalResp !== 1 ? 's' : ''}
        </p>

        {totalResp === 0 ? (
          <div style={{
            padding: '2rem', textAlign: 'center',
            color: 'rgba(255,255,255,0.2)', fontSize: 13,
            background: 'rgba(255,255,255,0.01)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 12,
          }}>
            Aún no hay respuestas. ¡Sé el primero en responder!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {respuestas.map(r => {
              const esSol        = r.id === hilo.respuesta_aceptada_id;
              const esAutorResp  = r.autor.id === usuarioId;
              const puedeMarcar  = esAutorHilo && hilo.estado !== 'CERRADO' && !hilo.respuesta_aceptada_id;
              const puedeBorrar  = esModerador || esAutorResp;

              return (
                <TarjetaRespuesta
                  key={r.id}
                  respuesta={r}
                  esSolucion={esSol}
                  puedeMarcar={puedeMarcar}
                  puedeBorrar={puedeBorrar}
                  onMarcar={handleMarcarSolucion}
                  onEliminar={handleEliminarRespuesta}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ── Formulario responder ──────────────────────────────────────────── */}
      {puedeResponder && (
        <FormRespuesta
          onResponder={handleResponder}
          hiloEstado={hilo.estado}
        />
      )}
    </div>
  );
}