import api from './api';

export const authService = {
  async login(correo, password) {
    const res = await api.post('/auth/login', { correo, password });
    const { token, usuario } = res.data.data;
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    return usuario;
  },

  async registro(datos) {
    const res = await api.post('/auth/registro', datos);
    const { token, usuario } = res.data.data;
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    return usuario;
  },

  async logout() {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  },

  getUsuarioActual() {
    const u = localStorage.getItem('usuario');
    return u ? JSON.parse(u) : null;
  },

  estaAutenticado() {
    return !!localStorage.getItem('token');
  },

  getRol() {
    const u = this.getUsuarioActual();
    return u?.rol?.codigo ?? null;
  },
};