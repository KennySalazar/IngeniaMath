import { useState } from 'react';

// ── Flashcard con flip 3D ─────────────────────────────────────────────────────
function FlashcardViewer({ flashcard }) {
  const [girada, setGirada] = useState(false);

  if (!flashcard) {
    return (
      <p style={{
        textAlign: 'center', color: 'rgba(255,255,255,0.3)',
        fontSize: 13, padding: '1rem 0',
      }}>
        Contenido no disponible.
      </p>
    );
  }

  return (
    <div style={{ perspective: 1000 }}>
      <p style={{
        textAlign: 'center', fontSize: 11,
        color: 'rgba(255,255,255,0.3)', marginBottom: 10,
      }}>
        Clic para {girada ? 'ver la pregunta' : 'ver la respuesta'}
      </p>

      <div
        onClick={() => setGirada(g => !g)}
        style={{
          position: 'relative', width: '100%', height: 200,
          cursor: 'pointer', transformStyle: 'preserve-3d',
          transform: girada ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Frente */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          background: 'rgba(99,102,241,0.1)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 14,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '1.25rem', textAlign: 'center',
        }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: '#818cf8',
            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10,
          }}>
            🃏 Pregunta
          </span>
          <p style={{ color: 'white', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
            {flashcard.frente}
          </p>
        </div>

        {/* Reverso */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: 14,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '1.25rem', textAlign: 'center',
        }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: '#10b981',
            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10,
          }}>
            ✓ Respuesta
          </span>
          <p style={{ color: 'white', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
            {flashcard.reverso}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Video YouTube ─────────────────────────────────────────────────────────────
function VideoViewer({ url }) {
    const [error, setError] = useState(false);
  
    const { embedUrl, videoId } = (() => {
      try {
        const u = new URL(url);
        let id = null;
  
        if (u.hostname.includes('youtube.com')) {
          id = u.searchParams.get('v');
        } else if (u.hostname.includes('youtu.be')) {
          id = u.pathname.slice(1).split('?')[0];
        }
  
        if (id) {
          return {
            videoId: id,
            embedUrl: `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`,
          };
        }
        return { embedUrl: url, videoId: null };
      } catch {
        return { embedUrl: url, videoId: null };
      }
    })();
  
    // Video bloqueado para embed → mostrar fallback
    if (error) {
      return (
        <div style={{
          borderRadius: 10, overflow: 'hidden',
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.2)',
          padding: '1.5rem', textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🔒</div>
          <p style={{
            color: 'rgba(255,255,255,0.7)', fontSize: 14,
            fontWeight: 600, margin: '0 0 6px',
          }}>
            Este video no permite reproducción embebida
          </p>
          <p style={{
            color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: '0 0 16px',
          }}>
            El propietario del video deshabilitó esta opción en YouTube.
          </p>
  
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 10,
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.35)',
              color: '#f87171', fontSize: 13, fontWeight: 700,
              textDecoration: 'none', transition: 'all 0.2s',
              fontFamily: 'DM Sans, sans-serif',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
          >
            🎬 Ver en YouTube
          </a>
  
          {/* Miniatura clicable como alternativa */}
          {videoId && (
            <div style={{ marginTop: 16 }}>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <img
                  src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                  alt="Miniatura del video"
                  style={{
                    width: '100%', borderRadius: 8,
                    opacity: 0.7, cursor: 'pointer',
                    transition: 'opacity 0.2s',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
                />
              </a>
              <p style={{
                fontSize: 11, color: 'rgba(255,255,255,0.25)',
                marginTop: 6,
              }}>
                Clic en la miniatura para abrir en YouTube
              </p>
            </div>
          )}
        </div>
      );
    }
  
    return (
      <div style={{
        position: 'relative', width: '100%',
        paddingBottom: '56.25%',
        borderRadius: 10, overflow: 'hidden', background: '#000',
      }}>
        <iframe
          src={embedUrl}
          title="Video educativo"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%', border: 'none',
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          // onError no funciona en iframes, usamos mensaje de YouTube como señal
          onLoad={e => {
            // YouTube inyecta un título específico cuando bloquea el embed
            try {
              const title = e.target.contentDocument?.title ?? '';
              if (title.includes('YouTube')) setError(true);
            } catch {
              // Cross-origin: no podemos leer el título, asumimos que funcionó
            }
          }}
        />
  
        {/* Overlay con enlace directo siempre visible */}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          title="Abrir en YouTube"
          style={{
            position: 'absolute', bottom: 8, right: 8,
            padding: '4px 10px', borderRadius: 6,
            background: 'rgba(0,0,0,0.7)',
            color: 'rgba(255,255,255,0.6)', fontSize: 10,
            textDecoration: 'none', fontFamily: 'DM Sans, sans-serif',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'white'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
        >
          ↗ Abrir en YouTube
        </a>
      </div>
    );
  }

// ── PDF / Enlace ──────────────────────────────────────────────────────────────
function EnlaceViewer({ url, tipo }) {
  const esPdf  = tipo === 'PDF';
  const icono  = esPdf ? '📄' : '🔗';
  const label  = esPdf ? 'Abrir PDF' : 'Abrir enlace';
  const color  = esPdf ? '#f59e0b' : '#6366f1';

  return (
    <div style={{ textAlign: 'center', padding: '1.25rem 0' }}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '11px 24px', borderRadius: 10,
          background: `${color}18`,
          border: `1px solid ${color}44`,
          color, fontSize: 14, fontWeight: 700,
          textDecoration: 'none', transition: 'all 0.2s',
          fontFamily: 'DM Sans, sans-serif',
        }}
        onMouseEnter={e => e.currentTarget.style.background = `${color}30`}
        onMouseLeave={e => e.currentTarget.style.background = `${color}18`}
      >
        <span style={{ fontSize: 18 }}>{icono}</span>
        {label}
      </a>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 8 }}>
        Se abrirá en una nueva pestaña
      </p>
    </div>
  );
}

// ── Simulador ─────────────────────────────────────────────────────────────────
function SimuladorViewer({ url }) {
  const [activo, setActivo] = useState(false);

  if (!activo) {
    return (
      <div style={{ textAlign: 'center', padding: '1.25rem 0' }}>
        <button
          onClick={() => setActivo(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '11px 24px', borderRadius: 10,
            background: 'rgba(16,185,129,0.12)',
            border: '1px solid rgba(16,185,129,0.35)',
            color: '#10b981', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
          }}
        >
          <span style={{ fontSize: 18 }}>⚙️</span>
          Lanzar simulador
        </button>
      </div>
    );
  }

  return (
    <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
      <iframe
        src={url}
        title="Simulador"
        style={{ width: '100%', height: 400, border: 'none', display: 'block' }}
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function VisualizadorRecurso({ recurso }) {
  if (!recurso) return null;

  const { tipo_recurso, titulo, descripcion, url_recurso, flashcard } = recurso;

  return (
    <div>
      {/* Cabecera */}
      <div style={{ marginBottom: '1rem' }}>
        <span style={{
          fontSize: 10, fontWeight: 700,
          color: 'rgba(255,255,255,0.3)',
          textTransform: 'uppercase', letterSpacing: 1,
        }}>
          {tipo_recurso}
        </span>
        <h3 style={{
          color: 'white', fontSize: 16, fontWeight: 700,
          margin: '4px 0 6px', lineHeight: 1.4,
          fontFamily: 'Syne, sans-serif',
        }}>
          {titulo}
        </h3>
        {descripcion && (
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0, lineHeight: 1.5 }}>
            {descripcion}
          </p>
        )}
      </div>

      {/* Divisor */}
      <div style={{
        height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: '1rem',
      }} />

      {/* Contenido según tipo */}
      {tipo_recurso === 'VIDEO'     && <VideoViewer     url={url_recurso} />}
      {tipo_recurso === 'PDF'       && <EnlaceViewer    url={url_recurso} tipo="PDF" />}
      {tipo_recurso === 'ENLACE'    && <EnlaceViewer    url={url_recurso} tipo="ENLACE" />}
      {tipo_recurso === 'SIMULADOR' && <SimuladorViewer url={url_recurso} />}
      {tipo_recurso === 'FLASHCARD' && <FlashcardViewer flashcard={flashcard} />}
    </div>
  );
}