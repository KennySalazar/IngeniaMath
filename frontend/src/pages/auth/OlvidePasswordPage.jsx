import { useState } from 'react';
import api from '../../services/api';
import './LoginPage.css';
import './OlvidePassword.css';

export default function OlvidePasswordPage() {
  const [correo, setCorreo]     = useState('');
  const [enviado, setEnviado]   = useState(false);
  const [error, setError]       = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await api.post('/password/solicitar', { correo });
      setEnviado(true);
    } catch {
      setError('Ocurrió un error. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-visual">
        <div className="login-visual__overlay" />
        <div className="login-visual__content">
          <div className="login-logo">
            <span className="login-logo__icon">∑</span>
            <span className="login-logo__text">IngeniaMath</span>
          </div>
          <h2 className="login-visual__title">Recupera tu acceso</h2>
          <p className="login-visual__sub">
            Te enviaremos un enlace a tu correo para que puedas crear una nueva contraseña segura.
          </p>
          <div className="math-deco math-deco--1">∫</div>
          <div className="math-deco math-deco--2">π</div>
          <div className="math-deco math-deco--3">√x</div>
        </div>
      </div>

      <div className="login-form-panel">
        <div className="login-form-box">
          {!enviado ? (
            <>
              <div className="login-form-header">
                <h1 className="login-form-title">Olvidé mi contraseña</h1>
                <p className="login-form-subtitle">Ingresa tu correo y te enviamos el enlace</p>
              </div>

              {error && (
                <div className="login-error">
                  <span className="login-error__icon">⚠</span> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="login-form">
                <div className="field">
                  <label className="field__label" htmlFor="correo">Correo electrónico</label>
                  <div className="field__wrapper">
                    <span className="field__icon"></span>
                    <input
                      id="correo"
                      type="email"
                      className="field__input"
                      placeholder="tu@correo.com"
                      value={correo}
                      onChange={e => setCorreo(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="login-btn" disabled={cargando}>
                  {cargando
                    ? <span className="login-btn__spinner" />
                    : 'Enviar enlace de recuperación'
                  }
                </button>
              </form>

              <div className="login-divider"><span>¿Recordaste tu contraseña?</span></div>
              <a href="/login" className="login-register-btn">Volver al inicio de sesión</a>
            </>
          ) : (
            <div className="enviado-box">
              <div className="enviado-icon">✉</div>
              <h2>Revisa tu correo</h2>
              <p>
                Enviamos un enlace de recuperación a <strong>{correo}</strong>.
                Revisa también tu carpeta de spam.
              </p>
                <a href="/login" className="login-btn">Volver al inicio de sesión</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}