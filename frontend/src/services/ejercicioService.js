import api from './api';

export const ejercicioService = {
async listar(filtros = {}) {
  const params = new URLSearchParams();
  if (filtros.modulo_id)        params.append('modulo_id',        filtros.modulo_id);
  if (filtros.subtema_id)       params.append('subtema_id',       filtros.subtema_id);
  if (filtros.nivel_dificultad) params.append('nivel_dificultad', filtros.nivel_dificultad);
  if (filtros.estado)           params.append('estado',           filtros.estado);
  if (filtros.buscar)           params.append('buscar',           filtros.buscar);
  if (filtros.per_page)         params.append('per_page',         filtros.per_page);
  if (filtros.page)             params.append('page',             filtros.page);
  const res = await api.get(`/ejercicios?${params.toString()}`);
  return res.data.data;
},
  async verDetalle(id) {
    const res = await api.get(`/ejercicios/${id}`);
    return res.data.data;
  },

  async crear(datos) {
    const res = await api.post('/ejercicios', datos);
    return res.data.data;
  },

  async editar(id, datos) {
    const res = await api.put(`/ejercicios/${id}`, datos);
    return res.data.data;
  },

  async enviarRevision(id) {
    const res = await api.post(`/ejercicios/${id}/enviar-revision`);
    return res.data.data;
  },

  async aprobar(id, notas = '') {
    const res = await api.post(`/ejercicios/${id}/aprobar`, { notas });
    return res.data.data;
  },

  async rechazar(id, notas) {
    const res = await api.post(`/ejercicios/${id}/rechazar`, { notas });
    return res.data.data;
  },

  async publicar(id) {
    const res = await api.post(`/ejercicios/${id}/publicar`);
    return res.data.data;
  },

  async deshabilitar(id) {
    const res = await api.post(`/ejercicios/${id}/deshabilitar`);
    return res.data.data;
  },

  async listarModulos() {
    const res = await api.get('/modulos');
    return res.data.data;
  },

  async listarSubtemas(moduloId) {
    const res = await api.get(`/modulos/${moduloId}/subtemas`);
    return res.data.data;
  },
};