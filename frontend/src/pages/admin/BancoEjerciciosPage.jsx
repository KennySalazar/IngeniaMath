import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ejercicioService } from '../../services/ejercicioService';
import MathRenderer from '../../components/ejercicios/MathRenderer';
import BadgeEstado from '../../components/ejercicios/BadgeEstado';
import './BancoEjerciciosPage.css';

const NIVELES = {
  BASICO: 'Básico',
  INTERMEDIO: 'Intermedio',
  AVANZADO: 'Avanzado',
  EXAMEN_REAL: 'Nivel examen real',
};

const TIPOS = {
  OPCION_MULTIPLE: 'Opción múltiple',
  VERDADERO_FALSO: 'Verdadero / Falso',
  RESPUESTA_NUMERICA: 'Respuesta numérica',
  COMPLETAR_ESPACIOS: 'Completar espacios',
};

function ResumenEstados({ ejercicios }) {
  const conteo = {
    BORRADOR: 0,
    EN_REVISION: 0,
    APROBADO: 0,
    PUBLICADO: 0,
    DESHABILITADO: 0,
  };

  ejercicios.forEach((e) => {
    if (conteo[e.estado] !== undefined) conteo[e.estado]++;
  });

  const cards = [
    { estado: 'BORRADOR', color: '#9ca3af', label: 'Borrador' },
    { estado: 'EN_REVISION', color: '#fbbf24', label: 'En revisión' },
    { estado: 'APROBADO', color: '#818cf8', label: 'Aprobado' },
    { estado: 'PUBLICADO', color: '#10b981', label: 'Publicado' },
    { estado: 'DESHABILITADO', color: '#f87171', label: 'Deshabilitado' },
  ];

  return (
    <div className="banco-resumen-grid">
      {cards.map((c) => (
        <div
          key={c.estado}
          className="banco-stat-card"
          style={{ borderColor: `${c.color}33` }}
        >
          <span className="banco-stat-num" style={{ color: c.color }}>
            {conteo[c.estado]}
          </span>
          <span className="banco-stat-label">{c.label}</span>
        </div>
      ))}
    </div>
  );
}

function ModalConfirm({ ejercicio, accion, onConfirmar, onCerrar }) {
  const [cargando, setCargando] = useState(false);

  const config = {
    publicar: {
      titulo: 'Publicar ejercicio',
      mensaje:
        'El ejercicio quedará disponible para estudiantes en práctica, diagnóstico y simulacros.',
      btnLabel: 'Sí, publicar',
      btnClass: 'btn-confirm-publicar',
    },
    deshabilitar: {
      titulo: 'Deshabilitar ejercicio',
      mensaje:
        'El ejercicio dejará de aparecer para los estudiantes. Podrás volver a habilitarlo cuando quieras.',
      btnLabel: 'Sí, deshabilitar',
      btnClass: 'btn-confirm-deshabilitar',
    },
    rehabilitar: {
        titulo:   'Rehabilitar ejercicio',
        mensaje:  'El ejercicio volverá a estar disponible para los estudiantes.',
        btnLabel: 'Sí, rehabilitar',
        btnClass: 'btn-confirm-publicar',
        },
  }[accion];

  const handleConfirmar = async () => {
    setCargando(true);
    try {
      await onConfirmar();
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2>{config.titulo}</h2>

        <div className="modal-ejercicio-preview">
          <p className="modal-enunciado-text">
            <MathRenderer texto={ejercicio.enunciado.substring(0, 120) + '...'} />
          </p>
          <p className="modal-ejercicio-meta">
            {ejercicio.modulo?.nombre} › {ejercicio.subtema?.nombre}
            &nbsp;·&nbsp;
            {NIVELES[ejercicio.nivel_dificultad]}
            &nbsp;·&nbsp;ID #{ejercicio.id}
          </p>
        </div>

        <p className="modal-mensaje">{config.mensaje}</p>

        <div className="modal-actions">
          <button className="btn-cancelar-modal" onClick={onCerrar}>
            Cancelar
          </button>
          <button
            className={config.btnClass}
            onClick={handleConfirmar}
            disabled={cargando}
          >
            {cargando ? 'Procesando...' : config.btnLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BancoEjerciciosPage() {
  const navigate = useNavigate();

  const [ejercicios, setEjercicios] = useState([]);
  const [todosParaStats, setTodosParaStats] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(null);

  const [pagina, setPagina] = useState(1);
  const [totalEjs, setTotalEjs] = useState(0);
  const [ultimaPag, setUltimaPag] = useState(1);
  const POR_PAGINA = 15;

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

  const cargarStats = useCallback(async () => {
    try {
      const data = await ejercicioService.listar({});
      setTodosParaStats(data.data ?? []);
    } catch {
      setTodosParaStats([]);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    cargarStats();
  }, [cargarStats]);

  useEffect(() => {
    ejercicioService.listarModulos().then(setModulos).catch(() => {});
  }, []);

  const handleFiltro = (e) => {
    setPagina(1);
    setFiltros((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

 const handleAccion = async () => {
  const { ejercicio, accion } = modal;
  try {
    if (accion === 'publicar') {
      await ejercicioService.publicar(ejercicio.id);
    } else if (accion === 'deshabilitar') {
      await ejercicioService.deshabilitar(ejercicio.id);
    } else if (accion === 'rehabilitar') {
      await ejercicioService.publicar(ejercicio.id); // vuelve a PUBLICADO
    }
    setModal(null);
    cargar();
    cargarStats();
  } catch (err) {
    alert(err.response?.data?.message ?? 'Error al procesar la acción.');
    setModal(null);
  }
};

const accionesDisponibles = (e) => {
  const acciones = [];
  if (e.estado === 'APROBADO')      acciones.push('publicar');
  if (e.estado === 'PUBLICADO')     acciones.push('deshabilitar');
  if (e.estado === 'DESHABILITADO') acciones.push('rehabilitar');
  return acciones;
};

  return (
    <div className="banco-page">
      <ResumenEstados ejercicios={todosParaStats} />

      <div className="banco-toolbar">
        <input
          className="toolbar-search"
          name="buscar"
          placeholder="Buscar en enunciados..."
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
          {Object.entries(NIVELES).map(([valor, label]) => (
            <option key={valor} value={valor}>
              {label}
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
      </div>

      <div className="tabla-wrapper">
        {cargando ? (
          <div className="tabla-cargando">Cargando ejercicios...</div>
        ) : ejercicios.length === 0 ? (
          <div className="tabla-vacia">No hay ejercicios que coincidan.</div>
        ) : (
          <table className="tabla-banco">
            <thead>
              <tr>
                <th>ID</th>
                <th>Enunciado</th>
                <th>Módulo / Subtema</th>
                <th>Nivel</th>
                <th>Tipo</th>
                <th>Tutor</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ejercicios.map((e) => {
                const acciones = accionesDisponibles(e);

                return (
                  <tr key={e.id}>
                    <td className="td-id">#{e.id}</td>

                    <td className="td-enunciado">
                      <div className="enunciado-text">
                        <MathRenderer
                          texto={
                            e.enunciado.substring(0, 70) +
                            (e.enunciado.length > 70 ? '...' : '')
                          }
                        />
                      </div>

                      {e.advertencia_duplicado && (
                        <span className="badge-dup">duplicado</span>
                      )}
                    </td>

                    <td>
                      <div className="td-modulo-nombre">{e.modulo?.nombre}</div>
                      <div className="td-subtema-nombre">{e.subtema?.nombre}</div>
                    </td>

                    <td>
                      <span className="badge-nivel-sm">
                        {NIVELES[e.nivel_dificultad]}
                      </span>
                    </td>

                    <td className="td-tipo">{TIPOS[e.tipo_ejercicio]}</td>

                    <td className="td-tutor">
                      {e.tutor?.nombres} {e.tutor?.apellidos}
                    </td>

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

                        {acciones.includes('publicar') && (
                          <button
                            className="btn-accion btn-publicar"
                            onClick={() =>
                              setModal({ ejercicio: e, accion: 'publicar' })
                            }
                          >
                            Publicar
                          </button>
                        )}

                        {acciones.includes('deshabilitar') && (
                          <button
                            className="btn-accion btn-deshabilitar"
                            onClick={() =>
                              setModal({ ejercicio: e, accion: 'deshabilitar' })
                            }
                          >
                            Deshabilitar
                          </button>
                        )}
                        {acciones.includes('rehabilitar') && (
                        <button
                            className="btn-accion btn-rehabilitar"
                            onClick={() => setModal({ ejercicio: e, accion: 'rehabilitar' })}
                        >
                            Rehabilitar
                        </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
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
                          item === pagina ? '#ef4444' : 'rgba(255,255,255,0.05)',
                        border: '1px solid',
                        borderColor:
                          item === pagina ? '#ef4444' : 'rgba(255,255,255,0.1)',
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

      {modal && (
        <ModalConfirm
          ejercicio={modal.ejercicio}
          accion={modal.accion}
          onConfirmar={handleAccion}
          onCerrar={() => setModal(null)}
        />
      )}
    </div>
  );
}