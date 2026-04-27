import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, LineChart, Line, ResponsiveContainer, Cell,
} from 'recharts';
import { estadisticasService } from '../../services/estadisticasService';

const COLOR = '#6366f1';

const COLORES_NIVEL = {
  BASICO:      { bg: 'rgba(16,185,129,0.15)',  color: '#10b981' },
  INTERMEDIO:  { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' },
  AVANZADO:    { bg: 'rgba(239,68,68,0.15)',   color: '#f87171' },
  EXAMEN_REAL: { bg: 'rgba(139,92,246,0.15)',  color: '#a78bfa' },
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

// ── Card métrica ──────────────────────────────────────────────────────────────
function CardMetrica({ icono, label, valor, sub, color = COLOR }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14, padding: '1.25rem',
    }}>
      <div style={{ fontSize: 22, marginBottom: 8 }}>{icono}</div>
      <p style={{
        fontSize: 26, fontWeight: 800, color, margin: '0 0 4px',
        fontFamily: 'Syne, sans-serif',
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

// ── Tabla de estudiantes ──────────────────────────────────────────────────────
function TablaEstudiantes({ estudiantes }) {
  const [orden, setOrden] = useState('porcentaje_aciertos');

  const ordenados = [...estudiantes].sort((a, b) => b[orden] - a[orden]);

  const colHead = (label, campo) => (
    <th
      onClick={() => setOrden(campo)}
      style={{
        padding: '10px 14px', fontSize: 11, fontWeight: 700,
        color: orden === campo ? COLOR : 'rgba(255,255,255,0.3)',
        textTransform: 'uppercase', letterSpacing: 0.8,
        cursor: 'pointer', textAlign: 'left', whiteSpace: 'nowrap',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
      }}
    >
      {label} {orden === campo ? '↓' : ''}
    </th>
  );

  if (estudiantes.length === 0) {
    return (
      <div style={{
        padding: '2rem', textAlign: 'center',
        color: 'rgba(255,255,255,0.25)', fontSize: 13,
      }}>
        No tienes estudiantes asignados.
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{
              padding: '10px 14px', fontSize: 11, fontWeight: 700,
              color: 'rgba(255,255,255,0.3)',
              textTransform: 'uppercase', letterSpacing: 0.8,
              textAlign: 'left',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)',
            }}>
              Estudiante
            </th>
            {colHead('Ejercicios', 'total_ejercicios')}
            {colHead('% Aciertos', 'porcentaje_aciertos')}
            {colHead('Simulacros', 'total_simulacros')}
            {colHead('Prom. Sim.', 'promedio_simulacros')}
            {colHead('Racha', 'racha_actual_dias')}
            <th style={{
              padding: '10px 14px', fontSize: 11, fontWeight: 700,
              color: 'rgba(255,255,255,0.3)',
              textTransform: 'uppercase', letterSpacing: 0.8,
              textAlign: 'left',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)',
            }}>
              Última actividad
            </th>
          </tr>
        </thead>
        <tbody>
          {ordenados.map((e, i) => {
            const colorAciertos = e.porcentaje_aciertos >= 70 ? '#10b981'
              : e.porcentaje_aciertos >= 40 ? '#f59e0b' : '#ef4444';

            return (
              <tr
                key={e.id}
                style={{ transition: 'background 0.15s' }}
                onMouseEnter={ev => ev.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}
              >
                {/* Nombre */}
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: `${COLOR}22`,
                      border: `1px solid ${COLOR}44`,
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center', flexShrink: 0,
                      fontSize: 12, fontWeight: 700, color: COLOR,
                    }}>
                      {e.nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: 0 }}>
                        {e.nombre}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0 }}>
                        {e.correo}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Ejercicios */}
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ color: 'white', fontSize: 13 }}>{e.total_ejercicios}</span>
                </td>

                {/* % Aciertos con barra */}
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      flex: 1, height: 6, borderRadius: 3,
                      background: 'rgba(255,255,255,0.06)', minWidth: 60,
                    }}>
                      <div style={{
                        height: '100%', borderRadius: 3,
                        width: `${e.porcentaje_aciertos}%`,
                        background: colorAciertos,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                    <span style={{ color: colorAciertos, fontSize: 12, fontWeight: 700, minWidth: 36 }}>
                      {e.porcentaje_aciertos}%
                    </span>
                  </div>
                </td>

                {/* Simulacros */}
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ color: 'white', fontSize: 13 }}>{e.total_simulacros}</span>
                </td>

                {/* Promedio simulacros */}
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{
                    color: e.promedio_simulacros >= 61 ? '#10b981' : '#f87171',
                    fontSize: 13, fontWeight: 600,
                  }}>
                    {e.promedio_simulacros > 0 ? `${e.promedio_simulacros}%` : '—'}
                  </span>
                </td>

                {/* Racha */}
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ color: e.racha_actual_dias > 0 ? '#f97316' : 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                    {e.racha_actual_dias > 0 ? `🔥 ${e.racha_actual_dias}d` : '—'}
                  </span>
                </td>

                {/* Última actividad */}
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                    {e.ultima_actividad
                      ? new Date(e.ultima_actividad).toLocaleDateString('es-GT')
                      : 'Sin actividad'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function EstadisticasTutorPage() {
  const navigate = useNavigate();

  const [datos,      setDatos]      = useState(null);
  const [cargando,   setCargando]   = useState(true);
  const [exportando, setExportando] = useState(false);
  const [error,      setError]      = useState('');

  useEffect(() => {
    estadisticasService.dashboardTutor()
      .then(setDatos)
      .catch(() => setError('No se pudieron cargar las estadísticas.'))
      .finally(() => setCargando(false));
  }, []);

  const handleExportar = async () => {
    setExportando(true);
    try {
      const res  = await estadisticasService.exportarReporteTutor();
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `reporte_estudiantes_${new Date().toISOString().split('T')[0]}.csv`;
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

      {/* ── Métricas grupales ────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 12,
      }}>
        {cargando ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} h={110} />)
        ) : (
          <>
            <CardMetrica
              icono="👥" label="Estudiantes asignados"
              valor={m.total_estudiantes}
            />
            <CardMetrica
              icono="📊" label="Promedio grupal de aciertos"
              valor={`${m.promedio_aciertos_grupal}%`}
              color={m.promedio_aciertos_grupal >= 60 ? '#10b981' : '#ef4444'}
            />
            <CardMetrica
              icono="🏆" label="Promedio en simulacros"
              valor={`${m.promedio_simulacros}%`}
              color={m.promedio_simulacros >= 61 ? '#10b981' : '#f59e0b'}
            />
            <CardMetrica
              icono="📝" label="Ejercicios resueltos (grupo)"
              valor={m.total_ejercicios_grupal.toLocaleString()}
              color="#a78bfa"
            />
          </>
        )}
      </div>

      {/* ── Progreso grupal semanal ──────────────────────────────────────── */}
      <Seccion titulo="Progreso grupal — últimas 8 semanas">
        {cargando ? <Skeleton h={200} /> : datos.progreso_semanal.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', padding: '2rem 0' }}>
            Sin datos de progreso aún.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={datos.progreso_semanal}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="semana" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} />
              <YAxis
                domain={[0, 100]} tickFormatter={v => `${v}%`}
                tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  background: '#1a1a2e',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, fontSize: 12,
                }}
                formatter={(v, name) => [
                  name === 'promedio_aciertos' ? `${v}%` : v,
                  name === 'promedio_aciertos' ? 'Promedio aciertos' : 'Estudiantes activos',
                ]}
              />
              <Line
                type="monotone" dataKey="promedio_aciertos"
                stroke={COLOR} strokeWidth={2.5}
                dot={{ fill: COLOR, r: 4 }} activeDot={{ r: 6 }}
              />
              <Line
                type="monotone" dataKey="estudiantes_activos"
                stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Seccion>

      {/* ── Fila: módulos error + ejercicios difíciles ───────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Módulos con mayor error grupal */}
        <Seccion titulo="Módulos con mayor tasa de error (grupo)">
          {cargando ? <Skeleton /> : datos.modulos_error.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', padding: '1.5rem 0' }}>
              Sin datos suficientes.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={datos.modulos_error} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  type="number" domain={[0, 100]}
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                  tickFormatter={v => `${v}%`}
                />
                <YAxis
                  type="category" dataKey="modulo_nombre" width={90}
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1a1a2e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, fontSize: 12,
                  }}
                  formatter={v => [`${v}%`, 'Tasa de error']}
                />
                <Bar dataKey="tasa_error" radius={[0, 6, 6, 0]}>
                  {datos.modulos_error.map((e, i) => (
                    <Cell
                      key={i}
                      fill={e.tasa_error >= 60 ? '#ef4444'
                        : e.tasa_error >= 40 ? '#f59e0b' : '#10b981'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Seccion>

        {/* Ejercicios más difíciles */}
        <Seccion titulo="Ejercicios con mayor tasa de error">
          {cargando ? <Skeleton /> : datos.ejercicios_dificiles.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', padding: '1.5rem 0' }}>
              Sin datos suficientes.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
              {datos.ejercicios_dificiles.map((ej, i) => {
                const cfg = COLORES_NIVEL[ej.nivel_dificultad] ?? COLORES_NIVEL.BASICO;
                return (
                  <div
                    key={ej.ejercicio_id}
                    style={{
                      padding: '10px 12px', borderRadius: 10,
                      background: 'rgba(239,68,68,0.05)',
                      border: '1px solid rgba(239,68,68,0.12)',
                      cursor: 'pointer', transition: 'background 0.15s',
                    }}
                    onClick={() => navigate(`/tutor/ejercicios/${ej.ejercicio_id}`)}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.05)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <p style={{
                        color: 'rgba(255,255,255,0.8)', fontSize: 12,
                        margin: 0, lineHeight: 1.5, flex: 1,
                      }}>
                        {ej.enunciado}
                      </p>
                      <span style={{
                        padding: '2px 8px', borderRadius: 20, fontSize: 11,
                        fontWeight: 700, flexShrink: 0,
                        background: 'rgba(239,68,68,0.15)', color: '#f87171',
                      }}>
                        {ej.tasa_error}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 20,
                        background: cfg.bg, color: cfg.color, fontWeight: 600,
                      }}>
                        {ej.nivel_dificultad}
                      </span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                        {ej.modulo_nombre} › {ej.subtema_nombre}
                      </span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
                        {ej.total_respuestas} intentos
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Seccion>
      </div>

      {/* ── Tabla de estudiantes ──────────────────────────────────────────── */}
      <Seccion
        titulo={`Mis estudiantes (${datos?.estudiantes?.length ?? 0})`}
        accion={
          <button
            onClick={handleExportar}
            disabled={exportando || cargando}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 16px', borderRadius: 9, fontSize: 12,
              fontWeight: 600, cursor: exportando ? 'not-allowed' : 'pointer',
              background: exportando ? 'rgba(99,102,241,0.1)' : `${COLOR}22`,
              border: `1px solid ${COLOR}44`,
              color: exportando ? 'rgba(255,255,255,0.3)' : COLOR,
              fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s',
            }}
          >
            {exportando ? '⏳ Exportando...' : '⬇️ Exportar CSV'}
          </button>
        }
      >
        {cargando
          ? <Skeleton h={200} />
          : <TablaEstudiantes estudiantes={datos.estudiantes} />
        }
      </Seccion>
    </div>
  );
}