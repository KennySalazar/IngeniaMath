import api from './api';

export const foroService = {

  async listar(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.modulo_id)  params.append('modulo_id',  filtros.modulo_id);
    if (filtros.subtema_id) params.append('subtema_id', filtros.subtema_id);
    if (filtros.estado)     params.append('estado',     filtros.estado);
    if (filtros.buscar)     params.append('buscar',     filtros.buscar);
    if (filtros.per_page)   params.append('per_page',   filtros.per_page);
    if (filtros.page)       params.append('page',       filtros.page);

    const res = await api.get(`/foro?${params.toString()}`);
    return res.data; // { data, meta }
  },

  async verHilo(id) {
    const res = await api.get(`/foro/${id}`);
    return res.data.data;
  },

  async crearHilo(datos) {
    const res = await api.post('/foro', datos);
    return res.data.data;
  },

  async editarHilo(id, datos) {
    const res = await api.put(`/foro/${id}`, datos);
    return res.data.data;
  },

  async responder(hiloId, contenido) {
    const res = await api.post(`/foro/${hiloId}/responder`, { contenido });
    return res.data.data;
  },

  async eliminarRespuesta(respuestaId) {
    await api.delete(`/foro/respuestas/${respuestaId}`);
  },

  async marcarSolucion(hiloId, respuestaId) {
    const res = await api.patch(`/foro/${hiloId}/solucion`, { respuesta_id: respuestaId });
    return res.data.data;
  },

  async cambiarEstado(hiloId, estado) {
    const res = await api.patch(`/foro/${hiloId}/estado`, { estado });
    return res.data.data;
  },

  async badge() {
    const res = await api.get('/foro/badge');
    return res.data.data; // { total: N }
  },
};