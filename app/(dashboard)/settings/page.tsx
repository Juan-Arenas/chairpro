'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import {
  Settings, MapPin, Clock, Phone, Globe, AlertCircle,
  Scissors, Zap, Palette, ArrowRight, Check, ShieldCheck,
  Calendar, DollarSign, Sparkles, RefreshCw, Mail, CheckCircle2,
  Lock, UserCircle
} from 'lucide-react';
import { DAY_LABELS, formatCurrency } from '@/lib/utils';
import type { Barbershop } from '@/types';

export default function SettingsPage() {
  const { currentShop, shops, currentUser, updateShopSettings } = useStore();
  const targetShop = currentShop || shops[0];
  const isSuperAdmin = currentUser?.role === 'superadmin';

  // Form states
  const [name, setName] = useState(targetShop?.name || '');
  const [slug, setSlug] = useState(targetShop?.slug || '');
  const [phone, setPhone] = useState(targetShop?.phone || '');
  const [whatsapp, setWhatsapp] = useState(targetShop?.whatsapp || '');
  const [address, setAddress] = useState(targetShop?.address || '');
  const [city, setCity] = useState(targetShop?.city || '');
  const [ownerName, setOwnerName] = useState(targetShop?.ownerName || '');
  const [ownerEmail, setOwnerEmail] = useState(targetShop?.ownerEmail || '');
  const [plan, setPlan] = useState<'trial' | 'basic' | 'pro' | 'enterprise'>(targetShop?.plan || 'pro');

  // Booking & Loyalty settings
  const [allowOnlineBooking, setAllowOnlineBooking] = useState(targetShop?.settings?.allowOnlineBooking ?? true);
  const [bookingWindowDays, setBookingWindowDays] = useState(targetShop?.settings?.bookingWindowDays ?? 30);
  const [cancellationPolicyHours, setCancellationPolicyHours] = useState(targetShop?.settings?.cancellationPolicyHours ?? 2);
  const [rewardThreshold, setRewardThreshold] = useState(targetShop?.settings?.rewardThreshold ?? 5);
  const [rewardDescription, setRewardDescription] = useState(targetShop?.settings?.rewardDescription || 'Corte de cortesía en tu próxima visita');

  // Working hours state
  const defaultWorkingHours: Barbershop['workingHours'] = {
    monday: { isOpen: true, open: '09:00', close: '19:00' },
    tuesday: { isOpen: true, open: '09:00', close: '19:00' },
    wednesday: { isOpen: true, open: '09:00', close: '19:00' },
    thursday: { isOpen: true, open: '09:00', close: '20:00' },
    friday: { isOpen: true, open: '09:00', close: '20:00' },
    saturday: { isOpen: true, open: '08:00', close: '18:00' },
    sunday: { isOpen: false, open: '10:00', close: '15:00' },
  };

  const [workingHours, setWorkingHours] = useState<Barbershop['workingHours']>(
    targetShop?.workingHours || defaultWorkingHours
  );

  const [savedAlert, setSavedAlert] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (targetShop) {
      setName(targetShop.name);
      setSlug(targetShop.slug);
      setPhone(targetShop.phone);
      setWhatsapp(targetShop.whatsapp || '');
      setAddress(targetShop.address);
      setCity(targetShop.city);
      setOwnerName(targetShop.ownerName || '');
      setOwnerEmail(targetShop.ownerEmail || targetShop.email || '');
      setPlan(targetShop.plan || 'pro');

      setAllowOnlineBooking(targetShop.settings?.allowOnlineBooking ?? true);
      setBookingWindowDays(targetShop.settings?.bookingWindowDays ?? 30);
      setCancellationPolicyHours(targetShop.settings?.cancellationPolicyHours ?? 2);
      setRewardThreshold(targetShop.settings?.rewardThreshold ?? 5);
      setRewardDescription(targetShop.settings?.rewardDescription || 'Corte de cortesía');

      setWorkingHours(targetShop.workingHours || defaultWorkingHours);
    }
  }, [targetShop]);

  if (!targetShop) {
    return (
      <div className="p-8 text-center text-zinc-400">
        No se encontró información de la barbería seleccionada.
      </div>
    );
  }

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

  const handleDayToggle = (day: typeof days[number]) => {
    setWorkingHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        isOpen: !prev[day].isOpen,
      },
    }));
  };

  const handleHourChange = (day: typeof days[number], field: 'open' | 'close', value: string) => {
    setWorkingHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleSaveAllSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await updateShopSettings(targetShop.id, {
        name,
        slug,
        phone,
        whatsapp,
        address,
        city,
        ownerName,
        ownerEmail,
        plan,
        mrr: plan === 'enterprise' ? 249000 : plan === 'basic' ? 129000 : plan === 'trial' ? 0 : 189000,
        workingHours,
        settings: {
          ...targetShop.settings,
          allowOnlineBooking,
          bookingWindowDays: Number(bookingWindowDays),
          cancellationPolicyHours: Number(cancellationPolicyHours),
          rewardThreshold: Number(rewardThreshold),
          rewardDescription,
          currency: 'COP',
          currencySymbol: '$',
        },
      });

      setSavedAlert(true);
      setTimeout(() => setSavedAlert(false), 3500);
    } catch (err) {
      console.error('Error guardando configuración:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const primaryColor = targetShop.theme?.primaryColor || '#7c3aed';

  return (
    <div className="space-y-6 pb-24 lg:pb-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge px-2.5 py-0.5 text-xs font-semibold bg-violet-500/15 text-violet-300 border-violet-500/30 flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5" />
              Configuración de Operaciones
            </span>
            {isSuperAdmin && (
              <span className="badge px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border-amber-500/30">
                👑 SuperAdmin Autorizado
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold font-display text-zinc-100">
            Ajustes & Parámetros de {targetShop.name}
          </h1>
          <p className="text-xs text-zinc-400">
            Modifica los datos de la sede, horarios de atención, reglas de cancelación y programa de fidelización con guardado en tiempo real.
          </p>
        </div>

        <button
          onClick={handleSaveAllSettings}
          disabled={isSaving}
          className="btn-primary px-5 py-2.5 shadow-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-transform hover:scale-105 shrink-0"
          style={{ backgroundColor: primaryColor }}
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          <span>Guardar Configuración</span>
        </button>
      </div>

      {savedAlert && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs sm:text-sm flex items-center gap-2.5 animate-scale-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>
            <strong>¡Configuración guardada con éxito!</strong> Los cambios se han actualizado en tiempo real y sincronizado con Supabase.
          </span>
        </div>
      )}

      {/* Quick link to Branding Studio */}
      <div className="card p-5 border-zinc-700 bg-gradient-to-r from-violet-950/30 via-zinc-900 to-zinc-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md shrink-0 text-lg"
            style={{ backgroundColor: primaryColor }}
          >
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">Personalización de Marca & Identidad Visual</h3>
            <p className="text-xs text-zinc-400">
              Colores personalizados, fondos, logotipos e indicaciones de estilo para tu panel y la app del cliente.
            </p>
          </div>
        </div>

        <Link
          href="/branding"
          className="btn-primary btn-sm px-4 shrink-0 flex items-center gap-1.5 font-bold text-xs"
          style={{ backgroundColor: primaryColor }}
        >
          <span>Ir a Branding Studio</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <form onSubmit={handleSaveAllSettings} className="space-y-6">
        {/* Section 1: General Information */}
        <div className="card p-5 border-zinc-800 space-y-4">
          <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
            <Scissors className="w-4 h-4" style={{ color: primaryColor }} />
            1. Información General de la Empresa
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Nombre Comercial de la Barbería *</label>
              <input
                type="text"
                required
                className="input text-xs sm:text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="label">Slug / URL de Reservas Públicas *</label>
              <div className="flex items-center rounded-xl border border-zinc-700 bg-zinc-950 px-2.5">
                <span className="text-xs text-zinc-500 font-mono">/booking/</span>
                <input
                  type="text"
                  required
                  className="bg-transparent border-0 text-xs sm:text-sm font-mono text-amber-400 focus:ring-0 p-1.5 w-full"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Nombre del Dueño / Administrador</label>
              <input
                type="text"
                className="input text-xs"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="label">Correo Electrónico de Contacto</label>
              <input
                type="email"
                className="input text-xs font-mono"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="label">Teléfono de Contacto</label>
              <input
                type="text"
                className="input text-xs font-mono"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="label">WhatsApp para Reservas & Notificaciones</label>
              <input
                type="text"
                className="input text-xs font-mono"
                placeholder="+57 300 123 4567"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
            </div>

            <div className="form-group sm:col-span-2">
              <label className="label">Dirección Física de la Sede</label>
              <input
                type="text"
                className="input text-xs"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="label">Ciudad</label>
              <input
                type="text"
                className="input text-xs"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="label">Plan SaaS Asignado</label>
              <select
                className="input text-xs font-semibold"
                value={plan}
                onChange={(e) => setPlan(e.target.value as any)}
              >
                <option value="trial">Prueba Gratuita (Trial - $0)</option>
                <option value="basic">Básico ($129.000 COP / mes)</option>
                <option value="pro">Pro ($189.000 COP / mes)</option>
                <option value="enterprise">Enterprise VIP ($249.000 COP / mes)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Working Hours / Schedule */}
        <div className="card p-5 border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-400" />
              2. Horarios de Atención & Apertura Semanal
            </h2>
            <span className="text-[11px] text-zinc-500">Configura la disponibilidad de la sede</span>
          </div>

          <div className="space-y-2.5">
            {days.map((day) => {
              const h = workingHours[day] || { isOpen: true, open: '09:00', close: '19:00' };

              return (
                <div
                  key={day}
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors ${
                    h.isOpen ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-950/60 border-zinc-900 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 w-36">
                    <button
                      type="button"
                      onClick={() => handleDayToggle(day)}
                      className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 ${
                        h.isOpen ? 'bg-emerald-500' : 'bg-zinc-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          h.isOpen ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-xs font-semibold text-zinc-200">{DAY_LABELS[day]}</span>
                  </div>

                  {h.isOpen ? (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-zinc-400">Abre:</span>
                      <input
                        type="time"
                        value={h.open}
                        onChange={(e) => handleHourChange(day, 'open', e.target.value)}
                        className="input py-1 px-2 text-xs w-28 font-mono bg-zinc-950"
                      />
                      <span className="text-zinc-400 mx-1">—</span>
                      <span className="text-zinc-400">Cierra:</span>
                      <input
                        type="time"
                        value={h.close}
                        onChange={(e) => handleHourChange(day, 'close', e.target.value)}
                        className="input py-1 px-2 text-xs w-28 font-mono bg-zinc-950"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-500 font-medium">Cerrado todo el día</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Booking & Loyalty Rules */}
        <div className="card p-5 border-zinc-800 space-y-4">
          <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            3. Reglas de Reservas Online & Programa de Fidelización
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group sm:col-span-2 flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
              <div>
                <span className="text-xs font-semibold text-zinc-200 block">Permitir Reservas Online</span>
                <span className="text-[11px] text-zinc-500 block">Habilita el portal público para agendamiento de clientes</span>
              </div>
              <button
                type="button"
                onClick={() => setAllowOnlineBooking(!allowOnlineBooking)}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                  allowOnlineBooking ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    allowOnlineBooking ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="form-group">
              <label className="label">Ventana de Reserva (Días de anticipación)</label>
              <input
                type="number"
                min="1"
                max="90"
                className="input text-xs"
                value={bookingWindowDays}
                onChange={(e) => setBookingWindowDays(parseInt(e.target.value) || 30)}
              />
              <span className="text-[10px] text-zinc-500">Hasta cuántos días a futuro puede agendar un cliente</span>
            </div>

            <div className="form-group">
              <label className="label">Horas Mínimas para Cancelación</label>
              <input
                type="number"
                min="0"
                max="48"
                className="input text-xs"
                value={cancellationPolicyHours}
                onChange={(e) => setCancellationPolicyHours(parseInt(e.target.value) || 2)}
              />
              <span className="text-[10px] text-zinc-500">Tiempo de preaviso para cancelar sin marcar No-Show</span>
            </div>

            <div className="form-group">
              <label className="label">Visitas Requeridas para Recompensa</label>
              <input
                type="number"
                min="1"
                max="20"
                className="input text-xs"
                value={rewardThreshold}
                onChange={(e) => setRewardThreshold(parseInt(e.target.value) || 5)}
              />
              <span className="text-[10px] text-zinc-500">Cortes necesarios para ganar el premio de fidelidad</span>
            </div>

            <div className="form-group">
              <label className="label">Descripción del Premio / Recompensa</label>
              <input
                type="text"
                className="input text-xs"
                placeholder="Ej. Corte gratis en tu próxima visita"
                value={rewardDescription}
                onChange={(e) => setRewardDescription(e.target.value)}
              />
              <span className="text-[10px] text-zinc-500">Texto que verá el cliente al completar su tarjeta digital</span>
            </div>
          </div>
        </div>

        {/* Bottom Save Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary px-6 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xl hover:scale-105 transition-transform"
            style={{ backgroundColor: primaryColor }}
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>Guardar Configuración de la Barbería</span>
          </button>
        </div>
      </form>
    </div>
  );
}
