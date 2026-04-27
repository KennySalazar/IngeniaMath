import { useState, useEffect } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, ResponsiveContainer, Cell,
} from 'recharts';
import { estadisticasService } from '../../services/estadisticasService';

const COLOR = '#10b981';

// ── Helpers ───────────────────────────────────────────────────────────────────

function tarjetaMetrica({ icono, label, valor, sub, color = COLOR }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14, padding: '1.25rem',
    }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>{icono}</div>
      <p style={{
        fontSize: 28, fontWeight: 800, color, margin: '0 0 4px',
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

// ── Heatmap de actividad ──────────────────────────────────────────────────────

function Heatmap({ datos }) {
  const COLORES = [
    'rgba(255,255,255,0.05)',  // nivel 0
    `${COLOR}33`,              // nivel 1
    `${COLOR}66`,              // nivel 2
    `${COLOR}99`,              // nivel 3
    COLOR,                     // nivel 4
  ];

  // Construir mapa fecha → nivel
  const mapaActividad = {};
  datos.forEach(d => { mapaActividad[d.fecha] = d.nivel; });

  // Generar últimos 365 días
  const dias = [];
  for (let i = 364; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    dias.push({ fecha: key, nivel: mapaActividad[key] ?? 0 });
  }

  // Agrupar en semanas
  const semanas = [];
  for (let i = 0; i < dias.length; i += 7) {
    semanas.push(dias.slice(i, i + 7));
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 3, overflowX: 'auto', paddingBottom: 6 }}>
        {semanas.map((semana, si) => (
          <div key={si} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {semana.map((dia, di) => (
              <div
                key={di}
                title={`${dia.fecha} · nivel ${dia.nivel}`}
                style={{
                  width: 12, height: 12, borderRadius: 2,
                  background: COLORES[dia.nivel],
                  transition: 'transform 0.1s',
                  cursor: 'default',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.4)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Leyenda */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.3)',
      }}>
        <span>Menos</span>
        {COLORES.map((c, i) => (
          <div key={i} style={{
            width: 12, height: 12, borderRadius: 2, background: c,
          }} />
        ))}
        <span>Más</span>
      </div>
    </div>
  );
}

// ── Sección con título ────────────────────────────────────────────────────────

function Seccion({ titulo, children }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, padding: '1.5rem',
    }}>
      <h3 style={{
        fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase', letterSpacing: 1,
        margin: '0 0 1.25rem',
      }}>
        {titulo}
      </h3>
      {children}
    </div>
  );
}

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

// ── Página principal ──────────────────────────────────────────────────────────

export default function EstadisticasPage() {
  const [datos,    setDatos]    = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    estadisticasService.dashboardEstudiante()
      .then(setDatos)
      .catch(() => setError('No se pudieron cargar las estadísticas.'))
      .finally(() => setCargando(false));
  }, []);

  if (error) {
    return (
      <div style={{
        padding: '2rem', textAlign: 'center',
        color: '#f87171', fontSize: 14,
      }}>
        {error}
      </div>
    );
  }

  const m = datos?.metricas;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>

      {/* ── Métricas numéricas ──────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 12,
      }}>
        {cargando ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} h={110} />)
        ) : (
          <>
            {tarjetaMetrica({
              icono: '📝', label: 'Ejercicios resueltos',
              valor: m.total_ejercicios_resueltos,
            })}
            {tarjetaMetrica({
              icono: '🏆', label: 'Simulacros realizados',
              valor: m.total_simulacros,
              color: '#f59e0b',
            })}
            {tarjetaMetrica({
              icono: '📊', label: 'Promedio simulacros',
              valor: `${m.promedio_simulacros}%`,
              color: m.promedio_simulacros >= 61 ? COLOR : '#ef4444',
            })}
            {tarjetaMetrica({
              icono: '🔥', label: 'Racha actual',
              valor: `${m.racha_actual_dias}d`,
              sub: 'días consecutivos',
              color: '#f97316',
            })}
            {tarjetaMetrica({
              icono: '✅', label: 'Módulos completados',
              valor: `${m.modulos_ruta.completados}/${m.modulos_ruta.total}`,
              sub: `${m.modulos_ruta.pendientes} pendientes`,
            })}
            {/* Top error */}
            {datos.top_errores[0] && tarjetaMetrica({
              icono: '⚠️', label: 'Mayor tasa de error',
              valor: `${datos.top_errores[0].tasa_error}%`,
              sub: datos.top_errores[0].modulo_nombre,
              color: '#ef4444',
            })}
          </>
        )}
      </div>

      {/* ── Fila: Radar + Barras ────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1.5rem',
      }}>

        {/* Radar de dominio */}
        <Seccion titulo="Dominio por módulo">
          {cargando ? <Skeleton /> : (
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={datos.radar}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis
                  dataKey="modulo_nombre"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                />
                <Radar
                  name="Dominio"
                  dataKey="porcentaje_dominio"
                  stroke={COLOR}
                  fill={COLOR}
                  fillOpacity={0.25}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1a1a2e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, fontSize: 12,
                  }}
                  formatter={v => [`${v}%`, 'Dominio']}
                />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </Seccion>

        {/* Barras de aciertos por módulo */}
        <Seccion titulo="Aciertos por módulo">
          {cargando ? <Skeleton /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={datos.aciertos_modulo} layout="vertical">
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
                  formatter={v => [`${v}%`, 'Aciertos']}
                />
                <Bar dataKey="porcentaje_aciertos" radius={[0, 6, 6, 0]}>
                  {datos.aciertos_modulo.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.porcentaje_aciertos >= 70 ? COLOR :
                        entry.porcentaje_aciertos >= 40 ? '#f59e0b' : '#ef4444'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Seccion>
      </div>

      {/* ── Progreso semanal ─────────────────────────────────────────────── */}
      <Seccion titulo="Progreso en el tiempo (últimas 10 semanas)">
        {cargando ? <Skeleton h={180} /> : datos.progreso_semanal.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', padding: '2rem 0' }}>
            Aún no hay datos de progreso semanal.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={datos.progreso_semanal}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="semana"
                tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                tickFormatter={v => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  background: '#1a1a2e',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, fontSize: 12,
                }}
                formatter={v => [`${v}%`, 'Promedio']}
              />
              <Line
                type="monotone"
                dataKey="promedio_aciertos"
                stroke={COLOR} strokeWidth={2.5}
                dot={{ fill: COLOR, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Seccion>

      {/* ── Heatmap ──────────────────────────────────────────────────────── */}
      <Seccion titulo="Actividad de estudio (últimos 365 días)">
        {cargando ? <Skeleton h={100} /> : (
          <Heatmap datos={datos.actividad_diaria} />
        )}
      </Seccion>

      {/* ── Top 3 módulos con mayor error ────────────────────────────────── */}
      {!cargando && datos.top_errores.length > 0 && (
        <Seccion titulo="Módulos que necesitan más atención">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {datos.top_errores.map((m, i) => (
              <div key={m.modulo_id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 16px', borderRadius: 10,
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.15)',
              }}>
                <span style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'rgba(239,68,68,0.15)',
                  color: '#f87171', fontSize: 13, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {i + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: 0 }}>
                    {m.modulo_nombre}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: '2px 0 0' }}>
                    {m.total_errores} errores registrados
                  </p>
                </div>
                <span style={{
                  padding: '4px 12px', borderRadius: 20,
                  background: 'rgba(239,68,68,0.15)', color: '#f87171',
                  fontSize: 12, fontWeight: 700,
                }}>
                  {m.tasa_error}% error
                </span>
              </div>
            ))}
          </div>
        </Seccion>
      )}
    </div>
  );
}