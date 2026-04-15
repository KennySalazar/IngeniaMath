import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './LoginPage.css';

export default function RestablecerPasswordPage() {
  const [searchParams]                = useSearchParams();
  const navigate                      = useNavigate();
  const token                         = searchParams.get('token');
  const [tokenValido, setTokenValido] = useState(null);
  const [password, setPassword]       = useState('');
  const [confirmacion, setConfirm]    = useState('');
  const [error, setError]             = useState('');
  const [exito, setExito]             = useState(false);
  const [cargando, setCargando]       = useState(false);

  useEffect(() => {
    if (!token) { setTokenValido(false); return; }
    api.get(`/password/validar-token?token=${token}`)
      .then(res => setTokenValido(res.data.valido))
      .catch(() => setTokenValido(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmacion) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setError('');
    setCargando(true);
    try {
      await api.post('/password/restablecer', {
        token,
        password,
        password_confirmation: confirmacion,
      });
      setExito(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al restablecer la contraseña.');
    } finally {
      setCargando(false);
    }
  };

  if (tokenValido === null) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans, sans-serif' }}>Verificando enlace...</p>
      </div>
    );
  }

  return (
    <div className="login-root">
      <div className="login-visual">
        <div className="login-visual__overlay" />
        <div className="login-visual__content">
          <div className="login-logo">
            <span className="login-logo__icon">∑</span>
            <span className="login-logo__text">IngeniaMath</span>
          </div>
          <h2 className="login-visual__title">Nueva contraseña</h2>
          <p className="login-visual__sub">Crea una contraseña segura para proteger tu cuenta.</p>
          <div className="math-deco math-deco--1">∫</div>
          <div className="math-deco math-deco--2">π</div>
        </div>
      </div>

      <div className="login-form-panel">
        <div className="login-form-box">

          {!tokenValido ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 52, marginBottom: '1rem' }}>⚠</div>
              <h2 style={{ color: '#f87171', fontFamily: 'Syne, sans-serif', fontSize: 22, marginBottom: '0.75rem' }}>
                Enlace inválido o expirado
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: '1.5rem', lineHeight: 1.7 }}>
                Este enlace ya fue usado o expiró. Solicita uno nuevo.
              </p>
              <a href="/olvide-password" className="login-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                Solicitar nuevo enlace
              </a>
            </div>

          ) : exito ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 52, marginBottom: '1rem' }}>✅</div>
              <h2 style={{ color: '#10b981', fontFamily: 'Syne, sans-serif', fontSize: 22, marginBottom: '0.75rem' }}>
                Contraseña restablecida
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.7 }}>
                Tu contraseña fue actualizada correctamente. Redirigiendo al login en 3 segundos...
              </p>
            </div>

          ) : (
            <>
              <div className="login-form-header">
                <h1 className="login-form-title">Crear nueva contraseña</h1>
                <p className="login-form-subtitle">Mínimo 8 caracteres</p>
              </div>

              {error && (
                <div className="login-error">
                  <span className="login-error__icon">⚠</span> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="login-form">
                <div className="field">
                  <label className="field__label">Nueva contraseña</label>
                  <div className="field__wrapper">
                    <span className="field__icon"></span>
                    <input
                      type="password"
                      className="field__input"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <div className="field">
                  <label className="field__label">Confirmar contraseña</label>
                  <div className="field__wrapper">
                    <span className="field__icon"></span>
                    <input
                      type="password"
                      className="field__input"
                      placeholder="••••••••"
                      value={confirmacion}
                      onChange={e => setConfirm(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <button type="submit" className="login-btn" disabled={cargando}>
                  {cargando
                    ? <span className="login-btn__spinner" />
                    : 'Restablecer contraseña'
                  }
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}