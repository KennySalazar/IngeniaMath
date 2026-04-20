import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MathRenderer from '../../components/ejercicios/MathRenderer';
import { practicaService } from '../../services/practicaService';
import './PracticaGuardadosPage.css';

export default function PracticaGuardadosPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [eliminandoId, setEliminandoId] = useState(null);
  const [abiertoId, setAbiertoId] = useState(null);
  const [sesionActiva, setSesionActiva] = useState(null);

  useEffect(() => {
    cargarGuardados();
  }, []);

  async function cargarGuardados() {
    try {
      setCargando(true);
      setError('');

      const data = await practicaService.guardados();
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(Number(data.total || 0));
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudieron cargar los ejercicios guardados.');
    } finally {
      setCargando(false);
    }
  }

  async function eliminarGuardado(ejercicioId) {
  try {
    setEliminandoId(ejercicioId);
    setError('');

    await practicaService.eliminarGuardado(ejercicioId);

    setItems(prev => prev.filter(item => item.ejercicio_id !== ejercicioId));
    setTotal(prev => Math.max(0, prev - 1));

    if (abiertoId === ejercicioId) {
      setAbiertoId(null);
    }
  } catch (e) {
    setError(e.response?.data?.message || 'No se pudo eliminar el ejercicio guardado.');
  } finally {
    setEliminandoId(null);
  }
}

  function toggleDetalle(ejercicioId) {
    setAbiertoId(prev => (prev === ejercicioId ? null : ejercicioId));
  }

  if (cargando) {
    return <div className="practica-guardados-loading">Cargando guardados...</div>;
  }

  return (
    <div className="practica-guardados-page">
      <div className="practica-guardados-hero">
        <div>
          <h1 className="practica-guardados-titulo">Mis ejercicios guardados</h1>
          <p className="practica-guardados-subtitulo">
            Aqui puedes revisar ejercicios que marcaste para estudiar despues.
          </p>
        </div>

        <div className="practica-guardados-top-actions">
          <button
            className="practica-guardados-btn practica-guardados-btn-secundario"
            onClick={() => navigate('/estudiante/practica')}
          >
            Ir a practica
          </button>
        </div>
      </div>

      {error ? <div className="practica-guardados-error">{error}</div> : null}

      <div className="practica-guardados-resumen">
        <div className="practica-guardados-stat">
          <span>Total guardados</span>
          <strong>{total}</strong>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="practica-guardados-empty">
          <h2>No tienes ejercicios guardados</h2>
          <p>Marca ejercicios durante una sesion de practica para revisarlos aqui.</p>
          <button
            className="practica-guardados-btn practica-guardados-btn-primario"
            onClick={() => navigate('/estudiante/practica')}
          >
            Ir a practicar
          </button>
        </div>
      ) : (
        <div className="practica-guardados-lista">
          {items.map(item => {
            const abierto = abiertoId === item.ejercicio_id;

            return (
              <div key={item.ejercicio_id} className="practica-guardados-card">
                <div className="practica-guardados-card-top">
                  <div className="practica-guardados-tags">
                    <span className="practica-guardados-tag">{item.tipo_ejercicio}</span>
                    <span className="practica-guardados-tag">{item.nivel_dificultad}</span>
                    <span className="practica-guardados-tag">{item.modulo_nombre}</span>
                    {item.subtema_nombre ? (
                      <span className="practica-guardados-tag">{item.subtema_nombre}</span>
                    ) : null}
                  </div>

                  <div className="practica-guardados-meta">
                    Guardado: {new Date(item.fecha_guardado).toLocaleString()}
                  </div>
                </div>

                <div className="practica-guardados-enunciado">
                  <MathRenderer texto={item.enunciado} />
                </div>

                {item.imagen_apoyo_url ? (
                  <img
                    src={item.imagen_apoyo_url}
                    alt="Apoyo"
                    className="practica-guardados-imagen"
                  />
                ) : null}

                <div className="practica-guardados-actions">
                  <button
                    className="practica-guardados-btn practica-guardados-btn-primario"
                    onClick={() => toggleDetalle(item.ejercicio_id)}
                  >
                    {abierto ? 'Ocultar detalle' : 'Ver detalle'}
                  </button>

                  <button
                    className="practica-guardados-btn practica-guardados-btn-peligro"
                    onClick={() => eliminarGuardado(item.ejercicio_id)}
                    disabled={eliminandoId === item.ejercicio_id}
                  >
                    {eliminandoId === item.ejercicio_id ? 'Eliminando...' : 'Quitar de guardados'}
                  </button>
                </div>

                {abierto ? (
                  <div className="practica-guardados-detalle">
                    <div className="practica-guardados-bloque">
                      <h3>Respuesta correcta</h3>
                      <div className="practica-guardados-render">
                        <MathRenderer texto={item.respuesta_correcta_texto || 'No disponible'} />
                      </div>
                    </div>

                    <div className="practica-guardados-bloque">
                      <h3>Solucion paso a paso</h3>
                      <div className="practica-guardados-render">
                        <MathRenderer texto={item.solucion_paso_a_paso || 'No disponible'} />
                      </div>
                    </div>

                    <div className="practica-guardados-bloque">
                      <h3>Explicacion conceptual</h3>
                      <div className="practica-guardados-render">
                        <MathRenderer texto={item.explicacion_conceptual || 'No disponible'} />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}