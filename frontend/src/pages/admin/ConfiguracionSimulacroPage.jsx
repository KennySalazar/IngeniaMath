import { useEffect, useState } from 'react';
import { simulacroService } from '../../services/simulacroService';
import './ConfiguracionSimulacroPage.css';

export default function ConfiguracionSimulacroPage() {
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState({
    nombre: '',
    duracion_minutos: 90,
    puntaje_minimo_aprobacion: 61,
  });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  async function cargarConfiguracion() {
    try {
      setCargando(true);
      setError('');
      setMensaje('');

      const data = await simulacroService.obtenerConfiguracionAdmin();
      setConfig(data);
      setForm({
        nombre: data.nombre || '',
        duracion_minutos: Number(data.duracion_minutos || 90),
        puntaje_minimo_aprobacion: Number(data.puntaje_minimo_aprobacion || 61),
      });
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo cargar la configuracion de simulacro.');
    } finally {
      setCargando(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: name === 'nombre' ? value : Number(value),
    }));
  }

  async function guardar(e) {
    e.preventDefault();

    try {
      setGuardando(true);
      setError('');
      setMensaje('');

      const data = await simulacroService.actualizarConfiguracion({
        nombre: form.nombre.trim(),
        duracion_minutos: Number(form.duracion_minutos),
        puntaje_minimo_aprobacion: Number(form.puntaje_minimo_aprobacion),
      });

      setConfig(data);
      setForm({
        nombre: data.nombre || '',
        duracion_minutos: Number(data.duracion_minutos || 90),
        puntaje_minimo_aprobacion: Number(data.puntaje_minimo_aprobacion || 61),
      });
      setMensaje('Configuracion actualizada. Los nuevos simulacros usaran esta duracion.');
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo guardar la configuracion.');
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return <div className="config-simulacro-loading">Cargando configuracion...</div>;
  }

  return (
    <div className="config-simulacro-page">
      {error ? <div className="config-simulacro-error">{error}</div> : null}
      {mensaje ? <div className="config-simulacro-success">{mensaje}</div> : null}

      <div className="config-simulacro-grid">
        <form className="config-simulacro-card" onSubmit={guardar}>
          <div>
            <h2>Configuracion activa</h2>
            <p>
              Cambia la duracion del simulacro. Por defecto es de 90 minutos, pero el administrador puede definir otro tiempo para los nuevos intentos.
            </p>
          </div>

          <div className="config-simulacro-field">
            <label>Nombre</label>
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              maxLength={100}
              required
            />
          </div>

          <div className="config-simulacro-field">
            <label>Duracion del simulacro en minutos</label>
            <input
              type="number"
              name="duracion_minutos"
              min="1"
              max="240"
              value={form.duracion_minutos}
              onChange={handleChange}
              required
            />
          </div>

          <div className="config-simulacro-field">
            <label>Puntaje minimo de aprobacion</label>
            <input
              type="number"
              name="puntaje_minimo_aprobacion"
              min="0"
              max="100"
              step="0.01"
              value={form.puntaje_minimo_aprobacion}
              onChange={handleChange}
              required
            />
          </div>

          <div className="config-simulacro-actions">
            <button type="button" className="config-simulacro-btn config-simulacro-btn-secundario" onClick={cargarConfiguracion}>
              Recargar
            </button>
            <button type="submit" className="config-simulacro-btn config-simulacro-btn-primario" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar configuracion'}
            </button>
          </div>
        </form>

        <div className="config-simulacro-card">
          <h2>Vista actual</h2>

          {config ? (
            <>
              <div className="config-simulacro-stats">
                <div>
                  <span>Duracion</span>
                  <strong>{config.duracion_minutos} min</strong>
                </div>
                <div>
                  <span>Preguntas</span>
                  <strong>{config.cantidad_preguntas}</strong>
                </div>
                <div>
                  <span>Puntaje minimo</span>
                  <strong>{config.puntaje_minimo_aprobacion}%</strong>
                </div>
              </div>

              <div className="config-simulacro-distribucion">
                <h3>Distribucion por modulo</h3>
                {(config.distribucion || []).map(item => (
                  <div className="config-simulacro-distribucion-item" key={item.modulo_id}>
                    <span>{item.modulo_nombre}</span>
                    <strong>{item.cantidad_preguntas}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="config-simulacro-muted">No hay configuracion activa.</p>
          )}
        </div>
      </div>
    </div>
  );
}
