'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { formatCurrency, formatDate, getInitials, TAG_LABELS } from '@/lib/utils';
import { Search, Plus, User, Phone, Calendar, DollarSign, Star, X, CheckCircle2 } from 'lucide-react';
import type { Client } from '@/types';

function ClientModal({ client, onClose }: { client?: Client; onClose: () => void }) {
  const { createClient, updateClient, currentShop } = useStore();
  const [form, setForm] = useState({
    name: client?.name || '',
    phone: client?.phone || '',
    email: client?.email || '',
    notes: client?.notes || '',
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (client) {
      updateClient(client.id, form);
    } else {
      createClient(form as any);
    }
    setSaved(true);
    setTimeout(onClose, 800);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h3 className="font-semibold font-display text-zinc-100">{client ? 'Editar cliente' : 'Nuevo cliente'}</h3>
          <button onClick={onClose} className="btn-icon"><X className="w-4 h-4" /></button>
        </div>
        {saved ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-zinc-300 font-semibold">¡Guardado!</p>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="form-group">
              <label className="label">Nombre completo *</label>
              <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Carlos Rodríguez" />
            </div>
            <div className="form-group">
              <label className="label">WhatsApp *</label>
              <input className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+57 300 000 0000" />
            </div>
            <div className="form-group">
              <label className="label">Correo (opcional)</label>
              <input className="input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="label">Notas internas</label>
              <textarea className="input" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Observaciones..." />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleSave} disabled={!form.name || !form.phone} className="btn-primary flex-1">
                {client ? 'Guardar' : 'Crear cliente'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ClientDetailModal({ client, onClose }: { client: Client; onClose: () => void }) {
  const { barbers, services, getClientAppointments } = useStore();
  const appts = getClientAppointments(client.id).sort((a, b) => b.date.localeCompare(a.date));
  const barber = barbers.find(b => b.id === client.preferredBarberId);
  const service = services.find(s => s.id === client.preferredServiceId);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h3 className="font-semibold font-display text-zinc-100">Perfil del cliente</h3>
          <button onClick={onClose} className="btn-icon"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-5">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="avatar w-16 h-16 text-lg">{getInitials(client.name)}</div>
            <div>
              <h4 className="font-bold text-lg text-zinc-100">{client.name}</h4>
              <div className="text-sm text-zinc-500">{client.phone}</div>
              {client.email && <div className="text-xs text-zinc-600">{client.email}</div>}
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {client.tags.map(tag => (
                  <span key={tag} className={`badge text-xs ${TAG_LABELS[tag]?.color}`}>{TAG_LABELS[tag]?.label}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card p-3 text-center">
              <div className="text-xl font-bold text-violet-400">{client.totalVisits}</div>
              <div className="stat-label">Visitas</div>
            </div>
            <div className="card p-3 text-center">
              <div className="text-xl font-bold text-emerald-400">{formatCurrency(client.totalSpent)}</div>
              <div className="stat-label">Total gastado</div>
            </div>
            <div className="card p-3 text-center">
              <div className={`text-xl font-bold ${client.noShowCount > 0 ? 'text-red-400' : 'text-zinc-400'}`}>{client.noShowCount}</div>
              <div className="stat-label">No shows</div>
            </div>
          </div>

          {/* Preferences */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-3">
              <div className="stat-label mb-1">Barbero habitual</div>
              <div className="text-sm text-zinc-300">{barber?.name || '—'}</div>
            </div>
            <div className="card p-3">
              <div className="stat-label mb-1">Servicio favorito</div>
              <div className="text-sm text-zinc-300">{service?.name || '—'}</div>
            </div>
          </div>

          {/* Loyalty */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-zinc-200">Fidelización</span>
              </div>
              <span className="badge-amber text-xs">{client.loyalty.visits} / 5 visitas</span>
            </div>
            <div className="progress-bar h-2">
              <div className="progress-fill h-2" style={{ width: `${Math.min(100, (client.loyalty.visits / 5) * 100)}%` }} />
            </div>
            <div className="text-xs text-zinc-600 mt-1.5">Recompensa: Corte gratis a las 5 visitas</div>
          </div>

          {/* Last visit */}
          {client.lastVisitAt && (
            <div className="text-xs text-zinc-600">
              Última visita: <span className="text-zinc-400">{formatDate(client.lastVisitAt)}</span>
            </div>
          )}

          {/* Appointment history */}
          <div>
            <div className="stat-label mb-2">Historial de citas</div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {appts.slice(0, 10).map(appt => {
                const svc = services.find(s => s.id === appt.serviceId);
                return (
                  <div key={appt.id} className="flex items-center justify-between py-2 border-b border-zinc-800/50">
                    <div>
                      <div className="text-xs text-zinc-300">{svc?.name}</div>
                      <div className="text-xs text-zinc-600">{formatDate(appt.date)} · {appt.startTime}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-semibold text-zinc-300">{formatCurrency(appt.price)}</div>
                    </div>
                  </div>
                );
              })}
              {appts.length === 0 && <p className="text-xs text-zinc-600">Sin historial de citas</p>}
            </div>
          </div>

          {client.notes && (
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="stat-label mb-1">Notas internas</div>
              <p className="text-xs text-zinc-400">{client.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const { clients } = useStore();
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<Client | null>(null);
  const [editing, setEditing] = useState<Client | null>(null);

  const filtered = clients.filter(c => {
    if (tagFilter !== 'all' && !c.tags.includes(tagFilter as any)) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.email || '').toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => b.totalVisits - a.totalVisits);

  return (
    <div className="space-y-5 pb-20 lg:pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Clientes</h2>
          <p className="section-desc">{clients.length} registrados</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary btn-sm">
          <Plus className="w-3.5 h-3.5" /> Nuevo cliente
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', count: clients.length, color: 'text-zinc-300' },
          { label: 'Frecuentes', count: clients.filter(c => c.tags.includes('frequent')).length, color: 'text-emerald-400' },
          { label: 'Nuevos', count: clients.filter(c => c.tags.includes('new')).length, color: 'text-blue-400' },
          { label: 'Inactivos', count: clients.filter(c => c.tags.includes('inactive')).length, color: 'text-zinc-500' },
        ].map(s => (
          <div key={s.label} className="card p-3 text-center">
            <div className={`text-2xl font-bold font-display ${s.color}`}>{s.count}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input className="input pl-9" placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={tagFilter} onChange={e => setTagFilter(e.target.value)}>
          <option value="all">Todos</option>
          <option value="new">Nuevos</option>
          <option value="frequent">Frecuentes</option>
          <option value="inactive">Inactivos</option>
          <option value="vip">VIP</option>
          <option value="no-show-risk">Riesgo no-show</option>
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(client => (
          <div key={client.id} className="card-hover p-4 cursor-pointer" onClick={() => setSelected(client)}>
            <div className="flex items-center gap-3 mb-3">
              <div className="avatar w-10 h-10 text-sm">{getInitials(client.name)}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-zinc-100 truncate">{client.name}</div>
                <div className="text-xs text-zinc-600">{client.phone}</div>
              </div>
              <div className="flex flex-col gap-1 items-end">
                {client.tags.slice(0, 2).map(tag => (
                  <span key={tag} className={`badge text-[10px] ${TAG_LABELS[tag]?.color}`}>{TAG_LABELS[tag]?.label}</span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-sm font-bold text-violet-400">{client.totalVisits}</div>
                <div className="text-xs text-zinc-600">Visitas</div>
              </div>
              <div>
                <div className="text-sm font-bold text-emerald-400">{formatCurrency(client.totalSpent)}</div>
                <div className="text-xs text-zinc-600">Gastado</div>
              </div>
              <div>
                <div className={`text-sm font-bold ${client.noShowCount > 0 ? 'text-red-400' : 'text-zinc-500'}`}>{client.noShowCount}</div>
                <div className="text-xs text-zinc-600">No shows</div>
              </div>
            </div>
            {/* Loyalty progress */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-zinc-600 mb-1">
                <span>Fidelización</span>
                <span>{client.loyalty.visits}/5 visitas</span>
              </div>
              <div className="progress-bar h-1.5">
                <div className="progress-fill h-1.5" style={{ width: `${Math.min(100, (client.loyalty.visits / 5) * 100)}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCreate && <ClientModal onClose={() => setShowCreate(false)} />}
      {selected && <ClientDetailModal client={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
