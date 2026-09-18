'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { formatCurrency, formatDate, formatTime, STATUS_COLORS, STATUS_LABELS, getInitials } from '@/lib/utils';
import { format } from 'date-fns';
import { Search, Filter, Plus, CheckCircle2, AlertTriangle, XCircle, Play, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AppointmentsPage() {
  const { appointments, barbers, clients, services, cancelAppointment, markNoShow, completeAppointment, markInProgress } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  const filtered = appointments
    .filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (dateFilter && a.date !== dateFilter) return false;
      if (search) {
        const client = clients.find((c) => c.id === a.clientId);
        const barber = barbers.find((b) => b.id === a.barberId);
        const service = services.find((s) => s.id === a.serviceId);
        const q = search.toLowerCase();
        return (
          client?.name.toLowerCase().includes(q) ||
          barber?.name.toLowerCase().includes(q) ||
          service?.name.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`));

  return (
    <div className="space-y-5 pb-20 lg:pb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="section-title">Gestión de Citas</h2>
          <p className="section-desc">{appointments.length} citas registradas</p>
        </div>
        <div className="flex gap-2">
          <a href="/calendar" className="btn-primary btn-sm">
            <Plus className="w-3.5 h-3.5" /> Nueva cita
          </a>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input className="input pl-9" placeholder="Buscar cliente, barbero o servicio..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input type="date" className="input w-auto" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Hoy', count: appointments.filter(a => a.date === format(new Date(), 'yyyy-MM-dd')).length, color: 'text-violet-400' },
          { label: 'Completadas', count: appointments.filter(a => a.status === 'completed').length, color: 'text-emerald-400' },
          { label: 'Pendientes', count: appointments.filter(a => ['scheduled', 'confirmed'].includes(a.status)).length, color: 'text-blue-400' },
          { label: 'No show', count: appointments.filter(a => a.status === 'no_show').length, color: 'text-red-400' },
        ].map((stat) => (
          <div key={stat.label} className="card p-3 text-center">
            <div className={`text-2xl font-bold font-display ${stat.color}`}>{stat.count}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Barbero</th>
              <th>Servicio</th>
              <th>Fecha y hora</th>
              <th>Precio</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 50).map((appt) => {
              const client = clients.find((c) => c.id === appt.clientId);
              const barber = barbers.find((b) => b.id === appt.barberId);
              const service = services.find((s) => s.id === appt.serviceId);
              return (
                <tr key={appt.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="avatar w-7 h-7 text-xs">{getInitials(client?.name || 'CL')}</div>
                      <div>
                        <div className="text-zinc-200 font-medium text-xs">{client?.name || '—'}</div>
                        <div className="text-zinc-600 text-xs">{client?.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: barber?.color || '#7c3aed' }} />
                      <span className="text-xs">{barber?.name || '—'}</span>
                    </div>
                  </td>
                  <td><span className="text-xs">{service?.name || '—'}</span></td>
                  <td>
                    <div className="text-xs text-zinc-300">{formatDate(appt.date)}</div>
                    <div className="text-xs text-zinc-600">{formatTime(appt.startTime)} – {formatTime(appt.endTime)}</div>
                  </td>
                  <td>
                    <div className="text-xs font-semibold text-zinc-200">{formatCurrency(appt.price)}</div>
                    <div className="text-xs text-zinc-600">Com: {formatCurrency(appt.commissionAmount)}</div>
                  </td>
                  <td>
                    <span className={`badge text-xs ${STATUS_COLORS[appt.status]}`}>{STATUS_LABELS[appt.status]}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      {appt.status === 'scheduled' && (
                        <button onClick={() => markInProgress(appt.id)} className="btn-icon p-1.5" title="Iniciar">
                          <Play className="w-3.5 h-3.5 text-blue-400" />
                        </button>
                      )}
                      {appt.status === 'in_progress' && (
                        <button onClick={() => completeAppointment(appt.id, 'cash')} className="btn-icon p-1.5" title="Completar">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        </button>
                      )}
                      {['scheduled', 'confirmed', 'in_progress'].includes(appt.status) && (
                        <>
                          <button onClick={() => markNoShow(appt.id)} className="btn-icon p-1.5" title="No asistió">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          </button>
                          <button onClick={() => cancelAppointment(appt.id)} className="btn-icon p-1.5" title="Cancelar">
                            <XCircle className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="empty-state py-12">
            <Search className="empty-state-icon" />
            <p className="empty-state-text">No se encontraron citas</p>
          </div>
        )}
      </div>
    </div>
  );
}
