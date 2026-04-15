import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usuarioService } from '../../services/usuarioService';
import './PerfilPage.css';

export default function PerfilPage() {
  const { usuario, actualizarUsuario} = useAuth();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    nombres:   '',
    apellidos: '',
    correo:    '',
    telefono:  '',
    biografia: '',
    foto_perfil_url: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    password:              '',
    password_confirmation: '',
  });

  const [tab, setTab]             = useState('info'); // 'info' | 'password'
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito]         = useState('');
  const [error, setError]         = useState('');
  const [preview, setPreview]     = useState('');

  // Cargar datos actuales del usuario
useEffect(() => {
  if (!usuario?.id) return;

  usuarioService.verPerfil(usuario.id).then(data => {
    setForm({
      nombres:         data.nombres         ?? '',
      apellidos:       data.apellidos        ?? '',
      correo:          data.correo           ?? '',
      telefono:        data.telefono         ?? '',
      biografia:       data.biografia        ?? '',
      foto_perfil_url: data.foto_perfil_url  ?? '',
    });
    setPreview(data.foto_perfil_url ?? '');

    // Actualiza localStorage con datos frescos
    localStorage.setItem('usuario', JSON.stringify({ ...usuario, ...data }));
  }).catch(() => {});
}, [usuario?.id]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordChange = (e) => {
    setPasswordForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Simula subida de foto — en producción conectarías a un storage real
  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tamaño máximo 2MB
    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen no debe superar 2MB.');
      return;
    }

    // Crear preview local
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      setForm(prev => ({ ...prev, foto_perfil_url: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleGuardarInfo = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');
    setGuardando(true);

    try {
        const actualizado = await usuarioService.editar(usuario.id, {
        nombres:         form.nombres,
        apellidos:       form.apellidos,
        correo:          form.correo,
        telefono:        form.telefono,
        biografia:       form.biografia,
        foto_perfil_url: form.foto_perfil_url,
        });

        
        actualizarUsuario(actualizado);
        setPreview(actualizado.foto_perfil_url ?? '');
        setExito('Perfil actualizado correctamente.');

   
    const usuarioActualizado = { ...usuario, ...actualizado };
    localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));
    setExito('Perfil actualizado correctamente.');


setPreview(actualizado.foto_perfil_url ?? '');
    } catch (err) {
      const errores = err.response?.data?.errors;
      if (errores) {
        setError(Object.values(errores).flat().join(' '));
      } else {
        setError(err.response?.data?.message ?? 'Error al guardar.');
      }
    } finally {
      setGuardando(false);
    }
  };

  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');

    if (passwordForm.password !== passwordForm.password_confirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (passwordForm.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setGuardando(true);
    try {
      await usuarioService.editar(usuario.id, {
        password:              passwordForm.password,
        password_confirmation: passwordForm.password_confirmation,
      });
      setExito('Contraseña actualizada correctamente.');
      setPasswordForm({ password: '', password_confirmation: '' });
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al cambiar contraseña.');
    } finally {
      setGuardando(false);
    }
  };

  // Iniciales para el avatar
  const iniciales = `${usuario?.nombres?.[0] ?? ''}${usuario?.apellidos?.[0] ?? ''}`.toUpperCase();

  const COLOR_ROL = {
    ADMIN:      '#ef4444',
    ESTUDIANTE: '#10b981',
    TUTOR:      '#6366f1',
    REVISOR:    '#f59e0b',
  };
  const colorRol = COLOR_ROL[usuario?.rol?.codigo] ?? '#6366f1';

  return (
    <div className="perfil-page">
      {/* Cabecera del perfil */}
      <div className="perfil-header">
        <div className="perfil-avatar-wrapper">
          {preview ? (
            <img src={preview} alt="Foto de perfil" className="perfil-avatar-img" />
          ) : (
            <div className="perfil-avatar-iniciales" style={{ background: `${colorRol}22`, color: colorRol }}>
              {iniciales}
            </div>
          )}
          <button
            className="perfil-avatar-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Cambiar foto"
          >
            📷
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFotoChange}
          />
        </div>

        <div className="perfil-header-info">
          <h2 className="perfil-nombre">{usuario?.nombres} {usuario?.apellidos}</h2>
          <p className="perfil-correo">{usuario?.correo}</p>
          <span className="perfil-badge-rol" style={{ background: `${colorRol}22`, color: colorRol }}>
            {usuario?.rol?.nombre}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="perfil-tabs">
        <button
          className={`perfil-tab ${tab === 'info' ? 'activo' : ''}`}
          onClick={() => { setTab('info'); setError(''); setExito(''); }}
        >
          Información personal
        </button>
        <button
          className={`perfil-tab ${tab === 'password' ? 'activo' : ''}`}
          onClick={() => { setTab('password'); setError(''); setExito(''); }}
        >
          Cambiar contraseña
        </button>
      </div>

      {/* Mensajes */}
      {exito && (
        <div className="perfil-exito">✓ {exito}</div>
      )}
      {error && (
        <div className="perfil-error">⚠ {error}</div>
      )}

      {/* Tab: Información personal */}
      {tab === 'info' && (
        <form onSubmit={handleGuardarInfo} className="perfil-form">
          <div className="perfil-form-grid">
            <div className="perfil-field">
              <label>Nombres</label>
              <input
                name="nombres"
                value={form.nombres}
                onChange={handleChange}
                required
                placeholder="Tu nombre"
              />
            </div>

            <div className="perfil-field">
              <label>Apellidos</label>
              <input
                name="apellidos"
                value={form.apellidos}
                onChange={handleChange}
                required
                placeholder="Tus apellidos"
              />
            </div>

            <div className="perfil-field perfil-field--full">
              <label>Correo electrónico</label>
              <input
                type="email"
                name="correo"
                value={form.correo}
                onChange={handleChange}
                required
                placeholder="tu@correo.com"
              />
            </div>

            <div className="perfil-field perfil-full">
              <label>Teléfono</label>
              <input
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                placeholder="+502 1234 5678"
                maxLength={30}
              />
            </div>

            <div className="perfil-field perfil-field--full">
              <label>Biografía</label>
              <textarea
                name="biografia"
                value={form.biografia}
                onChange={handleChange}
                placeholder="Cuéntanos algo sobre ti..."
                rows={3}
                maxLength={500}
              />
              <span className="perfil-contador">{form.biografia.length}/500</span>
            </div>

            <div className="perfil-field perfil-field--full">
              <label>URL de foto de perfil</label>
              <input
                name="foto_perfil_url"
                value={form.foto_perfil_url}
                onChange={(e) => {
                  handleChange(e);
                  setPreview(e.target.value);
                }}
                placeholder="https://... o usa el botón de cámara arriba"
              />
            </div>
          </div>

          <div className="perfil-actions">
            <button type="submit" className="btn-guardar" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      )}

      {/* Tab: Cambiar contraseña */}
      {tab === 'password' && (
        <form onSubmit={handleCambiarPassword} className="perfil-form">
          <div className="perfil-form-grid">
            <div className="perfil-field perfil-field--full">
              <label>Nueva contraseña</label>
              <input
                type="password"
                name="password"
                value={passwordForm.password}
                onChange={handlePasswordChange}
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            <div className="perfil-field perfil-field--full">
              <label>Confirmar nueva contraseña</label>
              <input
                type="password"
                name="password_confirmation"
                value={passwordForm.password_confirmation}
                onChange={handlePasswordChange}
                required
                minLength={8}
                placeholder="Repite la contraseña"
              />
            </div>
          </div>

          <div className="perfil-actions">
            <button type="submit" className="btn-guardar" disabled={guardando}>
              {guardando ? 'Actualizando...' : 'Cambiar contraseña'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}