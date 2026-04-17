import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { diagnosticoService } from '../../services/diagnosticoService';
import './DiagnosticoPage.css';

export default function DiagnosticoInicioPage() {
  const navigate  = useNavigate();
  const [cargando, setCargando] = useState(false);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    diagnosticoService.estado().then(estado => {
      if (estado.diagnostico_completado) {
        navigate('/estudiante/dashboard', { replace: true });
      } else if (estado.tiene_intento_activo) {
        // Reanuda el test en curso
        navigate('/diagnostico/test', { replace: true });
      }
    }).finally(() => setVerificando(false));
  }, [navigate]);

  const handleIniciar = async () => {
    setCargando(true);
    try {
      await diagnosticoService.iniciar();
      navigate('/diagnostico/test');
    } catch {
      setCargando(false);
    }
  };

  if (verificando) return (
    <div className="diag-loading">Cargando...</div>
  );

  return (
    <div className="diag-fullpage">
      <div className="diag-inicio-card">

        <div className="diag-logo">
          <span className="diag-logo-icon">∑</span>
          <span className="diag-logo-text">IngeniaMath</span>
        </div>

        <div className="diag-inicio-icono">📋</div>

        <h1 className="diag-inicio-titulo">Diagnóstico Inicial</h1>
        <p className="diag-inicio-subtitulo">
          Antes de comenzar, necesitamos evaluar tu nivel actual en los 7 módulos temáticos del examen de admisión USAC.
        </p>

        <div className="diag-info-grid">
          <div className="diag-info-item">
            <span className="diag-info-numero">14</span>
            <span className="diag-info-label">Preguntas</span>
          </div>
          <div className="diag-info-item">
            <span className="diag-info-numero">7</span>
            <span className="diag-info-label">Módulos</span>
          </div>
         
        </div>

        <div className="diag-instrucciones">
          <h3>Instrucciones</h3>
          <ul>
            <li>Responde cada pregunta con honestidad para obtener una ruta personalizada precisa.</li>
            <li>Puedes navegar entre preguntas antes de enviar.</li>
            <li>Si cierras la sesión, tu progreso se guarda y puedes continuar después.</li>
            <li>Al finalizar verás tu nivel en cada módulo y tu ruta de estudio.</li>
          </ul>
        </div>

        <button
          className="diag-btn-iniciar"
          onClick={handleIniciar}
          disabled={cargando}
        >
          {cargando ? 'Iniciando...' : 'Comenzar diagnóstico'}
        </button>
      </div>
    </div>
  );
}