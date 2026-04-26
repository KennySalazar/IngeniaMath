import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { recursoService } from '../../services/recursoService';
import { ejercicioService } from '../../services/ejercicioService';

const TIPOS = [
  { value: 'VIDEO',     label: '🎬 Video'     },
  { value: 'PDF',       label: '📄 PDF'       },
  { value: 'FLASHCARD', label: '🃏 Flashcard' },
  { value: 'SIMULADOR', label: '⚙️ Simulador' },
  { value: 'ENLACE',    label: '🔗 Enlace'    },
];

const COLOR = '#6366f1';

// ── Componentes UI (mismos que CrearRecursoPage) ─────────────────────────────

function Label({ children }) {
  return (
    <label style={{
      display: 'block', fontSize: 12, fontWeight: 600,
      color: 'rgba(255,255,255,0.5)', marginBottom: 6,
      textTransform: 'uppercase', letterSpacing: 0.8,
    }}>
      {children}
    </label>
  );
}

function Input({ style, ...props }) {
  return (
    <input
      {...props}
      style={{
        width: '100%', padding: '10px 14px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10, color: 'white', fontSize: 14,
        outline: 'none', boxSizing: 'border-box',
        fontFamily: 'DM Sans, sans-serif',
        ...style,
      }}
    />
  );
}

function Textarea({ style, ...props }) {
  return (
    <textarea
      {...props}
      style={{
        width: '100%', padding: '10px 14px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10, color: 'white', fontSize: 14,
        outline: 'none', resize: 'vertical', minHeight: 90,
        boxSizing: 'border-box', fontFamily: 'DM Sans, sans-serif',
        ...style,
      }}
    />
  );
}

function Select({ children, style, ...props }) {
  return (
    <select
      {...props}
      style={{
        width: '100%', padding: '10px 14px',
        background: '#1a1a2e',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10, color: 'white', fontSize: 14,
        outline: 'none', boxSizing: 'border-box',
        fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
        ...style,
      }}
    >
      {children}
    </select>
  );
}

function Campo({ label, children }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function MensajeError({ texto }) {
  if (!texto) return null;
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 10,
      background: 'rgba(239,68,68,0.1)',
      border: '1px solid rgba(239,68,68,0.3)',
      color: '#f87171', fontSize: 13, marginBottom: '1rem',
    }}>
      {texto}
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────

export default function EditarRecursoPage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null); // null = cargando
  const [modulos,  setModulos]  = useState([]);
  const [subtemas, setSubtemas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error,    setError]    = useState('');

  // ── Cargar recurso existente ─────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      recursoService.verDetalle(id),
      ejercicioService.listarModulos(),
    ])
      .then(([recurso, mods]) => {
        setModulos(mods);
        setForm({
          modulo_id:    recurso.modulo?.id    ?? '',
          subtema_id:   recurso.subtema?.id   ?? '',
          tipo_recurso: recurso.tipo_recurso  ?? '',
          titulo:       recurso.titulo        ?? '',
          descripcion:  recurso.descripcion   ?? '',
          url_recurso:  recurso.url_recurso   ?? '',
          flashcard: {
            titulo:  recurso.flashcard?.titulo  ?? '',
            frente:  recurso.flashcard?.frente  ?? '',
            reverso: recurso.flashcard?.reverso ?? '',
          },
        });

        // Cargar subtemas si ya tiene módulo
        if (recurso.modulo?.id) {
          return ejercicioService.listarSubtemas(recurso.modulo.id);
        }
      })
      .then(subs => { if (subs) setSubtemas(subs); })
      .catch(() => setError('No se pudo cargar el recurso.'));
  }, [id]);

  // ── Recargar subtemas al cambiar módulo ──────────────────────────────────────
  useEffect(() => {
    if (!form?.modulo_id) { setSubtemas([]); return; }

    ejercicioService.listarSubtemas(form.modulo_id)
      .then(setSubtemas)
      .catch(() => {});
  }, [form?.modulo_id]);

  const set = (campo, valor) =>
    setForm(f => ({ ...f, [campo]: valor }));

  const setFlashcard = (campo, valor) =>
    setForm(f => ({ ...f, flashcard: { ...f.flashcard, [campo]: valor } }));

  const esFlashcard = form?.tipo_recurso === 'FLASHCARD';
  const necesitaUrl = ['VIDEO', 'PDF', 'SIMULADOR', 'ENLACE'].includes(form?.tipo_recurso);

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError('');

    if (!form.modulo_id)     return setError('Selecciona un módulo.');
    if (!form.titulo.trim()) return setError('El título es obligatorio.');
    if (necesitaUrl && !form.url_recurso.trim())
      return setError('La URL del recurso es obligatoria.');

    // El backend no permite cambiar tipo_recurso, solo enviamos los campos editables
    const payload = {
      modulo_id:   parseInt(form.modulo_id),
      subtema_id:  form.subtema_id ? parseInt(form.subtema_id) : null,
      titulo:      form.titulo.trim(),
      descripcion: form.descripcion.trim() || null,
      url_recurso: necesitaUrl ? form.url_recurso.trim() : null,
    };

    try {
      setCargando(true);
      await recursoService.editar(id, payload);
      navigate('/tutor/recursos');
    } catch (e) {
      setError(e.response?.data?.message ?? 'Error al guardar los cambios.');
    } finally {
      setCargando(false);
    }
  };

  // ── Estados de carga / error inicial ─────────────────────────────────────────
  if (error && !form) {
    return (
      <div style={{
        padding: '2rem', textAlign: 'center',
        color: '#f87171', fontSize: 14,
      }}>
        {error}
      </div>
    );
  }

  if (!form) {
    return (
      <div style={{
        padding: '3rem', textAlign: 'center',
        color: 'rgba(255,255,255,0.3)', fontSize: 14,
      }}>
        Cargando recurso...
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>

      <MensajeError texto={error} />

      {/* Badge de tipo (no editable) */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '6px 14px', borderRadius: 20, marginBottom: '1.5rem',
        background: `${COLOR}18`,
        border: `1px solid ${COLOR}44`,
      }}>
        <span style={{ fontSize: 16 }}>
          {TIPOS.find(t => t.value === form.tipo_recurso)?.label ?? form.tipo_recurso}
        </span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
          · El tipo no puede cambiarse
        </span>
      </div>

      {/* Card principal */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16, padding: '2rem',
      }}>

        {/* Módulo */}
        <Campo label="Módulo *">
          <Select
            value={form.modulo_id}
            onChange={e => set('modulo_id', e.target.value)}
          >
            <option value="">— Selecciona un módulo —</option>
            {modulos.map(m => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </Select>
        </Campo>

        {/* Subtema */}
        <Campo label="Subtema (opcional)">
          <Select
            value={form.subtema_id}
            onChange={e => set('subtema_id', e.target.value)}
            disabled={!form.modulo_id}
          >
            <option value="">— Sin subtema —</option>
            {subtemas.map(s => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </Select>
        </Campo>

        {/* Título */}
        <Campo label="Título *">
          <Input
            value={form.titulo}
            onChange={e => set('titulo', e.target.value)}
          />
        </Campo>

        {/* Descripción */}
        <Campo label="Descripción">
          <Textarea
            value={form.descripcion}
            onChange={e => set('descripcion', e.target.value)}
          />
        </Campo>

        {/* URL (solo si no es flashcard) */}
        {necesitaUrl && (
          <Campo label="URL del recurso *">
            <Input
              type="url"
              placeholder="https://..."
              value={form.url_recurso}
              onChange={e => set('url_recurso', e.target.value)}
            />
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 5 }}>
              Enlace externo (YouTube, Google Drive, etc.)
            </p>
          </Campo>
        )}

        {/* Campos flashcard (solo lectura en edición — el backend no los actualiza por esta ruta) */}
        {esFlashcard && (
          <div style={{
            padding: '1.25rem', borderRadius: 12,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            marginBottom: '1.25rem',
          }}>
            <p style={{
              fontSize: 12, fontWeight: 700,
              color: 'rgba(255,255,255,0.3)',
              textTransform: 'uppercase', letterSpacing: 1, marginBottom: '1rem',
            }}>
              🃏 Contenido de la Flashcard
            </p>

            <Campo label="Frente (pregunta)">
              <Textarea
                value={form.flashcard.frente}
                onChange={e => setFlashcard('frente', e.target.value)}
              />
            </Campo>

            <Campo label="Reverso (respuesta)">
              <Textarea
                value={form.flashcard.reverso}
                onChange={e => setFlashcard('reverso', e.target.value)}
              />
            </Campo>

            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: 0 }}>
              ℹ️ Los cambios al contenido de la flashcard se guardan por separado en el sistema.
            </p>
          </div>
        )}

        {/* Botones */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={() => navigate('/tutor/recursos')}
            style={{
              padding: '10px 22px', borderRadius: 10, fontSize: 14,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={cargando}
            style={{
              padding: '10px 26px', borderRadius: 10, fontSize: 14,
              fontWeight: 700, cursor: cargando ? 'not-allowed' : 'pointer',
              background: cargando ? `${COLOR}66` : COLOR,
              border: 'none', color: 'white',
              fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s',
            }}
          >
            {cargando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>

      </div>
    </div>
  );
}