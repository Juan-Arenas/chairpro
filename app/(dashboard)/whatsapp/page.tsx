'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import {
  MessageCircle, Send, CheckCircle2, Sparkles,
  Phone, Zap, RefreshCw, Copy, Check, Scissors, DollarSign,
  ShieldCheck, Settings, ExternalLink, ArrowRight, Smartphone,
  Terminal, Database, Radio, AlertTriangle, Key, Cpu, HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WhatsAppHubPage() {
  const store = useStore();
  const { currentShop, barbers } = store;

  const [activeTab, setActiveTab] = useState<'config' | 'live_test' | 'guide'>('config');

  // Credentials State
  const [phoneNumberId, setPhoneNumberId] = useState(process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER_ID || '');
  const [accessToken, setAccessToken] = useState('');
  const [verifyToken, setVerifyToken] = useState('chairpro_barber_saas_secure_token');
  const [openaiKey, setOpenaiKey] = useState('');
  
  // Test Message State
  const [testPhone, setTestPhone] = useState('+57 ');
  const [testMessage, setTestMessage] = useState('💈 ¡Hola! Este es un mensaje de prueba oficial de ChairPro conectado a Meta WhatsApp Cloud API.');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  // Webhook Test Payload State
  const [webhookSampleBarber, setWebhookSampleBarber] = useState(barbers[0]?.id || '');
  const [webhookSampleText, setWebhookSampleText] = useState('Corte clásico 35 mil nequi');
  const [isSimulatingWebhook, setIsSimulatingWebhook] = useState(false);
  const [webhookLogResult, setWebhookLogResult] = useState<any | null>(null);

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const webhookUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/whatsapp/webhook`
    : 'https://tu-dominio.vercel.app/api/whatsapp/webhook';

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Send Live WhatsApp Test via Meta Graph API
  const handleSendMetaTest = async () => {
    if (!testPhone.trim()) {
      setTestResult({ success: false, message: 'Por favor ingresa un número de teléfono con indicativo (ej: +57 300 123 4567).' });
      return;
    }

    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/whatsapp/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: testPhone,
          message: testMessage,
          phoneNumberId: phoneNumberId || undefined,
          accessToken: accessToken || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: `✅ ¡Mensaje entregado exitosamente por WhatsApp a ${testPhone}! ID de Meta: ${data.messageId || 'OK'}`,
          details: data,
        });
      } else {
        setTestResult({
          success: false,
          message: `⚠️ Meta API Error: ${data.error || 'No se pudo enviar el mensaje.'}`,
          details: data,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `❌ Error de red al conectar con Meta: ${err.message}`,
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Dispatch Webhook Test Payload
  const handleSimulateInboundWebhook = async () => {
    setIsSimulatingWebhook(true);
    setWebhookLogResult(null);

    const matchedBarber = barbers.find(b => b.id === webhookSampleBarber) || barbers[0];
    const barberPhone = (matchedBarber?.phone || '573001234567').replace(/\D/g, '');

    // Meta Standard Webhook Inbound Format
    const mockMetaPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '15550234567',
                  phone_number_id: phoneNumberId || '104829384920192',
                },
                contacts: [{ profile: { name: matchedBarber?.name || 'Barbero' }, wa_id: barberPhone }],
                messages: [
                  {
                    from: barberPhone,
                    id: `wamid.HBgL${Date.now()}`,
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    text: { body: webhookSampleText },
                    type: 'text',
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    };

    try {
      const res = await fetch('/api/whatsapp/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockMetaPayload),
      });

      const data = await res.json();
      setWebhookLogResult({
        status: res.status,
        timestamp: new Date().toLocaleTimeString('es-CO'),
        barberName: matchedBarber?.name,
        input: webhookSampleText,
        response: data,
      });
    } catch (err: any) {
      setWebhookLogResult({
        status: 500,
        timestamp: new Date().toLocaleTimeString('es-CO'),
        error: err.message,
      });
    } finally {
      setIsSimulatingWebhook(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="section-title flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-emerald-400" />
              Conexión Meta WhatsApp Cloud API (Oficial)
            </h2>
          </div>
          <p className="section-desc">
            Integración de WhatsApp para barberías en producción. Sin emuladores, 100% en la nube de Meta y conectado a Supabase.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
          <button
            onClick={() => setActiveTab('config')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all',
              activeTab === 'config' ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Settings className="w-3.5 h-3.5" />
            Webhook & Credenciales
          </button>
          <button
            onClick={() => setActiveTab('live_test')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all',
              activeTab === 'live_test' ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Radio className="w-3.5 h-3.5" />
            Prueba de Envío & Diagnóstico
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all',
              activeTab === 'guide' ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Guía de Conexión (3 Pasos)
          </button>
        </div>
      </div>

      {/* TAB 1: WEBHOOK & CONFIGURATION */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Webhook Endpoint Info */}
          <div className="lg:col-span-6 space-y-5">
            <div className="card p-6 border-emerald-500/30 space-y-5 bg-gradient-to-b from-emerald-950/20 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-zinc-100">Punto de Enlace del Webhook</h3>
                    <p className="text-xs text-zinc-400">Pega estos datos en el panel de Meta Developers</p>
                  </div>
                </div>
                <span className="badge-emerald text-xs">🟢 Listo para recibir</span>
              </div>

              {/* Webhook URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                  <span>URL del Webhook (Callback URL)</span>
                  <span className="text-[10px] text-zinc-500 font-normal">Método GET y POST</span>
                </label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={webhookUrl}
                    className="input flex-1 text-xs font-mono bg-zinc-950 text-emerald-400 select-all"
                  />
                  <button
                    onClick={() => handleCopy(webhookUrl, 'webhook_url')}
                    className="btn-secondary text-xs flex items-center gap-1 shrink-0"
                  >
                    {copiedField === 'webhook_url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'webhook_url' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {/* Verify Token */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                  <span>Token de Verificación (Verify Token)</span>
                  <span className="text-[10px] text-zinc-500 font-normal">Para el apretón de manos inicial de Meta</span>
                </label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={verifyToken}
                    className="input flex-1 text-xs font-mono bg-zinc-950 text-zinc-200 select-all"
                  />
                  <button
                    onClick={() => handleCopy(verifyToken, 'verify_token')}
                    className="btn-secondary text-xs flex items-center gap-1 shrink-0"
                  >
                    {copiedField === 'verify_token' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'verify_token' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {/* Fields to subscribe */}
              <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 space-y-1">
                <div className="text-xs font-bold text-zinc-300">Campos a suscribir en Meta:</div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-[11px] font-mono text-emerald-300">
                    messages
                  </span>
                  <span className="px-2.5 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-[11px] font-mono text-zinc-400">
                    message_deliveries
                  </span>
                </div>
              </div>
            </div>

            {/* Whisper Audio AI Status */}
            <div className="card p-5 border-zinc-800 space-y-3">
              <div className="flex items-center gap-2.5">
                <Cpu className="w-5 h-5 text-violet-400" />
                <h4 className="font-bold text-sm text-zinc-100">Motor de Transcripción de Voz (Whisper)</h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Cuando los barberos envían una nota de voz por WhatsApp (ej: <i>&ldquo;Corte 35 mil nequi con Camilo&rdquo;</i>), el webhook descarga el audio OGG de Meta y lo transcribe automáticamente usando OpenAI Whisper o Groq Whisper.
              </p>
              <div className="flex items-center gap-2 p-2.5 bg-violet-500/10 border border-violet-500/20 rounded-xl text-xs text-violet-300">
                <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
                <span>Variable requerida: <code className="font-mono font-bold">OPENAI_API_KEY</code> o <code className="font-mono font-bold">GROQ_API_KEY</code></span>
              </div>
            </div>
          </div>

          {/* Meta Cloud API Token & Phone ID Form */}
          <div className="lg:col-span-6 space-y-5">
            <div className="card p-6 border-zinc-800 space-y-5">
              <div className="flex items-center gap-2.5">
                <Key className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-base text-zinc-100">Credenciales Meta Cloud API</h3>
                  <p className="text-xs text-zinc-400">Obtenidas en developers.facebook.com</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">
                    Identificador de Número de Teléfono (Phone Number ID)
                  </label>
                  <input
                    className="input text-xs font-mono"
                    placeholder="Ej: 104829104829102"
                    value={phoneNumberId}
                    onChange={e => setPhoneNumberId(e.target.value)}
                  />
                  <p className="text-[11px] text-zinc-500">
                    Variable en .env: <code className="text-zinc-400 font-mono">WHATSAPP_PHONE_NUMBER_ID</code>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">
                    Token de Acceso Permanente (System User Token)
                  </label>
                  <input
                    type="password"
                    className="input text-xs font-mono"
                    placeholder="EAAGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={accessToken}
                    onChange={e => setAccessToken(e.target.value)}
                  />
                  <p className="text-[11px] text-zinc-500">
                    Variable en .env: <code className="text-zinc-400 font-mono">WHATSAPP_ACCESS_TOKEN</code>
                  </p>
                </div>

                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800/80 space-y-2 text-xs">
                  <div className="font-bold text-zinc-200 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-emerald-400" />
                    Base de Datos Supabase Conectada
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Cada mensaje o audio recibido actualiza en milisegundos las tablas <code className="text-emerald-400">appointments</code>, <code className="text-emerald-400">transactions</code> y <code className="text-emerald-400">barbers</code> en Supabase.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE TEST & DIAGNOSTICS */}
      {activeTab === 'live_test' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Outbound Test to Real Phone */}
          <div className="lg:col-span-6 space-y-5">
            <div className="card p-6 border-emerald-500/30 space-y-4">
              <div className="flex items-center gap-2.5">
                <Send className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-base text-zinc-100">Enviar WhatsApp Real a mi Celular</h3>
                  <p className="text-xs text-zinc-400">Verifica la entrega a través de Meta Cloud API</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Número de WhatsApp (con indicativo)</label>
                  <input
                    className="input text-xs font-mono"
                    placeholder="+57 300 123 4567"
                    value={testPhone}
                    onChange={e => setTestPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Texto del Mensaje</label>
                  <textarea
                    rows={3}
                    className="input text-xs"
                    value={testMessage}
                    onChange={e => setTestMessage(e.target.value)}
                  />
                </div>

                <button
                  onClick={handleSendMetaTest}
                  disabled={isSendingTest}
                  className="btn-primary w-full text-xs bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center gap-2 py-2.5 font-bold"
                >
                  <Send className={cn('w-4 h-4', isSendingTest && 'animate-spin')} />
                  {isSendingTest ? 'Enviando vía Meta Graph API...' : '🚀 Enviar Mensaje Real a mi WhatsApp'}
                </button>

                {testResult && (
                  <div
                    className={cn(
                      'p-4 rounded-xl text-xs space-y-2 border',
                      testResult.success
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                        : 'bg-red-950/40 border-red-500/40 text-red-200'
                    )}
                  >
                    <div className="font-bold">{testResult.message}</div>
                    {testResult.details && (
                      <pre className="text-[10px] bg-black/40 p-2 rounded overflow-x-auto font-mono text-zinc-300 max-h-36">
                        {JSON.stringify(testResult.details, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Inbound Webhook Payload Simulator */}
          <div className="lg:col-span-6 space-y-5">
            <div className="card p-6 border-zinc-800 space-y-4">
              <div className="flex items-center gap-2.5">
                <Terminal className="w-5 h-5 text-violet-400" />
                <div>
                  <h3 className="font-bold text-base text-zinc-100">Simulador de Payload Entrante (Meta Webhook)</h3>
                  <p className="text-xs text-zinc-400">Verifica cómo el webhook procesa y registra en Supabase</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Barbero Emisor</label>
                  <select
                    className="input text-xs"
                    value={webhookSampleBarber}
                    onChange={e => setWebhookSampleBarber(e.target.value)}
                  >
                    {barbers.map(b => (
                      <option key={b.id} value={b.id}>
                        ✂️ {b.name} ({b.phone || 'Sin cel'}) — {(b.commissionRate || 0.45) * 100}% comisión
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Mensaje de WhatsApp Recibido</label>
                  <input
                    className="input text-xs"
                    value={webhookSampleText}
                    onChange={e => setWebhookSampleText(e.target.value)}
                    placeholder="ej: Corte clásico 35 mil nequi"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Corte clásico 35 mil nequi',
                    'Fade 30k efectivo + cera 20k',
                    'Combo barba 45 mil daviplata',
                    'Me voy a almuerzo',
                    '¿Cuánto llevo ganado hoy?',
                  ].map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => setWebhookSampleText(sample)}
                      className="text-[10px] px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700"
                    >
                      {sample}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleSimulateInboundWebhook}
                  disabled={isSimulatingWebhook}
                  className="btn-secondary w-full text-xs flex items-center justify-center gap-2 py-2 font-bold hover:border-violet-500"
                >
                  <Zap className={cn('w-4 h-4 text-violet-400', isSimulatingWebhook && 'animate-spin')} />
                  {isSimulatingWebhook ? 'Disparando Webhook...' : '⚡ Disparar Webhook POST a /api/whatsapp/webhook'}
                </button>

                {webhookLogResult && (
                  <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                      <span>HTTP Status: <strong className="text-emerald-400">{webhookLogResult.status}</strong></span>
                      <span>{webhookLogResult.timestamp}</span>
                    </div>
                    <pre className="text-[10px] bg-black/50 p-2 rounded overflow-x-auto font-mono text-emerald-300 max-h-40">
                      {JSON.stringify(webhookLogResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STEP-BY-STEP META GUIDE */}
      {activeTab === 'guide' && (
        <div className="card p-6 border-zinc-800 space-y-6">
          <div>
            <h3 className="font-bold text-lg text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Cómo Conectar Meta WhatsApp Cloud API Oficial en 3 Pasos
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Meta ofrece <strong>1,000 conversaciones gratis al mes</strong> por cada número. No necesitas servidores intermedios, Docker ni pagos mensuales a plataformas de terceros.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-sm flex items-center justify-center">
                1
              </div>
              <h4 className="font-bold text-sm text-zinc-100">Crear App en Meta</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Entra a <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline inline-flex items-center gap-0.5">developers.facebook.com <ExternalLink className="w-3 h-3" /></a>, crea una aplicación de tipo <strong>&ldquo;Negocio&rdquo;</strong> y añade el producto <strong>WhatsApp</strong>.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-sm flex items-center justify-center">
                2
              </div>
              <h4 className="font-bold text-sm text-zinc-100">Configurar el Webhook</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                En WhatsApp &gt; Configuración, pega la <strong>URL del Webhook</strong> y el <strong>Token de Verificación</strong> provistos en la pestaña &ldquo;Webhook & Credenciales&rdquo;. Luego suscribe el campo <code className="text-emerald-400 font-mono">messages</code>.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-sm flex items-center justify-center">
                3
              </div>
              <h4 className="font-bold text-sm text-zinc-100">Guardar Variables en .env</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Copia tu <code className="text-zinc-300 font-mono">WHATSAPP_PHONE_NUMBER_ID</code> y tu <code className="text-zinc-300 font-mono">WHATSAPP_ACCESS_TOKEN</code> permanente en tu archivo <code className="text-zinc-300 font-mono">.env</code> de Vercel o local. ¡Y listo!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
