import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './router/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';

function NavbarSimple({ titulo }) {
  const { logout, usuario } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const colores = {
    ADMIN:      '#ef4444',
    TUTOR:      '#6366f1',
    ESTUDIANTE: '#10b981',
    REVISOR:    '#f59e0b',
  };

  const rol = usuario?.rol?.codigo;
  const color = colores[rol] || '#6366f1';

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      fontFamily: 'DM Sans, sans-serif',
    }}>
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 2rem',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            width: 36, height: 36,
            background: `linear-gradient(135deg, ${color}, #4f46e5)`,
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, color: 'white',
          }}>∑</span>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 18 }}>IngeniaMath</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
            {usuario?.nombres} {usuario?.apellidos}
          </span>
          <span style={{
            padding: '3px 10px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
            background: `${color}22`,
            color: color,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}>{rol}</span>
          <button onClick={handleLogout} style={{
            padding: '8px 18px',
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 10,
            color: '#f87171',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.target.style.background = 'rgba(239,68,68,0.25)'}
          onMouseLeave={e => e.target.style.background = 'rgba(239,68,68,0.12)'}
          >
            Cerrar sesión
          </button>
        </div>
      </nav>

      <div style={{ padding: '3rem 2rem', color: 'white' }}>
        <h1 style={{
          fontSize: 32,
          fontWeight: 800,
          marginBottom: 8,
          background: `linear-gradient(135deg, white, ${color})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>{titulo}</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
          Módulos en construcción — Paso 15 en progreso...
        </p>
      </div>
    </div>
  );
}

const DashboardEstudiante = () => <NavbarSimple titulo="Dashboard Estudiante 🎓" />;
const DashboardAdmin      = () => <NavbarSimple titulo="Dashboard Administrador ⚙️" />;
const DashboardTutor      = () => <NavbarSimple titulo="Dashboard Tutor 📚" />;
const DashboardRevisor    = () => <NavbarSimple titulo="Dashboard Revisor ✅" />;
const NoAutorizado        = () => <NavbarSimple titulo="403 — No autorizado 🚫" />;

function RedireccionPorRol() {
  const { usuario } = useAuth();
  const rol = usuario?.rol?.codigo;
  if (rol === 'ADMIN')    return <Navigate to="/admin/dashboard" replace />;
  if (rol === 'TUTOR')    return <Navigate to="/tutor/dashboard" replace />;
  if (rol === 'REVISOR')  return <Navigate to="/revisor/dashboard" replace />;
  return <Navigate to="/estudiante/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/"      element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/no-autorizado" element={<NoAutorizado />} />

      <Route path="/dashboard" element={
        <ProtectedRoute><RedireccionPorRol /></ProtectedRoute>
      }/>
      <Route path="/estudiante/dashboard" element={
        <ProtectedRoute roles={['ESTUDIANTE']}><DashboardEstudiante /></ProtectedRoute>
      }/>
      <Route path="/admin/dashboard" element={
        <ProtectedRoute roles={['ADMIN']}><DashboardAdmin /></ProtectedRoute>
      }/>
      <Route path="/tutor/dashboard" element={
        <ProtectedRoute roles={['TUTOR']}><DashboardTutor /></ProtectedRoute>
      }/>
      <Route path="/revisor/dashboard" element={
        <ProtectedRoute roles={['REVISOR']}><DashboardRevisor /></ProtectedRoute>
      }/>
    </Routes>
  );
}