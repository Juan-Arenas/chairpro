'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { formatCurrency, getInitials, DAY_LABELS } from '@/lib/utils';
import {
  Plus, Edit2, Power, Star, X, CheckCircle2, KeyRound,
  Copy, Check, MessageCircle, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Barber } from '@/types';

const COLORS = ['#7C3AED', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

function BarberModal({ barber, onClose }: { barber?: Barber; onClose: () => void }) {
  const { createBarber, updateBarber, services } = useStore();
  const [form, setForm] = useState({
    name: barber?.name || '',
    phone: barber?.phone || '',
    email: barber?.email || '',
    description: barber?.description || '',
    specialties: barber?.specialties.join(', ') || '',
    commissionRate: barber?.commissionRate ? (barber.commissionRate * 100).toString() : '40',
    color: barber?.color || '#7C3AED',
    serviceIds: barber?.serviceIds || [] as string[],
    schedule: barber?.schedule || DAYS.map(day => ({
      day, isWorking: day !== 'sunday', start: '09:00', end: '19:00', breakStart: '13:00', breakEnd: '14:00'
    })),
    isActive: barber?.isActive ?? true,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const data = {
      ...form,
      specialties: form.specialties.split(',').map(s => s.trim()).filter(Boolean),
      commissionRate: parseFloat(form.commissionRate) / 100,
      schedule: form.schedule,
      joinedAt: barber?.joinedAt || new Date().toISOString(),
    };
    if (barber) {
      updateBarber(barber.id, data);
    } else {
      createBarber(data as any);
    }
    setSaved(true);
    setTimeout(onClose, 800);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h3 className="font-semibold font-display text-zinc-100">{barber ? 'Editar barbero' : 'Nuevo barbero'}</h3>
          <button onClick={onClose} className="btn-icon"><X className="w-4 h-4" /></button>
        </div>
        {saved ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-zinc-300 font-semibold">¡Guardado correctamente!</p>
          </div>
        ) : (
          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group col-span-2">
                <label className="label">Nombre completo *</label>
                <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Carlos Mendoza" />
              </div>
              <div className="form-group">
                <label className="label">Teléfono</label>
                <input className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+57 300 000 0000" />
              </div>
              <div className="form-group">
                <label className="label">Email de acceso</label>
                <input className="input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="carlos@barberia.co" />
              </div>
              <div className="form-group col-span-2">
                <label className="label">Descripción</label>
                <textarea className="input" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="label">Especialidades (separadas por coma)</label>
                <input className="input" value={form.specialties} onChange={e => setForm({...form, specialties: e.target.value})} placeholder="Fade, Barba, Diseño" />
              </div>
              <div className="form-group">
                <label className="label">Comisión (%)</label>
                <input className="input" type="number" min="0" max="100" value={form.commissionRate} onChange={e => setForm({...form, commissionRate: e.target.value})} />
              </div>
            </div>

            {/* Color picker */}
            <div className="form-group">
              <label className="label">Color en calendario</label>
              <div className="flex gap-2">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setForm({...form, color: c})}
                    className={cn('w-8 h-8 rounded-full border-2 transition-all', form.color === c ? 'border-white scale-110' : 'border-transparent')}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>

            {/* Services */}
            <div className="form-group">
              <label className="label">Servicios que realiza</label>
              <div className="grid grid-cols-2 gap-2">
                {services.filter(s => s.isActive).map(s => (
                  <label key={s.id} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-zinc-800/40 transition-colors">
                    <input type="checkbox" checked={form.serviceIds.includes(s.id)}
                      onChange={e => setForm({...form, serviceIds: e.target.checked ? [...form.serviceIds, s.id] : form.serviceIds.filter(id => id !== s.id)})}
                      className="w-4 h-4 accent-violet-500" />
                    <span className="text-sm text-zinc-300">{s.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Schedule */}
            <div className="form-group">
              <label className="label">Horario semanal</label>
              <div className="space-y-2">
                {form.schedule.map((day, i) => (
                  <div key={day.day} className="flex items-center gap-3 p-2 rounded-lg bg-zinc-800/30">
                    <input type="checkbox" checked={day.isWorking}
                      onChange={e => {
                        const newSched = [...form.schedule];
                        newSched[i] = {...newSched[i], isWorking: e.target.checked};
                        setForm({...form, schedule: newSched});
                      }}
                      className="w-4 h-4 accent-violet-500" />
                    <span className="text-xs text-zinc-400 w-20">{DAY_LABELS[day.day]}</span>
                    {day.isWorking && (
                      <>
                        <input type="time" className="input w-24 text-xs py-1" value={day.start}
                          onChange={e => { const s=[...form.schedule]; s[i]={...s[i], start: e.target.value}; setForm({...form, schedule: s}); }} />
                        <span className="text-zinc-600 text-xs">–</span>
                        <input type="time" className="input w-24 text-xs py-1" value={day.end}
                          onChange={e => { const s=[...form.schedule]; s[i]={...s[i], end: e.target.value}; setForm({...form, schedule: s}); }} />
                      </>
                    )}
                    {!day.isWorking && <span className="text-xs text-zinc-600">No trabaja</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2 sticky bottom-0 bg-zinc-900 py-3">
              <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleSave} disabled={!form.name} className="btn-primary flex-1">
                {barber ? 'Guardar cambios' : 'Crear barbero'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BarbersPage() {
  const { barbers, toggleBarberActive, getBarberStats, currentShop } = useStore();
  const [editing, setEditing] = useState<Barber | undefined>();
  const [showModal, setShowModal] = useState(false);

  // Access modal state for creating/delivering barber credentials
  const [accessModal, setAccessModal] = useState<{
    barber: Barber;
    isOpen: boolean;
    email: string;
    password?: string;
    loginUrl: string;
    whatsappMessage: string;
    loading: boolean;
    error: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  const handleGenerateAccess = async (barber: Barber) => {
    const barberEmail = barber.email || `${barber.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@${currentShop?.slug || 'barberia'}.co`;
    
    setAccessModal({
      barber,
      isOpen: true,
      email: barberEmail,
      loginUrl: typeof window !== 'undefined' ? `${window.location.origin}/login` : 'http://localhost:3000/login',
      whatsappMessage: '',
      loading: true,
      error: '',
    });

    try {
      const res = await fetch('/api/tenant/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: currentShop?.id,
          shopName: currentShop?.name,
          name: barber.name,
          email: barberEmail,
          phone: barber.phone,
          role: 'barber',
          barberId: barber.id,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Error al generar credenciales');
      }

      setAccessModal(prev => prev ? {
        ...prev,
        email: data.credentials.email,
        password: data.credentials.password,
        loginUrl: data.credentials.loginUrl,
        whatsappMessage: data.whatsappMessage,
        loading: false,
      } : null);
    } catch (err: any) {
      setAccessModal(prev => prev ? {
        ...prev,
        loading: false,
        error: err.message || 'Error al crear usuario en Supabase Auth',
      } : null);
    }
  };

  const copyCredentials = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-5 pb-20 lg:pb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Equipo de Barberos & Profesionales</h2>
          <p className="section-desc">
            {barbers.filter(b => b.isActive).length} activos · Administra horarios, comisiones y entrega accesos móviles individuales.
          </p>
        </div>
        <button onClick={() => { setEditing(undefined); setShowModal(true); }} className="btn-primary btn-sm flex items-center gap-1.5 shadow">
          <Plus className="w-3.5 h-3.5" /> Nuevo barbero
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {barbers.map((barber) => {
          const stats = getBarberStats(barber.id);
          return (
            <div key={barber.id} className={cn('card-hover p-5 flex flex-col justify-between', !barber.isActive && 'opacity-60')}>
              <div>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="avatar w-12 h-12 text-sm shrink-0" style={{ background: `linear-gradient(135deg, ${barber.color}99, ${barber.color})` }}>
                      {getInitials(barber.name)}
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-100">{barber.name}</div>
                      <div className={cn('text-xs', barber.isActive ? 'text-emerald-400' : 'text-zinc-600')}>
                        {barber.isActive ? 'Activo en Turno' : 'Inactivo'}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(barber); setShowModal(true); }} className="btn-icon p-1.5" title="Editar barbero">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => toggleBarberActive(barber.id)} className="btn-icon p-1.5" title={barber.isActive ? 'Desactivar' : 'Activar'}>
                      <Power className={cn('w-3.5 h-3.5', barber.isActive ? 'text-emerald-400' : 'text-zinc-600')} />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-zinc-500 mb-3 line-clamp-2">{barber.description || 'Especialista en cortes y estética masculina.'}</p>

                {/* Specialties */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {barber.specialties.map(sp => (
                    <span key={sp} className="badge-violet text-xs">{sp}</span>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-zinc-800/30 rounded-lg mb-3">
                  <div className="text-center">
                    <div className="text-sm font-bold text-zinc-200">{stats.completedAppointments}</div>
                    <div className="text-[10px] text-zinc-500">Citas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-violet-400">{formatCurrency(stats.totalIncome)}</div>
                    <div className="text-[10px] text-zinc-500">Generado</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-emerald-400">{(barber.commissionRate * 100).toFixed(0)}%</div>
                    <div className="text-[10px] text-zinc-500">Comisión</div>
                  </div>
                </div>

                {/* Schedule preview */}
                <div className="flex gap-1 flex-wrap mb-3">
                  {barber.schedule.map(day => (
                    <div key={day.day} title={DAY_LABELS[day.day]}
                      className={cn('w-7 h-7 rounded-md text-xs flex items-center justify-center font-medium',
                        day.isWorking ? 'bg-violet-600/20 text-violet-400' : 'bg-zinc-800 text-zinc-700')}>
                      {DAY_LABELS[day.day].slice(0, 1)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action: Deliver Login to Barber */}
              <div className="pt-3 border-t border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>Comisión ganada:</span>
                  <span className="text-emerald-400 font-bold">{formatCurrency(stats.totalCommission)}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleGenerateAccess(barber)}
                  className="w-full btn-secondary btn-sm flex items-center justify-center gap-1.5 text-xs py-1.5 text-zinc-200 hover:text-white"
                >
                  <KeyRound className="w-3.5 h-3.5 text-violet-400" />
                  <span>Entregar Acceso Móvil (Login)</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <BarberModal barber={editing} onClose={() => { setShowModal(false); setEditing(undefined); }} />
      )}

      {/* Modal: Deliver Access to Barber */}
      {accessModal?.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md p-6 animate-scale-in bg-zinc-950 border-violet-500/30">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-100">Acceso para {accessModal.barber.name}</h3>
                  <span className="text-[11px] text-zinc-400">Rol: Barbero Profesional</span>
                </div>
              </div>
              <button onClick={() => setAccessModal(null)} className="btn-icon p-1.5">✕</button>
            </div>

            {accessModal.loading ? (
              <div className="py-8 text-center space-y-3">
                <span className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin inline-block" />
                <p className="text-xs text-zinc-400">Creando cuenta en Supabase Auth...</p>
              </div>
            ) : accessModal.error ? (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
                {accessModal.error}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Usuario / Correo:</span>
                    <span className="font-mono font-bold text-zinc-100">{accessModal.email}</span>
                  </div>
                  {accessModal.password && (
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Contraseña asignada:</span>
                      <span className="font-mono font-bold text-amber-400">{accessModal.password}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Enlace de Inicio:</span>
                    <span className="font-mono text-zinc-300 truncate max-w-[180px]">{accessModal.loginUrl}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <a
                    href={`https://api.whatsapp.com/send?phone=${(accessModal.barber.phone || '').replace(/[^0-9]/g, '')}&text=${encodeURIComponent(accessModal.whatsappMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition-transform hover:scale-[1.02]"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Enviar Accesos por WhatsApp a {accessModal.barber.name}
                  </a>

                  <button
                    type="button"
                    onClick={() => copyCredentials(`Usuario: ${accessModal.email}\nContraseña: ${accessModal.password}\nLink: ${accessModal.loginUrl}`)}
                    className="w-full btn-secondary py-2 text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? '¡Credenciales copiadas!' : 'Copiar Credenciales'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
