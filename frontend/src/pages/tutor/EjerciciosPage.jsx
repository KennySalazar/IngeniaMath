import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ejercicioService } from '../../services/ejercicioService';
import BadgeEstado from '../../components/ejercicios/BadgeEstado';
import MathRenderer from '../../components/ejercicios/MathRenderer';
import './EjerciciosPage.css';

const NIVELES = {
  BASICO: 'Básico',
  INTERMEDIO: 'Intermedio',
  AVANZADO: 'Avanzado',
  EXAMEN_REAL: 'Examen real',
};

export default function EjerciciosPage() {
  const navigate = useNavigate();

  const [ejercicios, setEjercicios] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [confirmEnviar, setConfirmEnviar] = useState(null);

  const [pagina, setPagina] = useState(1);
  const [totalEjs, setTotalEjs] = useState(0);
  const [ultimaPag, setUltimaPag] = useState(1);
  const POR_PAGINA = 10;

  const [filtros, setFiltros] = useState({
    modulo_id: '',
    nivel_dificultad: '',
    estado: '',
    buscar: '',
  });

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const data = await ejercicioService.listar({
        ...filtros,
        per_page: POR_PAGINA,
        page: pagina,
      });

      setEjercicios(data.data ?? []);
      setTotalEjs(data.total ?? 0);
      setUltimaPag(data.ultima_pagina ?? 1);
    } catch {
      setEjercicios([]);
      setTotalEjs(0);
      setUltimaPag(1);
    } finally {
      setCargando(false);
    }
  }, [filtros, pagina]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    ejercicioService.listarModulos().then(setModulos).catch(() => {});
  }, []);

  const handleEnviarRevision = async (id) => {
    try {
      await ejercicioService.enviarRevision(id);
      setConfirmEnviar(null);

      if (ejercicios.length === 1 && pagina > 1) {
        setPagina((p) => p - 1);
        return;
      }

      cargar();
    } catch (err) {
      alert(err.response?.data?.message ?? 'Error al enviar a revisión.');
    }
  };

  const handleFiltro = (e) => {
    setPagina(1);
    setFiltros((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="ejercicios-page">
      <div className="ejercicios-toolbar">
        <input
          className="toolbar-search"
          placeholder="Buscar en enunciados..."
          name="buscar"
          value={filtros.buscar}
          onChange={handleFiltro}
        />

        <select
          className="toolbar-select"
          name="modulo_id"
          value={filtros.modulo_id}
          onChange={handleFiltro}
        >
          <option value="">Todos los módulos</option>
          {modulos.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre}
            </option>
          ))}
        </select>

        <select
          className="toolbar-select"
          name="nivel_dificultad"
          value={filtros.nivel_dificultad}
          onChange={handleFiltro}
        >
          <option value="">Todos los niveles</option>
          {Object.entries(NIVELES).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>

        <select
          className="toolbar-select"
          name="estado"
          value={filtros.estado}
          onChange={handleFiltro}
        >
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
              {ejercicios.map((e) => (
                <tr key={e.id}>
                  <td className="td-enunciado">
                    <div className="enunciado-preview">
                      <MathRenderer
                        texto={
                          e.enunciado.substring(0, 80) +
                          (e.enunciado.length > 80 ? '...' : '')
                        }
                      />
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

                  <td>
                    <BadgeEstado estado={e.estado} />
                  </td>

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

        {!cargando && totalEjs > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              fontFamily: 'DM Sans, sans-serif',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
              Mostrando {((pagina - 1) * POR_PAGINA) + 1}–
              {Math.min(pagina * POR_PAGINA, totalEjs)} de{' '}
              <strong style={{ color: 'rgba(255,255,255,0.6)' }}>
                {totalEjs}
              </strong>{' '}
              ejercicios
            </span>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
                style={{
                  padding: '6px 12px',
                  background:
                    pagina === 1
                      ? 'rgba(255,255,255,0.03)'
                      : 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color:
                    pagina === 1
                      ? 'rgba(255,255,255,0.2)'
                      : 'rgba(255,255,255,0.6)',
                  fontSize: 13,
                  cursor: pagina === 1 ? 'not-allowed' : 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                ← Anterior
              </button>

              {Array.from({ length: ultimaPag }, (_, i) => i + 1)
                .filter((n) => n === 1 || n === ultimaPag || Math.abs(n - pagina) <= 2)
                .reduce((acc, n, i, arr) => {
                  if (i > 0 && n - arr[i - 1] > 1) acc.push('...');
                  acc.push(n);
                  return acc;
                }, [])
                .map((item, i) =>
                  item === '...' ? (
                    <span
                      key={`sep-${i}`}
                      style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setPagina(item)}
                      style={{
                        width: 34,
                        height: 34,
                        background:
                          item === pagina ? '#6366f1' : 'rgba(255,255,255,0.05)',
                        border: '1px solid',
                        borderColor:
                          item === pagina ? '#6366f1' : 'rgba(255,255,255,0.1)',
                        borderRadius: 8,
                        color:
                          item === pagina ? 'white' : 'rgba(255,255,255,0.5)',
                        fontSize: 13,
                        fontWeight: item === pagina ? 700 : 400,
                        cursor: 'pointer',
                        fontFamily: 'DM Sans, sans-serif',
                      }}
                    >
                      {item}
                    </button>
                  )
                )}

              <button
                onClick={() => setPagina((p) => Math.min(ultimaPag, p + 1))}
                disabled={pagina === ultimaPag}
                style={{
                  padding: '6px 12px',
                  background:
                    pagina === ultimaPag
                      ? 'rgba(255,255,255,0.03)'
                      : 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color:
                    pagina === ultimaPag
                      ? 'rgba(255,255,255,0.2)'
                      : 'rgba(255,255,255,0.6)',
                  fontSize: 13,
                  cursor: pagina === ultimaPag ? 'not-allowed' : 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>

      {confirmEnviar && (
        <div className="modal-overlay" onClick={() => setConfirmEnviar(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2>Enviar a revisión</h2>
            <p>
              ¿Enviar el ejercicio <strong>#{confirmEnviar.id}</strong> a revisión?
              Una vez enviado no podrás editarlo hasta que sea rechazado.
            </p>
            <div className="modal-actions">
              <button
                className="btn-cancelar-modal"
                onClick={() => setConfirmEnviar(null)}
              >
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