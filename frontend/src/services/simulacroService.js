import api from './api';

export const simulacroService = {
  async configuracion() {
    const res = await api.get('/simulacros/configuracion');
    return res.data.data;
  },

  async activa() {
    const res = await api.get('/simulacros/activa');
    return res.data.data;
  },

  async iniciar() {
    const res = await api.post('/simulacros/iniciar');
    return res.data.data;
  },

  async detalle(simulacroId) {
    const res = await api.get(`/simulacros/${simulacroId}`);
    return res.data.data;
  },

  async responder(simulacroId, payload) {
    const res = await api.post(`/simulacros/${simulacroId}/responder`, payload);
    return res.data.data;
  },

  async finalizar(simulacroId) {
    const res = await api.post(`/simulacros/${simulacroId}/finalizar`);
    return res.data.data;
  },

  async historial() {
    const res = await api.get('/simulacros/historial');
    return res.data.data;
  },
};