import api from './api';

export const practicaService = {

    async activa() {
    const res = await api.get('/practica/activa');
    return res.data.data;
    },

    async historial() {
  const res = await api.get('/practica/historial');
  return res.data.data;
},

  async iniciar(payload) {
    const res = await api.post('/practica/iniciar', payload);
    return res.data.data;
  },

  async detalle(sesionId) {
    const res = await api.get(`/practica/${sesionId}`);
    return res.data.data;
  },

  async responder(sesionId, payload) {
    const res = await api.post(`/practica/${sesionId}/responder`, payload);
    return res.data.data;
  },

  async finalizar(sesionId) {
    const res = await api.post(`/practica/${sesionId}/finalizar`);
    return res.data.data;
  },

  async resumen(sesionId) {
    const res = await api.get(`/practica/${sesionId}/resumen`);
    return res.data.data;
  },

  async omitirPorTiempo(sesionId, payload) {
  const res = await api.post(`/practica/${sesionId}/omitir`, payload);
  return res.data.data;
    },

    async guardados() {
    const res = await api.get('/practica/guardados');
    return res.data.data;
  },

  async eliminarGuardado(ejercicioId) {
    const res = await api.delete(`/practica/guardados/${ejercicioId}`);
    return res.data.data;
  },

    async guardarParaDespues(payload) {
    const res = await api.post('/practica/guardados', payload);
    return res.data.data;
  },
};