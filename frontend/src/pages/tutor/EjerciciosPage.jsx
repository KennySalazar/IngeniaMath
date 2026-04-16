import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ejercicioService } from '../../services/ejercicioService';
import BadgeEstado from '../../components/ejercicios/BadgeEstado';
import MathRenderer from '../../components/ejercicios/MathRenderer';
import './EjerciciosPage.css';

const NIVELES = {
  BASICO:      'Básico',
  INTERMEDIO:  'Intermedio',
  AVANZADO:    'Avanzado',
  EXAMEN_REAL: 'Examen real',
};

export default function EjerciciosPage() {
  const navigate = useNavigate();

  const [ejercicios, setEjercicios] = useState([]);
  const [modulos,    setModulos]    = useState([]);
  const [cargando,   setCargando]   = useState(true);
  const [filtros,    setFiltros]    = useState({
    modulo_id: '', nivel_dificultad: '', estado: '', buscar: '',
  });
  const [confirmEnviar, setConfirmEnviar] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const data = await ejercicioService.listar(filtros);
      setEjercicios(data.data ?? []);
    } catch {
      setEjercicios([]);
    } finally {
      setCargando(false);
    }
  }, [filtros]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    ejercicioService.listarModulos().then(setModulos).catch(() => {});
  }, []);

  const handleEnviarRevision = async (id) => {
    try {
      await ejercicioService.enviarRevision(id);
      setConfirmEnviar(null);
      cargar();
    } catch (err) {
      alert(err.response?.data?.message ?? 'Error al enviar a revisión.');
    }
  };

  const handleFiltro = (e) => {
    setFiltros(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="ejercicios-page">
      {/* Toolbar */}
      <div className="ejercicios-toolbar">
        <input
          className="toolbar-search"
          placeholder="Buscar en enunciados..."
          name="buscar"
          value={filtros.buscar}
          onChange={handleFiltro}
        />

        <select className="toolbar-select" name="modulo_id" value={filtros.modulo_id} onChange={handleFiltro}>
          <option value="">Todos los módulos</option>
          {modulos.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </select>

        <select className="toolbar-select" name="nivel_dificultad" value={filtros.nivel_dificultad} onChange={handleFiltro}>
          <option value="">Todos los niveles</option>
          {Object.entries(NIVELES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>

        <select className="toolbar-select" name="estado" value={filtros.estado} onChange={handleFiltro}>
          <option value="">Todos los estados</option>
          <option value="BORRADOR">Borrador</option>
          <option value="EN_REVISION">En revisión</option>
          <option value="APROBADO">Aprobado</option>
          <option value="PUBLICADO">Publicado</option>
          <option value="DESHABILITADO">Deshabilitado</option>
        </select>

        <button
          className="btn-nuevo"
          onClick={() => navigate('/tutor/ejercicios/crear')}
        >
          + Nuevo ejercicio
        </button>
      </div>

      {/* Tabla */}
      <div className="tabla-wrapper">
        {cargando ? (
          <div className="tabla-cargando">Cargando ejercicios...</div>
        ) : ejercicios.length === 0 ? (
          <div className="tabla-vacia">No hay ejercicios que coincidan con los filtros.</div>
        ) : (
          <table className="tabla-ejercicios">
            <thead>
              <tr>
                <th>Enunciado</th>
                <th>Módulo</th>
                <th>Nivel</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ejercicios.map(e => (
                <tr key={e.id}>
                  <td className="td-enunciado">
                    <div className="enunciado-preview">
                      <MathRenderer texto={e.enunciado.substring(0, 80) + (e.enunciado.length > 80 ? '...' : '')} />
                    </div>
                    {e.advertencia_duplicado && (
                      <span className="badge-duplicado">posible duplicado</span>
                    )}
                  </td>
                  <td>
                    <div className="td-modulo">{e.modulo?.nombre}</div>
                    <div className="td-subtema">{e.subtema?.nombre}</div>
                  </td>
                  <td>
                    <span className="badge-nivel">{NIVELES[e.nivel_dificultad]}</span>
                  </td>
                  <td className="td-tipo">{e.tipo_ejercicio.replace('_', ' ')}</td>
                  <td><BadgeEstado estado={e.estado} /></td>
                  <td>
                    <div className="td-acciones">
                      <button
                        className="btn-accion btn-ver"
                        onClick={() => navigate(`/tutor/ejercicios/${e.id}`)}
                      >
                        Ver
                      </button>
                      {e.estado === 'BORRADOR' && (
                        <>
                          <button
                            className="btn-accion btn-editar"
                            onClick={() => navigate(`/tutor/ejercicios/crear?editar=${e.id}`)}
                          >
                            Editar
                          </button>
                          <button
                            className="btn-accion btn-enviar"
                            onClick={() => setConfirmEnviar(e)}
                          >
                            Enviar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Confirmación enviar a revisión */}
      {confirmEnviar && (
        <div className="modal-overlay" onClick={() => setConfirmEnviar(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2>Enviar a revisión</h2>
            <p>
              ¿Enviar el ejercicio <strong>#{confirmEnviar.id}</strong> a revisión?
              Una vez enviado no podrás editarlo hasta que sea rechazado.
            </p>
            <div className="modal-actions">
              <button className="btn-cancelar-modal" onClick={() => setConfirmEnviar(null)}>
                Cancelar
              </button>
              <button
                className="btn-confirmar"
                onClick={() => handleEnviarRevision(confirmEnviar.id)}
              >
                Sí, enviar a revisión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}