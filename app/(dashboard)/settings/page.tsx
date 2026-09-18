'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { Settings, MapPin, Clock, Phone, Globe, AlertCircle, Scissors, Zap, Palette, ArrowRight, Check } from 'lucide-react';
import { DAY_LABELS } from '@/lib/utils';

export default function SettingsPage() {
  const { currentShop, currentUser, updateShopBranding } = useStore();
  const [name, setName] = useState(currentShop?.name || '');
  const [phone, setPhone] = useState(currentShop?.phone || '');
  const [address, setAddress] = useState(currentShop?.address || '');
  const [city, setCity] = useState(currentShop?.city || '');
  const [whatsapp, setWhatsapp] = useState(currentShop?.whatsapp || '');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (currentShop) {
      setName(currentShop.name);
      setPhone(currentShop.phone);
      setAddress(currentShop.address);
      setCity(currentShop.city);
      setWhatsapp(currentShop.whatsapp || '');
    }
  }, [currentShop]);

  if (!currentShop) return null;

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateShopBranding(currentShop.id, {
      name,
      phone,
      address,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-5 pb-20 lg:pb-4 max-w-3xl">
      <div>
        <h2 className="section-title">Configuración de {currentShop.name}</h2>
        <p className="section-desc">Gestiona la información de tu sede, horarios de atención y marca</p>
      </div>

      {saved && (
        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Información de la barbería guardada correctamente.</span>
        </div>
      )}

      {/* Branding Studio Card */}
      <div className="card p-5 border-zinc-700 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md shrink-0"
            style={{ backgroundColor: currentShop.theme?.primaryColor || '#7c3aed' }}
          >
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">Personalización de Marca & Tema Visual</h3>
            <p className="text-xs text-zinc-400">
              Modifica colores (verde, azul, dorado, etc.), modo oscuro/claro, logo y wallpapers para tu panel y la app del cliente.
            </p>
          </div>
        </div>

        <Link
          href="/branding"
          className="btn-primary btn-sm px-4 shrink-0 flex items-center gap-1.5 font-semibold text-xs"
          style={{ backgroundColor: currentShop.theme?.primaryColor || '#7c3aed' }}
        >
          <span>Ir a Branding Studio</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Shop info form */}
      <div className="card p-5">
        <h3 className="font-semibold text-zinc-100 mb-4 flex items-center gap-2">
          <Scissors className="w-4 h-4 text-brand" />Información general de la sede
        </h3>
        <form onSubmit={handleSaveInfo} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="label">Nombre de la barbería</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="label">Teléfono de contacto</label>
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div className="form-group col-span-2">
              <label className="label">Dirección física</label>
              <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="label">Ciudad</label>
              <input className="input" value={city} onChange={(e) => setCity(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="label">WhatsApp para reservas</label>
              <input className="input" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <button type="submit" className="btn-primary btn-sm px-4">
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>

      {/* Working hours */}
      <div className="card p-5">
        <h3 className="font-semibold text-zinc-100 mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-violet-400" />Horarios de atención</h3>
        <div className="space-y-2">
          {days.map(day => {
            const h = currentShop.workingHours[day];
            return (
              <div key={day} className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-800/30">
                <span className="text-sm text-zinc-400 w-24">{DAY_LABELS[day]}</span>
                {h.isOpen ? (
                  <span className="text-sm text-zinc-300">{h.open} – {h.close}</span>
                ) : (
                  <span className="text-sm text-zinc-600">Cerrado</span>
                )}
                <span className={`badge text-xs ${h.isOpen ? 'badge-emerald' : 'badge-zinc'}`}>{h.isOpen ? 'Abierto' : 'Cerrado'}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Loyalty settings */}
      <div className="card p-5">
        <h3 className="font-semibold text-zinc-100 mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" />Programa de fidelización</h3>
        <div className="space-y-3">
          <div className="form-group"><label className="label">Visitas para recompensa</label><input className="input" defaultValue={currentShop.settings?.rewardThreshold || 5} readOnly /></div>
          <div className="form-group"><label className="label">Descripción de recompensa</label><input className="input" defaultValue={currentShop.settings?.rewardDescription || 'Corte gratis'} readOnly /></div>
          <div className="form-group"><label className="label">Horas mínimas para cancelar</label><input className="input" defaultValue={currentShop.settings?.cancellationPolicyHours || 2} readOnly /></div>
        </div>
      </div>

      {/* Plan info */}
      <div className="card p-5 bg-gradient-to-br from-violet-600/10 to-transparent border-violet-600/20">
        <h3 className="font-semibold text-zinc-100 mb-3 flex items-center gap-2"><Palette className="w-4 h-4 text-violet-400" />Plan ChairPro</h3>
        <div className="flex items-center gap-3 mb-4">
          <div className="badge-violet px-3 py-1.5 text-sm font-semibold">DEMO ACTIVA</div>
          <span className="text-xs text-zinc-500">Todas las funciones habilitadas para demostración</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            '✅ Agenda ilimitada', '✅ Reservas QR', '✅ Gestión de clientes', '✅ Control inventario',
            '✅ Estadísticas', '✅ Automatizaciones', '✅ Comisiones automáticas', '✅ Fidelización',
            '✅ Asistente virtual', '✅ Control no-show', '✅ Finanzas completas', '✅ Multi-barbero',
          ].map(f => (
            <div key={f} className="text-xs text-zinc-400">{f}</div>
          ))}
        </div>
      </div>

      {/* User account */}
      <div className="card p-5">
        <h3 className="font-semibold text-zinc-100 mb-3 flex items-center gap-2"><Settings className="w-4 h-4 text-zinc-500" />Mi cuenta</h3>
        <div className="space-y-3">
          <div className="form-group"><label className="label">Nombre</label><input className="input" defaultValue={currentUser?.name || ''} readOnly /></div>
          <div className="form-group"><label className="label">Email</label><input className="input" defaultValue={currentUser?.email || ''} readOnly /></div>
          <div className="form-group"><label className="label">Rol</label><input className="input" defaultValue={currentUser?.role || ''} readOnly /></div>
        </div>
        <div className="mt-4 flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs text-zinc-400">Esta es una demostración. Los cambios en los campos están deshabilitados para proteger los datos demo.</span>
        </div>
      </div>
    </div>
  );
}
