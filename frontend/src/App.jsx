import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './router/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import UsuariosPage from './pages/admin/UsuariosPage';
import OlvidePasswordPage from './pages/auth/OlvidePasswordPage';
import RestablecerPasswordPage from './pages/auth/RestablecerPasswordPage';
import RegistroPage from './pages/auth/RegistroPage';
import PerfilPage from './pages/perfil/PerfilPage';
import EjerciciosPage     from './pages/tutor/EjerciciosPage';
import CrearEjercicioPage from './pages/tutor/CrearEjercicioPage';
import DetalleEjercicioPage from './pages/tutor/DetalleEjercicioPage';
import RevisionPage from './pages/revisor/RevisionPage';



function NavbarSimple({ titulo, children }) {
  const { logout, usuario } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const colores = {
    ADMIN: '#ef4444',
    TUTOR: '#6366f1',
    ESTUDIANTE: '#10b981',
    REVISOR: '#f59e0b',
  };

  const rol = usuario?.rol?.codigo;
  const color = colores[rol] || '#6366f1';

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: 'DM Sans, sans-serif' }}>
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 2rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              width: 36,
              height: 36,
              background: `linear-gradient(135deg, ${color}, #4f46e5)`,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 800,
              color: 'white',
            }}
          >
            ∑
          </span>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 18 }}>IngeniaMath</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a
            href="/perfil"
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: 13,
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
            }}
          >
            {usuario?.nombres} {usuario?.apellidos}
          </a>

          <span
            style={{
              padding: '3px 10px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              background: `${color}22`,
              color,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            {rol}
          </span>

          <a
             href="/perfil"
              title="Ver mi perfil"
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                overflow: 'hidden',
                border: `2px solid ${color}66`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                flexShrink: 0,
                background: `${color}22`,
              }}
            >
              {usuario?.foto_perfil_url ? (
                <img
                  src={usuario.foto_perfil_url}
                  alt="Foto de perfil"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              ) : (
                <span style={{ fontSize: 13, fontWeight: 700, color }}>
                  {`${usuario?.nombres?.[0] ?? ''}${usuario?.apellidos?.[0] ?? ''}`.toUpperCase()}
                </span>
              )}
            </a>

          <button
            onClick={handleLogout}
            style={{
              padding: '8px 18px',
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10,
              color: '#f87171',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.12)';
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </nav>

      <div style={{ padding: '2rem' }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            marginBottom: '1.5rem',
            fontFamily: 'Syne, sans-serif',
            background: `linear-gradient(135deg, white, ${color})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {titulo}
        </h1>
        {children}
      </div>
    </div>
  );
}

const DashboardAdmin = () => (
  <NavbarSimple titulo="Gestión de Usuarios">
    <UsuariosPage />
  </NavbarSimple>
);

const DashboardEstudiante = () => (
  <NavbarSimple titulo="Dashboard Estudiante">
    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Módulo en construcción...</p>
  </NavbarSimple>
);

const DashboardTutor = () => (
  <NavbarSimple titulo="Mis ejercicios">
    <EjerciciosPage />
  </NavbarSimple>
);

const DashboardRevisor = () => (
  <NavbarSimple titulo="Panel de revisión">
    <RevisionPage />
  </NavbarSimple>
);


const NoAutorizado = () => (
  <NavbarSimple titulo="403 — No autorizado">
    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
      No tienes permiso para ver esta página.
    </p>
  </NavbarSimple>
);

function RedireccionPorRol() {
  const { usuario } = useAuth();
  const rol = usuario?.rol?.codigo;

  if (rol === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (rol === 'TUTOR') return <Navigate to="/tutor/dashboard" replace />;
  if (rol === 'REVISOR') return <Navigate to="/revisor/dashboard" replace />;

  return <Navigate to="/estudiante/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegistroPage />} />
      <Route path="/olvide-password" element={<OlvidePasswordPage />} />
      <Route path="/recuperar-password" element={<RestablecerPasswordPage />} />
      <Route path="/no-autorizado" element={<NoAutorizado />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RedireccionPorRol />
          </ProtectedRoute>
        }
      />

      <Route
        path="/perfil"
        element={
          <ProtectedRoute>
            <NavbarSimple titulo="Mi perfil">
              <PerfilPage />
            </NavbarSimple>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <DashboardAdmin />
          </ProtectedRoute>
        }
      />

      <Route
        path="/estudiante/dashboard"
        element={
          <ProtectedRoute roles={['ESTUDIANTE']}>
            <DashboardEstudiante />
          </ProtectedRoute>
        }
      />

          <Route
      path="/tutor/dashboard"
      element={
        <ProtectedRoute roles={['TUTOR']}>
          <DashboardTutor />
        </ProtectedRoute>
      }
    />

  
    <Route
      path="/tutor/ejercicios"
      element={
        <ProtectedRoute roles={['TUTOR', 'ADMIN']}>
          <NavbarSimple titulo="Banco de ejercicios">
            <EjerciciosPage />
          </NavbarSimple>
        </ProtectedRoute>
      }
    />

    <Route path="/tutor/ejercicios/:id" element={
      <ProtectedRoute roles={['TUTOR', 'ADMIN', 'REVISOR']}>
        <NavbarSimple titulo="Detalle del ejercicio">
          <DetalleEjercicioPage />
        </NavbarSimple>
      </ProtectedRoute>
    }/>

    <Route
      path="/tutor/ejercicios/crear"
      element={
        <ProtectedRoute roles={['TUTOR', 'ADMIN']}>
          <NavbarSimple titulo="Nuevo ejercicio">
            <CrearEjercicioPage />
          </NavbarSimple>
        </ProtectedRoute>
      }
    />

      <Route
        path="/revisor/dashboard"
        element={
          <ProtectedRoute roles={['REVISOR']}>
            <DashboardRevisor />
          </ProtectedRoute>
        }
      />
      <Route path="/revisor/revision" element={
      <ProtectedRoute roles={['REVISOR', 'ADMIN']}>
        <NavbarSimple titulo="Panel de revisión">
          <RevisionPage />
        </NavbarSimple>
      </ProtectedRoute>
    }/>
    </Routes>
  );
}