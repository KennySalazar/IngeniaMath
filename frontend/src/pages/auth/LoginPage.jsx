import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const [correo, setCorreo]       = useState('');
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [showPass, setShowPass]   = useState(false);
  const { login }                 = useAuth();
  const navigate                  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const usuario = await login(correo, password);
      const rol = usuario?.rol?.codigo;
      if (rol === 'ADMIN')    navigate('/admin/dashboard');
      else if (rol === 'TUTOR')   navigate('/tutor/dashboard');
      else if (rol === 'REVISOR') navigate('/revisor/dashboard');
      else navigate('/estudiante/dashboard');
    } catch (err) {
      const msg = err.response?.data?.errors?.correo?.[0]
               || err.response?.data?.message
               || 'Error al iniciar sesión.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      {/* Panel izquierdo — visual */}
      <div className="login-visual">
        <div className="login-visual__overlay" />
        <div className="login-visual__content">
          <div className="login-logo">
            <span className="login-logo__icon">∑</span>
            <span className="login-logo__text">IngeniaMath</span>
          </div>
          <h2 className="login-visual__title">
            Prepárate para<br />conquistar el examen
          </h2>
          <p className="login-visual__sub">
            Plataforma adaptativa para aspirantes a<br />
            Ingeniería USAC · 7 módulos · Rutas personalizadas
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
              <span className="login-stat__label">Adaptativo</span>
            </div>
          </div>
          {/* Decoración matemática flotante */}
          <div className="math-deco math-deco--1">∫</div>
          <div className="math-deco math-deco--2">π</div>
          <div className="math-deco math-deco--3">√x</div>
          <div className="math-deco math-deco--4">θ</div>
          <div className="math-deco math-deco--5">Δ</div>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="login-form-panel">
        <div className="login-form-box">
          <div className="login-form-header">
            <h1 className="login-form-title">Bienvenido de vuelta</h1>
            <p className="login-form-subtitle">Ingresa a tu cuenta para continuar</p>
          </div>

          {error && (
            <div className="login-error">
              <span className="login-error__icon">⚠</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            <div className="field">
              <label className="field__label" htmlFor="correo">Correo electrónico</label>
              <div className="field__wrapper">
                <span className="field__icon">✉</span>
                <input
                  id="correo"
                  type="email"
                  className="field__input"
                  placeholder="tu@correo.com"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="password">Contraseña</label>
              <div className="field__wrapper">
                <span className="field__icon">🔒</span>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className="field__input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="field__toggle"
                  onClick={() => setShowPass(!showPass)}
                  tabIndex={-1}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div className="login-forgot">
              <a href="#" className="login-forgot__link">¿Olvidaste tu contraseña?</a>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <span className="login-btn__spinner" />
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>

          <div className="login-divider"><span>¿No tienes cuenta?</span></div>
          <a href="/registro" className="login-register-btn">Crear cuenta nueva</a>

          <div className="login-roles">
            <span className="login-roles__label">Acceso por rol:</span>
            <span className="login-role login-role--estudiante">Estudiante</span>
            <span className="login-role login-role--tutor">Tutor</span>
            <span className="login-role login-role--admin">Admin</span>
            <span className="login-role login-role--revisor">Revisor</span>
          </div>
        </div>
      </div>
    </div>
  );
}