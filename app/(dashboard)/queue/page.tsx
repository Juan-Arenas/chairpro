'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import {
  Users, Clock, Play, Pause, Power, Tv, CheckCircle2,
  Coffee, Scissors, UserCheck, AlertCircle, Sparkles,
  Maximize2, Minimize2, ArrowRight, ShieldCheck, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BarberStatus, BarberQueueItem } from '@/types';

export default function QueuePage() {
  const store = useStore();
  const { currentShop, barbers, appointments, setBarberStatus, getBarberQueue } = store;

  const [queueItems, setQueueItems] = useState<BarberQueueItem[]>([]);
  const [isTvMode, setIsTvMode] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Update clock and queue
  useEffect(() => {
    const update = () => {
      setCurrentTime(new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setQueueItems(getBarberQueue());
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [getBarberQueue, barbers, appointments]);

  const STATUS_CONFIG: Record<BarberStatus, { label: string; bg: string; border: string; text: string; dot: string; icon: any }> = {
    available: {
      label: 'Disponible',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      dot: 'bg-emerald-500',
      icon: CheckCircle2,
    },
    busy: {
      label: 'En Turno (Ocupado)',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      dot: 'bg-amber-500 animate-pulse',
      icon: Scissors,
    },
    break: {
      label: 'En Descanso / Almuerzo',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      dot: 'bg-blue-500',
      icon: Coffee,
    },
    off: {
      label: 'Fuera de Turno',
      bg: 'bg-zinc-800/40',
      border: 'border-zinc-700',
      text: 'text-zinc-500',
      dot: 'bg-zinc-600',
      icon: Power,
    },
  };

  const activeBarbersCount = queueItems.filter(b => b.status === 'available' || b.status === 'busy').length;
  const busyCount = queueItems.filter(b => b.status === 'busy').length;

  return (
    <div className={cn('space-y-6 pb-20 lg:pb-8 transition-all', isTvMode && 'fixed inset-0 z-50 bg-zinc-950 p-6 overflow-y-auto space-y-6')}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="section-title">Turnero Digital & Disponibilidad en Vivo</h2>
          </div>
          <p className="section-desc">
            Estado en tiempo real de barberos, control de turnos de clientes y pantalla para sala de espera.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>{currentTime || '12:00:00'}</span>
          </div>

          <button
            onClick={() => setIsTvMode(!isTvMode)}
            className={cn(
              'btn-primary text-xs flex items-center gap-2 shadow-lg transition-all',
              isTvMode ? 'bg-amber-600 hover:bg-amber-500' : 'bg-violet-600 hover:bg-violet-500'
            )}
          >
            {isTvMode ? <Minimize2 className="w-4 h-4" /> : <Tv className="w-4 h-4" />}
            {isTvMode ? 'Salir Modo TV' : 'Modo TV Sala de Espera'}
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4 border-zinc-800">
          <div className="text-[11px] text-zinc-400 font-medium">Barberos en Sala</div>
          <div className="text-2xl font-bold font-display text-zinc-100 mt-1">{activeBarbersCount} / {barbers.length}</div>
        </div>
        <div className="card p-4 border-amber-500/20 bg-amber-500/5">
          <div className="text-[11px] text-amber-300 font-medium">En Corte / Ocupados</div>
          <div className="text-2xl font-bold font-display text-amber-400 mt-1">{busyCount} en silla</div>
        </div>
        <div className="card p-4 border-emerald-500/20 bg-emerald-500/5">
          <div className="text-[11px] text-emerald-300 font-medium">Listos para Siguiente Turno</div>
          <div className="text-2xl font-bold font-display text-emerald-400 mt-1">
            {queueItems.filter(b => b.status === 'available').length} libres
          </div>
        </div>
        <div className="card p-4 border-zinc-800">
          <div className="text-[11px] text-zinc-400 font-medium">Total Cortes Hoy</div>
          <div className="text-2xl font-bold font-display text-zinc-100 mt-1">
            {queueItems.reduce((s, b) => s + b.dailyServicesCount, 0)} servicios
          </div>
        </div>
      </div>

      {/* Barber Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {queueItems.map(item => {
          const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.available;
          const Icon = cfg.icon;

          return (
            <div
              key={item.barberId}
              className={cn(
                'card p-5 border transition-all duration-300 flex flex-col justify-between',
                cfg.border,
                item.status === 'busy' && 'bg-amber-950/10 shadow-amber-950/20 shadow-lg',
                item.status === 'available' && 'bg-emerald-950/10'
              )}
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white text-base shadow-lg shrink-0"
                      style={{ backgroundColor: item.avatarColor }}
                    >
                      {item.barberName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-zinc-100">{item.barberName}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={cn('w-2 h-2 rounded-full', cfg.dot)} />
                        <span className={cn('text-xs font-semibold', cfg.text)}>{cfg.label}</span>
                      </div>
                    </div>
                  </div>

                  <span className="badge-zinc text-[11px] font-mono">
                    {item.dailyServicesCount} cortes hoy
                  </span>
                </div>

                {/* Current Service Status Box */}
                {item.status === 'busy' ? (
                  <div className="p-3.5 bg-zinc-900/90 rounded-xl border border-amber-500/30 space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400 font-medium">En silla:</span>
                      <span className="font-bold text-amber-300">{item.currentClientName || 'Cliente en Turno'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400 font-medium">Servicio:</span>
                      <span className="text-zinc-200">{item.currentServiceName || 'Corte Clásico'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800">
                      <span className="text-zinc-400 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" /> Tiempo estimado:
                      </span>
                      <span className="font-bold font-mono text-amber-400">~{item.remainingMinutes || 20} min</span>
                    </div>
                  </div>
                ) : item.status === 'available' ? (
                  <div className="p-3.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-center text-xs text-emerald-300 font-semibold mb-4 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Silla libre — Listo para recibir siguiente cliente
                  </div>
                ) : item.status === 'break' ? (
                  <div className="p-3.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-center text-xs text-blue-300 font-semibold mb-4 flex items-center justify-center gap-2">
                    <Coffee className="w-4 h-4 text-blue-400" />
                    En descanso / Almuerzo (Pausado)
                  </div>
                ) : (
                  <div className="p-3.5 bg-zinc-900/60 rounded-xl border border-zinc-800 text-center text-xs text-zinc-500 font-medium mb-4">
                    Fuera de turno
                  </div>
                )}
              </div>

              {/* Interactive 1-Click Status Buttons */}
              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  Cambiar Disponibilidad (1-Clic):
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setBarberStatus(item.barberId, 'available')}
                    className={cn(
                      'py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all',
                      item.status === 'available'
                        ? 'bg-emerald-500 text-zinc-950 font-bold shadow-md'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-emerald-500/20 hover:text-emerald-300'
                    )}
                  >
                    🟢 Disponible
                  </button>

                  <button
                    onClick={() => setBarberStatus(item.barberId, 'busy')}
                    className={cn(
                      'py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all',
                      item.status === 'busy'
                        ? 'bg-amber-500 text-zinc-950 font-bold shadow-md'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-amber-500/20 hover:text-amber-300'
                    )}
                  >
                    🟡 En Turno
                  </button>

                  <button
                    onClick={() => setBarberStatus(item.barberId, 'break')}
                    className={cn(
                      'py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all',
                      item.status === 'break'
                        ? 'bg-blue-500 text-zinc-950 font-bold shadow-md'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-blue-500/20 hover:text-blue-300'
                    )}
                  >
                    ☕ Descanso
                  </button>

                  <button
                    onClick={() => setBarberStatus(item.barberId, 'off')}
                    className={cn(
                      'py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all',
                      item.status === 'off'
                        ? 'bg-zinc-600 text-white font-bold'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    )}
                  >
                    🔴 Fuera
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
