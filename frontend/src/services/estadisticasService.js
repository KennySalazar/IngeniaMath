import api from './api';

export const estadisticasService = {

  async dashboardEstudiante() {
    const res = await api.get('/estadisticas/estudiante');
    return res.data.data;
  },

  async dashboardTutor() {
    const res = await api.get('/estadisticas/tutor');
    return res.data.data;
  },

  exportarReporteTutor() {
    // Descarga directa abriendo la URL con el token en el header
    // Se maneja desde el componente con un fetch manual
    return api.get('/estadisticas/tutor/exportar', {
      responseType: 'blob',
    });
  },
  async dashboardAdmin() {
    const res = await api.get('/estadisticas/admin');
    return res.data.data;
  },
  
  exportarReporteAdmin() {
    return api.get('/estadisticas/admin/exportar', { responseType: 'blob' });
  },

};