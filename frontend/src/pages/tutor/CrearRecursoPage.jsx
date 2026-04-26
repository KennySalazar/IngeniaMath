import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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

// ── Componentes UI locales ───────────────────────────────────────────────────

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

export default function CrearRecursoPage() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  // Form state
  const [form, setForm] = useState({
    modulo_id:   '',
    subtema_id:  '',
    tipo_recurso: '',
    titulo:      '',
    descripcion: '',
    url_recurso: '',
    flashcard: { titulo: '', frente: '', reverso: '' },
  });

  const [modulos,  setModulos]  = useState([]);
  const [subtemas, setSubtemas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error,    setError]    = useState('');

  const esFlashcard = form.tipo_recurso === 'FLASHCARD';
  const necesitaUrl = ['VIDEO', 'PDF', 'SIMULADOR', 'ENLACE'].includes(form.tipo_recurso);

  // Cargar módulos al montar
  useEffect(() => {
    ejercicioService.listarModulos()
      .then(setModulos)
      .catch(() => setError('No se pudieron cargar los módulos.'));
  }, []);

  // Cargar subtemas cuando cambia el módulo
  useEffect(() => {
    setForm(f => ({ ...f, subtema_id: '' }));
    setSubtemas([]);
    if (!form.modulo_id) return;

    ejercicioService.listarSubtemas(form.modulo_id)
      .then(setSubtemas)
      .catch(() => {});
  }, [form.modulo_id]);

  const set = (campo, valor) =>
    setForm(f => ({ ...f, [campo]: valor }));

  const setFlashcard = (campo, valor) =>
    setForm(f => ({ ...f, flashcard: { ...f.flashcard, [campo]: valor } }));

  const handleSubmit = async () => {
    setError('');

    // Validaciones básicas
    if (!form.modulo_id)    return setError('Selecciona un módulo.');
    if (!form.tipo_recurso) return setError('Selecciona un tipo de recurso.');
    if (!form.titulo.trim()) return setError('El título es obligatorio.');

    if (necesitaUrl && !form.url_recurso.trim())
      return setError('La URL del recurso es obligatoria.');

    if (esFlashcard) {
      if (!form.flashcard.titulo.trim()) return setError('El título de la flashcard es obligatorio.');
      if (!form.flashcard.frente.trim()) return setError('El frente de la flashcard es obligatorio.');
      if (!form.flashcard.reverso.trim()) return setError('El reverso de la flashcard es obligatorio.');
    }

    const payload = {
      modulo_id:    parseInt(form.modulo_id),
      subtema_id:   form.subtema_id ? parseInt(form.subtema_id) : null,
      tipo_recurso: form.tipo_recurso,
      titulo:       form.titulo.trim(),
      descripcion:  form.descripcion.trim() || null,
      url_recurso:  necesitaUrl ? form.url_recurso.trim() : null,
      ...(esFlashcard && { flashcard: form.flashcard }),
    };

    try {
      setCargando(true);
      await recursoService.crear(payload);
      navigate('/tutor/recursos');
    } catch (e) {
      const msg = e.response?.data?.message || 'Error al crear el recurso.';
      setError(msg);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>

      <MensajeError texto={error} />

      {/* Card principal */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16, padding: '2rem',
      }}>

        {/* Módulo */}
        <Campo label="Módulo *">
          <Select value={form.modulo_id} onChange={e => set('modulo_id', e.target.value)}>
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

        {/* Tipo */}
        <Campo label="Tipo de recurso *">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TIPOS.map(t => {
              const activo = form.tipo_recurso === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => set('tipo_recurso', t.value)}
                  style={{
                    padding: '8px 16px', borderRadius: 10, fontSize: 13,
                    fontWeight: activo ? 700 : 400,
                    cursor: 'pointer', transition: 'all 0.15s',
                    border: activo
                      ? `1.5px solid ${COLOR}`
                      : '1.5px solid rgba(255,255,255,0.1)',
                    background: activo ? `${COLOR}22` : 'rgba(255,255,255,0.03)',
                    color: activo ? COLOR : 'rgba(255,255,255,0.5)',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </Campo>

        {/* Título */}
        <Campo label="Título *">
          <Input
            placeholder="Ej: Introducción al cálculo diferencial"
            value={form.titulo}
            onChange={e => set('titulo', e.target.value)}
          />
        </Campo>

        {/* Descripción */}
        <Campo label="Descripción">
          <Textarea
            placeholder="Descripción breve del recurso..."
            value={form.descripcion}
            onChange={e => set('descripcion', e.target.value)}
          />
        </Campo>

        {/* URL (solo si NO es flashcard) */}
        {necesitaUrl && (
          <Campo label="URL del recurso *">
            <Input
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={form.url_recurso}
              onChange={e => set('url_recurso', e.target.value)}
            />
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 5 }}>
              Enlace externo (YouTube, Google Drive, etc.)
            </p>
          </Campo>
        )}

        {/* Campos de Flashcard */}
        {esFlashcard && (
          <div style={{
            padding: '1.25rem', borderRadius: 12,
            background: `${COLOR}0d`,
            border: `1px solid ${COLOR}33`,
            marginBottom: '1.25rem',
          }}>
            <p style={{
              fontSize: 12, fontWeight: 700, color: COLOR,
              textTransform: 'uppercase', letterSpacing: 1, marginBottom: '1rem',
            }}>
              🃏 Contenido de la Flashcard
            </p>

            <Campo label="Título de la flashcard *">
              <Input
                placeholder="Ej: Derivada de una función potencia"
                value={form.flashcard.titulo}
                onChange={e => setFlashcard('titulo', e.target.value)}
              />
            </Campo>

            <Campo label="Frente (pregunta) *">
              <Textarea
                placeholder="¿Cuál es la derivada de xⁿ?"
                value={form.flashcard.frente}
                onChange={e => setFlashcard('frente', e.target.value)}
                style={{ minHeight: 80 }}
              />
            </Campo>

            <Campo label="Reverso (respuesta) *">
              <Textarea
                placeholder="n · xⁿ⁻¹"
                value={form.flashcard.reverso}
                onChange={e => setFlashcard('reverso', e.target.value)}
                style={{ minHeight: 80 }}
              />
            </Campo>
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
              background: cargando ? 'rgba(99,102,241,0.4)' : COLOR,
              border: 'none', color: 'white',
              fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s',
            }}
          >
            {cargando ? 'Creando...' : 'Crear recurso'}
          </button>
        </div>

      </div>
    </div>
  );
}