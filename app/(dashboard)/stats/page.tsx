'use client';
import { useStore } from '@/lib/store';
import { formatCurrency, getInitials } from '@/lib/utils';
import { format, startOfMonth } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';

const COLORS = ['#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];

export default function StatsPage() {
  const { appointments, clients, services, barbers, transactions } = useStore();
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const monthAppts = appointments.filter(a => a.date >= monthStart);
  const completedAppts = appointments.filter(a => a.status === 'completed');

  // Top services
  const serviceCounts: Record<string, number> = {};
  completedAppts.forEach(a => { serviceCounts[a.serviceId] = (serviceCounts[a.serviceId] || 0) + 1; });
  const topServices = Object.entries(serviceCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id, count]) => ({ name: services.find(s => s.id === id)?.name || id, count }));

  // Popular hours
  const hourCounts: Record<string, number> = {};
  appointments.filter(a => a.status === 'completed').forEach(a => {
    const h = a.startTime.slice(0, 2);
    hourCounts[h] = (hourCounts[h] || 0) + 1;
  });
  const hourData = Object.entries(hourCounts).sort(([a], [b]) => a.localeCompare(b))
    .map(([hour, count]) => ({ hour: `${hour}h`, count }));

  // Barber performance
  const barberData = barbers.filter(b => b.isActive).map(b => {
    const stats = useStore.getState().getBarberStats(b.id);
    return { name: b.name.split(' ')[0], income: stats.totalIncome, commission: stats.totalCommission, appointments: stats.completedAppointments };
  });

  // Client breakdown
  const clientStats = {
    new: clients.filter(c => c.tags.includes('new')).length,
    frequent: clients.filter(c => c.tags.includes('frequent')).length,
    inactive: clients.filter(c => c.tags.includes('inactive')).length,
    vip: clients.filter(c => c.tags.includes('vip')).length,
  };

  return (
    <div className="space-y-5 pb-20 lg:pb-4">
      <div>
        <h2 className="section-title">Estadísticas</h2>
        <p className="section-desc">Análisis completo del negocio</p>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Citas del mes', value: monthAppts.length, color: 'text-violet-400' },
          { label: 'Completadas', value: monthAppts.filter(a => a.status === 'completed').length, color: 'text-emerald-400' },
          { label: 'No shows', value: appointments.filter(a => a.status === 'no_show').length, color: 'text-red-400' },
          { label: 'Tasa de completitud', value: `${completedAppts.length > 0 ? ((completedAppts.length / appointments.filter(a => a.status !== 'scheduled').length) * 100).toFixed(0) : 0}%`, color: 'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <div className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top services */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Servicios más vendidos</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topServices} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 10 }} width={80} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {topServices.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Popular hours */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Horas más solicitadas</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="hour" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Barber table */}
      <div className="card p-5">
        <h3 className="section-title mb-4">Rendimiento por barbero</h3>
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Barbero</th><th>Citas</th><th>Ingresos</th><th>Comisión</th><th>Para la barbería</th></tr></thead>
            <tbody>
              {barberData.map((b, i) => (
                <tr key={i}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="avatar w-7 h-7 text-xs" style={{ background: `linear-gradient(135deg, ${COLORS[i]}99, ${COLORS[i]})` }}>{getInitials(b.name)}</div>
                      <span className="text-sm font-medium text-zinc-300">{b.name}</span>
                    </div>
                  </td>
                  <td><span className="text-sm text-zinc-300">{b.appointments}</span></td>
                  <td><span className="text-sm text-violet-400 font-semibold">{formatCurrency(b.income)}</span></td>
                  <td><span className="text-sm text-emerald-400">{formatCurrency(b.commission)}</span></td>
                  <td><span className="text-sm text-zinc-300 font-semibold">{formatCurrency(b.income - b.commission)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client breakdown */}
      <div className="card p-5">
        <h3 className="section-title mb-4">Segmentación de clientes</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(clientStats).map(([key, count]) => {
            const labels: Record<string, { label: string; color: string }> = {
              new: { label: 'Nuevos', color: 'text-blue-400' },
              frequent: { label: 'Frecuentes', color: 'text-emerald-400' },
              inactive: { label: 'Inactivos', color: 'text-zinc-500' },
              vip: { label: 'VIP', color: 'text-amber-400' },
            };
            return (
              <div key={key} className="card p-4 text-center">
                <div className={`text-2xl font-bold ${labels[key].color}`}>{count}</div>
                <div className="stat-label">{labels[key].label}</div>
                <div className="text-xs text-zinc-700 mt-1">{clients.length > 0 ? ((count / clients.length) * 100).toFixed(0) : 0}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
