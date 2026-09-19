'use client';

import { useState, useRef } from 'react';
import { useStore } from '@/lib/store';
import {
  QrCode, Download, ExternalLink, Smartphone, Printer,
  Sparkles, MessageCircle, Star, Wifi, DollarSign, Check,
  Copy, Scissors, RefreshCw, Share2, Info
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';

// Dynamic import for SSR compatibility with high-quality rendering
const QRCodeCanvas = dynamic(() => import('qrcode.react').then(m => m.QRCodeCanvas), { ssr: false });
const QRCodeSVG = dynamic(() => import('qrcode.react').then(m => m.QRCodeSVG), { ssr: false });

type QRCategory = 'booking' | 'whatsapp' | 'google_reviews' | 'wifi' | 'payment';

export default function QRStudioPage() {
  const { currentShop, barbers, services } = useStore();

  const [category, setCategory] = useState<QRCategory>('booking');
  
  // Booking Sub-options
  const [bookingType, setBookingType] = useState<'general' | 'barber' | 'service'>('general');
  const [selectedBarberId, setSelectedBarberId] = useState(barbers[0]?.id || '');
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id || '');

  // WhatsApp Sub-options
  const [waPhone, setWaPhone] = useState(currentShop?.phone || '+57 300 123 4567');
  const [waMessage, setWaMessage] = useState(`¡Hola ${currentShop?.name || 'The Black Chair'}! 💈 Quiero agendar un turno.`);

  // Google Reviews Sub-options
  const [googleBusinessName, setGoogleBusinessName] = useState(currentShop?.name || 'The Black Chair Barbería');

  // WiFi Sub-options
  const [wifiSsid, setWifiSsid] = useState(`${currentShop?.name || 'Barberia'}_Clientes_5G`);
  const [wifiPass, setWifiPass] = useState('Barberia2026*');
  const [wifiType, setWifiType] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');

  // Payment Sub-options
  const [paymentPhone, setPaymentPhone] = useState(currentShop?.phone || '3001234567');
  const [paymentProvider, setPaymentProvider] = useState<'nequi' | 'daviplata' | 'bancolombia'>('nequi');

  const effectiveBarberId = selectedBarberId || barbers[0]?.id || 'barber_carlos';
  const effectiveServiceId = selectedServiceId || services[0]?.id || 'svc_1';

  // Auto-sync selection when store loads
  useEffect(() => {
    if (barbers.length > 0 && !selectedBarberId) {
      setSelectedBarberId(barbers[0].id);
    }
  }, [barbers, selectedBarberId]);

  useEffect(() => {
    if (services.length > 0 && !selectedServiceId) {
      setSelectedServiceId(services[0].id);
    }
  }, [services, selectedServiceId]);

  const shopSlug = currentShop?.slug || 'the-black-chair';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://chairpro.app';
  const baseBookingUrl = `${origin}/booking/${shopSlug}`;

  // Calculate Real Scannable QR Payload
  const getQRValue = (): string => {
    switch (category) {
      case 'booking': {
        let url = baseBookingUrl;
        if (bookingType === 'barber') url += `?barber=${effectiveBarberId}`;
        if (bookingType === 'service') url += `?service=${effectiveServiceId}`;
        return url;
      }
      case 'whatsapp': {
        const cleanPhone = waPhone.replace(/\D/g, '');
        const encodedMsg = encodeURIComponent(waMessage);
        return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
      }
      case 'google_reviews': {
        return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(googleBusinessName)}` || `https://maps.google.com/?q=${encodeURIComponent(googleBusinessName)}`;
      }
      case 'wifi': {
        return `WIFI:S:${wifiSsid};T:${wifiType};P:${wifiPass};;`;
      }
      case 'payment': {
        const clean = paymentPhone.replace(/\D/g, '');
        if (paymentProvider === 'nequi') return `https://recarga.nequi.com.co/?phone=${clean}`;
        if (paymentProvider === 'daviplata') return `https://www.daviplata.com/pagos?phone=${clean}`;
        return `https://bancolombia.com/pagos?cel=${clean}`;
      }
      default:
        return baseBookingUrl;
    }
  };

  const getQRTitle = (): string => {
    switch (category) {
      case 'booking':
        if (bookingType === 'barber') return `Reserva con ${barbers.find(b => b.id === effectiveBarberId)?.name || 'Carlos Mendoza'}`;
        if (bookingType === 'service') return `Reserva ${services.find(s => s.id === effectiveServiceId)?.name || 'Servicio'}`;
        return 'Reserva Online de Turnos';
      case 'whatsapp':
        return 'WhatsApp Directo Barbería';
      case 'google_reviews':
        return 'Calificación 5 Estrellas Google Maps';
      case 'wifi':
        return `Wi-Fi Gratis — ${wifiSsid}`;
      case 'payment':
        return `Pago Rápido ${paymentProvider.toUpperCase()}`;
    }
  };

  const getQRSubtitle = (): string => {
    switch (category) {
      case 'booking':
        return 'Abre el portal web interactivo para agendar cita en 3 pasos sin registros.';
      case 'whatsapp':
        return 'Abre WhatsApp en el celular del cliente con mensaje listo para enviar.';
      case 'google_reviews':
        return 'Abre la ventana de reseñas de Google para acumular calificaciones en el espejo.';
      case 'wifi':
        return 'Conecta automáticamente cualquier iPhone o Android a tu red sin pedir clave.';
      case 'payment':
        return 'Abre la pasarela de pago o transferencia rápida para propinas o cobros.';
    }
  };

  // Download High-Res PNG
  const handleDownloadPNG = () => {
    const canvas = document.getElementById('main-qr-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `chairpro-qr-${category}-${Date.now()}.png`;
    a.click();
  };

  // Print Poster
  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getQRValue());
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const primaryColor = currentShop?.theme?.primaryColor || '#7C3AED';

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="section-title flex items-center gap-2">
              <QrCode className="w-6 h-6 text-violet-400" />
              Estudio de Códigos QR Oficiales
            </h2>
          </div>
          <p className="section-desc">
            Códigos QR 100% reales y funcionales con estándar ISO/IEC 18004. Escaneables con cualquier cámara de celular.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-400" />
            <span>Imprimir Póster para Espejo</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: QR Category Picker & Inputs */}
        <div className="lg:col-span-6 space-y-4 print:hidden">
          {/* Category Selector Cards */}
          <div className="card p-4 space-y-3 border-zinc-800">
            <h3 className="font-bold text-xs text-zinc-300 uppercase tracking-wider">
              1. Selecciona el Tipo de QR Real:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { id: 'booking', label: '📅 Reservas Web', desc: 'Portal de citas 24/7', icon: Scissors },
                { id: 'whatsapp', label: '💬 WhatsApp Directo', desc: 'Abre chat con 1 toque', icon: MessageCircle },
                { id: 'google_reviews', label: '⭐ Reseñas Google Maps', desc: 'Booster 5 estrellas', icon: Star },
                { id: 'wifi', label: '📶 Clave Wi-Fi Rápida', desc: 'Conexión automática', icon: Wifi },
                { id: 'payment', label: '💸 Pagos / Propinas', desc: 'Nequi / Daviplata', icon: DollarSign },
              ].map(cat => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id as QRCategory)}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-xl border text-left transition-all',
                      isSelected
                        ? 'border-violet-500 bg-violet-500/10 shadow-md'
                        : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                    )}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                        isSelected ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className={cn('text-xs font-bold', isSelected ? 'text-violet-200' : 'text-zinc-200')}>
                        {cat.label}
                      </div>
                      <div className="text-[11px] text-zinc-500">{cat.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Configuration Panel based on Category */}
          <div className="card p-5 border-zinc-800 space-y-4">
            <h3 className="font-bold text-xs text-zinc-300 uppercase tracking-wider">
              2. Configurar Parámetros del QR:
            </h3>

            {/* Category 1: BOOKING */}
            {category === 'booking' && (
              <div className="space-y-3">
                <div className="flex gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
                  <button
                    onClick={() => setBookingType('general')}
                    className={cn(
                      'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all',
                      bookingType === 'general' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                    )}
                  >
                    General
                  </button>
                  <button
                    onClick={() => setBookingType('barber')}
                    className={cn(
                      'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all',
                      bookingType === 'barber' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                    )}
                  >
                    Por Barbero
                  </button>
                  <button
                    onClick={() => setBookingType('service')}
                    className={cn(
                      'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all',
                      bookingType === 'service' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                    )}
                  >
                    Por Servicio
                  </button>
                </div>

                {bookingType === 'barber' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Selecciona el Barbero del Espejo:</label>
                    <select
                      className="input text-xs"
                      value={selectedBarberId}
                      onChange={e => setSelectedBarberId(e.target.value)}
                    >
                      {barbers.map(b => (
                        <option key={b.id} value={b.id}>
                          ✂️ {b.name} (Espejo #{b.id})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {bookingType === 'service' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Selecciona el Servicio Promocionado:</label>
                    <select
                      className="input text-xs"
                      value={selectedServiceId}
                      onChange={e => setSelectedServiceId(e.target.value)}
                    >
                      {services.map(s => (
                        <option key={s.id} value={s.id}>
                          💈 {s.name} — ${s.price.toLocaleString('es-CO')} COP
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Category 2: WHATSAPP */}
            {category === 'whatsapp' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Número de WhatsApp (con indicativo)</label>
                  <input
                    className="input text-xs font-mono"
                    value={waPhone}
                    onChange={e => setWaPhone(e.target.value)}
                    placeholder="+57 300 123 4567"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Mensaje Pre-escrito al escanear</label>
                  <textarea
                    rows={3}
                    className="input text-xs"
                    value={waMessage}
                    onChange={e => setWaMessage(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Category 3: GOOGLE REVIEWS */}
            {category === 'google_reviews' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Nombre de la Barbería en Google Maps</label>
                  <input
                    className="input text-xs"
                    value={googleBusinessName}
                    onChange={e => setGoogleBusinessName(e.target.value)}
                    placeholder="Ej: The Black Chair Barbería Bogotá"
                  />
                  <p className="text-[11px] text-zinc-500">
                    Al escanear el QR en el espejo, el cliente abre directamente la pantalla de calificación 5 estrellas.
                  </p>
                </div>
              </div>
            )}

            {/* Category 4: WIFI */}
            {category === 'wifi' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Nombre de la Red Wi-Fi (SSID)</label>
                  <input
                    className="input text-xs font-mono"
                    value={wifiSsid}
                    onChange={e => setWifiSsid(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Contraseña del Wi-Fi</label>
                  <input
                    className="input text-xs font-mono"
                    value={wifiPass}
                    onChange={e => setWifiPass(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Category 5: PAYMENT */}
            {category === 'payment' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  {(['nequi', 'daviplata', 'bancolombia'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPaymentProvider(p)}
                      className={cn(
                        'flex-1 py-1.5 text-xs font-bold rounded-lg border capitalize transition-all',
                        paymentProvider === p
                          ? 'border-violet-500 bg-violet-600 text-white'
                          : 'border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Número de Cuenta / Teléfono</label>
                  <input
                    className="input text-xs font-mono"
                    value={paymentPhone}
                    onChange={e => setPaymentPhone(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Real Scannable Payload Preview Link */}
          <div className="card p-4 bg-zinc-950/80 border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-400" />
                Enlace / Carga Útil Codificada en el QR:
              </span>
              <button
                onClick={handleCopy}
                className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1"
              >
                {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedUrl ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
            <div className="p-2.5 bg-zinc-900 rounded-lg font-mono text-[11px] text-emerald-400 break-all select-all border border-zinc-800">
              {getQRValue()}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive QR Display & Mirror Poster Preview */}
        <div className="lg:col-span-6 space-y-4">
          <div
            id="printable-poster"
            className="card p-8 flex flex-col items-center justify-center text-center relative border-zinc-700 shadow-2xl bg-zinc-900 overflow-hidden"
          >
            {/* Top Badge */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg"
                style={{ backgroundColor: primaryColor }}
              >
                {currentShop?.name || 'The Black Chair'} 💈
              </span>
            </div>

            <h3 className="font-display font-extrabold text-lg text-zinc-100 mb-1">
              {getQRTitle()}
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mb-6">
              {getQRSubtitle()}
            </p>

            {/* High-Resolution QR Canvas Container */}
            <div className="p-5 bg-white rounded-3xl shadow-2xl border-4 border-zinc-800 relative group animate-scale-in">
              <QRCodeCanvas
                id="main-qr-canvas"
                value={getQRValue()}
                size={230}
                bgColor="#FFFFFF"
                fgColor="#09090B"
                level="H"
                includeMargin={false}
              />
            </div>

            {/* Scan instructions footer */}
            <div className="mt-6 space-y-1">
              <div className="text-xs font-bold text-zinc-200 flex items-center justify-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                Apunta con la cámara de tu celular para escanear
              </div>
              <div className="text-[11px] text-zinc-500">
                Compatible con iPhone, Android, WhatsApp y Google Lens
              </div>
            </div>

            {/* Bottom Actions (Hidden when printing) */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-sm print:hidden">
              <button
                onClick={handleDownloadPNG}
                className="btn-primary flex-1 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Descargar PNG de Alta Calidad
              </button>

              {category === 'booking' && (
                <a
                  href={getQRValue()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary py-2.5 px-4 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir Enlace
                </a>
              )}
            </div>
          </div>

          {/* Mirror Placement Tips */}
          <div className="card p-5 border-zinc-800 space-y-3 print:hidden">
            <h4 className="font-bold text-xs text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Dónde Colocar Estos Códigos QR en la Barbería:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 space-y-1">
                <div className="font-semibold text-zinc-200">🪞 En el Espejo de Cada Barbero</div>
                <div className="text-[11px] text-zinc-500">
                  QR de Reseñas 5⭐ en Google y QR de reservas para su próximo corte antes de levantarse.
                </div>
              </div>
              <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 space-y-1">
                <div className="font-semibold text-zinc-200">📋 En Recepción / Mostrador</div>
                <div className="text-[11px] text-zinc-500">
                  QR de Wi-Fi gratis para clientes en sala de espera y QR de reservas para transeúntes.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
