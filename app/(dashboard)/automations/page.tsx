'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { formatRelativeTime, formatCurrency } from '@/lib/utils';
import {
  Zap, Clock, CheckCircle2, DollarSign, ShieldAlert,
  Star, RefreshCw, Send, Sparkles, MessageCircle,
  Smartphone, TrendingUp, Package, ArrowRight, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DailyCloseReport } from '@/types';

export default function AutomationsPage() {
  const store = useStore();
  const {
    currentShop,
    automations,
    toggleAutomation,
    sendDailyCashCloseWhatsApp,
    dailyCloseReports,
  } = store;

  const [activeTab, setActiveTab] = useState<'flows' | 'daily_close' | 'roi_calculator'>('flows');
  const [runningSim, setRunningSim] = useState<string | null>(null);
  const [simModalData, setSimModalData] = useState<{ title: string; message: string; buttons?: string[] } | null>(null);

  const activeCount = automations.filter(a => a.isActive).length;
  const totalRuns = automations.reduce((s, a) => s + a.runCount, 0);

  // Trigger Daily Cash Close Simulation
  const handleTestDailyClose = () => {
    setRunningSim('close');
    setTimeout(() => {
      const result = sendDailyCashCloseWhatsApp();
      setRunningSim(null);
      setSimModalData({
        title: '📊 Reporte de Cierre de Caja Enviado a WhatsApp del Dueño',
        message: result.summary,
      });
    }, 600);
  };

  // Trigger Anti No-Show Simulation
  const handleTestAntiNoShow = () => {
    setRunningSim('noshow');
    setTimeout(() => {
      setRunningSim(null);
      setSimModalData({
        title: '⏰ Recordatorio Anti No-Show (WhatsApp con 1-Click)',
        message: `👋 ¡Hola Carlos Mendoza!\n\nTe recordamos tu cita de hoy en *${currentShop?.name || 'The Black Chair'}* 💈:\n✂️ *Servicio:* Corte Clásico + Barba\n💈 *Barbero:* Mateo Gómez\n⏰ *Hora:* 04:30 PM\n📍 *Dirección:* ${currentShop?.address || 'Cra 15 # 85-32'}\n\nPor favor confirma tu asistencia presionando un botón:`,
        buttons: ['✅ Confirmar Asistencia', '🔄 Reprogramar Turno', '❌ Cancelar'],
      });
    }, 500);
  };

  // Trigger Win-Back Simulation
  const handleTestWinBack = () => {
    setRunningSim('winback');
    setTimeout(() => {
      setRunningSim(null);
      setSimModalData({
        title: '🔄 Mensaje de Reenganche (Win-Back 21 Días)',
        message: `💈 ¡Hola Andrés Felipe!\n\nHan pasado *21 días* desde tu última visita con Mateo en *${currentShop?.name || 'The Black Chair'}* ✂️.\n\nUn buen corte siempre marca la diferencia. ¿Te apartamos tu espacio para este fin de semana?\n\n📲 Responde *1* para hoy a las 5pm o *2* para mañana.`,
      });
    }, 500);
  };

  // Trigger Google Review Booster Simulation
  const handleTestGoogleReview = () => {
    setRunningSim('review');
    setTimeout(() => {
      setRunningSim(null);
      setSimModalData({
        title: '⭐ Booster de Reseñas 5 Estrellas en Google Maps',
        message: `🔥 ¡Hola Carlos!\n\nEsperamos que hayas quedado al 100% con tu corte de hoy con Mateo en *${currentShop?.name || 'The Black Chair'}* 💈✨\n\n¿Nos regalarías 1 minuto dejando tu calificación de 5 estrellas en Google? Tu opinión nos ayuda muchísimo a seguir creciendo:\n\n⭐ *Deja tu reseña aquí:*\n👉 https://maps.google.com/?q=${encodeURIComponent(currentShop?.name || 'Barberia')}\n\n¡Al mostrar tu reseña en tu próxima visita recibirás un *10% de descuento*! 🎁`,
      });
    }, 500);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse" />
            <h2 className="section-title">Motor de Automatizaciones SaaS</h2>
          </div>
          <p className="section-desc">
            {activeCount} activas · {totalRuns} ejecuciones automáticas este mes · Cero trabajo manual
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
          <button
            onClick={() => setActiveTab('flows')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all',
              activeTab === 'flows' ? 'bg-violet-600 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Zap className="w-3.5 h-3.5" />
            Flujos Activos ({activeCount})
          </button>
          <button
            onClick={() => setActiveTab('daily_close')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all',
              activeTab === 'daily_close' ? 'bg-violet-600 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Cierre de Caja 9 PM
          </button>
          <button
            onClick={() => setActiveTab('roi_calculator')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all',
              activeTab === 'roi_calculator' ? 'bg-violet-600 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Impacto & Retorno (ROI)
          </button>
        </div>
      </div>

      {/* POPUP SIMULATION MODAL */}
      {simModalData && (
        <div className="modal-overlay" onClick={() => setSimModalData(null)}>
          <div className="modal-content max-w-lg animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="font-bold text-sm text-zinc-100">{simModalData.title}</div>
              <button onClick={() => setSimModalData(null)} className="btn-icon">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-xs text-zinc-200 font-mono whitespace-pre-line leading-relaxed shadow-inner">
                {simModalData.message}
              </div>

              {simModalData.buttons && (
                <div className="space-y-1.5 pt-2">
                  <div className="text-[10px] text-zinc-500 uppercase font-bold">Botones interactivos en WhatsApp:</div>
                  <div className="flex flex-wrap gap-2">
                    {simModalData.buttons.map((b, i) => (
                      <span key={i} className="px-3 py-1 bg-violet-600/20 border border-violet-500/40 text-violet-300 text-xs rounded-lg font-semibold">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-zinc-800 flex justify-end">
              <button onClick={() => setSimModalData(null)} className="btn-primary text-xs">
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: FLOWS */}
      {activeTab === 'flows' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Automation 1: Daily Cash Close */}
          <div className="card p-5 border-blue-500/30 bg-gradient-to-b from-blue-950/15 to-transparent space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-lg shrink-0">
                  📊
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-100">Cierre de Caja Automático 9:00 PM</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Envía balance exacto a WhatsApp del dueño</p>
                </div>
              </div>
              <span className="badge-emerald text-xs">Activa</span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Consolida automáticamente: Total facturado, efectivo en cajón físico vs Nequi/Daviplata y comisiones exactas por barbero para evitar descuadres y robo hormiga.
            </p>

            <div className="pt-2 flex items-center justify-between border-t border-zinc-800">
              <span className="text-[11px] text-zinc-500">⏰ Disparador: Todos los días a las 21:00</span>
              <button
                onClick={handleTestDailyClose}
                disabled={runningSim === 'close'}
                className="btn-secondary text-xs flex items-center gap-1.5 hover:border-blue-500/50"
              >
                <Send className="w-3.5 h-3.5 text-blue-400" />
                {runningSim === 'close' ? 'Generando...' : 'Probar Envío'}
              </button>
            </div>
          </div>

          {/* Automation 2: Anti No-Show WhatsApp Reminder */}
          <div className="card p-5 border-amber-500/30 bg-gradient-to-b from-amber-950/15 to-transparent space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-lg shrink-0">
                  🛡️
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-100">Motor Anti No-Show (1-Click)</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Recordatorio 2 horas antes con botones</p>
                </div>
              </div>
              <span className="badge-emerald text-xs">Activa</span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Envía mensaje con botones interactivos [Confirmar] o [Reprogramar]. Si el cliente no puede ir, libera el cupo de inmediato y avisa a clientes en espera.
            </p>

            <div className="pt-2 flex items-center justify-between border-t border-zinc-800">
              <span className="text-[11px] text-zinc-500">⏰ Disparador: 120 min antes de la cita</span>
              <button
                onClick={handleTestAntiNoShow}
                disabled={runningSim === 'noshow'}
                className="btn-secondary text-xs flex items-center gap-1.5 hover:border-amber-500/50"
              >
                <Send className="w-3.5 h-3.5 text-amber-400" />
                {runningSim === 'noshow' ? 'Enviando...' : 'Probar Mensaje'}
              </button>
            </div>
          </div>

          {/* Automation 3: Win-Back Re-engagement */}
          <div className="card p-5 border-violet-500/30 bg-gradient-to-b from-violet-950/15 to-transparent space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-lg shrink-0">
                  🔄
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-100">Piloto Automático de Reenganche</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Reactiva clientes inactivos tras 21 días</p>
                </div>
              </div>
              <span className="badge-emerald text-xs">Activa</span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Detecta cuando un cliente cumple 3 semanas sin cortarse y le envía un mensaje personalizado de WhatsApp recordándole su barbero favorito. Aumenta la recurrencia un 28%.
            </p>

            <div className="pt-2 flex items-center justify-between border-t border-zinc-800">
              <span className="text-[11px] text-zinc-500">⏰ Disparador: 21 días sin visita</span>
              <button
                onClick={handleTestWinBack}
                disabled={runningSim === 'winback'}
                className="btn-secondary text-xs flex items-center gap-1.5 hover:border-violet-500/50"
              >
                <Send className="w-3.5 h-3.5 text-violet-400" />
                {runningSim === 'winback' ? 'Enviando...' : 'Probar Mensaje'}
              </button>
            </div>
          </div>

          {/* Automation 4: Google Maps Review Booster */}
          <div className="card p-5 border-emerald-500/30 bg-gradient-to-b from-emerald-950/15 to-transparent space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-lg shrink-0">
                  ⭐
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-100">Booster de Reseñas Google Maps</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Multiplica las 5 estrellas en Google</p>
                </div>
              </div>
              <span className="badge-emerald text-xs">Activa</span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              45 minutos después del corte, envía un WhatsApp pidiendo calificación con el link directo a Google Maps a cambio de un incentivo. Posiciona tu barbería de #1 en Google.
            </p>

            <div className="pt-2 flex items-center justify-between border-t border-zinc-800">
              <span className="text-[11px] text-zinc-500">⏰ Disparador: 45 min tras cita completada</span>
              <button
                onClick={handleTestGoogleReview}
                disabled={runningSim === 'review'}
                className="btn-secondary text-xs flex items-center gap-1.5 hover:border-emerald-500/50"
              >
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                {runningSim === 'review' ? 'Enviando...' : 'Probar Mensaje'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DAILY CLOSE REPORTS */}
      {activeTab === 'daily_close' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-zinc-100">Reportes de Cierre de Caja Generados</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Historial de cierres enviados automáticamente a WhatsApp
              </p>
            </div>

            <button
              onClick={handleTestDailyClose}
              className="btn-primary text-xs flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500"
            >
              <Zap className="w-4 h-4" />
              Ejecutar Cierre Ahora
            </button>
          </div>

          {dailyCloseReports.length > 0 ? (
            <div className="space-y-4">
              {dailyCloseReports.map(report => (
                <div key={report.id} className="card p-5 border-zinc-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-zinc-100">Fecha: {report.date}</div>
                      <div className="text-xs text-zinc-500">Destinatario: {report.recipientPhone}</div>
                    </div>
                    <span className="badge-emerald text-xs">Enviado por WhatsApp</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                      <div className="text-[10px] text-zinc-500 uppercase">Facturación Total</div>
                      <div className="text-base font-bold text-zinc-100">{formatCurrency(report.totalRevenue)}</div>
                    </div>
                    <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                      <div className="text-[10px] text-zinc-500 uppercase">Efectivo en Cajón</div>
                      <div className="text-base font-bold text-emerald-400">{formatCurrency(report.cashInDrawer)}</div>
                    </div>
                    <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                      <div className="text-[10px] text-zinc-500 uppercase">Nequi + Daviplata</div>
                      <div className="text-base font-bold text-violet-400">
                        {formatCurrency(report.nequiAmount + report.daviplataAmount)}
                      </div>
                    </div>
                    <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                      <div className="text-[10px] text-zinc-500 uppercase">Utilidad Neta Negocio</div>
                      <div className="text-base font-bold text-amber-400">{formatCurrency(report.netShopProfit)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center text-zinc-500 text-xs border-dashed border-zinc-800">
              No hay reportes de cierre previos. Presiona &ldquo;Ejecutar Cierre Ahora&rdquo; para generar el reporte de hoy.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ROI CALCULATOR */}
      {activeTab === 'roi_calculator' && (
        <div className="max-w-3xl space-y-5">
          <div className="card p-6 border-violet-500/30 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-violet-400" />
              <h3 className="font-bold text-base text-zinc-100">¿Cuánto Ahorra y Genera este SaaS a la Barbería?</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Basado en una barbería promedio con 4 barberos y 30 citas diarias:
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-zinc-200">🛡️ Recuperación por Anti No-Show</div>
                  <div className="text-[11px] text-zinc-400">Reduce inasistencias de 6 a 1 al día (5 citas salvadas)</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-400 text-sm font-mono">+ $3.500.000 COP / mes</div>
                </div>
              </div>

              <div className="p-3.5 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-zinc-200">🔄 Clientes Recurrentes (Win-Back 21 Días)</div>
                  <div className="text-[11px] text-zinc-400">+28% de retención de clientes antiguos</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-400 text-sm font-mono">+ $2.100.000 COP / mes</div>
                </div>
              </div>

              <div className="p-3.5 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-zinc-200">⏰ Tiempo Ahorrado al Dueño</div>
                  <div className="text-[11px] text-zinc-400">Cierre de caja automático y cuadre de comisiones sin calculadora</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-amber-400 text-sm font-mono">30 horas / mes</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
