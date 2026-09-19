'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import {
  Sliders, RefreshCw, Trash2, CheckCircle2, AlertTriangle,
  X, MessageCircle, Bot, Mic, Tv, Zap, Clock, ShieldAlert,
  Star, ShoppingBag, Award, Scissors, Sparkles, Check, Database,
  Eye, EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function QuickControlFab() {
  const {
    currentShop,
    currentUser,
    toggleFeatureToggle,
    resetDemoData,
    clearAppointmentsAndTransactions,
    clearWhatsAppMessages,
    clearAllBusinessData,
  } = useStore();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'features' | 'data'>('features');
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // If user is a barber, they don't manage shop-level feature toggles
  if (currentUser?.role === 'barber') {
    return null;
  }

  const settings = currentShop?.settings || ({} as any);

  const FEATURE_SWITCHES = [
    {
      key: 'enableWhatsApp',
      title: 'WhatsApp Real (Meta Cloud API)',
      desc: 'Integración oficial de WhatsApp y webhooks',
      icon: MessageCircle,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      defaultVal: true,
    },
    {
      key: 'enableClientBot',
      title: 'Chatbot IA 24/7 para Clientes',
      desc: 'Respuestas automáticas de precios y reservas',
      icon: Bot,
      color: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
      defaultVal: true,
    },
    {
      key: 'enableBarberBot',
      title: 'Registro de Voz/Texto Barberos',
      desc: 'Reconoce audios y mensajes de cortes',
      icon: Mic,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      defaultVal: true,
    },
    {
      key: 'enableQueue',
      title: 'Turnero Digital & Modo TV',
      desc: 'Pantalla de turnos en vivo y disponibilidad',
      icon: Tv,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      defaultVal: true,
    },
    {
      key: 'enableAutomations',
      title: 'Automatizaciones & Marketing',
      desc: 'Suite de pilotos automáticos',
      icon: Zap,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      defaultVal: true,
    },
    {
      key: 'enableDailyCloseWhatsApp',
      title: 'Cierre de Caja Diario 9:00 PM',
      desc: 'Reporte automático al WhatsApp del dueño',
      icon: Clock,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      defaultVal: true,
    },
    {
      key: 'enableNoShow',
      title: 'Control Anti No-Show',
      desc: 'Confirmaciones de citas en 1 clic',
      icon: ShieldAlert,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      defaultVal: true,
    },
    {
      key: 'enableLoyalty',
      title: 'Club de Fidelización & VIP',
      desc: 'Puntos por corte y descuentos por visitas',
      icon: Star,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      defaultVal: true,
    },
    {
      key: 'enableInventory',
      title: 'Inventario & Tienda',
      desc: 'Stock de ceras, productos y ventas directas',
      icon: ShoppingBag,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      defaultVal: true,
    },
    {
      key: 'enableCommissions',
      title: 'Liquidación de Comisiones',
      desc: 'Cálculo y pago de porcentajes a barberos',
      icon: Award,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
      defaultVal: true,
    },
    {
      key: 'allowOnlineBooking',
      title: 'Portal de Reservas Web & QR',
      desc: 'Permitir a clientes agendar citas por la web',
      icon: Scissors,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      defaultVal: true,
    },
  ];

  const handleTriggerAction = (actionKey: string) => {
    if (actionKey === 'reset_demo') {
      resetDemoData();
      setSuccessToast('✅ ¡Datos de prueba restaurados con éxito!');
    } else if (actionKey === 'clear_appts_tx') {
      clearAppointmentsAndTransactions();
      setSuccessToast('🗑️ ¡Citas y transacciones limpiadas a $0!');
    } else if (actionKey === 'clear_wa') {
      clearWhatsAppMessages();
      setSuccessToast('💬 ¡Historial de WhatsApp limpiado!');
    } else if (actionKey === 'clear_all') {
      clearAllBusinessData();
      setSuccessToast('💥 ¡Todo el negocio quedó en blanco!');
    }
    setConfirmAction(null);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  return (
    <>
      {/* Floating Action Button in Bottom Right Corner */}
      <div className="fixed bottom-4 right-4 z-40 lg:bottom-6 lg:right-6">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-zinc-900/95 hover:bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-2xl backdrop-blur-md transition-all hover:scale-105 active:scale-95 group"
          title="Panel de Control de Funciones y Reinicio de Datos"
        >
          <Sliders className="w-4 h-4 text-violet-400 group-hover:rotate-45 transition-transform" />
          <span className="text-xs font-bold hidden sm:inline">Control de Funciones & Datos</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </button>
      </div>

      {/* Slide-over / Modal Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border-zinc-700 shadow-2xl bg-zinc-900">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-100">Centro de Control & Gestión</h3>
                  <p className="text-[11px] text-zinc-400">Inactiva funciones que no uses o reinicia tus datos con 1 clic</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setConfirmAction(null);
                }}
                className="btn-icon p-1.5 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex p-2 bg-zinc-950 border-b border-zinc-800 gap-2">
              <button
                onClick={() => setActiveTab('features')}
                className={cn(
                  'flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2',
                  activeTab === 'features' ? 'bg-violet-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>🎛️ Activar / Inactivar Funciones</span>
              </button>
              <button
                onClick={() => setActiveTab('data')}
                className={cn(
                  'flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2',
                  activeTab === 'data' ? 'bg-violet-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                <Database className="w-3.5 h-3.5" />
                <span>🧹 Reinicio & Limpieza de Datos</span>
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar">
              {/* Success Toast */}
              {successToast && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs rounded-xl font-bold flex items-center gap-2 animate-scale-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{successToast}</span>
                </div>
              )}

              {/* TAB 1: FEATURE TOGGLES */}
              {activeTab === 'features' && (
                <div className="space-y-3">
                  <div className="text-[11px] text-zinc-400 bg-zinc-950/80 p-3 rounded-xl border border-zinc-800">
                    💡 <strong>Personaliza tu plataforma:</strong> Si tu barbería no utiliza algún módulo (por ejemplo inventario o turnero), apágalo aquí y desaparecerá automáticamente de tu barra lateral.
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {FEATURE_SWITCHES.map(item => {
                      const Icon = item.icon;
                      const isEnabled = settings[item.key] !== undefined ? settings[item.key] : item.defaultVal;

                      return (
                        <div
                          key={item.key}
                          className={cn(
                            'p-3 rounded-xl border flex items-center justify-between gap-3 transition-all',
                            isEnabled
                              ? 'bg-zinc-900/90 border-zinc-700/80 shadow-sm'
                              : 'bg-zinc-950/40 border-zinc-800/60 opacity-60'
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border', item.color)}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-zinc-100 flex items-center gap-1.5">
                                <span>{item.title}</span>
                                {isEnabled ? (
                                  <span className="badge-emerald text-[9px] py-0">Activo</span>
                                ) : (
                                  <span className="badge-zinc text-[9px] py-0 text-zinc-500">Inactivo</span>
                                )}
                              </div>
                              <div className="text-[11px] text-zinc-400 truncate">{item.desc}</div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleFeatureToggle(item.key)}
                            className={cn(
                              'w-11 h-6 rounded-full transition-colors relative shrink-0 p-0.5 focus:outline-none',
                              isEnabled ? 'bg-emerald-600' : 'bg-zinc-800'
                            )}
                          >
                            <div
                              className={cn(
                                'w-5 h-5 rounded-full bg-white transition-transform shadow-md',
                                isEnabled ? 'translate-x-5' : 'translate-x-0'
                              )}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: DATA RESET & CLEANUP */}
              {activeTab === 'data' && (
                <div className="space-y-4">
                  <div className="text-[11px] text-zinc-400 bg-zinc-950/80 p-3 rounded-xl border border-zinc-800">
                    ⚙️ <strong>Opciones de Mantenimiento de Datos:</strong> Úsalas para limpiar citas de prueba antes de atender clientes reales, o para recargar datos de demostración.
                  </div>

                  {/* Action Cards */}
                  <div className="space-y-3">
                    {/* Option 1: Restore Demo Data */}
                    <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 text-violet-400" />
                          <h4 className="font-bold text-xs text-zinc-100">Restaurar Datos de Demostración</h4>
                        </div>
                        <span className="badge-violet text-[10px]">Para Presentaciones</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Recarga el equipo de barberos, catálogo de servicios, citas y ventas de ejemplo completas.
                      </p>
                      {confirmAction === 'reset_demo' ? (
                        <div className="p-3 bg-violet-950/40 border border-violet-500/30 rounded-xl space-y-2 animate-fade-in">
                          <div className="text-xs font-bold text-violet-300 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-violet-400" />
                            ¿Confirmas restaurar todos los datos demo?
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleTriggerAction('reset_demo')}
                              className="btn-primary text-xs py-1.5 px-3 bg-violet-600 hover:bg-violet-500 font-bold"
                            >
                              Sí, Restaurar Todo
                            </button>
                            <button
                              onClick={() => setConfirmAction(null)}
                              className="btn-secondary text-xs py-1.5 px-3"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmAction('reset_demo')}
                          className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 hover:border-violet-500/50"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Restaurar Datos de Prueba</span>
                        </button>
                      )}
                    </div>

                    {/* Option 2: Clear Appointments and Sales to zero */}
                    <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Trash2 className="w-4 h-4 text-amber-400" />
                          <h4 className="font-bold text-xs text-zinc-100">Limpiar Agenda y Caja a Cero ($0)</h4>
                        </div>
                        <span className="badge-amber text-[10px]">Comenzar en Real</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Elimina todas las citas y transacciones de prueba. Conserva tus barberos, servicios y configuración para empezar a facturar de verdad.
                      </p>
                      {confirmAction === 'clear_appts_tx' ? (
                        <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl space-y-2 animate-fade-in">
                          <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                            ¿Confirmas vaciar las citas y transacciones?
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleTriggerAction('clear_appts_tx')}
                              className="btn-primary text-xs py-1.5 px-3 bg-amber-600 hover:bg-amber-500 font-bold"
                            >
                              Sí, Limpiar a Cero
                            </button>
                            <button
                              onClick={() => setConfirmAction(null)}
                              className="btn-secondary text-xs py-1.5 px-3"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmAction('clear_appts_tx')}
                          className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 hover:border-amber-500/50"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Vaciar Citas y Finanzas</span>
                        </button>
                      )}
                    </div>

                    {/* Option 3: Clear WhatsApp logs */}
                    <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-emerald-400" />
                          <h4 className="font-bold text-xs text-zinc-100">Limpiar Historial de WhatsApp</h4>
                        </div>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Borra el registro de audios y mensajes de prueba intercambiados con el bot.
                      </p>
                      {confirmAction === 'clear_wa' ? (
                        <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl space-y-2 animate-fade-in">
                          <div className="text-xs font-bold text-emerald-300">
                            ¿Confirmas borrar los mensajes de WhatsApp?
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleTriggerAction('clear_wa')}
                              className="btn-primary text-xs py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 font-bold"
                            >
                              Sí, Borrar Historial
                            </button>
                            <button
                              onClick={() => setConfirmAction(null)}
                              className="btn-secondary text-xs py-1.5 px-3"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmAction('clear_wa')}
                          className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 hover:border-emerald-500/50"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Limpiar Mensajes WhatsApp</span>
                        </button>
                      )}
                    </div>

                    {/* Option 4: Full Factory Reset */}
                    <div className="p-4 bg-red-950/20 rounded-2xl border border-red-500/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Trash2 className="w-4 h-4 text-red-400" />
                          <h4 className="font-bold text-xs text-red-300">Vaciar Todo (Pizarra en Blanco)</h4>
                        </div>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Elimina clientes, citas, transacciones y mensajes para configurar tu barbería completamente desde cero.
                      </p>
                      {confirmAction === 'clear_all' ? (
                        <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl space-y-2 animate-fade-in">
                          <div className="text-xs font-bold text-red-300 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            ⚠️ ¡Esta acción dejará el sistema vacío! ¿Deseas continuar?
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleTriggerAction('clear_all')}
                              className="btn-primary text-xs py-1.5 px-3 bg-red-600 hover:bg-red-500 font-bold"
                            >
                              Sí, Vaciar Todo
                            </button>
                            <button
                              onClick={() => setConfirmAction(null)}
                              className="btn-secondary text-xs py-1.5 px-3"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmAction('clear_all')}
                          className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 text-red-400 hover:border-red-500/50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Vaciar Todo a Blanco</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-zinc-800 bg-zinc-950/80 flex justify-end">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setConfirmAction(null);
                }}
                className="btn-secondary text-xs py-1.5 px-4"
              >
                Cerrar Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
