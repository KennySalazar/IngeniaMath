import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ejercicioService } from '../../services/ejercicioService';
import MathRenderer from '../../components/ejercicios/MathRenderer';
import './CrearEjercicioPage.css';

const NIVELES = [
  { value: 'BASICO',       label: 'Básico'          },
  { value: 'INTERMEDIO',   label: 'Intermedio'      },
  { value: 'AVANZADO',     label: 'Avanzado'        },
  { value: 'EXAMEN_REAL',  label: 'Nivel examen real'},
];

const TIPOS = [
  { value: 'OPCION_MULTIPLE',    label: 'Opción múltiple'       },
  { value: 'VERDADERO_FALSO',    label: 'Verdadero / Falso'     },
  { value: 'RESPUESTA_NUMERICA', label: 'Respuesta numérica'    },
  { value: 'COMPLETAR_ESPACIOS', label: 'Completar espacios'    },
];

const OPCIONES_INICIALES = [
  { texto_opcion: '', es_correcta: true  },
  { texto_opcion: '', es_correcta: false },
  { texto_opcion: '', es_correcta: false },
  { texto_opcion: '', es_correcta: false },
];

export default function CrearEjercicioPage() {
  const navigate      = useNavigate();
  const [searchParams] = useSearchParams();
  const editarId      = searchParams.get('editar');

  const [modulos,  setModulos]  = useState([]);
  const [subtemas, setSubtemas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error,    setError]    = useState('');
  const [advertencia, setAdvertencia] = useState('');
  const [preview,  setPreview]  = useState(false);

  const [form, setForm] = useState({
    modulo_id:                '',
    subtema_id:               '',
    nivel_dificultad:         'BASICO',
    tipo_ejercicio:           'OPCION_MULTIPLE',
    enunciado:                '',
    solucion_paso_a_paso:     '',
    explicacion_conceptual:   '',
    respuesta_correcta_texto: '',
    tiempo_estimado_minutos:  5,
    imagen_apoyo_url:         '',
  });

  const [opciones, setOpciones] = useState(OPCIONES_INICIALES);

  // Carga módulos al montar
  useEffect(() => {
    ejercicioService.listarModulos()
      .then(setModulos)
      .catch(() => setError('Error al cargar módulos.'));
  }, []);

  // Carga subtemas cuando cambia el módulo
  useEffect(() => {
    if (!form.modulo_id) { setSubtemas([]); return; }
    ejercicioService.listarSubtemas(form.modulo_id)
      .then(setSubtemas)
      .catch(() => {});
  }, [form.modulo_id]);

  // Si viene parámetro editar, carga el ejercicio
  useEffect(() => {
    if (!editarId) return;
    ejercicioService.verDetalle(editarId).then(e => {
      setForm({
        modulo_id:                e.modulo?.id        ?? '',
        subtema_id:               e.subtema?.id       ?? '',
        nivel_dificultad:         e.nivel_dificultad,
        tipo_ejercicio:           e.tipo_ejercicio,
        enunciado:                e.enunciado,
        solucion_paso_a_paso:     e.solucion_paso_a_paso,
        explicacion_conceptual:   e.explicacion_conceptual   ?? '',
        respuesta_correcta_texto: e.respuesta_correcta_texto ?? '',
        tiempo_estimado_minutos:  e.tiempo_estimado_minutos,
        imagen_apoyo_url:         e.imagen_apoyo_url ?? '',
      });
      if (e.opciones?.length > 0) {
        setOpciones(e.opciones.map(o => ({
          texto_opcion: o.texto,
          es_correcta:  o.es_correcta,
        })));
      }
    });
  }, [editarId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'tiempo_estimado_minutos' ? parseInt(value) : value,
    }));
  };

  const handleOpcionChange = (index, campo, valor) => {
    setOpciones(prev => prev.map((op, i) => {
      if (i !== index) return op;
      return { ...op, [campo]: valor };
    }));
  };

  const marcarCorrecta = (index) => {
    setOpciones(prev => prev.map((op, i) => ({
      ...op,
      es_correcta: i === index,
    })));
  };

  const agregarOpcion = () => {
    if (opciones.length >= 6) return;
    setOpciones(prev => [...prev, { texto_opcion: '', es_correcta: false }]);
  };

  const quitarOpcion = (index) => {
    if (opciones.length <= 2) return;
    setOpciones(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setAdvertencia('');
    setCargando(true);

    try {
      const payload = { ...form };

      if (form.tipo_ejercicio === 'OPCION_MULTIPLE') {
        const tieneCorrecta = opciones.some(o => o.es_correcta);
        if (!tieneCorrecta) {
          setError('Debes marcar al menos una opción como correcta.');
          setCargando(false);
          return;
        }
        payload.opciones = opciones.filter(o => o.texto_opcion.trim() !== '');
      }

      let resultado;
      if (editarId) {
        resultado = await ejercicioService.editar(editarId, payload);
      } else {
        resultado = await ejercicioService.crear(payload);
      }

      if (resultado.advertencia) {
        setAdvertencia(resultado.advertencia);
      }

      navigate('/tutor/ejercicios');
    } catch (err) {
      const errores = err.response?.data?.errors;
      if (errores) {
        setError(Object.values(errores).flat().join(' '));
      } else {
        setError(err.response?.data?.message ?? 'Error al guardar el ejercicio.');
      }
    } finally {
      setCargando(false);
    }
  };

  const necesitaOpciones = form.tipo_ejercicio === 'OPCION_MULTIPLE';
  const necesitaRespuestaTexto = ['VERDADERO_FALSO', 'RESPUESTA_NUMERICA', 'COMPLETAR_ESPACIOS']
    .includes(form.tipo_ejercicio);

  return (
    <div className="crear-ejercicio-page">
      <div className="crear-header">
        <div>
          <h2>{editarId ? 'Editar ejercicio' : 'Nuevo ejercicio'}</h2>
          <p>Usa $formula$ para fórmulas inline y $$formula$$ para bloque</p>
        </div>
        <div className="crear-header-acciones">
          <button
            type="button"
            className={`btn-preview ${preview ? 'activo' : ''}`}
            onClick={() => setPreview(!preview)}
          >
            {preview ? 'Ocultar preview' : 'Ver preview'}
          </button>
          <button
            type="button"
            className="btn-cancelar"
            onClick={() => navigate('/tutor/ejercicios')}
          >
            Cancelar
          </button>
        </div>
      </div>

      {error && <div className="crear-error">⚠ {error}</div>}

      {advertencia && (
        <div className="crear-advertencia">
          ⚠ {advertencia}
        </div>
      )}

      <form onSubmit={handleSubmit} className="crear-form">
        <div className="crear-grid-2">
          {/* Módulo */}
          <div className="crear-field">
            <label>Módulo temático *</label>
            <select name="modulo_id" value={form.modulo_id} onChange={handleChange} required>
              <option value="">Selecciona un módulo</option>
              {modulos.map(m => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </div>

          {/* Subtema */}
          <div className="crear-field">
            <label>Subtema *</label>
            <select
              name="subtema_id"
              value={form.subtema_id}
              onChange={handleChange}
              required
              disabled={!form.modulo_id}
            >
              <option value="">
                {form.modulo_id ? 'Selecciona un subtema' : 'Primero selecciona módulo'}
              </option>
              {subtemas.map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>

          {/* Nivel */}
          <div className="crear-field">
            <label>Nivel de dificultad *</label>
            <select name="nivel_dificultad" value={form.nivel_dificultad} onChange={handleChange}>
              {NIVELES.map(n => (
                <option key={n.value} value={n.value}>{n.label}</option>
              ))}
            </select>
          </div>

          {/* Tipo */}
          <div className="crear-field">
            <label>Tipo de ejercicio *</label>
            <select name="tipo_ejercicio" value={form.tipo_ejercicio} onChange={handleChange}>
              {TIPOS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Tiempo */}
          <div className="crear-field">
            <label>Tiempo estimado (minutos) *</label>
            <input
              type="number"
              name="tiempo_estimado_minutos"
              value={form.tiempo_estimado_minutos}
              onChange={handleChange}
              min={1}
              max={120}
              required
            />
          </div>

          {/* URL imagen */}
          <div className="crear-field">
            <label>URL de imagen de apoyo (opcional)</label>
            <input
              type="text"
              name="imagen_apoyo_url"
              value={form.imagen_apoyo_url}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Enunciado */}
        <div className="crear-field">
          <label>Enunciado del problema * (soporta LaTeX: $x^2$)</label>
          <textarea
            name="enunciado"
            value={form.enunciado}
            onChange={handleChange}
            rows={4}
            required
            minLength={10}
            placeholder="Escribe el enunciado aquí. Usa $formula$ para matemáticas."
          />
          {preview && form.enunciado && (
            <div className="math-preview">
              <span className="math-preview-label">Preview:</span>
              <MathRenderer texto={form.enunciado} />
            </div>
          )}
        </div>

        {/* Opciones para opción múltiple */}
        {necesitaOpciones && (
          <div className="crear-opciones">
            <label>Opciones de respuesta * (marca la correcta)</label>
            {opciones.map((op, i) => (
              <div key={i} className="opcion-row">
                <button
                  type="button"
                  className={`opcion-radio ${op.es_correcta ? 'correcta' : ''}`}
                  onClick={() => marcarCorrecta(i)}
                  title="Marcar como correcta"
                >
                  {op.es_correcta ? '●' : '○'}
                </button>
                <input
                  type="text"
                  value={op.texto_opcion}
                  onChange={e => handleOpcionChange(i, 'texto_opcion', e.target.value)}
                  placeholder={`Opción ${i + 1}`}
                  className="opcion-input"
                />
                {preview && op.texto_opcion && (
                  <div className="opcion-preview">
                    <MathRenderer texto={op.texto_opcion} />
                  </div>
                )}
                <button
                  type="button"
                  className="opcion-quitar"
                  onClick={() => quitarOpcion(i)}
                  disabled={opciones.length <= 2}
                >
                  ✕
                </button>
              </div>
            ))}
            {opciones.length < 6 && (
              <button type="button" className="btn-agregar-opcion" onClick={agregarOpcion}>
                + Agregar opción
              </button>
            )}
          </div>
        )}

        {/* Respuesta correcta para otros tipos */}
        {necesitaRespuestaTexto && (
          <div className="crear-field">
            <label>Respuesta correcta *</label>
            <input
              type="text"
              name="respuesta_correcta_texto"
              value={form.respuesta_correcta_texto}
              onChange={handleChange}
              placeholder={
                form.tipo_ejercicio === 'VERDADERO_FALSO'
                  ? 'Verdadero o Falso'
                  : 'Escribe la respuesta correcta'
              }
            />
          </div>
        )}

        {/* Solución paso a paso */}
        <div className="crear-field">
          <label>Solución paso a paso * (soporta LaTeX)</label>
          <textarea
            name="solucion_paso_a_paso"
            value={form.solucion_paso_a_paso}
            onChange={handleChange}
            rows={5}
            required
            minLength={10}
            placeholder="Explica la solución detalladamente. Usa $formula$ para matemáticas."
          />
          {preview && form.solucion_paso_a_paso && (
            <div className="math-preview">
              <span className="math-preview-label">Preview:</span>
              <MathRenderer texto={form.solucion_paso_a_paso} />
            </div>
          )}
        </div>

        {/* Explicación conceptual */}
        <div className="crear-field">
          <label>Explicación conceptual (opcional)</label>
          <textarea
            name="explicacion_conceptual"
            value={form.explicacion_conceptual}
            onChange={handleChange}
            rows={3}
            placeholder="Concepto teórico relacionado con este ejercicio."
          />
        </div>

        <div className="crear-actions">
          <button type="submit" className="btn-guardar" disabled={cargando}>
            {cargando
              ? 'Guardando...'
              : editarId ? 'Guardar cambios' : 'Crear ejercicio'}
          </button>
        </div>
      </form>
    </div>
  );
}