'use client';
import { useStore } from '@/lib/store';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';
import { AlertTriangle, UserX } from 'lucide-react';

export default function NoShowPage() {
  const { clients, appointments, barbers, services, getInactiveClients } = useStore();
  const noShowClients = clients.filter(c => c.noShowCount > 0).sort((a, b) => b.noShowCount - a.noShowCount);
  const riskClients = clients.filter(c => c.noShowCount >= 2);
  const noShowAppts = appointments.filter(a => a.status === 'no_show').sort((a, b) => b.date.localeCompare(a.date));
  const inactiveClients = getInactiveClients(45);

  return (
    <div className="space-y-5 pb-20 lg:pb-4">
      <div>
        <h2 className="section-title">Control de No-Show</h2>
        <p className="section-desc">Seguimiento de inasistencias y clientes inactivos</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4 text-center border-red-500/20"><div className="text-2xl font-bold text-red-400">{noShowAppts.length}</div><div className="stat-label">Total no-shows</div></div>
        <div className="card p-4 text-center border-amber-500/20"><div className="text-2xl font-bold text-amber-400">{riskClients.length}</div><div className="stat-label">Riesgo alto (≥2)</div></div>
        <div className="card p-4 text-center"><div className="text-2xl font-bold text-zinc-400">{noShowClients.length}</div><div className="stat-label">Clientes con historial</div></div>
        <div className="card p-4 text-center border-zinc-700"><div className="text-2xl font-bold text-zinc-500">{inactiveClients.length}</div><div className="stat-label">Inactivos 45+ días</div></div>
      </div>

      {/* Risk clients */}
      {riskClients.length > 0 && (
        <div className="card p-5 border-red-500/20">
          <h3 className="font-semibold text-zinc-100 mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-400" />Clientes de alto riesgo (≥2 inasistencias)</h3>
          <div className="space-y-3">
            {riskClients.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                <div className="avatar w-9 h-9 text-xs">{getInitials(c.name)}</div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-zinc-200">{c.name}</div>
                  <div className="text-xs text-zinc-500">{c.phone} · {c.totalVisits} visitas totales</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-red-400">{c.noShowCount}</div>
                  <div className="text-xs text-zinc-600">no-shows</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All no-show clients */}
      <div className="card p-5">
        <h3 className="section-title mb-4 flex items-center gap-2"><UserX className="w-4 h-4 text-zinc-500" />Historial de inasistencias</h3>
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Cliente</th><th>Fecha</th><th>Servicio</th><th>Barbero</th><th># No shows</th></tr></thead>
            <tbody>
              {noShowAppts.slice(0, 20).map(appt => {
                const client = clients.find(c => c.id === appt.clientId);
                const barber = barbers.find(b => b.id === appt.barberId);
                const service = services.find(s => s.id === appt.serviceId);
                return (
                  <tr key={appt.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="avatar w-6 h-6 text-xs">{getInitials(client?.name || 'CL')}</div>
                        <span className="text-xs text-zinc-300">{client?.name || '—'}</span>
                      </div>
                    </td>
                    <td className="text-xs text-zinc-500">{formatDate(appt.date)} {appt.startTime}</td>
                    <td className="text-xs text-zinc-400">{service?.name || '—'}</td>
                    <td className="text-xs text-zinc-400">{barber?.name?.split(' ')[0] || '—'}</td>
                    <td><span className="badge-red text-xs">{client?.noShowCount || 1} veces</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inactive clients */}
      <div className="card p-5">
        <h3 className="section-title mb-1">Clientes inactivos (45+ días sin reservar)</h3>
        <p className="section-desc mb-4">{inactiveClients.length} clientes listos para campaña de reactivación</p>
        <div className="space-y-2">
          {inactiveClients.slice(0, 10).map(c => (
            <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800/40 transition-colors">
              <div className="avatar w-8 h-8 text-xs">{getInitials(c.name)}</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-zinc-300">{c.name}</div>
                <div className="text-xs text-zinc-600">{c.phone} · Última visita: {c.lastVisitAt ? formatDate(c.lastVisitAt) : 'Nunca'}</div>
              </div>
              <div className="text-xs text-emerald-400 font-semibold">{formatCurrency(c.totalSpent)}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-violet-600/5 border border-violet-600/20 rounded-lg">
          <div className="text-xs text-zinc-400">💡 Conecta WhatsApp API para enviar campañas de reactivación automáticamente.</div>
        </div>
      </div>
    </div>
  );
}
