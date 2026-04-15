import api from './api';

export const usuarioService = {
  async listar(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.buscar)  params.append('buscar', filtros.buscar);
    if (filtros.rol_id)  params.append('rol_id', filtros.rol_id);
    if (filtros.activo)  params.append('activo', filtros.activo);
    const res = await api.get(`/usuarios?${params.toString()}`);
    return res.data.data;
  },

  async verPerfil(id) {
    const res = await api.get(`/usuarios/${id}`);
    return res.data.data;
  },

  async editar(id, datos) {
    const res = await api.put(`/usuarios/${id}`, datos);
    return res.data.data;
  },

  async crear(datos) {
    const res = await api.post('/usuarios', datos);
    return res.data.data;
  },

  async cambiarEstado(id, activo) {
    const res = await api.patch(`/usuarios/${id}/estado`, { activo });
    return res.data.data;
  },

  async cambiarRol(id, rol_id) {
    const res = await api.patch(`/usuarios/${id}/rol`, { rol_id });
    return res.data.data;
  },

  async eliminar(id) {
    await api.delete(`/usuarios/${id}`);
  },

  async resumen() {
    const res = await api.get('/usuarios-resumen');
    return res.data.data;
  },
};