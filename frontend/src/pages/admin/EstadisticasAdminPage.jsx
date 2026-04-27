import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, ResponsiveContainer, Legend,
} from 'recharts';
import { estadisticasService } from '../../services/estadisticasService';

const COLOR_ADMIN = '#ef4444';

const COLORES_ROL = {
  ADMIN:      '#ef4444',
  TUTOR:      '#6366f1',
  ESTUDIANTE: '#10b981',
  REVISOR:    '#f59e0b',
};

const ICONOS_ENTIDAD = {
  ejercicios:          '📝',
  simulacros:          '🏆',
  sesiones_practica:   '🎯',
  usuarios:            '👤',
  recursos_educativos: '📚',
  diagnostico:         '🔍',
};

const LABELS_ACCION = {
  CREATED:            { label: 'Creó',      color: '#10b981' },
  UPDATED:            { label: 'Editó',     color: '#6366f1' },
  DELETED:            { label: 'Eliminó',   color: '#ef4444' },
  LOGIN:              { label: 'Inició sesión', color: '#f59e0b' },
  ESTADO_CAMBIADO:    { label: 'Cambió estado', color: '#a78bfa' },
  ENVIADO_REVISION:   { label: 'Envió a revisión', color: '#f59e0b' },
  APROBADO:           { label: 'Aprobó',    color: '#10b981' },
  RECHAZADO:          { label: 'Rechazó',   color: '#ef4444' },
  PUBLICADO:          { label: 'Publicó',   color: '#6366f1' },
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ h = 200 }) {
  return (
    <div style={{
      height: h, borderRadius: 12,
      background: 'rgba(255,255,255,0.04)',
      animation: 'pulse 1.5s infinite',
    }} />
  );
}

// ── Sección ───────────────────────────────────────────────────────────────────
function Seccion({ titulo, accion, children }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, padding: '1.5rem',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: '1.25rem',
      }}>
        <h3 style={{
          fontSize: 13, fontWeight: 700,
          color: 'rgba(255,255,255,0.45)',
          textTransform: 'uppercase', letterSpacing: 1, margin: 0,
        }}>
          {titulo}
        </h3>
        {accion}
      </div>
      {children}
    </div>
  );
}

// ── Card métrica grande ───────────────────────────────────────────────────────
function CardMetrica({ icono, label, valor, sub, color = COLOR_ADMIN, badge }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14, padding: '1.25rem',
      position: 'relative', overflow: 'hidden',
    }}>
      {badge && (
        <span style={{
          position: 'absolute', top: 12, right: 12,
          padding: '2px 8px', borderRadius: 20, fontSize: 10,
          fontWeight: 700, background: `${color}22`, color,
        }}>
          {badge}
        </span>
      )}
      <div style={{ fontSize: 22, marginBottom: 8 }}>{icono}</div>
      <p style={{
        fontSize: 28, fontWeight: 800, color,
        margin: '0 0 4px', fontFamily: 'Syne, sans-serif',
      }}>
        {valor}
      </p>
      <p style={{ fontSize: 13, color: 'white', margin: '0 0 2px', fontWeight: 600 }}>
        {label}
      </p>
      {sub && (
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0 }}>{sub}</p>
      )}
    </div>
  );
}

// ── Estado del banco de ejercicios ────────────────────────────────────────────
function BancoEjercicios({ ejercicios }) {
  const items = [
    { label: 'Publicados',     valor: ejercicios.publicados,     color: '#10b981' },
    { label: 'Aprobados',      valor: ejercicios.aprobados,      color: '#6366f1' },
    { label: 'En revisión',    valor: ejercicios.en_revision,    color: '#f59e0b' },
    { label: 'Borradores',     valor: ejercicios.borradores,     color: 'rgba(255,255,255,0.3)' },
    { label: 'Deshabilitados', valor: ejercicios.deshabilitados, color: '#ef4444' },
  ];

  const total = ejercicios.total || 1;

  return (
    <div>
      {/* Barra de progreso apilada */}
      <div style={{
        display: 'flex', height: 10, borderRadius: 6,
        overflow: 'hidden', marginBottom: '1rem', gap: 2,
      }}>
        {items.map(item => (
          <div
            key={item.label}
            title={`${item.label}: ${item.valor}`}
            style={{
              width: `${(item.valor / total) * 100}%`,
              background: item.color,
              minWidth: item.valor > 0 ? 4 : 0,
              transition: 'width 0.5s ease',
            }}
          />
        ))}
      </div>

      {/* Leyenda */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {items.map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 10, height: 10, borderRadius: 2,
              background: item.color, flexShrink: 0,
            }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              {item.label}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>
              {item.valor}
            </span>
          </div>
        ))}
      </div>

      <p style={{
        fontSize: 11, color: 'rgba(255,255,255,0.2)',
        marginTop: 10, textAlign: 'right',
      }}>
        Total en el banco: {ejercicios.total}
      </p>
    </div>
  );
}

// ── Actividad reciente ────────────────────────────────────────────────────────
function ActividadReciente({ actividad }) {
  if (actividad.length === 0) {
    return (
      <p style={{
        color: 'rgba(255,255,255,0.25)', fontSize: 13,
        textAlign: 'center', padding: '1.5rem 0',
      }}>
        Sin actividad registrada.
      </p>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 6,
      maxHeight: 360, overflowY: 'auto',
    }}>
      {actividad.map(a => {
        const cfgAccion = LABELS_ACCION[a.accion] ?? { label: a.accion, color: 'rgba(255,255,255,0.4)' };
        const colorRol  = COLORES_ROL[a.rol] ?? 'rgba(255,255,255,0.3)';
        const icono     = ICONOS_ENTIDAD[a.entidad] ?? '⚙️';

        return (
          <div
            key={a.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 10,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            {/* Ícono entidad */}
            <span style={{ fontSize: 18, flexShrink: 0 }}>{icono}</span>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ color: 'white', fontSize: 12, fontWeight: 600 }}>
                  {a.usuario}
                </span>
                <span style={{
                  padding: '1px 6px', borderRadius: 20, fontSize: 10,
                  fontWeight: 700, background: `${colorRol}22`, color: colorRol,
                }}>
                  {a.rol}
                </span>
                <span style={{ fontSize: 12, color: cfgAccion.color, fontWeight: 600 }}>
                  {cfgAccion.label}
                </span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                  {a.entidad.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            {/* Fecha */}
            <span style={{
              fontSize: 11, color: 'rgba(255,255,255,0.25)',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              {new Date(a.fecha_evento).toLocaleString('es-GT', {
                day: '2-digit', month: '2-digit',
                hour: '2-digit', minute: '2-digit',
              })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Tabla usuarios por rol ────────────────────────────────────────────────────
function TablaRoles({ roles }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {roles.map(r => {
        const color = COLORES_ROL[r.codigo] ?? 'rgba(255,255,255,0.4)';
        return (
          <div
            key={r.codigo}
            style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr 80px 80px 80px',
              alignItems: 'center', gap: 12,
              padding: '12px 16px', borderRadius: 10,
              background: `${color}08`,
              border: `1px solid ${color}22`,
            }}
          >
            {/* Rol */}
            <span style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 11,
              fontWeight: 700, background: `${color}22`, color,
              textAlign: 'center',
            }}>
              {r.codigo}
            </span>

            {/* Barra de activos */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                flex: 1, height: 6, borderRadius: 3,
                background: 'rgba(255,255,255,0.06)',
              }}>
                <div style={{
                  height: '100%', borderRadius: 3, background: color,
                  width: r.total > 0
                    ? `${(r.activos / r.total) * 100}%`
                    : '0%',
                  transition: 'width 0.5s ease',
                }} />
              </div>
            </div>

            {/* Total */}
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'white', fontSize: 16, fontWeight: 800, margin: 0 }}>
                {r.total}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: 0 }}>
                total
              </p>
            </div>

            {/* Activos */}
            <div style={{ textAlign: 'center' }}>
              <p style={{ color, fontSize: 14, fontWeight: 700, margin: 0 }}>
                {r.activos}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: 0 }}>
                activos
              </p>
            </div>

            {/* Nuevos 30 días */}
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#10b981', fontSize: 13, fontWeight: 600, margin: 0 }}>
                +{r.nuevos_30_dias}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: 0 }}>
                este mes
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function EstadisticasAdminPage() {
  const [datos,      setDatos]      = useState(null);
  const [cargando,   setCargando]   = useState(true);
  const [exportando, setExportando] = useState(false);
  const [error,      setError]      = useState('');

  useEffect(() => {
    estadisticasService.dashboardAdmin()
      .then(setDatos)
      .catch(() => setError('No se pudieron cargar las estadísticas.'))
      .finally(() => setCargando(false));
  }, []);

  const handleExportar = async () => {
    setExportando(true);
    try {
      const res  = await estadisticasService.exportarReporteAdmin();
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `reporte_plataforma_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Error al exportar el reporte.');
    } finally {
      setExportando(false);
    }
  };

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#f87171', fontSize: 14 }}>
        {error}
      </div>
    );
  }

  const m = datos?.metricas;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>

      {/* ── Métricas globales ────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
        gap: 12,
      }}>
        {cargando ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} h={110} />)
        ) : (
          <>
            <CardMetrica
              icono="👥" label="Usuarios registrados"
              valor={m.usuarios.total}
              sub={`${m.usuarios.activos} activos`}
              badge={`+${m.usuarios.nuevos_30_dias} este mes`}
            />
            <CardMetrica
              icono="📝" label="Ejercicios en el banco"
              valor={m.ejercicios.total}
              sub={`${m.ejercicios.publicados} publicados`}
              color="#6366f1"
            />
            <CardMetrica
              icono="🎯" label="Sesiones de práctica"
              valor={m.practica_30_dias.total_sesiones.toLocaleString()}
              sub="últimos 30 días"
              color="#10b981"
            />
            <CardMetrica
              icono="🏆" label="Simulacros realizados"
              valor={m.simulacros.finalizados}
              sub={`Promedio: ${m.simulacros.promedio_puntaje}%`}
              color="#f59e0b"
            />
            <CardMetrica
              icono="📚" label="Recursos educativos"
              valor={m.recursos.total}
              sub={`${m.recursos.publicados} publicados`}
              color="#a78bfa"
            />
            <CardMetrica
              icono="👩‍🎓" label="Estudiantes activos"
              valor={m.practica_30_dias.estudiantes_activos}
              sub="practicando este mes"
              color="#10b981"
            />
          </>
        )}
      </div>

      {/* ── Estado del banco de ejercicios ──────────────────────────────── */}
      <Seccion titulo="Estado del banco de ejercicios">
        {cargando
          ? <Skeleton h={80} />
          : <BancoEjercicios ejercicios={m.ejercicios} />
        }
      </Seccion>

      {/* ── Fila: crecimiento + actividad diaria ─────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Crecimiento de usuarios */}
        <Seccion titulo="Nuevos usuarios por semana">
          {cargando ? <Skeleton /> : datos.crecimiento.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', padding: '2rem 0' }}>
              Sin datos aún.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={datos.crecimiento}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="semana" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    background: '#1a1a2e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }} />
                <Bar dataKey="estudiantes" name="Estudiantes" fill="#10b981" radius={[4,4,0,0]} stackId="a" />
                <Bar dataKey="tutores"     name="Tutores"     fill="#6366f1" radius={[4,4,0,0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Seccion>

        {/* Actividad diaria */}
        <Seccion titulo="Actividad diaria — últimos 30 días">
          {cargando ? <Skeleton /> : datos.actividad_diaria.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', padding: '2rem 0' }}>
              Sin actividad registrada.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={datos.actividad_diaria}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="fecha" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} interval={4} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    background: '#1a1a2e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }} />
                <Line
                  type="monotone" dataKey="estudiantes_unicos"
                  name="Estudiantes activos"
                  stroke="#10b981" strokeWidth={2} dot={false}
                />
                <Line
                  type="monotone" dataKey="total_sesiones"
                  name="Sesiones"
                  stroke="#6366f1" strokeWidth={1.5}
                  strokeDasharray="4 4" dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Seccion>
      </div>

      {/* ── Usuarios por rol ─────────────────────────────────────────────── */}
      <Seccion
        titulo="Reportes de uso por rol"
        accion={
          <button
            onClick={handleExportar}
            disabled={exportando || cargando}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 16px', borderRadius: 9, fontSize: 12,
              fontWeight: 600,
              cursor: exportando ? 'not-allowed' : 'pointer',
              background: exportando
                ? 'rgba(239,68,68,0.05)'
                : 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: exportando ? 'rgba(255,255,255,0.3)' : '#f87171',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            {exportando ? '⏳ Exportando...' : '⬇️ Exportar CSV completo'}
          </button>
        }
      >
        {cargando
          ? <Skeleton h={180} />
          : <TablaRoles roles={datos.usuarios_por_rol} />
        }
      </Seccion>

      {/* ── Actividad reciente ───────────────────────────────────────────── */}
      <Seccion titulo="Actividad reciente del sistema">
        {cargando
          ? <Skeleton h={300} />
          : <ActividadReciente actividad={datos.actividad_reciente} />
        }
      </Seccion>
    </div>
  );
}