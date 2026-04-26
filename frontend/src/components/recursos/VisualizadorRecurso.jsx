import { useState } from 'react';

// ── Tarjeta Flashcard con efecto flip ────────────────────────────────────────

function FlashcardViewer({ flashcard }) {
  const [girada, setGirada] = useState(false);

  if (!flashcard) {
    return (
      <div style={{
        padding: '2rem', textAlign: 'center',
        color: 'rgba(255,255,255,0.3)', fontSize: 14,
      }}>
        Contenido de flashcard no disponible.
      </div>
    );
  }

  return (
    <div style={{ perspective: 1000, width: '100%', maxWidth: 480, margin: '0 auto' }}>
      {/* Instrucción */}
      <p style={{
        textAlign: 'center', fontSize: 12,
        color: 'rgba(255,255,255,0.35)', marginBottom: 12,
      }}>
        Haz clic en la tarjeta para {girada ? 'ver la pregunta' : 'ver la respuesta'}
      </p>

      {/* Tarjeta */}
      <div
        onClick={() => setGirada(g => !g)}
        style={{
          position: 'relative', width: '100%', height: 220,
          cursor: 'pointer',
          transformStyle: 'preserve-3d',
          transform: girada ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Frente */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          background: 'rgba(99,102,241,0.1)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 16,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '1.5rem', textAlign: 'center',
        }}>
          <span style={{
            fontSize: 11, fontWeight: 700, color: '#818cf8',
            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
          }}>
            🃏 Pregunta
          </span>
          <p style={{ color: 'white', fontSize: 16, lineHeight: 1.6, margin: 0 }}>
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
          borderRadius: 16,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '1.5rem', textAlign: 'center',
        }}>
          <span style={{
            fontSize: 11, fontWeight: 700, color: '#10b981',
            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
          }}>
            ✓ Respuesta
          </span>
          <p style={{ color: 'white', fontSize: 16, lineHeight: 1.6, margin: 0 }}>
            {flashcard.reverso}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Visor de Video (iframe embebido) ─────────────────────────────────────────

function VideoViewer({ url }) {
  // Convierte URL normal de YouTube a formato embed
  const embedUrl = (() => {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtube.com')) {
        const v = u.searchParams.get('v');
        return v ? `https://www.youtube.com/embed/${v}` : url;
      }
      if (u.hostname.includes('youtu.be')) {
        return `https://www.youtube.com/embed${u.pathname}`;
      }
      return url;
    } catch {
      return url;
    }
  })();

  return (
    <div style={{
      position: 'relative', width: '100%',
      paddingBottom: '56.25%', // ratio 16:9
      borderRadius: 12, overflow: 'hidden',
      background: '#000',
    }}>
      <iframe
        src={embedUrl}
        title="Video educativo"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%', border: 'none',
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
        allowFullScreen
      />
    </div>
  );
}

// ── Botón de descarga/apertura para PDF y enlaces ────────────────────────────

function EnlaceViewer({ url, tipo }) {
  const esPdf = tipo === 'PDF';
  const icono = esPdf ? '📄' : '🔗';
  const label = esPdf ? 'Abrir PDF' : 'Abrir enlace';
  const color = esPdf ? '#f59e0b' : '#6366f1';

  return (
    <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '12px 28px', borderRadius: 12,
          background: `${color}22`,
          border: `1px solid ${color}55`,
          color, fontSize: 15, fontWeight: 700,
          textDecoration: 'none', transition: 'all 0.2s',
          fontFamily: 'DM Sans, sans-serif',
        }}
        onMouseEnter={e => e.currentTarget.style.background = `${color}40`}
        onMouseLeave={e => e.currentTarget.style.background = `${color}22`}
      >
        <span style={{ fontSize: 20 }}>{icono}</span>
        {label}
      </a>
      <p style={{
        fontSize: 11, color: 'rgba(255,255,255,0.25)',
        marginTop: 8,
      }}>
        Se abrirá en una nueva pestaña
      </p>
    </div>
  );
}

// ── Simulador ────────────────────────────────────────────────────────────────

function SimuladorViewer({ url }) {
  const [mostrar, setMostrar] = useState(false);

  if (!mostrar) {
    return (
      <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
        <button
          onClick={() => setMostrar(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '12px 28px', borderRadius: 12,
            background: 'rgba(16,185,129,0.12)',
            border: '1px solid rgba(16,185,129,0.35)',
            color: '#10b981', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
          }}
        >
          <span style={{ fontSize: 20 }}>⚙️</span>
          Lanzar simulador
        </button>
      </div>
    );
  }

  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
      <iframe
        src={url}
        title="Simulador"
        style={{ width: '100%', height: 480, border: 'none' }}
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </div>
  );
}

// ── Componente principal exportado ───────────────────────────────────────────

/**
 * Uso:
 *   <VisualizadorRecurso recurso={recurso} />
 *
 * El prop `recurso` debe tener la forma devuelta por recursoService.verDetalle()
 * (con la propiedad `flashcard` incluida si tipo_recurso === 'FLASHCARD').
 */
export default function VisualizadorRecurso({ recurso }) {
  if (!recurso) return null;

  const { tipo_recurso, titulo, descripcion, url_recurso, flashcard } = recurso;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16, padding: '1.5rem',
    }}>
      {/* Cabecera */}
      <div style={{ marginBottom: '1.25rem' }}>
        <p style={{
          fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)',
          textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 6px',
        }}>
          {tipo_recurso}
        </p>
        <h3 style={{
          color: 'white', fontSize: 18, fontWeight: 700,
          margin: '0 0 6px', fontFamily: 'Syne, sans-serif',
        }}>
          {titulo}
        </h3>
        {descripcion && (
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, margin: 0 }}>
            {descripcion}
          </p>
        )}
      </div>

      {/* Cuerpo según tipo */}
      <div>
        {tipo_recurso === 'VIDEO'     && <VideoViewer     url={url_recurso} />}
        {tipo_recurso === 'PDF'       && <EnlaceViewer    url={url_recurso} tipo="PDF" />}
        {tipo_recurso === 'ENLACE'    && <EnlaceViewer    url={url_recurso} tipo="ENLACE" />}
        {tipo_recurso === 'SIMULADOR' && <SimuladorViewer url={url_recurso} />}
        {tipo_recurso === 'FLASHCARD' && <FlashcardViewer flashcard={flashcard} />}
      </div>
    </div>
  );
}