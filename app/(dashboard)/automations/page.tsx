'use client';
import { useStore } from '@/lib/store';
import { formatRelativeTime } from '@/lib/utils';
import { Zap, ChevronRight, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const TRIGGER_ICONS: Record<string, string> = {
  on_appointment_created: '📅',
  on_appointment_completed: '✅',
  on_appointment_cancelled: '❌',
  on_no_show: '⚠️',
  on_low_stock: '📦',
  on_client_inactive: '👤',
};

const ACTION_COLORS: Record<string, string> = {
  send_confirmation: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
  send_reminder: 'bg-violet-500/10 border-violet-500/20 text-violet-300',
  register_income: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
  calculate_commission: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
  update_client_history: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
  update_stats: 'bg-zinc-500/10 border-zinc-500/20 text-zinc-300',
  create_notification: 'bg-violet-500/10 border-violet-500/20 text-violet-300',
  flag_client: 'bg-red-500/10 border-red-500/20 text-red-300',
  release_slot: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
  add_to_recovery_list: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
};

export default function AutomationsPage() {
  const { automations, toggleAutomation } = useStore();
  const activeCount = automations.filter(a => a.isActive).length;
  const totalRuns = automations.reduce((s, a) => s + a.runCount, 0);

  return (
    <div className="space-y-5 pb-20 lg:pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Automatizaciones</h2>
          <p className="section-desc">{activeCount} activas · {totalRuns} ejecuciones totales</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-violet-600/5 border border-violet-600/20 rounded-xl">
        <Zap className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-semibold text-violet-300 mb-1">Motor de automatizaciones activo</div>
          <div className="text-xs text-zinc-500">Las automatizaciones se ejecutan en segundo plano cuando ocurren los eventos configurados. Puedes activar o desactivar cada una individualmente.</div>
        </div>
      </div>

      {/* Automation flows */}
      <div className="space-y-4">
        {automations.map(auto => (
          <div key={auto.id} className={cn('card p-5 transition-all duration-300', !auto.isActive && 'opacity-60')}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg', auto.isActive ? 'bg-violet-500/15' : 'bg-zinc-800')}>
                  {TRIGGER_ICONS[auto.trigger] || '🔔'}
                </div>
                <div>
                  <div className="font-semibold text-zinc-100">{auto.name}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{auto.triggerLabel}</div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="badge-zinc text-xs">{auto.runCount} ejecuciones</span>
                    {auto.lastRunAt && (
                      <span className="text-xs text-zinc-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatRelativeTime(auto.lastRunAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => toggleAutomation(auto.id)}
                className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all', auto.isActive ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25' : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600')}
              >
                <div className={cn('w-2 h-2 rounded-full', auto.isActive ? 'bg-emerald-400' : 'bg-zinc-600')} />
                {auto.isActive ? 'Activa' : 'Inactiva'}
              </button>
            </div>

            {/* Flow diagram */}
            <div className="space-y-2">
              {/* Trigger */}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
                <div className="text-xs font-semibold text-violet-300 uppercase tracking-wider">Disparador: {auto.triggerLabel}</div>
              </div>

              {auto.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-2 ml-1">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-px h-3 bg-zinc-700" />
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                  </div>
                  <div className={cn('flex-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium mt-1', ACTION_COLORS[step.action])}>
                    <div className="flex items-center justify-between">
                      <span>{step.label}</span>
                      {step.delay && step.delay > 0 && (
                        <span className="opacity-60 text-[10px]">+{step.delay < 60 ? `${step.delay}min` : `${step.delay / 60}h`}</span>
                      )}
                      {step.delay && step.delay < 0 && (
                        <span className="opacity-60 text-[10px]">{Math.abs(step.delay)}min antes</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* WhatsApp note */}
            {auto.steps.some(s => s.action === 'send_confirmation' || s.action === 'send_reminder') && (
              <div className="mt-3 text-xs text-zinc-600 flex items-center gap-1.5 bg-zinc-800/50 rounded-lg px-3 py-2">
                <span>💬</span>
                <span>Los mensajes de WhatsApp requieren conexión con proveedor oficial. En modo demo, se muestran como simulados.</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add automation CTA */}
      <div className="card p-5 border-dashed border-zinc-700 text-center">
        <Zap className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
        <div className="text-sm text-zinc-500 mb-3">¿Quieres crear una automatización personalizada?</div>
        <div className="text-xs text-zinc-600">Esta función estará disponible en MartiArenas Labs Pro. Las automatizaciones personalizadas permiten crear flujos específicos para tu negocio.</div>
      </div>
    </div>
  );
}
