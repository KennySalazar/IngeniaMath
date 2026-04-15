import { createContext, useContext, useState } from 'react';
import { authService } from '../services/authService';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(authService.getUsuarioActual());

  const login = async (correo, password) => {
    const u = await authService.login(correo, password);
    setUsuario(u);
    return u;
  };

  const logout = async () => {
    await authService.logout();
    setUsuario(null);
  };

  // Nueva función para actualizar datos del usuario en el contexto
  const actualizarUsuario = (nuevosDatos) => {
    const actualizado = { ...usuario, ...nuevosDatos };
    localStorage.setItem('usuario', JSON.stringify(actualizado));
    setUsuario(actualizado);
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout, actualizarUsuario, estaAutenticado: !!usuario }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);