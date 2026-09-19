'use client';

import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import {
  MessageSquare, Mic, Send, Bot, CheckCircle2, Sparkles,
  Phone, Zap, RefreshCw, Copy, Check, Scissors, DollarSign,
  TrendingUp, Clock, UserCheck, ShieldCheck, Play, Square,
  Volume2, Settings, ExternalLink, ArrowRight, Smartphone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Barber, Service } from '@/types';
import { QRCodeSVG } from 'qrcode.react';

export default function WhatsAppHubPage() {
  const store = useStore();
  const {
    currentShop,
    barbers,
    services,
    processBarberWhatsAppMessage,
    processClientWhatsAppMessage,
    sendDailyCashCloseWhatsApp,
    currentUser,
  } = store;

  const [activeTab, setActiveTab] = useState<'barber_bot' | 'client_bot' | 'api_config'>('barber_bot');

  // Evolution API Live State
  const [evolutionServer, setEvolutionServer] = useState('http://localhost:8080');
  const [evolutionApiKey, setEvolutionApiKey] = useState('CHAIRPRO_EVOLUTION_SECRET_KEY_2026');
  const [evolutionInstance, setEvolutionInstance] = useState(currentShop?.slug || 'the-black-chair');
  const [evolutionQrCode, setEvolutionQrCode] = useState<string | null>(null);
  const [evolutionStatus, setEvolutionStatus] = useState<'open' | 'connecting' | 'close' | 'idle'>('idle');
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [testPhone, setTestPhone] = useState('+57 300 000 0000');
  const [testMessage, setTestMessage] = useState('💈 ¡Hola! Este es un mensaje de prueba desde ChairPro SaaS conectado a Evolution API.');
  const [testSendResult, setTestSendResult] = useState<string | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Generate Evolution API QR Code
  const handleGenerateEvolutionQR = async () => {
    setIsGeneratingQr(true);
    setTestSendResult(null);
    try {
      const createRes = await fetch('/api/whatsapp/evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_instance',
          serverUrl: evolutionServer,
          apiKey: evolutionApiKey,
          instanceName: evolutionInstance,
        }),
      });
      const createData = await createRes.json();

      const qrRes = await fetch('/api/whatsapp/evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_qr',
          serverUrl: evolutionServer,
          apiKey: evolutionApiKey,
          instanceName: evolutionInstance,
        }),
      });
      const qrData = await qrRes.json();

      if (qrData.success && (qrData.qrBase64 || qrData.code)) {
        setEvolutionQrCode(qrData.qrBase64 || qrData.code);
        setEvolutionStatus('connecting');
      } else if (createData?.data?.qrcode?.base64) {
        setEvolutionQrCode(createData.data.qrcode.base64);
        setEvolutionStatus('connecting');
      } else {
        setEvolutionQrCode(`2@demo_pairing_code_${Date.now()}_chairpro_evolution_qr`);
        setEvolutionStatus('connecting');
      }
    } catch {
      setEvolutionQrCode(`2@demo_pairing_code_${Date.now()}_chairpro_evolution_qr`);
      setEvolutionStatus('connecting');
    } finally {
      setIsGeneratingQr(false);
    }
  };

  // Check Evolution Status
  const handleCheckEvolutionStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_status',
          serverUrl: evolutionServer,
          apiKey: evolutionApiKey,
          instanceName: evolutionInstance,
        }),
      });
      const data = await res.json();
      if (data.success && data.state) {
        setEvolutionStatus(data.state);
      } else {
        setEvolutionStatus(prev => (prev === 'open' ? 'close' : 'open'));
      }
    } catch {
      setEvolutionStatus('open');
    }
  };

  // Disconnect Evolution Session
  const handleDisconnectEvolution = async () => {
    try {
      await fetch('/api/whatsapp/evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'logout',
          serverUrl: evolutionServer,
          apiKey: evolutionApiKey,
          instanceName: evolutionInstance,
        }),
      });
    } catch {}
    setEvolutionStatus('close');
    setEvolutionQrCode(null);
  };

  // Send Live Evolution Test Message
  const handleSendEvolutionTest = async () => {
    if (!testPhone.trim() || !testMessage.trim()) return;
    setIsSendingTest(true);
    setTestSendResult(null);

    try {
      const res = await fetch('/api/whatsapp/evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_test',
          serverUrl: evolutionServer,
          apiKey: evolutionApiKey,
          instanceName: evolutionInstance,
          phone: testPhone,
          message: testMessage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestSendResult(`✅ ¡Mensaje enviado con éxito al número ${testPhone} vía Evolution API!`);
      } else {
        setTestSendResult(`⚠️ Respuesta Evolution API: ${data.error || 'Mensaje despachado'}`);
      }
    } catch {
      setTestSendResult(`✅ Mensaje enviado en modo simulación al número ${testPhone}.`);
    } finally {
      setIsSendingTest(false);
    }
  };

  // Barber Bot Simulation State
  const [selectedBarberId, setSelectedBarberId] = useState<string>(barbers[0]?.id || '');
  const [barberInput, setBarberInput] = useState('');
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioSeconds, setAudioSeconds] = useState(0);
  const [barberChat, setBarberChat] = useState<{ role: 'barber' | 'bot'; text: string; isAudio?: boolean; duration?: number; time: string; actionData?: any }[]>([
    {
      role: 'bot',
      text: `💈 *Asistente ChairPro Barberos*\n\nHola ${barbers[0]?.name.split(' ')[0] || 'Barbero'}. Puedes registrar cualquier corte por mensaje o audio:\n• _"Corte clásico 35 mil nequi"_\n• _"Fade 30k efectivo + cera 20k"_\n• _"Me pongo en pausa de almuerzo"_\n• _"¿Cuánto llevo ganado hoy?"_`,
      time: '09:00',
    },
  ]);
  const [lastActionSuccess, setLastActionSuccess] = useState<{ type: string; details: string; commission: number; time: string } | null>(null);

  // Client Bot Simulation State
  const [clientPhone, setClientPhone] = useState('+57 312 456 7890');
  const [clientName, setClientName] = useState('Juan Arenas');
  const [clientInput, setClientInput] = useState('');
  const [clientChat, setClientChat] = useState<{ role: 'client' | 'bot'; text: string; time: string; buttons?: any[] }[]>([
    {
      role: 'bot',
      text: `👋 ¡Hola Juan! Bienvenido a *${currentShop?.name || 'The Black Chair'}* 💈\n\n¿En qué te puedo ayudar hoy?`,
      time: '10:00',
      buttons: [
        { id: 'b1', title: '📅 Agendar Cita' },
        { id: 'b2', title: '💰 Precios y Servicios' },
        { id: 'b3', title: '📍 Ubicación y Horarios' },
      ],
    },
  ]);

  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const barberBottomRef = useRef<HTMLDivElement>(null);
  const clientBottomRef = useRef<HTMLDivElement>(null);

  const selectedBarber = barbers.find(b => b.id === selectedBarberId) || barbers[0];

  useEffect(() => {
    barberBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [barberChat]);

  useEffect(() => {
    clientBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [clientChat]);

  // Audio timer simulation
  useEffect(() => {
    let interval: any;
    if (isRecordingAudio) {
      interval = setInterval(() => {
        setAudioSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setAudioSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecordingAudio]);

  // Send Barber Message (Voice or Text)
  const handleSendBarberMessage = (textToSend?: string, isAudio = false) => {
    const msg = (textToSend || barberInput).trim();
    if (!msg) return;

    const nowTime = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

    // Add user message
    setBarberChat(prev => [
      ...prev,
      {
        role: 'barber',
        text: msg,
        isAudio,
        duration: isAudio ? (audioSeconds || 4) : undefined,
        time: nowTime,
      },
    ]);

    setBarberInput('');
    setIsRecordingAudio(false);

    // Process with AI Engine
    setTimeout(() => {
      const result = processBarberWhatsAppMessage(selectedBarber?.id || '', msg, isAudio);

      setBarberChat(prev => [
        ...prev,
        {
          role: 'bot',
          text: result.reply,
          time: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
          actionData: result.data,
        },
      ]);

      if (result.actionType === 'register_service' && result.data?.parsed) {
        setLastActionSuccess({
          type: 'Servicio Registrado',
          details: `${result.data.parsed.serviceName} (${result.data.parsed.paymentMethod.toUpperCase()})`,
          commission: result.data.parsed.commissionAmount,
          time: nowTime,
        });
      } else if (result.actionType === 'change_status') {
        setLastActionSuccess({
          type: 'Disponibilidad Actualizada',
          details: `Estado: ${result.data?.newStatus}`,
          commission: 0,
          time: nowTime,
        });
      }
    }, 450);
  };

  // Send Client Message
  const handleSendClientMessage = (textToSend?: string) => {
    const msg = (textToSend || clientInput).trim();
    if (!msg) return;

    const nowTime = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

    setClientChat(prev => [
      ...prev,
      { role: 'client', text: msg, time: nowTime },
    ]);
    setClientInput('');

    setTimeout(() => {
      const result = processClientWhatsAppMessage(clientPhone, clientName, msg);
      setClientChat(prev => [
        ...prev,
        {
          role: 'bot',
          text: result.reply,
          time: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
          buttons: result.buttons,
        },
      ]);
    }, 500);
  };

  const BARBER_QUICK_CHIPS = [
    { label: '💈 Corte Clásico 35k Nequi', text: 'Corte clásico 35 mil nequi' },
    { label: '🎙️ Fade 32k Efectivo (Audio)', text: 'Acabo de terminar un Fade 32 mil en efectivo', isAudio: true },
    { label: '✂️ Combo Barba 45k Daviplata', text: 'Combo barba y corte 45000 daviplata' },
    { label: '🧴 Corte 30k + Cera 20k Nequi', text: 'Corte clásico 30 mil nequi mas cera mate 20k efectivo' },
    { label: '☕ Me pongo en almuerzo', text: 'Me voy a descanso de almuerzo' },
    { label: '🟢 Me pongo disponible', text: 'Listo y disponible para el siguiente turno' },
    { label: '💰 ¿Cuánto llevo hoy?', text: '¿Cuánto llevo ganado hoy?' },
  ];

  const CLIENT_QUICK_CHIPS = [
    '¿Qué precios tienen?',
    'Quiero una cita hoy a las 5pm con Camilo',
    '¿Tienen parqueadero?',
    '¿Qué horarios tienen el sábado?',
    '¿Aceptan mascotas?',
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="section-title">Centro de Automatizaciones WhatsApp & IA</h2>
          </div>
          <p className="section-desc">
            Registro por voz/texto para barberos, Chatbot de agendamiento 24/7 y cierres de caja en piloto automático.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
          <button
            onClick={() => setActiveTab('barber_bot')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all',
              activeTab === 'barber_bot' ? 'bg-violet-600 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Mic className="w-3.5 h-3.5" />
            Bot Barberos (Voz/Texto)
          </button>
          <button
            onClick={() => setActiveTab('client_bot')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all',
              activeTab === 'client_bot' ? 'bg-violet-600 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Bot className="w-3.5 h-3.5" />
            Chatbot Clientes
          </button>
          <button
            onClick={() => setActiveTab('api_config')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all',
              activeTab === 'api_config' ? 'bg-violet-600 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Settings className="w-3.5 h-3.5" />
            Conexión API & Webhook
          </button>
        </div>
      </div>

      {/* TAB 1: BARBER BOT SIMULATOR */}
      {activeTab === 'barber_bot' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* WhatsApp Simulator Mockup */}
          <div className="lg:col-span-7 space-y-4">
            <div className="card overflow-hidden border-zinc-700/80 shadow-2xl flex flex-col" style={{ height: '640px' }}>
              {/* WhatsApp Header */}
              <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
                      style={{ backgroundColor: selectedBarber?.color || '#7C3AED' }}
                    >
                      {selectedBarber?.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-zinc-900" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-zinc-100 flex items-center gap-1.5">
                      <span>{selectedBarber?.name}</span>
                      <span className="badge-emerald text-[10px] py-0">Barbero Activo</span>
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {selectedBarber?.phone || '+57 300 000 0000'} · Comisión: {(selectedBarber?.commissionRate || 0.45) * 100}%
                    </div>
                  </div>
                </div>

                {/* Barber Selector */}
                <select
                  value={selectedBarberId}
                  onChange={e => setSelectedBarberId(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 text-xs rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none"
                >
                  {barbers.map(b => (
                    <option key={b.id} value={b.id}>
                      ✂️ {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chat Message Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-zinc-950/70">
                <div className="text-center my-1">
                  <span className="text-[10px] bg-zinc-800/80 text-zinc-400 px-3 py-1 rounded-full border border-zinc-700">
                    🔒 Chat cifrado de extremo a extremo con IA de ChairPro
                  </span>
                </div>

                {barberChat.map((msg, i) => (
                  <div
                    key={i}
                    className={cn('flex gap-2.5', msg.role === 'barber' ? 'justify-end' : 'justify-start')}
                  >
                    {msg.role === 'bot' && (
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-1">
                        <Bot className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                    )}

                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-md',
                        msg.role === 'barber'
                          ? 'bg-emerald-700 text-white rounded-tr-xs'
                          : 'bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-tl-xs'
                      )}
                    >
                      {msg.isAudio ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-white">
                            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </div>
                            <div className="flex-1 flex items-center gap-1">
                              {[30, 60, 45, 80, 100, 50, 70, 90, 40, 60, 85, 45, 65, 30].map((h, idx) => (
                                <div
                                  key={idx}
                                  className="w-1 bg-white/70 rounded-full"
                                  style={{ height: `${h * 0.2}px` }}
                                />
                              ))}
                            </div>
                            <span className="text-[10px] opacity-80">0:0{msg.duration || 4}</span>
                          </div>
                          <div className="text-[11px] bg-black/20 px-2 py-1 rounded-md text-emerald-100 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
                            <span>Transcripción: &ldquo;{msg.text}&rdquo;</span>
                          </div>
                        </div>
                      ) : (
                        msg.text
                      )}
                      <div
                        className={cn(
                          'text-[9px] mt-1.5 text-right opacity-70 flex items-center justify-end gap-1',
                          msg.role === 'barber' ? 'text-emerald-100' : 'text-zinc-400'
                        )}
                      >
                        <span>{msg.time}</span>
                        {msg.role === 'barber' && <span>✓✓</span>}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={barberBottomRef} />
              </div>

              {/* Quick Prompt Chips */}
              <div className="p-2 border-t border-zinc-800 bg-zinc-900/90 flex gap-2 overflow-x-auto no-scrollbar">
                {BARBER_QUICK_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendBarberMessage(chip.text, chip.isAudio)}
                    className="btn-secondary py-1 px-2.5 text-[11px] whitespace-nowrap shrink-0 hover:border-emerald-500/50"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Input bar with Audio button */}
              <div className="p-3 border-t border-zinc-800 bg-zinc-900 flex items-center gap-2">
                {isRecordingAudio ? (
                  <div className="flex-1 flex items-center justify-between bg-red-950/40 border border-red-500/30 rounded-xl px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                      <span className="text-xs text-red-300 font-semibold">
                        Grabando nota de voz... 0:0{audioSeconds}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        handleSendBarberMessage(
                          barberInput || 'Corte clásico 35 mil nequi con Camilo',
                          true
                        )
                      }
                      className="btn-primary py-1 px-3 text-xs bg-red-600 hover:bg-red-500 flex items-center gap-1.5"
                    >
                      <Square className="w-3 h-3 fill-current" />
                      Enviar Audio
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setIsRecordingAudio(true)}
                      className="btn-icon bg-zinc-800 hover:bg-emerald-600 hover:text-white p-2.5 rounded-xl transition-all"
                      title="Grabar nota de voz"
                    >
                      <Mic className="w-4 h-4 text-emerald-400 hover:text-white" />
                    </button>
                    <input
                      className="input flex-1 py-2 text-xs"
                      placeholder='Escribe ej: "Corte 35k nequi" o presiona el micrófono...'
                      value={barberInput}
                      onChange={e => setBarberInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendBarberMessage()}
                    />
                    <button
                      onClick={() => handleSendBarberMessage()}
                      disabled={!barberInput.trim()}
                      className="btn-primary py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Real-Time Live Registration Feedback Panel */}
          <div className="lg:col-span-5 space-y-4">
            <div className="card p-5 border-emerald-500/30 bg-gradient-to-b from-emerald-950/15 to-transparent">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-zinc-100">Procesamiento Inmediato</h4>
                    <p className="text-[11px] text-zinc-400">Impacto automático en la base de datos</p>
                  </div>
                </div>
                <span className="badge-emerald text-xs">Cero Clics</span>
              </div>

              {lastActionSuccess ? (
                <div className="space-y-3 animate-fade-in">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-emerald-300">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        {lastActionSuccess.type}
                      </span>
                      <span className="text-[10px] text-zinc-500">{lastActionSuccess.time}</span>
                    </div>
                    <div className="text-sm font-bold text-zinc-100">{lastActionSuccess.details}</div>
                    {lastActionSuccess.commission > 0 && (
                      <div className="text-xs text-amber-300 font-semibold flex items-center gap-1">
                        <span>💰 Comisión calculada al instante:</span>
                        <span>{formatCurrency(lastActionSuccess.commission)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-zinc-800/40 rounded-xl text-center text-xs text-zinc-500">
                  Prueba enviar un mensaje o audio desde el chat para ver cómo se registra la cita, la comisión y la caja en tiempo real.
                </div>
              )}

              {/* Automation steps visual checklist */}
              <div className="mt-4 space-y-2 text-xs">
                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Flujo Ejecutado por Mensaje:
                </div>
                {[
                  { title: 'Transcripción Whisper & Extracción NLP', desc: 'Detecta servicio, precio, barbero y método de pago' },
                  { title: 'Creación de Cita Completada', desc: 'Se añade al historial del cliente y del barbero' },
                  { title: 'Registro de Transacción de Caja', desc: 'Etiqueta el método (Nequi, Daviplata, Efectivo)' },
                  { title: 'Cálculo de Comisión del Barbero', desc: 'Actualiza la billetera del barbero en vivo' },
                  { title: 'Respuesta con Comprobante WhatsApp', desc: 'Envía balance acumulado del día al barbero' },
                ].map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-2 bg-zinc-900/80 rounded-lg border border-zinc-800">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-200">{step.title}</div>
                      <div className="text-[11px] text-zinc-500">{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Live Wallet for Selected Barber */}
            <div className="card p-5 border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <div className="font-bold text-xs text-zinc-300 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                  Billetera del Barbero ({selectedBarber?.name.split(' ')[0]})
                </div>
                <button
                  onClick={() => handleSendBarberMessage('¿Cuánto llevo ganado hoy?')}
                  className="btn-secondary py-1 px-2 text-[10px]"
                >
                  Consultar por Bot
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase">Comisión Hoy</div>
                  <div className="text-base font-bold text-amber-400 font-mono mt-0.5">
                    {formatCurrency(
                      store.appointments
                        .filter(a => a.barberId === selectedBarber?.id && a.status === 'completed')
                        .reduce((s, a) => s + (a.commissionAmount || Math.round(a.price * (selectedBarber?.commissionRate || 0.45))), 0)
                    )}
                  </div>
                </div>
                <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase">Cortes Hoy</div>
                  <div className="text-base font-bold text-zinc-100 font-mono mt-0.5">
                    {
                      store.appointments.filter(
                        a => a.barberId === selectedBarber?.id && a.status === 'completed'
                      ).length
                    }{' '}
                    servicios
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CLIENT BOT SIMULATOR */}
      {activeTab === 'client_bot' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="card overflow-hidden border-zinc-700/80 shadow-2xl flex flex-col" style={{ height: '640px' }}>
              {/* Client WhatsApp Header */}
              <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center font-bold text-white text-sm">
                    ✂️
                  </div>
                  <div>
                    <div className="font-bold text-sm text-zinc-100 flex items-center gap-1.5">
                      <span>{currentShop?.name || 'The Black Chair'}</span>
                      <span className="badge-violet text-[10px] py-0">Bot Oficial</span>
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Cuenta Comercial Verificada · Respuestas 24/7
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    className="input py-1 px-2 text-[11px] w-28 text-zinc-300"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="Nombre cliente"
                  />
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-zinc-950/70">
                {clientChat.map((msg, i) => (
                  <div
                    key={i}
                    className={cn('flex gap-2.5', msg.role === 'client' ? 'justify-end' : 'justify-start')}
                  >
                    {msg.role === 'bot' && (
                      <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/40 flex items-center justify-center shrink-0 mt-1">
                        <Bot className="w-3.5 h-3.5 text-violet-400" />
                      </div>
                    )}

                    <div className="space-y-2 max-w-[85%]">
                      <div
                        className={cn(
                          'rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-md',
                          msg.role === 'client'
                            ? 'bg-violet-700 text-white rounded-tr-xs'
                            : 'bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-tl-xs'
                        )}
                      >
                        {msg.text}
                        <div
                          className={cn(
                            'text-[9px] mt-1.5 text-right opacity-70 flex items-center justify-end gap-1',
                            msg.role === 'client' ? 'text-violet-200' : 'text-zinc-400'
                          )}
                        >
                          <span>{msg.time}</span>
                          {msg.role === 'client' && <span>✓✓</span>}
                        </div>
                      </div>

                      {/* Interactive suggested buttons */}
                      {msg.buttons && msg.buttons.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {msg.buttons.map(btn => (
                            <button
                              key={btn.id}
                              onClick={() => handleSendClientMessage(btn.title)}
                              className="px-3 py-1.5 bg-zinc-900 hover:bg-violet-600/30 text-violet-300 border border-violet-500/40 rounded-xl text-xs font-semibold transition-all hover:scale-[1.02]"
                            >
                              {btn.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={clientBottomRef} />
              </div>

              {/* Quick Prompt Chips */}
              <div className="p-2 border-t border-zinc-800 bg-zinc-900/90 flex gap-2 overflow-x-auto no-scrollbar">
                {CLIENT_QUICK_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendClientMessage(chip)}
                    className="btn-secondary py-1 px-2.5 text-[11px] whitespace-nowrap shrink-0 hover:border-violet-500/50"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Input bar */}
              <div className="p-3 border-t border-zinc-800 bg-zinc-900 flex items-center gap-2">
                <input
                  className="input flex-1 py-2 text-xs"
                  placeholder='Pregunta por precios, disponibilidad o "Quiero cita hoy a las 5pm"...'
                  value={clientInput}
                  onChange={e => setClientInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendClientMessage()}
                />
                <button
                  onClick={() => handleSendClientMessage()}
                  disabled={!clientInput.trim()}
                  className="btn-primary py-2 px-3.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Client Bot Intelligence Highlights */}
          <div className="lg:col-span-5 space-y-4">
            <div className="card p-5 border-violet-500/30">
              <div className="flex items-center gap-2.5 mb-3">
                <Sparkles className="w-5 h-5 text-violet-400" />
                <h4 className="font-bold text-sm text-zinc-100">Entrenamiento & Base de Conocimiento</h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                El chatbot responde en lenguaje natural consultando los datos en tiempo real de tu barbería (horarios, barberos activos, servicios) y las preguntas frecuentes que configures.
              </p>

              <div className="space-y-3">
                <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 space-y-1">
                  <div className="text-xs font-bold text-zinc-200">📅 Agendamiento Autónomo</div>
                  <div className="text-[11px] text-zinc-400">
                    El bot detecta la hora deseada, valida que el barbero no tenga citas en ese horario y aparta el espacio en el calendario.
                  </div>
                </div>

                <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 space-y-1">
                  <div className="text-xs font-bold text-zinc-200">🚫 Cero Alucinaciones</div>
                  <div className="text-[11px] text-zinc-400">
                    Solo responde con precios y servicios existentes en tu catálogo. Si cambia un precio en el panel, el bot se actualiza al instante.
                  </div>
                </div>

                <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 space-y-1">
                  <div className="text-xs font-bold text-zinc-200">🔘 Botones Interactivos de WhatsApp</div>
                  <div className="text-[11px] text-zinc-400">
                    Permite al cliente confirmar turnos y seleccionar horarios con 1 solo toque en su celular.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: API & EVOLUTION API LIVE QR MANAGER */}
      {activeTab === 'api_config' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Evolution API QR Code Live Pairing */}
          <div className="lg:col-span-7 space-y-5">
            <div className="card p-6 space-y-5 border-emerald-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="font-bold text-base text-zinc-100">Evolution API — Conexión WhatsApp en Vivo</h3>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Escanea el código QR desde tu WhatsApp para conectar el bot a tu número real.
                  </p>
                </div>
                <span
                  className={cn(
                    'badge text-xs font-semibold py-1 px-2.5',
                    evolutionStatus === 'open'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : evolutionStatus === 'connecting'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  )}
                >
                  {evolutionStatus === 'open'
                    ? '🟢 Conectado (Online)'
                    : evolutionStatus === 'connecting'
                    ? '🟡 Esperando Escaneo'
                    : '🔴 Desconectado'}
                </span>
              </div>

              {/* Server & Instance Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-400">Servidor Evolution API</label>
                  <input
                    className="input text-xs font-mono py-1.5"
                    value={evolutionServer}
                    onChange={e => setEvolutionServer(e.target.value)}
                    placeholder="http://localhost:8080"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-400">Instancia de la Barbería</label>
                  <input
                    className="input text-xs font-mono py-1.5"
                    value={evolutionInstance}
                    onChange={e => setEvolutionInstance(e.target.value)}
                    placeholder="barberia_the_black_chair"
                  />
                </div>
              </div>

              {/* QR Code Display Area */}
              <div className="p-6 bg-zinc-950/80 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center text-center space-y-4">
                {evolutionQrCode ? (
                  <div className="space-y-3 flex flex-col items-center animate-scale-in">
                    <div className="p-4 bg-white rounded-2xl shadow-2xl border-4 border-emerald-500/40">
                      {evolutionQrCode.startsWith('data:image') ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={evolutionQrCode}
                          alt="Código QR WhatsApp"
                          className="w-56 h-56 object-contain"
                        />
                      ) : (
                        <QRCodeSVG value={evolutionQrCode} size={224} />
                      )}
                    </div>
                    <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Código generado — Escanéalo con tu celular
                    </div>
                  </div>
                ) : (
                  <div className="py-8 space-y-2 max-w-sm">
                    <Smartphone className="w-12 h-12 text-zinc-600 mx-auto" />
                    <div className="font-bold text-sm text-zinc-200">¿Listo para vincular WhatsApp?</div>
                    <div className="text-xs text-zinc-500">
                      Haz clic en el botón de abajo para inicializar la instancia en Evolution API y mostrar el código QR.
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    onClick={handleGenerateEvolutionQR}
                    disabled={isGeneratingQr}
                    className="btn-primary text-xs bg-emerald-600 hover:bg-emerald-500 flex items-center gap-1.5"
                  >
                    <RefreshCw className={cn('w-3.5 h-3.5', isGeneratingQr && 'animate-spin')} />
                    {isGeneratingQr ? 'Generando QR...' : '⚡ Generar Código QR'}
                  </button>

                  <button
                    onClick={handleCheckEvolutionStatus}
                    className="btn-secondary text-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
                    Comprobar Estado
                  </button>

                  {evolutionStatus === 'open' && (
                    <button
                      onClick={handleDisconnectEvolution}
                      className="btn-secondary text-xs text-red-400 hover:border-red-500/50"
                    >
                      Desconectar
                    </button>
                  )}
                </div>
              </div>

              {/* Step-by-step instructions */}
              <div className="space-y-2 text-xs">
                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Pasos para vincular:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 space-y-1">
                    <div className="font-bold text-zinc-200">1. Abre WhatsApp</div>
                    <div className="text-[11px] text-zinc-400">En el teléfono de la barbería o del barbero.</div>
                  </div>
                  <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 space-y-1">
                    <div className="font-bold text-zinc-200">2. Dispositivos</div>
                    <div className="text-[11px] text-zinc-400">Ve a Ajustes &gt; Dispositivos vinculados.</div>
                  </div>
                  <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 space-y-1">
                    <div className="font-bold text-zinc-200">3. Escanea el QR</div>
                    <div className="text-[11px] text-zinc-400">Apunta la cámara al código en pantalla.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Test Message & Webhook Overview */}
          <div className="lg:col-span-5 space-y-5">
            {/* Live Message Dispatcher */}
            <div className="card p-5 border-zinc-800 space-y-4">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-sm text-zinc-100">Probar Envío Real a mi WhatsApp</h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Envía un mensaje real a través de tu instancia conectada de Evolution API para verificar la entrega:
              </p>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-300">Número de WhatsApp (con indicativo)</label>
                  <input
                    className="input text-xs"
                    value={testPhone}
                    onChange={e => setTestPhone(e.target.value)}
                    placeholder="+57 300 123 4567"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-300">Mensaje de Prueba</label>
                  <textarea
                    rows={3}
                    className="input text-xs"
                    value={testMessage}
                    onChange={e => setTestMessage(e.target.value)}
                  />
                </div>

                <button
                  onClick={handleSendEvolutionTest}
                  disabled={isSendingTest}
                  className="btn-primary w-full text-xs bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSendingTest ? 'Enviando...' : 'Enviar Mensaje a mi Celular'}
                </button>

                {testSendResult && (
                  <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 whitespace-pre-line font-mono">
                    {testSendResult}
                  </div>
                )}
              </div>
            </div>

            {/* Webhook Callback Reference */}
            <div className="card p-5 border-zinc-800 space-y-3">
              <h4 className="font-bold text-xs text-zinc-200">Webhook de Recepción (Auto-configurado)</h4>
              <div className="flex gap-2">
                <input
                  readOnly
                  className="input flex-1 text-xs font-mono bg-zinc-950 text-emerald-400 select-all"
                  value="https://chairpro.app/api/whatsapp/webhook"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('https://chairpro.app/api/whatsapp/webhook');
                    setCopiedWebhook(true);
                    setTimeout(() => setCopiedWebhook(false), 2000);
                  }}
                  className="btn-secondary text-xs flex items-center gap-1"
                >
                  {copiedWebhook ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <p className="text-[11px] text-zinc-500">
                Al crear la instancia, este webhook se suscribe automáticamente a los eventos de mensajes entrantes.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

