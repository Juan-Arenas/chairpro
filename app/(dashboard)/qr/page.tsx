'use client';
import { useState, useRef } from 'react';
import { useStore } from '@/lib/store';
import { QrCode, Download, ExternalLink, Smartphone } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamic import for SSR compatibility
const QRCodeCanvas = dynamic(() => import('qrcode.react').then(m => m.QRCodeCanvas), { ssr: false });

export default function QRPage() {
  const { currentShop, barbers, services } = useStore();
  const [qrType, setQrType] = useState<'general' | 'barber' | 'service'>('general');
  const [selectedBarberId, setSelectedBarberId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const qrRef = useRef<HTMLCanvasElement>(null);

  const shopSlug = currentShop?.slug || 'the-black-chair';
  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}/booking/${shopSlug}` : `https://chairpro.app/booking/${shopSlug}`;

  const getQRValue = () => {
    let url = baseUrl;
    if (qrType === 'barber' && selectedBarberId) url += `?barber=${selectedBarberId}`;
    if (qrType === 'service' && selectedServiceId) url += `?service=${selectedServiceId}`;
    return url;
  };

  const getQRTitle = () => {
    if (qrType === 'barber' && selectedBarberId) return `QR — ${barbers.find(b => b.id === selectedBarberId)?.name || 'Barbero'}`;
    if (qrType === 'service' && selectedServiceId) return `QR — ${services.find(s => s.id === selectedServiceId)?.name || 'Servicio'}`;
    return 'QR General de Reservas';
  };

  const handleDownload = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `chairpro-qr-${qrType}.png`;
    a.click();
  };

  const QR_TYPES = [
    { value: 'general', label: 'QR General', desc: 'Reservas para cualquier barbero y servicio' },
    { value: 'barber', label: 'QR por Barbero', desc: 'Dirige directamente a un barbero específico' },
    { value: 'service', label: 'QR por Servicio', desc: 'Precarga un servicio específico' },
  ];

  const USE_CASES = [
    { icon: '🪞', label: 'Espejo de la barbería' },
    { icon: '📋', label: 'Mostrador / recepción' },
    { icon: '📸', label: 'Historias de Instagram' },
    { icon: '🎥', label: 'TikTok y redes sociales' },
    { icon: '🗺️', label: 'Perfil de Google' },
    { icon: '📄', label: 'Tarjetas de presentación' },
    { icon: '📰', label: 'Volantes y publicidad' },
    { icon: '📱', label: 'WhatsApp Business' },
  ];

  return (
    <div className="space-y-5 pb-20 lg:pb-4">
      <div>
        <h2 className="section-title">Generador de Códigos QR</h2>
        <p className="section-desc">Tus clientes reservan escaneando — sin llamadas, sin mensajes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Config */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold text-zinc-100 mb-4">Tipo de QR</h3>
            <div className="space-y-2">
              {QR_TYPES.map(t => (
                <button key={t.value} onClick={() => setQrType(t.value as any)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl border transition-all text-left ${qrType === t.value ? 'border-violet-500 bg-violet-600/10' : 'border-zinc-800 hover:border-zinc-700'}`}>
                  <div className={`w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 ${qrType === t.value ? 'border-violet-500 bg-violet-500' : 'border-zinc-600'}`} />
                  <div>
                    <div className={`text-sm font-semibold ${qrType === t.value ? 'text-violet-300' : 'text-zinc-300'}`}>{t.label}</div>
                    <div className="text-xs text-zinc-600">{t.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {qrType === 'barber' && (
            <div className="card p-5">
              <h3 className="font-semibold text-zinc-100 mb-3">Seleccionar barbero</h3>
              <div className="space-y-2">
                {barbers.filter(b => b.isActive).map(b => (
                  <button key={b.id} onClick={() => setSelectedBarberId(b.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${selectedBarberId === b.id ? 'border-violet-500 bg-violet-600/10' : 'border-zinc-800 hover:border-zinc-700'}`}>
                    <div className="avatar w-8 h-8 text-xs" style={{ background: `linear-gradient(135deg, ${b.color}99, ${b.color})` }}>{b.name.slice(0, 2)}</div>
                    <span className={`text-sm font-medium ${selectedBarberId === b.id ? 'text-violet-300' : 'text-zinc-300'}`}>{b.name}</span>
                    {selectedBarberId === b.id && <div className="ml-auto w-4 h-4 bg-violet-500 rounded-full" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {qrType === 'service' && (
            <div className="card p-5">
              <h3 className="font-semibold text-zinc-100 mb-3">Seleccionar servicio</h3>
              <div className="space-y-2">
                {services.filter(s => s.isActive).map(s => (
                  <button key={s.id} onClick={() => setSelectedServiceId(s.id)}
                    className={`w-full flex items-center justify-between gap-3 p-3 rounded-lg border transition-all ${selectedServiceId === s.id ? 'border-violet-500 bg-violet-600/10' : 'border-zinc-800 hover:border-zinc-700'}`}>
                    <span className={`text-sm font-medium ${selectedServiceId === s.id ? 'text-violet-300' : 'text-zinc-300'}`}>{s.name}</span>
                    <span className="text-xs text-zinc-500">${(s.price / 1000).toFixed(0)}k</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Use cases */}
          <div className="card p-5">
            <h3 className="font-semibold text-zinc-100 mb-3 flex items-center gap-2"><Smartphone className="w-4 h-4 text-violet-400" />Usos sugeridos</h3>
            <div className="grid grid-cols-2 gap-2">
              {USE_CASES.map(uc => (
                <div key={uc.label} className="flex items-center gap-2 p-2 rounded-lg bg-zinc-800/30">
                  <span className="text-base">{uc.icon}</span>
                  <span className="text-xs text-zinc-400">{uc.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* QR Preview */}
        <div className="flex flex-col gap-4">
          <div className="card p-8 flex flex-col items-center text-center">
            <div className="badge-violet mb-4">{getQRTitle()}</div>
            <div className="p-4 bg-white rounded-2xl shadow-lg mb-4">
              <QRCodeCanvas
                value={getQRValue()}
                size={200}
                bgColor="#ffffff"
                fgColor="#09090b"
                level="H"
                includeMargin={false}
              />
            </div>
            <div className="text-xs text-zinc-600 mb-4 max-w-48 break-all">{getQRValue()}</div>
            <div className="flex gap-3 flex-col sm:flex-row w-full">
              <button onClick={handleDownload} className="btn-primary flex-1">
                <Download className="w-4 h-4" /> Descargar PNG
              </button>
              <a href={getQRValue()} target="_blank" rel="noopener noreferrer" className="btn-secondary flex-1 flex items-center justify-center gap-2">
                <ExternalLink className="w-4 h-4" /> Ver página
              </a>
            </div>
          </div>

          {/* Booking URL */}
          <div className="card p-4">
            <div className="stat-label mb-2">URL de reservas</div>
            <div className="bg-zinc-800 rounded-lg p-3 font-mono text-xs text-violet-300 break-all">{baseUrl}</div>
            <p className="text-xs text-zinc-600 mt-2">Comparte este enlace directamente o genera el QR para que tus clientes reserven en segundos.</p>
          </div>

          {/* Stats placeholder */}
          <div className="card p-4 bg-violet-600/5 border-violet-600/20">
            <div className="stat-label mb-2">Estadísticas de escaneos</div>
            <div className="text-2xl font-bold text-violet-400">47</div>
            <div className="text-xs text-zinc-600">escaneos este mes (datos de demo)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
