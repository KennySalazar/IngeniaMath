import { useState, useEffect, useCallback } from 'react';
import { usuarioService } from '../../services/usuarioService';
import './UsuariosPage.css';

const ROLES = [
  { id: 1, codigo: 'ADMIN', nombre: 'Administrador' },
  { id: 2, codigo: 'ESTUDIANTE', nombre: 'Estudiante' },
  { id: 3, codigo: 'TUTOR', nombre: 'Tutor/Instructor' },
  { id: 4, codigo: 'REVISOR', nombre: 'Revisor/Moderador' },
];

const COLOR_ROL = {
  ADMIN: { bg: 'rgba(239,68,68,0.12)', text: '#f87171' },
  ESTUDIANTE: { bg: 'rgba(16,185,129,0.12)', text: '#10b981' },
  TUTOR: { bg: 'rgba(99,102,241,0.12)', text: '#818cf8' },
  REVISOR: { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24' },
};

function ModalUsuario({ usuario, onGuardar, onCerrar }) {
  const esEdicion = !!usuario;

  const [form, setForm] = useState({
    nombres: usuario?.nombres ?? '',
    apellidos: usuario?.apellidos ?? '',
    correo: usuario?.correo ?? '',
    password: '',
    rol_id: usuario?.rol?.id ?? 2,
  });

  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const datos = { ...form };

      if (esEdicion && !datos.password) {
        delete datos.password;
      }

      await onGuardar(datos);
    } catch (err) {
      const errores = err.response?.data?.errors;

      if (errores) {
        setError(Object.values(errores).flat().join(' '));
      } else {
        setError(err.response?.data?.message ?? 'Error al guardar.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{esEdicion ? 'Editar usuario' : 'Nuevo usuario'}</h2>
          <button className="modal-close" onClick={onCerrar}>
            ✕
          </button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-field">
              <label>Nombres</label>
              <input
                name="nombres"
                value={form.nombres}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label>Apellidos</label>
              <input
                name="apellidos"
                value={form.apellidos}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-field">
            <label>Correo electrónico</label>
            <input
              type="email"
              name="correo"
              value={form.correo}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-field">
            <label>
              {esEdicion
                ? 'Nueva contraseña (dejar vacío para no cambiar)'
                : 'Contraseña'}
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required={!esEdicion}
              minLength={8}
              placeholder={esEdicion ? '••••••••' : ''}
            />
          </div>

          <div className="form-field">
            <label>Rol</label>
            <select name="rol_id" value={form.rol_id} onChange={handleChange}>
              {ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secundario" onClick={onCerrar}>
              Cancelar
            </button>

            <button type="submit" className="btn-primario" disabled={cargando}>
              {cargando
                ? 'Guardando...'
                : esEdicion
                  ? 'Guardar cambios'
                  : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [buscar, setBuscar] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('todos');
  const [modal, setModal] = useState(null);
  const [confirmEliminar, setConfirmEliminar] = useState(null);
  const [resumen, setResumen] = useState([]);

  const [pagina, setPagina] = useState(1);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [ultimaPag, setUltimaPag] = useState(1);
  const POR_PAGINA = 10;

  const cargarUsuarios = useCallback(async () => {
    setCargando(true);

    try {
      const data = await usuarioService.listar({
        buscar,
        rol_id: filtroRol,
        activo: filtroActivo,
        per_page: POR_PAGINA,
        page: pagina,
      });

      setUsuarios(data.data ?? []);
      setTotalUsuarios(data.total ?? 0);
      setUltimaPag(data.ultima_pagina ?? 1);
    } catch {
      setUsuarios([]);
      setTotalUsuarios(0);
      setUltimaPag(1);
    } finally {
      setCargando(false);
    }
  }, [buscar, filtroRol, filtroActivo, pagina]);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  useEffect(() => {
    usuarioService.resumen().then(setResumen).catch(() => {});
  }, []);

  const handleBuscarChange = (e) => {
    setPagina(1);
    setBuscar(e.target.value);
  };

  const handleFiltroRolChange = (e) => {
    setPagina(1);
    setFiltroRol(e.target.value);
  };

  const handleFiltroActivoChange = (e) => {
    setPagina(1);
    setFiltroActivo(e.target.value);
  };

  const handleCrear = async (datos) => {
    await usuarioService.crear(datos);
    setModal(null);
    setPagina(1);
    cargarUsuarios();
  };

  const handleEditar = async (datos) => {
    await usuarioService.editar(modal.id, datos);
    setModal(null);
    cargarUsuarios();
  };

  const handleCambiarEstado = async (usuario) => {
    await usuarioService.cambiarEstado(usuario.id, !usuario.activo);
    cargarUsuarios();
  };

  const handleEliminar = async () => {
    await usuarioService.eliminar(confirmEliminar.id);
    setConfirmEliminar(null);

    if (usuarios.length === 1 && pagina > 1) {
      setPagina((p) => p - 1);
      return;
    }

    cargarUsuarios();
  };

  return (
    <div className="usuarios-page">
      <div className="resumen-grid">
        {resumen.map((r) => (
          <div key={r.rol} className="resumen-card">
            <span className="resumen-card__num">{r.total}</span>
            <span
              className="resumen-card__label"
              style={{ color: COLOR_ROL[r.rol]?.text ?? '#fff' }}
            >
              {r.nombre}
            </span>
          </div>
        ))}
      </div>

      <div className="usuarios-toolbar">
        <input
          className="toolbar-search"
          placeholder="Buscar por nombre o correo..."
          value={buscar}
          onChange={handleBuscarChange}
        />

        <select
          className="toolbar-select"
          value={filtroRol}
          onChange={handleFiltroRolChange}
        >
          <option value="">Todos los roles</option>
          {ROLES.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
            </option>
          ))}
        </select>

        <select
          className="toolbar-select"
          value={filtroActivo}
          onChange={handleFiltroActivoChange}
        >
          <option value="todos">Todos</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>

        <button className="btn-primario" onClick={() => setModal('crear')}>
          + Nuevo usuario
        </button>
      </div>

      <div className="tabla-wrapper">
        {cargando ? (
          <div className="tabla-cargando">Cargando usuarios...</div>
        ) : (
          <table className="tabla-usuarios">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Último acceso</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan={6} className="tabla-vacia">
                    No hay usuarios que coincidan.
                  </td>
                </tr>
              ) : (
                usuarios.map((u) => {
                  const colorRol = COLOR_ROL[u.rol?.codigo] ?? {
                    bg: '#333',
                    text: '#aaa',
                  };

                  const iniciales =
                    `${u.nombres?.[0] ?? ''}${u.apellidos?.[0] ?? ''}`.toUpperCase();

                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="usuario-cell">
                          <div
                            className="usuario-avatar"
                            style={{ background: colorRol.bg, color: colorRol.text }}
                          >
                            {iniciales}
                          </div>

                          <div>
                            <p className="usuario-nombre">
                              {u.nombres} {u.apellidos}
                            </p>
                            <p className="usuario-id">ID #{u.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="td-correo">{u.correo}</td>

                      <td>
                        <span
                          className="badge-rol"
                          style={{ background: colorRol.bg, color: colorRol.text }}
                        >
                          {u.rol?.nombre}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`badge-estado ${u.activo ? 'activo' : 'inactivo'}`}
                        >
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>

                      <td className="td-fecha">
                        {u.ultimo_login_at
                          ? new Date(u.ultimo_login_at).toLocaleDateString('es-GT')
                          : 'Nunca'}
                      </td>

                      <td>
                        <div className="acciones">
                          <button
                            className="btn-accion btn-editar"
                            onClick={() => setModal(u)}
                            title="Editar"
                          >
                            Editar
                          </button>

                          <button
                            className={`btn-accion ${u.activo ? 'btn-desactivar' : 'btn-activar'}`}
                            onClick={() => handleCambiarEstado(u)}
                            title={u.activo ? 'Desactivar' : 'Activar'}
                          >
                            {u.activo ? 'Desactivar' : 'Activar'}
                          </button>

                          <button
                            className="btn-accion btn-eliminar"
                            onClick={() => setConfirmEliminar(u)}
                            title="Eliminar"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}

        {!cargando && totalUsuarios > 0 && (
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
              {Math.min(pagina * POR_PAGINA, totalUsuarios)} de{' '}
              <strong style={{ color: 'rgba(255,255,255,0.6)' }}>
                {totalUsuarios}
              </strong>{' '}
              usuarios
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
        <ModalUsuario
          usuario={modal === 'crear' ? null : modal}
          onGuardar={modal === 'crear' ? handleCrear : handleEditar}
          onCerrar={() => setModal(null)}
        />
      )}

      {confirmEliminar && (
        <div className="modal-overlay" onClick={() => setConfirmEliminar(null)}>
          <div className="modal-box modal-confirm" onClick={(e) => e.stopPropagation()}>
            <h2>Eliminar usuario</h2>
            <p>
              ¿Estás seguro de que quieres eliminar a{' '}
              <strong>
                {confirmEliminar.nombres} {confirmEliminar.apellidos}
              </strong>
              ? Esta acción no se puede deshacer.
            </p>

            <div className="modal-actions">
              <button
                className="btn-secundario"
                onClick={() => setConfirmEliminar(null)}
              >
                Cancelar
              </button>

              <button className="btn-eliminar-confirm" onClick={handleEliminar}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}