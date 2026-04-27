import api from './api';

export const estadisticasService = {

  async dashboardEstudiante() {
    const res = await api.get('/estadisticas/estudiante');
    return res.data.data;
  },

};