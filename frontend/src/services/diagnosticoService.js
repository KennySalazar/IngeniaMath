import api from './api';

export const diagnosticoService = {
  async estado() {
    const res = await api.get('/diagnostico/estado');
    return res.data.data;
  },

  async iniciar() {
    const res = await api.post('/diagnostico/iniciar');
    return res.data.data;
  },

  async responder(intentoId, payload) {
    const res = await api.post(`/diagnostico/${intentoId}/responder`, payload);
    return res.data.data;
  },

  async finalizar(intentoId) {
    const res = await api.post(`/diagnostico/${intentoId}/finalizar`);
    return res.data.data;
  },

  async resultados(intentoId) {
    const res = await api.get(`/diagnostico/${intentoId}/resultados`);
    return res.data.data;
  },

  async obtenerRuta() {
    const res = await api.get('/ruta');
    return res.data.data;
  },

  async generarPlan(payload = {}) {
    const res = await api.post('/plan/generar', payload);
    return res.data.data;
  },

  async obtenerPlan() {
    const res = await api.get('/plan');
    return res.data.data;
  },
};