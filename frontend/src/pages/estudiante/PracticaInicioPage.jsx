import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ejercicioService } from '../../services/ejercicioService';
import { practicaService } from '../../services/practicaService';
import './PracticaInicioPage.css';

const NIVELES = ['BASICO', 'INTERMEDIO', 'AVANZADO', 'EXAMEN_REAL'];

export default function PracticaInicioPage() {
  const navigate = useNavigate();

  const [modulos, setModulos] = useState([]);
  const [subtemas, setSubtemas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [iniciandoLibre, setIniciandoLibre] = useState(false);
  const [iniciandoGuiada, setIniciandoGuiada] = useState(false);
  const [error, setError] = useState('');
  const [sesionActiva, setSesionActiva] = useState(null);
  const [resumenActivo, setResumenActivo] = useState(null);

  const [formulario, setFormulario] = useState({
    modulo_id: '',
    subtema_id: '',
    nivel_dificultad: 'BASICO',
  });

  useEffect(() => {
    cargarInicial();
  }, []);

  async function cargarInicial() {
    try {
      setCargando(true);
      setError('');

      const [modulosData, activaData] = await Promise.all([
        ejercicioService.listarModulos(),
        practicaService.activa(),
      ]);

      setModulos(Array.isArray(modulosData) ? modulosData : []);
      setSesionActiva(activaData?.activa ? activaData.sesion : null);
      setResumenActivo(activaData?.activa ? activaData.resumen : null);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudieron cargar los datos de practica.');
    } finally {
      setCargando(false);
    }
  }

  async function cargarSubtemas(moduloId) {
    if (!moduloId) {
      setSubtemas([]);
      return;
    }

    try {
      const data = await ejercicioService.listarSubtemas(moduloId);
      setSubtemas(Array.isArray(data) ? data : []);
    } catch (e) {
      setSubtemas([]);
    }
  }

  function continuarSesion() {
    if (!sesionActiva?.id) {
      return;
    }

    navigate(`/estudiante/practica/sesion/${sesionActiva.id}`);
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setFormulario(prev => {
      const next = { ...prev, [name]: value };

      if (name === 'modulo_id') {
        next.subtema_id = '';
      }

      return next;
    });

    if (name === 'modulo_id') {
      cargarSubtemas(value);
    }
  }

  async function iniciarLibre(e) {
    e.preventDefault();
    setError('');

    if (!formulario.modulo_id) {
      setError('Debes seleccionar un modulo.');
      return;
    }

    try {
      setIniciandoLibre(true);

      const data = await practicaService.iniciar({
        modo: 'LIBRE',
        modulo_id: Number(formulario.modulo_id),
        subtema_id: formulario.subtema_id ? Number(formulario.subtema_id) : null,
        nivel_dificultad: formulario.nivel_dificultad,
      });

      navigate(`/estudiante/practica/sesion/${data.sesion.id}`);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo iniciar la practica libre.');
    } finally {
      setIniciandoLibre(false);
    }
  }

  async function iniciarGuiada() {
    setError('');

    try {
      setIniciandoGuiada(true);

      const data = await practicaService.iniciar({
        modo: 'GUIADA',
      });

      navigate(`/estudiante/practica/sesion/${data.sesion.id}`);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo iniciar la practica guiada.');
    } finally {
      setIniciandoGuiada(false);
    }
  }

  if (cargando) {
    return <div className="practica-inicio-loading">Cargando practica...</div>;
  }

  return (
    <div className="practica-inicio-page">
      <div className="practica-inicio-hero practica-inicio-hero-row">
        <div>
          <h1 className="practica-inicio-titulo">Modulo de practica</h1>
          <p className="practica-inicio-subtitulo">
            Elige entre practica guiada segun tu ruta o practica libre por modulo y nivel.
          </p>
        </div>

       <div className="practica-inicio-hero-actions">
        <button
            className="practica-inicio-btn practica-inicio-btn-secundario"
            onClick={() => navigate('/estudiante/practica/guardados')}
        >
            Mis guardados
        </button>

        <button
            className="practica-inicio-btn practica-inicio-btn-secundario"
            onClick={() => navigate('/estudiante/practica/historial')}
        >
            Historial
        </button>
        </div>
      </div>

      {error ? (
        <div className="practica-inicio-error">{error}</div>
      ) : null}

      {sesionActiva ? (
        <div className="practica-inicio-activa">
          <div className="practica-inicio-activa-header">
            <div className="practica-inicio-badge practica-badge-guiada">
              {sesionActiva.modo === 'GUIADA' ? 'G' : 'L'}
            </div>

            <div className="practica-inicio-activa-info">
              <h2>Ya tienes una sesion activa</h2>
              <p>
                {sesionActiva.modo} · {sesionActiva.modulo_nombre || 'Modulo'} · {sesionActiva.subtema_nombre || 'General'} · {sesionActiva.nivel_dificultad || 'N/A'}
              </p>
            </div>
          </div>

          <div className="practica-inicio-activa-stats">
            <div className="practica-inicio-activa-stat">
              <span>Total</span>
              <strong>{resumenActivo?.total_ejercicios || 0}</strong>
            </div>
            <div className="practica-inicio-activa-stat">
              <span>Correctos</span>
              <strong>{resumenActivo?.total_correctos || 0}</strong>
            </div>
            <div className="practica-inicio-activa-stat">
              <span>Aciertos</span>
              <strong>{resumenActivo?.porcentaje_aciertos || 0}%</strong>
            </div>
            <div className="practica-inicio-activa-stat">
              <span>Minutos</span>
              <strong>{resumenActivo?.tiempo_total_minutos || 0}</strong>
            </div>
          </div>

          <div className="practica-inicio-activa-actions">
            <button
                type="button"
                className="practica-inicio-btn practica-inicio-btn-guiada"
                onClick={continuarSesion}
            >
                Continuar sesion activa
            </button>

            <button
                type="button"
                className="practica-inicio-btn practica-inicio-btn-secundario"
                onClick={() => navigate('/estudiante/practica/guardados')}
            >
                Mis guardados
            </button>

            <button
                type="button"
                className="practica-inicio-btn practica-inicio-btn-secundario"
                onClick={() => navigate('/estudiante/practica/historial')}
            >
                Historial
            </button>
            </div>
        </div>
      ) : null}

      <div className="practica-inicio-grid">
        <div className="practica-inicio-card">
          <div className="practica-inicio-badge practica-badge-guiada">G</div>
          <h2 className="practica-inicio-card-titulo">Practica guiada</h2>
          <p className="practica-inicio-card-texto">
            El sistema toma tu ruta activa, prioriza tus debilidades y ajusta el nivel segun tu rendimiento.
          </p>

          <div className="practica-inicio-lista">
            <span>Ruta activa del estudiante</span>
            <span>Prioridad por subtema pendiente</span>
            <span>Sube o baja dificultad automaticamente</span>
            <span>No repite ejercicios acertados en 7 dias</span>
          </div>

          <button
            type="button"
            className="practica-inicio-btn practica-inicio-btn-guiada"
            onClick={sesionActiva ? continuarSesion : iniciarGuiada}
            disabled={iniciandoGuiada || !!sesionActiva}
          >
            {sesionActiva
              ? 'Tienes una sesion activa'
              : (iniciandoGuiada ? 'Iniciando...' : 'Iniciar practica guiada')}
          </button>
        </div>

        <div className="practica-inicio-card">
          <div className="practica-inicio-badge practica-badge-libre">L</div>
          <h2 className="practica-inicio-card-titulo">Practica libre</h2>
          <p className="practica-inicio-card-texto">
            Tu eliges el modulo, subtema y nivel para practicar de forma manual.
          </p>

          <form className="practica-inicio-form" onSubmit={iniciarLibre}>
            <div className="practica-inicio-campo">
              <label>Modulo</label>
              <select
                name="modulo_id"
                value={formulario.modulo_id}
                onChange={handleChange}
                disabled={!!sesionActiva}
              >
                <option value="">Selecciona un modulo</option>
                {modulos.map(modulo => (
                  <option key={modulo.id} value={modulo.id}>
                    {modulo.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="practica-inicio-campo">
              <label>Subtema</label>
              <select
                name="subtema_id"
                value={formulario.subtema_id}
                onChange={handleChange}
                disabled={!formulario.modulo_id || !!sesionActiva}
              >
                <option value="">Todos los subtemas</option>
                {subtemas.map(subtema => (
                  <option key={subtema.id} value={subtema.id}>
                    {subtema.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="practica-inicio-campo">
              <label>Nivel</label>
              <select
                name="nivel_dificultad"
                value={formulario.nivel_dificultad}
                onChange={handleChange}
                disabled={!!sesionActiva}
              >
                {NIVELES.map(nivel => (
                  <option key={nivel} value={nivel}>
                    {nivel}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="practica-inicio-btn practica-inicio-btn-libre"
              disabled={iniciandoLibre || !!sesionActiva}
            >
              {sesionActiva
                ? 'Tienes una sesion activa'
                : (iniciandoLibre ? 'Iniciando...' : 'Iniciar practica libre')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}