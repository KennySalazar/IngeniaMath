import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './router/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import UsuariosPage from './pages/admin/UsuariosPage';
import BancoEjerciciosPage from './pages/admin/BancoEjerciciosPage';
import OlvidePasswordPage from './pages/auth/OlvidePasswordPage';
import RestablecerPasswordPage from './pages/auth/RestablecerPasswordPage';
import RegistroPage from './pages/auth/RegistroPage';
import PerfilPage from './pages/perfil/PerfilPage';
import EjerciciosPage from './pages/tutor/EjerciciosPage';
import CrearEjercicioPage from './pages/tutor/CrearEjercicioPage';
import DetalleEjercicioPage from './pages/tutor/DetalleEjercicioPage';
import RevisionPage from './pages/revisor/RevisionPage';
import DiagnosticoInicioPage    from './pages/diagnostico/DiagnosticoInicioPage';
import DiagnosticoTestPage      from './pages/diagnostico/DiagnosticoTestPage';
import DiagnosticoResultadosPage from './pages/diagnostico/DiagnosticoResultadosPage';
import DiagnosticoRutaPage      from './pages/diagnostico/DiagnosticoRutaPage';
import { diagnosticoService } from './services/diagnosticoService';
import DashboardEstudiantePage from './pages/estudiante/DashboardEstudiantePage';
import PracticaInicioPage from './pages/estudiante/PracticaInicioPage';
import PracticaSesionPage from './pages/estudiante/PracticaSesionPage';
import PracticaGuardadosPage from './pages/estudiante/PracticaGuardadosPage';
import PracticaHistorialPage from './pages/estudiante/PracticaHistorialPage';
import SimulacrosInicioPage from './pages/estudiante/SimulacrosInicioPage';
import SimulacroSesionPage from './pages/estudiante/SimulacroSesionPage';
import SimulacroHistorialPage from './pages/estudiante/SimulacroHistorialPage';
import ConfiguracionSimulacroPage from './pages/admin/ConfiguracionSimulacroPage';
import RecursosPage     from './pages/tutor/RecursosPage';
import CrearRecursoPage from './pages/tutor/CrearRecursoPage';
import EditarRecursoPage from './pages/tutor/EditarRecursoPage';
import BibliotecaPage from './pages/estudiante/BibliotecaPage';
import RevisionRecursosPage from './pages/revisor/RevisionRecursosPage';
import EstadisticasPage from './pages/estudiante/EstadisticasPage';
import EstadisticasTutorPage from './pages/tutor/EstadisticasTutorPage';
import EstadisticasAdminPage from './pages/admin/EstadisticasAdminPage';
import { foroService } from './services/foroService';
import ForoPage from './pages/foro/ForoPage';
import HiloPage from './pages/foro/HiloPage';

// ── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  const { logout, usuario } = useAuth();
  const navigate = useNavigate();
  const [badge, setBadge] = useState(0);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  // Badge foro — solo estudiantes
  useEffect(() => {
    if (usuario?.rol?.codigo !== 'ESTUDIANTE') return;

    const cargarBadge = () => {
      foroService.badge()
        .then(d => setBadge(d.total))
        .catch(() => {});
    };

    cargarBadge();
    const interval = setInterval(cargarBadge, 120_000);
    return () => clearInterval(interval);
  }, [usuario?.id]);

  const colores = {
    ADMIN: '#ef4444', TUTOR: '#6366f1',
    ESTUDIANTE: '#10b981', REVISOR: '#f59e0b',
  };
  const rol   = usuario?.rol?.codigo;
  const color = colores[rol] || '#6366f1';

  // Rutas del foro visibles para todos los roles autenticados
  const puedeVerForo = ['ESTUDIANTE', 'TUTOR', 'REVISOR', 'ADMIN'].includes(rol);

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0.875rem 2rem',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      background: 'rgba(255,255,255,0.03)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>

      {/* Logo */}
      <button onClick={() => navigate('/dashboard')} style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
      }}>
        <span style={{
          width: 34, height: 34,
          background: `linear-gradient(135deg, ${color}, #4f46e5)`,
          borderRadius: 10, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 17, fontWeight: 800, color: 'white',
        }}>∑</span>
        <span style={{ color: 'white', fontWeight: 700, fontSize: 17 }}>IngeniaMath</span>
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>

        {/* Botón Foro con badge */}
        {puedeVerForo && (
          <button
            onClick={() => navigate('/foro')}
            style={{
              position: 'relative',
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.5)',
              fontSize: 13, cursor: 'pointer',
              padding: '4px 8px',
              fontFamily: 'DM Sans, sans-serif',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'white'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
          >
            💬 Foro
            {badge > 0 && (
              <span style={{
                position: 'absolute', top: -2, right: -4,
                width: 16, height: 16, borderRadius: '50%',
                background: '#ef4444', color: 'white',
                fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </button>
        )}

        {/* Nombre */}
        <a
          href="/perfil"
          style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textDecoration: 'none' }}
          onMouseEnter={e => e.currentTarget.style.color = 'white'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
        >
          {usuario?.nombres} {usuario?.apellidos}
        </a>

        {/* Badge rol */}
        <span style={{
          padding: '3px 10px', borderRadius: 20, fontSize: 11,
          fontWeight: 700, background: `${color}22`, color,
          textTransform: 'uppercase', letterSpacing: 1,
        }}>
          {rol}
        </span>

        {/* Avatar */}
        <a href="/perfil" style={{
          width: 32, height: 32, borderRadius: '50%', overflow: 'hidden',
          border: `2px solid ${color}66`, display: 'flex', alignItems: 'center',
          justifyContent: 'center', textDecoration: 'none', background: `${color}22`,
          flexShrink: 0,
        }}>
          {usuario?.foto_perfil_url ? (
            <img
              src={usuario.foto_perfil_url} alt="Foto"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.target.style.display = 'none'; }}
            />
          ) : (
            <span style={{ fontSize: 12, fontWeight: 700, color }}>
              {`${usuario?.nombres?.[0] ?? ''}${usuario?.apellidos?.[0] ?? ''}`.toUpperCase()}
            </span>
          )}
        </a>

        {/* Cerrar sesión */}
        <button
          onClick={handleLogout}
          style={{
            padding: '7px 16px',
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 9, color: '#f87171',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.25)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}

// ── Botón volver ─────────────────────────────────────────────────────────────
function BtnVolver({ destino }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => destino ? navigate(destino) : navigate(-1)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '7px 14px', marginBottom: '1.25rem',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 9, color: 'rgba(255,255,255,0.5)',
        fontSize: 13, cursor: 'pointer',
        fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
        e.currentTarget.style.color = 'white';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
        e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
      }}
    >
      ← Volver
    </button>
  );
}

// ── Tabs horizontales del admin ──────────────────────────────────────────────
function AdminTabs() {
  const navigate = useNavigate();
  const location = useLocation();

  const TABS = [
    { path: '/admin/dashboard', label: 'Usuarios'           },
    { path: '/admin/banco',     label: 'Banco de ejercicios'},
    { path: '/admin/simulacros-configuracion', label: 'Simulacros'},
    { path: '/revisor/revision',label: 'Revisión'           },
    { path: '/revisor/recursos', label: 'Recursos' },
    { path: '/tutor/ejercicios',label: 'Ejercicios'         },
    { path: '/perfil',          label: 'Mi perfil'          },
    { path: '/admin/estadisticas', label: 'Estadísticas' },
  ];

  return (
    <div style={{
      display: 'flex', gap: 4,
      padding: '0 2rem',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      background: 'rgba(255,255,255,0.01)',
      overflowX: 'auto',
    }}>
      {TABS.map(tab => {
        const activo = location.pathname === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              padding: '12px 16px',
              background: 'none', border: 'none',
              borderBottom: activo
                ? '2px solid #ef4444'
                : '2px solid transparent',
              color: activo ? '#ef4444' : 'rgba(255,255,255,0.45)',
              fontSize: 13, fontWeight: activo ? 600 : 400,
              cursor: 'pointer', whiteSpace: 'nowrap',
              fontFamily: 'DM Sans, sans-serif',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              if (!activo) e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
            }}
            onMouseLeave={e => {
              if (!activo) e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Layout admin (con tabs horizontales) ────────────────────────────────────
function AdminLayout({ children, titulo }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f' }}>
      <Navbar />
      <AdminTabs />
      <div style={{ padding: '2rem' }}>
        <h1 style={{
          fontSize: 26, fontWeight: 800, marginBottom: '1.5rem',
          fontFamily: 'Syne, sans-serif',
          background: 'linear-gradient(135deg, white, #ef4444)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>{titulo}</h1>
        {children}
      </div>
    </div>
  );
}

// ── Layout simple (tutor, revisor, estudiante) ───────────────────────────────
function SimpleLayout({ titulo, children, botonVolver }) {
  const { usuario } = useAuth();
  const colores = {
    TUTOR: '#6366f1', REVISOR: '#f59e0b',
    ESTUDIANTE: '#10b981', ADMIN: '#ef4444',
  };
  const color = colores[usuario?.rol?.codigo] || '#6366f1';

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f' }}>
      <Navbar />
      <div style={{ padding: '2rem' }}>
        {botonVolver && <BtnVolver destino={botonVolver} />}
        <h1 style={{
          fontSize: 26, fontWeight: 800, marginBottom: '1.5rem',
          fontFamily: 'Syne, sans-serif',
          background: `linear-gradient(135deg, white, ${color})`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>{titulo}</h1>
        {children}
      </div>
    </div>
  );
}

// ── Dashboards ───────────────────────────────────────────────────────────────
const DashboardAdmin = () => (
  <AdminLayout titulo="Gestión de Usuarios"><UsuariosPage /></AdminLayout>
);
const DashboardTutor = () => {
  const navigate = useNavigate();

  return (
    <SimpleLayout titulo="Mis ejercicios">
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '12px' }}>
        {/* Botón Recursos */}
        <button
          onClick={() => navigate('/tutor/recursos')}
          style={{
            padding: '10px 18px',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            borderRadius: '10px',
            color: '#818cf8',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'}
        >
          <span>📚</span> Gestionar Recursos Educativos
        </button>
  
        {/* Botón Estadísticas */}
        <button
          onClick={() => navigate('/tutor/estadisticas')}
          style={{
            padding: '10px 18px',
            background: 'rgba(16, 185, 129, 0.1)', // Un verde suave para variar
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '10px',
            color: '#34d399',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'}
        >
          <span>📈</span> Ver estadísticas del grupo
        </button>
      </div>
      
      <EjerciciosPage />
    </SimpleLayout>
  );
};
const DashboardRevisor = () => (
  <SimpleLayout titulo="Panel de revisión"><RevisionPage /></SimpleLayout>
);
const DashboardEstudiante = () => (
  <SimpleLayout titulo="Dashboard Estudiante">
    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Módulo en construcción...</p>
  </SimpleLayout>
);
const NoAutorizado = () => (
  <SimpleLayout titulo="403 — No autorizado">
    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Sin permiso.</p>
  </SimpleLayout>
);

function RedireccionPorRol() {
  const { usuario } = useAuth();
  const esEstudiante = usuario?.rol?.codigo === 'ESTUDIANTE';
  const [diagnosticoCompleto, setDiagnosticoCompleto] = useState(
    esEstudiante ? null : false
  );

  useEffect(() => {
    if (!esEstudiante) return;

    let activo = true;

    diagnosticoService
      .estado()
      .then((estado) => {
        if (activo) {
          setDiagnosticoCompleto(estado.diagnostico_completado);
        }
      })
      .catch(() => {
        if (activo) {
          setDiagnosticoCompleto(false);
        }
      });

    return () => {
      activo = false;
    };
  }, [esEstudiante, usuario?.id]);

  if (esEstudiante && diagnosticoCompleto === null) {
    return null;
  }

  const rol = usuario?.rol?.codigo;

  if (rol === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (rol === 'TUTOR') return <Navigate to="/tutor/dashboard" replace />;
  if (rol === 'REVISOR') return <Navigate to="/revisor/dashboard" replace />;

  if (rol === 'ESTUDIANTE') {
    return diagnosticoCompleto
      ? <Navigate to="/estudiante/dashboard" replace />
      : <Navigate to="/diagnostico/inicio" replace />;
  }

  return <Navigate to="/login" replace />;
}



function DashboardEstudianteGuard() {
  const navigate   = useNavigate();
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    diagnosticoService.estado()
      .then(estado => {
        if (!estado.diagnostico_completado) {
          navigate('/diagnostico/inicio', { replace: true });
        }
      })
      .catch(() => {})
      .finally(() => setVerificando(false));
  }, [navigate]);

  if (verificando) return null;

  return <DashboardEstudiantePage />;
}
export default function App() {
  const { usuario } = useAuth();
  const rol = usuario?.rol?.codigo;

  const dashboardRol =
    rol === 'ADMIN'   ? '/admin/dashboard'     :
    rol === 'TUTOR'   ? '/tutor/dashboard'     :
    rol === 'REVISOR' ? '/revisor/dashboard'   :
    '/estudiante/dashboard';

  return (
    <Routes>
      {/* Públicas */}
      <Route path="/"                   element={<Navigate to="/login" replace />} />
      <Route path="/login"              element={<LoginPage />} />
      <Route path="/registro"           element={<RegistroPage />} />
      <Route path="/olvide-password"    element={<OlvidePasswordPage />} />
      <Route path="/recuperar-password" element={<RestablecerPasswordPage />} />
      <Route path="/no-autorizado"      element={<NoAutorizado />} />

      <Route path="/dashboard" element={
        <ProtectedRoute><RedireccionPorRol /></ProtectedRoute>
      }/>

      <Route path="/diagnostico/inicio"     element={<ProtectedRoute roles={['ESTUDIANTE']}><DiagnosticoInicioPage /></ProtectedRoute>} />
      <Route path="/diagnostico/test"       element={<ProtectedRoute roles={['ESTUDIANTE']}><DiagnosticoTestPage /></ProtectedRoute>} />
      <Route path="/diagnostico/resultados" element={<ProtectedRoute roles={['ESTUDIANTE']}><DiagnosticoResultadosPage /></ProtectedRoute>} />
      <Route path="/diagnostico/ruta"       element={<ProtectedRoute roles={['ESTUDIANTE']}><DiagnosticoRutaPage /></ProtectedRoute>} />

      {/* Perfil */}
      <Route path="/perfil" element={
        <ProtectedRoute>
          {rol === 'ADMIN'
            ? <AdminLayout titulo="Mi perfil"><PerfilPage /></AdminLayout>
            : <SimpleLayout titulo="Mi perfil" botonVolver={dashboardRol}>
                <PerfilPage />
              </SimpleLayout>
          }
        </ProtectedRoute>
      }/>

      {/* Admin */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute roles={['ADMIN']}>
          <AdminLayout titulo="Gestión de Usuarios"><UsuariosPage /></AdminLayout>
        </ProtectedRoute>
      }/>
      <Route path="/admin/banco" element={
        <ProtectedRoute roles={['ADMIN']}>
          <AdminLayout titulo="Banco de Ejercicios"><BancoEjerciciosPage /></AdminLayout>
        </ProtectedRoute>
      }/>
      <Route path="/admin/simulacros-configuracion" element={
        <ProtectedRoute roles={['ADMIN']}>
          <AdminLayout titulo="Configuracion de simulacros"><ConfiguracionSimulacroPage /></AdminLayout>
        </ProtectedRoute>
      }/>
      <Route path="/revisor/revision" element={
        <ProtectedRoute roles={['REVISOR', 'ADMIN']}>
          {rol === 'ADMIN'
            ? <AdminLayout titulo="Panel de Revisión"><RevisionPage /></AdminLayout>
            : <SimpleLayout titulo="Panel de revisión"><RevisionPage /></SimpleLayout>
          }
        </ProtectedRoute>
      }/>
      <Route path="/tutor/ejercicios" element={
        <ProtectedRoute roles={['TUTOR', 'ADMIN']}>
          {rol === 'ADMIN'
            ? <AdminLayout titulo="Ejercicios"><EjerciciosPage /></AdminLayout>
            : <SimpleLayout titulo="Mis ejercicios" botonVolver={dashboardRol}>
                <EjerciciosPage />
              </SimpleLayout>
          }
        </ProtectedRoute>
      }/>
      <Route path="/tutor/ejercicios/crear" element={
        <ProtectedRoute roles={['TUTOR', 'ADMIN']}>
          <SimpleLayout titulo="Nuevo ejercicio" botonVolver="/tutor/ejercicios">
            <CrearEjercicioPage />
          </SimpleLayout>
        </ProtectedRoute>
      }/>
     <Route path="/tutor/ejercicios/:id" element={
    <ProtectedRoute roles={['TUTOR', 'ADMIN', 'REVISOR']}>
      <SimpleLayout titulo="Detalle del ejercicio">
        <DetalleEjercicioPage />
      </SimpleLayout>
    </ProtectedRoute>
  }/>
  <Route path="/admin/estadisticas" element={
  <ProtectedRoute roles={['ADMIN']}>
    <AdminLayout titulo="Estadísticas de la plataforma">
      <EstadisticasAdminPage />
    </AdminLayout>
  </ProtectedRoute>
}/>

      {/* Tutor */}
      <Route path="/tutor/dashboard" element={
        <ProtectedRoute roles={['TUTOR']}><DashboardTutor /></ProtectedRoute>
      }/>
      <Route path="/tutor/estadisticas" element={
        <ProtectedRoute roles={['TUTOR', 'ADMIN']}>
          <SimpleLayout titulo="Estadísticas del grupo" botonVolver="/tutor/dashboard">
            <EstadisticasTutorPage />
          </SimpleLayout>
        </ProtectedRoute>
        }/>

      {/* Revisor */}
      <Route path="/revisor/dashboard" element={
        <ProtectedRoute roles={['REVISOR']}><DashboardRevisor /></ProtectedRoute>
      }/>
      <Route path="/tutor/recursos" element={
  <ProtectedRoute roles={['TUTOR', 'ADMIN']}>
    <SimpleLayout titulo="Mis recursos" botonVolver={dashboardRol}>
      <RecursosPage />
    </SimpleLayout>
  </ProtectedRoute>
}/>

<Route path="/tutor/recursos/crear" element={
  <ProtectedRoute roles={['TUTOR', 'ADMIN']}>
    <SimpleLayout titulo="Nuevo recurso" botonVolver="/tutor/recursos">
      <CrearRecursoPage />
    </SimpleLayout>
  </ProtectedRoute>
}/>
<Route path="/tutor/recursos/:id/editar" element={
  <ProtectedRoute roles={['TUTOR', 'ADMIN']}>
    <SimpleLayout titulo="Editar recurso" botonVolver="/tutor/recursos">
      <EditarRecursoPage />
    </SimpleLayout>
  </ProtectedRoute>
}/>
<Route path="/revisor/recursos" element={
  <ProtectedRoute roles={['REVISOR', 'ADMIN']}>
    {rol === 'ADMIN'
      ? <AdminLayout titulo="Revisión de recursos">
          <RevisionRecursosPage />
        </AdminLayout>
      : <SimpleLayout titulo="Revisión de recursos">
          <RevisionRecursosPage />
        </SimpleLayout>
    }
  </ProtectedRoute>
}/>


      {/* Estudiante */}
    <Route path="/estudiante/dashboard" element={
  <ProtectedRoute roles={['ESTUDIANTE']}>
    <SimpleLayout titulo="">
      <DashboardEstudianteGuard />
    </SimpleLayout>
  </ProtectedRoute>
}/>

<Route path="/estudiante/practica" element={
  <ProtectedRoute roles={['ESTUDIANTE']}>
    <SimpleLayout titulo="Practica">
      <PracticaInicioPage />
    </SimpleLayout>
  </ProtectedRoute>
}/>

<Route path="/estudiante/practica/guardados" element={
  <ProtectedRoute roles={['ESTUDIANTE']}>
    <SimpleLayout titulo="Ejercicios guardados" botonVolver="/estudiante/practica">
      <PracticaGuardadosPage />
    </SimpleLayout>
  </ProtectedRoute>
}/>

<Route path="/estudiante/practica/historial" element={
  <ProtectedRoute roles={['ESTUDIANTE']}>
    <SimpleLayout titulo="Historial de practica" botonVolver="/estudiante/practica">
      <PracticaHistorialPage />
    </SimpleLayout>
  </ProtectedRoute>
}/>

<Route path="/estudiante/simulacros" element={
  <ProtectedRoute roles={['ESTUDIANTE']}>
    <SimpleLayout titulo="Simulacros">
      <SimulacrosInicioPage />
    </SimpleLayout>
  </ProtectedRoute>
}/>

<Route path="/estudiante/simulacros/sesion/:simulacroId" element={
  <ProtectedRoute roles={['ESTUDIANTE']}>
    <SimpleLayout titulo="Sesion de simulacro">
      <SimulacroSesionPage />
    </SimpleLayout>
  </ProtectedRoute>
}/>

<Route path="/estudiante/simulacros/historial" element={
  <ProtectedRoute roles={['ESTUDIANTE']}>
    <SimpleLayout titulo="Historial de simulacros" botonVolver="/estudiante/simulacros">
      <SimulacroHistorialPage />
    </SimpleLayout>
  </ProtectedRoute>
}/>

<Route path="/estudiante/practica/sesion/:sesionId" element={
  <ProtectedRoute roles={['ESTUDIANTE']}>
    <SimpleLayout titulo="Practica" botonVolver="/estudiante/practica">
      <PracticaSesionPage />
    </SimpleLayout>
  </ProtectedRoute>
}/>
<Route path="/estudiante/biblioteca" element={
  <ProtectedRoute roles={['ESTUDIANTE']}>
    <SimpleLayout titulo="Biblioteca de recursos">
      <BibliotecaPage />
    </SimpleLayout>
  </ProtectedRoute>
}/>
<Route path="/estudiante/estadisticas" element={
  <ProtectedRoute roles={['ESTUDIANTE']}>
    <SimpleLayout titulo="Mis estadísticas">
      <EstadisticasPage />
    </SimpleLayout>
  </ProtectedRoute>
}/>
<Route path="/foro" element={
  <ProtectedRoute roles={['ESTUDIANTE', 'TUTOR', 'REVISOR', 'ADMIN']}>
    <SimpleLayout titulo="Foro de dudas">
      <ForoPage />
    </SimpleLayout>
  </ProtectedRoute>
}/>

<Route path="/foro/:id" element={
  <ProtectedRoute roles={['ESTUDIANTE', 'TUTOR', 'REVISOR', 'ADMIN']}>
    <SimpleLayout titulo="Detalle del hilo" botonVolver="/foro">
      <HiloPage />
    </SimpleLayout>
  </ProtectedRoute>
}/>
    </Routes>
  );

}