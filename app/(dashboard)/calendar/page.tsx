'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import {
  format, addDays, startOfWeek, parseISO, isToday,
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ChevronLeft, ChevronRight, Plus, Clock, User, X,
  CheckCircle2, AlertTriangle, XCircle, Calendar,
  Play, Ban,
} from 'lucide-react';
import { formatTime, formatCurrency, STATUS_COLORS, STATUS_LABELS, getInitials, cn } from '@/lib/utils';
import type { Appointment, Barber, Client, Service } from '@/types';

const TIME_SLOTS = Array.from({ length: 22 }, (_, i) => {
  const hour = Math.floor(i / 2) + 9;
  const min = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${min}`;
});

function AppointmentCard({
  appt, barber, client, service, onAction
}: {
  appt: Appointment; barber?: Barber; client?: Client; service?: Service;
  onAction: (id: string, action: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  return (
    <div
      className="absolute inset-x-1 rounded-md p-1.5 text-xs cursor-pointer overflow-hidden border animate-scale-in"
      style={{
        backgroundColor: `${barber?.color || '#7c3aed'}20`,
        borderColor: `${barber?.color || '#7c3aed'}50`,
      }}
      onClick={() => setShowActions(!showActions)}
    >
      <div className="font-semibold truncate" style={{ color: barber?.color || '#a78bfa' }}>
        {client?.name?.split(' ')[0] || 'Cliente'}
      </div>
      <div className="text-zinc-400 truncate">{service?.name}</div>
      {showActions && (
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-zinc-900/95 rounded-md p-2 flex flex-col gap-1 z-10 animate-scale-in">
          <div className="text-zinc-300 font-semibold text-[10px] truncate mb-1">{client?.name}</div>
          {appt.status === 'scheduled' && (
            <button className="btn-success btn-sm text-[10px] py-0.5" onClick={(e) => { e.stopPropagation(); onAction(appt.id, 'in_progress'); }}>
              <Play className="w-2.5 h-2.5" /> Iniciar
            </button>
          )}
          {appt.status === 'in_progress' && (
            <button className="btn-success btn-sm text-[10px] py-0.5" onClick={(e) => { e.stopPropagation(); onAction(appt.id, 'complete'); }}>
              <CheckCircle2 className="w-2.5 h-2.5" /> Completar
            </button>
          )}
          {['scheduled', 'confirmed'].includes(appt.status) && (
            <>
              <button className="btn-danger btn-sm text-[10px] py-0.5" onClick={(e) => { e.stopPropagation(); onAction(appt.id, 'no_show'); }}>
                <AlertTriangle className="w-2.5 h-2.5" /> No asistió
              </button>
              <button className="btn-secondary btn-sm text-[10px] py-0.5" onClick={(e) => { e.stopPropagation(); onAction(appt.id, 'cancel'); }}>
                <Ban className="w-2.5 h-2.5" /> Cancelar
              </button>
            </>
          )}
          <button className="btn-ghost btn-sm text-[10px] py-0.5" onClick={(e) => { e.stopPropagation(); setShowActions(false); }}>
            <X className="w-2.5 h-2.5" /> Cerrar
          </button>
        </div>
      )}
    </div>
  );
}

export default function CalendarPage() {
  const {
    appointments,
    barbers,
    clients,
    services,
    currentUser,
    currentShop,
    cancelAppointment,
    markNoShow,
    completeAppointment,
    markInProgress
  } = useStore();

  const isBarber = currentUser?.role === 'barber';
  const myBarberId = currentUser?.barberId;
  const currentShopId = currentShop?.id || 'shop_demo';

  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedBarberId, setSelectedBarberId] = useState<string>(
    isBarber && myBarberId ? myBarberId : 'all'
  );
  const [showNewAppt, setShowNewAppt] = useState(false);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const shopBarbers = barbers.filter((b) => b.shopId === currentShopId && b.isActive);

  const effectiveBarberId = isBarber && myBarberId ? myBarberId : selectedBarberId;

  const filteredBarbers = isBarber && myBarberId
    ? shopBarbers.filter((b) => b.id === myBarberId)
    : effectiveBarberId === 'all'
    ? shopBarbers
    : shopBarbers.filter((b) => b.id === effectiveBarberId);

  const shopAppointments = appointments.filter(
    (a) => a.shopId === currentShopId && (isBarber && myBarberId ? a.barberId === myBarberId : true)
  );

  const handleAction = (id: string, action: string) => {
    if (action === 'cancel') cancelAppointment(id);
    else if (action === 'no_show') markNoShow(id);
    else if (action === 'complete') completeAppointment(id, 'cash');
    else if (action === 'in_progress') markInProgress(id);
  };

  const getAppointmentsForSlot = (barberId: string, date: string, time: string) => {
    return shopAppointments.filter(
      (a) =>
        a.barberId === barberId &&
        a.date === date &&
        a.startTime <= time &&
        a.endTime > time &&
        a.status !== 'cancelled'
    );
  };

  const prevWeek = () => setCurrentWeekStart((d) => addDays(d, -7));
  const nextWeek = () => setCurrentWeekStart((d) => addDays(d, 7));
  const goToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  return (
    <div className="space-y-4 pb-20 lg:pb-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="section-title">{isBarber ? 'Mi Agenda de Turnos' : 'Calendario Semanal'}</h2>
          <p className="section-desc">
            {format(currentWeekStart, "d 'de' MMMM", { locale: es })} — {format(addDays(currentWeekStart, 6), "d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!isBarber && (
            <select
              value={selectedBarberId}
              onChange={(e) => setSelectedBarberId(e.target.value)}
              className="input w-auto text-xs py-1.5"
            >
              <option value="all">Todos los barberos ({shopBarbers.length})</option>
              {shopBarbers.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}
          {isBarber && (
            <div className="px-3 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-xs font-semibold text-blue-300">
              ✂️ {currentUser?.name}
            </div>
          )}
          <div className="flex items-center gap-1">
            <button onClick={prevWeek} className="btn-icon"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={goToday} className="btn-secondary btn-sm">Hoy</button>
            <button onClick={nextWeek} className="btn-icon"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <button onClick={() => setShowNewAppt(true)} className="btn-primary btn-sm">
            <Plus className="w-3.5 h-3.5" /> Nueva cita
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${
              key === 'completed' ? 'bg-emerald-400' :
              key === 'in_progress' ? 'bg-amber-400' :
              key === 'cancelled' ? 'bg-zinc-600' :
              key === 'no_show' ? 'bg-red-400' :
              key === 'confirmed' ? 'bg-violet-400' : 'bg-blue-400'
            }`} />
            <span className="text-xs text-zinc-500">{label}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <div style={{ minWidth: filteredBarbers.length > 0 ? filteredBarbers.length * 140 + 80 : 400 }}>
            {/* Header row */}
            <div className="grid border-b border-zinc-800 bg-zinc-900/80"
              style={{ gridTemplateColumns: `80px repeat(${weekDays.length}, 1fr)` }}>
              <div className="px-3 py-3 text-xs text-zinc-600 font-medium">Hora</div>
              {weekDays.map((day) => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const dayAppts = appointments.filter((a) => a.date === dayStr && a.status !== 'cancelled');
                return (
                  <div key={dayStr} className={`px-2 py-3 text-center border-l border-zinc-800 ${isToday(day) ? 'bg-violet-600/5' : ''}`}>
                    <div className={`text-xs font-semibold ${isToday(day) ? 'text-violet-400' : 'text-zinc-500'}`}>
                      {format(day, 'EEE', { locale: es }).toUpperCase()}
                    </div>
                    <div className={`text-base font-bold font-display ${isToday(day) ? 'text-violet-300' : 'text-zinc-300'}`}>
                      {format(day, 'd')}
                    </div>
                    {dayAppts.length > 0 && (
                      <div className="text-xs text-zinc-600">{dayAppts.length} citas</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Time slots */}
            <div className="max-h-[500px] overflow-y-auto no-scrollbar">
              {TIME_SLOTS.map((time) => (
                <div
                  key={time}
                  className="grid border-b border-zinc-800/30 hover:bg-zinc-800/10 transition-colors"
                  style={{ gridTemplateColumns: `80px repeat(${weekDays.length}, 1fr)`, minHeight: 48 }}
                >
                  <div className="px-3 py-2 text-xs text-zinc-600 font-medium shrink-0">
                    {formatTime(time)}
                  </div>
                  {weekDays.map((day) => {
                    const dayStr = format(day, 'yyyy-MM-dd');
                    const slotAppts = selectedBarberId === 'all'
                      ? appointments.filter((a) => a.date === dayStr && a.startTime <= time && a.endTime > time && a.status !== 'cancelled')
                      : appointments.filter((a) => a.barberId === selectedBarberId && a.date === dayStr && a.startTime <= time && a.endTime > time && a.status !== 'cancelled');

                    return (
                      <div
                        key={dayStr}
                        className={`relative border-l border-zinc-800/30 ${isToday(day) ? 'bg-violet-600/3' : ''}`}
                        style={{ minHeight: 48 }}
                      >
                        {slotAppts.map((appt) => {
                          const barber = barbers.find((b) => b.id === appt.barberId);
                          const client = clients.find((c) => c.id === appt.clientId);
                          const service = services.find((s) => s.id === appt.serviceId);
                          // Only show if this is the START time slot
                          if (appt.startTime !== time) return null;
                          return (
                            <AppointmentCard
                              key={appt.id}
                              appt={appt}
                              barber={barber}
                              client={client}
                              service={service}
                              onAction={handleAction}
                            />
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* New Appointment Modal */}
      {showNewAppt && <NewAppointmentModal onClose={() => setShowNewAppt(false)} />}
    </div>
  );
}

function NewAppointmentModal({ onClose }: { onClose: () => void }) {
  const { barbers, services, clients, createAppointment, findOrCreateClient, getAvailableSlots, currentShop } = useStore();
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState('');
  const [selectedBarber, setSelectedBarber] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTime, setSelectedTime] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [created, setCreated] = useState(false);

  const service = services.find((s) => s.id === selectedService);
  const barber = barbers.find((b) => b.id === selectedBarber);
  const availableSlots = selectedBarber && selectedDate && service
    ? getAvailableSlots(selectedBarber, selectedDate, service.duration)
    : [];

  const handleCreate = () => {
    if (!service || !barber || !selectedTime || !clientName || !clientPhone) return;
    const client = findOrCreateClient(clientPhone, clientName);
    const commissionRate = service.commissionRate > 0 ? service.commissionRate : barber.commissionRate;
    const endTime = (() => {
      const [h, m] = selectedTime.split(':').map(Number);
      const end = h * 60 + m + service.duration;
      return `${Math.floor(end / 60).toString().padStart(2, '0')}:${(end % 60).toString().padStart(2, '0')}`;
    })();
    createAppointment({
      shopId: currentShop?.id || 'shop_demo',
      clientId: client.id,
      barberId: selectedBarber,
      serviceId: selectedService,
      date: selectedDate,
      startTime: selectedTime,
      endTime,
      status: 'scheduled',
      source: 'manual',
      price: service.price,
      commissionAmount: Math.round(service.price * commissionRate),
      isPaid: false,
      reminderSent: false,
    });
    setCreated(true);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h3 className="font-semibold font-display text-zinc-100">Nueva cita</h3>
          <button onClick={onClose} className="btn-icon"><X className="w-4 h-4" /></button>
        </div>

        {created ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h4 className="font-semibold text-zinc-100 mb-2">¡Cita creada!</h4>
            <p className="text-sm text-zinc-500 mb-6">La cita fue registrada y el horario bloqueado.</p>
            <button onClick={onClose} className="btn-primary">Cerrar</button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Service */}
            <div className="form-group">
              <label className="label">Servicio</label>
              <select className="input" value={selectedService} onChange={(e) => setSelectedService(e.target.value)}>
                <option value="">Selecciona un servicio</option>
                {services.filter((s) => s.isActive).map((s) => (
                  <option key={s.id} value={s.id}>{s.name} — {formatCurrency(s.price)} ({s.duration} min)</option>
                ))}
              </select>
            </div>

            {/* Barber */}
            <div className="form-group">
              <label className="label">Barbero</label>
              <select className="input" value={selectedBarber} onChange={(e) => { setSelectedBarber(e.target.value); setSelectedTime(''); }}>
                <option value="">Selecciona un barbero</option>
                {barbers.filter((b) => b.isActive).map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div className="form-group">
              <label className="label">Fecha</label>
              <input
                type="date"
                className="input"
                value={selectedDate}
                min={format(new Date(), 'yyyy-MM-dd')}
                onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(''); }}
              />
            </div>

            {/* Time slots */}
            {selectedBarber && selectedDate && service && (
              <div className="form-group">
                <label className="label">Hora disponible ({availableSlots.length} slots)</label>
                {availableSlots.length === 0 ? (
                  <div className="bg-zinc-800/50 rounded-lg p-3 text-xs text-zinc-500 text-center">
                    No hay disponibilidad para esta fecha
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        className={cn(
                          'px-2 py-1.5 rounded-lg text-xs font-medium border transition-all',
                          selectedTime === slot
                            ? 'bg-violet-600 text-white border-violet-500'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-violet-600/30 hover:text-zinc-200'
                        )}
                      >
                        {formatTime(slot)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Client */}
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="label">Nombre del cliente</label>
                <input className="input" placeholder="Carlos Rodríguez" value={clientName} onChange={(e) => setClientName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">WhatsApp</label>
                <input className="input" placeholder="+57 300 000 0000" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
              </div>
            </div>

            {/* Summary */}
            {service && selectedTime && (
              <div className="bg-violet-600/5 border border-violet-600/20 rounded-lg p-3 text-xs space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Servicio:</span><span className="text-zinc-200 font-medium">{service.name}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Duración:</span><span className="text-zinc-200">{service.duration} min</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Precio:</span><span className="text-violet-300 font-semibold">{formatCurrency(service.price)}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
              <button
                onClick={handleCreate}
                disabled={!selectedService || !selectedBarber || !selectedTime || !clientName || !clientPhone}
                className="btn-primary flex-1"
              >
                Crear cita
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
