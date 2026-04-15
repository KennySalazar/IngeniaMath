import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, roles }) {
  const { usuario, estaAutenticado } = useAuth();

  if (!estaAutenticado) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(usuario?.rol?.codigo)) {
    return <Navigate to="/no-autorizado" replace />;
  }

  return children;
}