import api from './api';

export const recursoService = {

  async listar(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.modulo_id)   params.append('modulo_id',   filtros.modulo_id);
    if (filtros.subtema_id)  params.append('subtema_id',  filtros.subtema_id);
    if (filtros.tipo_recurso) params.append('tipo_recurso', filtros.tipo_recurso);
    if (filtros.estado)      params.append('estado',      filtros.estado);
    if (filtros.per_page)    params.append('per_page',    filtros.per_page);
    if (filtros.page)        params.append('page',        filtros.page);

    const res = await api.get(`/recursos?${params.toString()}`);
    return res.data; // { data, meta, links }
  },

  async verDetalle(id) {
    const res = await api.get(`/recursos/${id}`);
    return res.data.data;
  },

  async crear(datos) {
    const res = await api.post('/recursos', datos);
    return res.data.data;
  },

  async editar(id, datos) {
    const res = await api.put(`/recursos/${id}`, datos);
    return res.data.data;
  },

  async eliminar(id) {
    await api.delete(`/recursos/${id}`);
  },

  async enviarRevision(id) {
    const res = await api.patch(`/recursos/${id}/enviar-revision`);
    return res.data.data;
  },

  async aprobar(id) {
    const res = await api.patch(`/recursos/${id}/aprobar`);
    return res.data.data;
  },

  async rechazar(id, notas) {
    const res = await api.patch(`/recursos/${id}/rechazar`, { notas });
    return res.data.data;
  },

  async publicar(id) {
    const res = await api.patch(`/recursos/${id}/publicar`);
    return res.data.data;
  },

  async listarPorEjercicio(ejercicioId) {
    const res = await api.get(`/recursos/ejercicio/${ejercicioId}`);
    return res.data.data;
  },

  async vincularEjercicio(recursoId, ejercicioId, accion = 'adjuntar') {
    const res = await api.post(`/recursos/${recursoId}/vincular-ejercicio`, {
      ejercicio_id: ejercicioId,
      accion,
    });
    return res.data;
  },
};