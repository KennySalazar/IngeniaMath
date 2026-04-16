const ESTILOS = {
  BORRADOR:      { bg: 'rgba(156,163,175,0.15)', color: '#9ca3af', label: 'Borrador'     },
  EN_REVISION:   { bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24', label: 'En revisión'  },
  APROBADO:      { bg: 'rgba(99,102,241,0.15)',  color: '#818cf8', label: 'Aprobado'     },
  PUBLICADO:     { bg: 'rgba(16,185,129,0.15)',  color: '#10b981', label: 'Publicado'    },
  DESHABILITADO: { bg: 'rgba(239,68,68,0.12)',   color: '#f87171', label: 'Deshabilitado'},
};

export default function BadgeEstado({ estado }) {
  const estilo = ESTILOS[estado] ?? ESTILOS.BORRADOR;

  return (
    <span style={{
      display:       'inline-block',
      padding:       '3px 10px',
      borderRadius:  20,
      fontSize:      11,
      fontWeight:    600,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      background:    estilo.bg,
      color:         estilo.color,
    }}>
      {estilo.label}
    </span>
  );
}