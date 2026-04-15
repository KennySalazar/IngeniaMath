import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import './LoginPage.css';
import './RegistroPage.css';

export default function RegistroPage() {
  const navigate = useNavigate();


  const [form, setForm] = useState({
    nombres:              '',
    apellidos:            '',
    correo:               '',
    password:             '',
    password_confirmation: '',
  });
  const [error, setError]     = useState('');
  const [cargando, setCargando] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.password_confirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setCargando(true);
    try {
      // Registro directo via authService — crea cuenta y hace login automático
      const { default: api } = await import('../../services/api');
      const res = await api.post('/auth/registro', form);
      const { token, usuario } = res.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(usuario));
      // Redirige al diagnóstico inicial (por ahora al dashboard)
      navigate('/estudiante/dashboard');
    } catch (err) {
      const errores = err.response?.data?.errors;
      if (errores) {
        setError(Object.values(errores).flat().join(' '));
      } else {
        setError(err.response?.data?.message ?? 'Error al crear la cuenta.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-root">
      {/* Panel izquierdo */}
      <div className="login-visual">
        <div className="login-visual__overlay" />
        <div className="login-visual__content">
          <div className="login-logo">
            <span className="login-logo__icon">∑</span>
            <span className="login-logo__text">IngeniaMath</span>
          </div>
          <h2 className="login-visual__title">
            Empieza tu<br />preparación hoy
          </h2>
          <p className="login-visual__sub">
            Crea tu cuenta gratuita y recibe una ruta de<br />
            estudio personalizada para el examen USAC.
          </p>
          <div className="login-stats">
            <div className="login-stat">
              <span className="login-stat__num">7</span>
              <span className="login-stat__label">Módulos</span>
            </div>
            <div className="login-stat">
              <span className="login-stat__num">∞</span>
              <span className="login-stat__label">Ejercicios</span>
            </div>
            <div className="login-stat">
              <span className="login-stat__num">100%</span>
              <span className="login-stat__label">Gratis</span>
            </div>
          </div>
          <div className="math-deco math-deco--1">∫</div>
          <div className="math-deco math-deco--2">π</div>
          <div className="math-deco math-deco--3">√x</div>
          <div className="math-deco math-deco--4">θ</div>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="login-form-panel">
        <div className="login-form-box">
          <div className="login-form-header">
            <h1 className="login-form-title">Crear cuenta</h1>
            <p className="login-form-subtitle">Solo para aspirantes a Ingeniería USAC</p>
          </div>

          {error && (
            <div className="login-error">
              <span className="login-error__icon">⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            {/* Nombres y apellidos en fila */}
            <div className="registro-row">
              <div className="field">
                <label className="field__label" htmlFor="nombres">Nombres</label>
                <div className="field__wrapper">
                  <span className="field__icon"></span>
                  <input
                    id="nombres"
                    name="nombres"
                    type="text"
                    className="field__input"
                    placeholder="Ana María"
                    value={form.nombres}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label className="field__label" htmlFor="apellidos">Apellidos</label>
                <div className="field__wrapper">
                  <span className="field__icon"></span>
                  <input
                    id="apellidos"
                    name="apellidos"
                    type="text"
                    className="field__input"
                    placeholder="Morales García"
                    value={form.apellidos}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="correo">Correo electrónico</label>
              <div className="field__wrapper">
                <span className="field__icon"></span>
                <input
                  id="correo"
                  name="correo"
                  type="email"
                  className="field__input"
                  placeholder="tu@correo.com"
                  value={form.correo}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="password">Contraseña</label>
              <div className="field__wrapper">
                <span className="field__icon"></span>
                <input
                  id="password"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  className="field__input"
                  placeholder="Mínimo 8 caracteres"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="field__toggle"
                  onClick={() => setShowPass(!showPass)}
                  tabIndex={-1}
                >
                  {showPass ? '' : '👁'}
                </button>
              </div>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="password_confirmation">Confirmar contraseña</label>
              <div className="field__wrapper">
                <span className="field__icon"></span>
                <input
                  id="password_confirmation"
                  name="password_confirmation"
                  type={showPass ? 'text' : 'password'}
                  className="field__input"
                  placeholder="Repite tu contraseña"
                  value={form.password_confirmation}
                  onChange={handleChange}
                  required
                  minLength={8}
                />
              </div>
            </div>

            {/* Indicador de fortaleza de contraseña */}
            {form.password.length > 0 && (
              <div className="password-strength">
                <div className="strength-bars">
                  <div className={`bar ${form.password.length >= 1 ? 'active' : ''}`} />
                  <div className={`bar ${form.password.length >= 4 ? 'active medium' : ''}`} />
                  <div className={`bar ${form.password.length >= 8 ? 'active strong' : ''}`} />
                </div>
                <span className="strength-label">
                  {form.password.length < 4 ? 'Débil' : form.password.length < 8 ? 'Regular' : 'Segura'}
                </span>
              </div>
            )}

            <button type="submit" className="login-btn" disabled={cargando}>
              {cargando
                ? <span className="login-btn__spinner" />
                : 'Crear mi cuenta'}
            </button>
          </form>

          <div className="login-divider"><span>¿Ya tienes cuenta?</span></div>
          <a href="/login" className="login-register-btn">Iniciar sesión</a>

          <p className="registro-nota">
            Al registrarte aceptas que esta plataforma es exclusiva para preparación académica.
          </p>
        </div>
      </div>
    </div>
  );
}