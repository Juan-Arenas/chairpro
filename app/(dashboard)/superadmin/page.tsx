'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import {
  Building2, Users, DollarSign, Plus, ExternalLink,
  Power, ShieldCheck, CheckCircle2, ArrowRight,
  Sparkles, MapPin, Mail, Phone, Calendar,
  Copy, Check, Share2, MessageCircle, KeyRound, Search,
  QrCode as QrIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const QRCodeCanvas = dynamic(() => import('qrcode.react').then(m => m.QRCodeCanvas), { ssr: false });

export default function SuperAdminPage() {
  const {
    shops,
    users,
    appointments,
    barbers,
    currentShop,
    switchShop,
    toggleShopStatus,
    getSaaSPlatformKPIs,
    mode,
  } = useStore();

  const router = useRouter();
  const kpis = getSaaSPlatformKPIs();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Access Credential Card Modal
  const [accessCardModal, setAccessCardModal] = useState<{
    isOpen: boolean;
    shopName: string;
    slug: string;
    ownerName: string;
    email: string;
    password?: string;
    phone?: string;
    loginUrl: string;
    bookingUrl: string;
    whatsappMessage: string;
    shopId: string;
  } | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    phone: '+57 300 000 0000',
    city: 'Bogotá',
    address: '',
    plan: 'pro' as 'basic' | 'pro' | 'enterprise',
    primaryColor: '#7c3aed',
    tagline: 'Cortes legendarios y estilo superior',
  });

  const COLOR_PRESETS = [
    { label: 'Violeta Signature', hex: '#7c3aed' },
    { label: 'Azul Neón', hex: '#0ea5e9' },
    { label: 'Verde Esmeralda', hex: '#10b981' },
    { label: 'Oro Luxury', hex: '#d97706' },
    { label: 'Rojo Carmesí', hex: '#dc2626' },
    { label: 'Gris Carbón', hex: '#52525b' },
  ];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug || !formData.ownerEmail) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // 1. Call secure server endpoint
      const res = await fetch('/api/superadmin/create-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al crear la barbería');
      }

      // 2. Add new tenant to local Zustand state so it renders immediately
      const newShop = {
        id: data.tenant.id,
        name: data.tenant.name,
        slug: data.tenant.slug,
        address: formData.address || 'Dirección por configurar',
        city: data.tenant.city,
        country: 'Colombia',
        phone: formData.phone,
        email: data.tenant.ownerEmail,
        ownerEmail: data.tenant.ownerEmail,
        ownerName: data.tenant.ownerName,
        timezone: 'America/Bogota',
        theme: {
          mode: 'dark' as const,
          primaryColor: data.tenant.primaryColor || '#7c3aed',
          backgroundType: 'gradient' as const,
          logoUrl: '✂️',
          tagline: formData.tagline || 'Cortes legendarios y estilo superior',
          backgroundOpacity: 0.15,
        },
        status: 'active' as const,
        mrr: data.tenant.mrr,
        plan: data.tenant.plan,
        createdAt: data.tenant.createdAt,
        workingHours: {
          monday: { isOpen: true, open: '09:00', close: '19:00' },
          tuesday: { isOpen: true, open: '09:00', close: '19:00' },
          wednesday: { isOpen: true, open: '09:00', close: '19:00' },
          thursday: { isOpen: true, open: '09:00', close: '20:00' },
          friday: { isOpen: true, open: '09:00', close: '20:00' },
          saturday: { isOpen: true, open: '08:00', close: '18:00' },
          sunday: { isOpen: false, open: '10:00', close: '15:00' },
        },
        settings: {
          allowOnlineBooking: true,
          bookingWindowDays: 30,
          cancellationPolicyHours: 2,
          rewardThreshold: 5,
          rewardDescription: 'Corte de cortesía en tu próxima visita',
          currency: 'COP',
          currencySymbol: '$',
        },
      };

      useStore.setState((state) => ({
        shops: [...state.shops.filter(s => s.id !== newShop.id), newShop],
      }));

      setShowCreateModal(false);

      // 3. Open the Welcome & Access Card Modal for immediate delivery
      setAccessCardModal({
        isOpen: true,
        shopName: formData.name,
        slug: formData.slug,
        ownerName: formData.ownerName || 'Dueño',
        email: data.credentials.email,
        password: data.credentials.password,
        phone: formData.phone,
        loginUrl: data.credentials.loginUrl,
        bookingUrl: data.credentials.bookingUrl,
        whatsappMessage: data.whatsappMessage,
        shopId: data.tenant.id,
      });

      // Reset form
      setFormData({
        name: '',
        slug: '',
        ownerName: '',
        ownerEmail: '',
        ownerPassword: '',
        phone: '+57 300 000 0000',
        city: 'Bogotá',
        address: '',
        plan: 'pro',
        primaryColor: '#7c3aed',
        tagline: 'Cortes legendarios y estilo superior',
      });
    } catch (err: any) {
      console.error('Error creating shop:', err);
      setErrorMessage(err.message || 'Error al conectar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAccessCardForShop = (shop: any) => {
    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const loginUrl = `${appUrl}/login`;
    const bookingUrl = `${appUrl}/booking/${shop.slug}`;
    const cleanEmail = shop.ownerEmail || shop.email;

    const whatsappMessage = `💈 *¡Hola, ${shop.ownerName || shop.name}!*

Aquí tienes los accesos oficiales a tu plataforma *${shop.name}* en ChairPro SaaS:

🔐 *PANEL ADMINISTRATIVO:*
• *Enlace:* ${loginUrl}
• *Usuario:* ${cleanEmail}

🌐 *TU PORTAL DE RESERVAS PARA CLIENTES:*
• *Enlace:* ${bookingUrl}

¡Comienza a agendar citas y personalizar tu barbería hoy mismo! 🚀`;

    setAccessCardModal({
      isOpen: true,
      shopName: shop.name,
      slug: shop.slug,
      ownerName: shop.ownerName || 'Dueño',
      email: cleanEmail,
      phone: shop.phone,
      loginUrl,
      bookingUrl,
      whatsappMessage,
      shopId: shop.id,
    });
  };

  const filteredShops = useMemo(() => {
    if (!searchQuery.trim()) return shops;
    const q = searchQuery.toLowerCase();
    return shops.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        (s.ownerEmail && s.ownerEmail.toLowerCase().includes(q)) ||
        (s.ownerName && s.ownerName.toLowerCase().includes(q))
    );
  }, [shops, searchQuery]);

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-900 border border-amber-500/20 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="badge px-2.5 py-1 text-xs font-bold bg-amber-500/20 text-amber-300 border-amber-500/30">
              👑 Panel SuperAdmin SaaS Live
            </span>
            <span className="text-xs text-zinc-400">Control Multi-Empresa Centralizado</span>
          </div>
          <h1 className="text-2xl font-bold font-display text-zinc-100">
            Control Global de Barberías & Entrega de Accesos
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Registra nuevas barberías en segundos, crea sus cuentas en Supabase Auth, entrégales sus accesos por WhatsApp y entra a gestionar cualquier sede con 1 clic.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary py-2.5 px-5 shrink-0 flex items-center gap-2 shadow-lg hover:scale-105 transition-all text-sm font-bold"
          style={{ backgroundColor: '#f59e0b', color: '#000' }}
        >
          <Plus className="w-4 h-4" />
          Registrar Nueva Barbería
        </button>
      </div>

      {/* Global SaaS KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card bg-zinc-900/90 border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="stat-label">Barberías Suscritas</span>
            <Building2 className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold text-zinc-100 mt-1">
            {kpis.totalShops} <span className="text-xs text-emerald-400 font-normal">({kpis.activeShops} activas)</span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Base multi-tenant aislada</div>
        </div>

        <div className="kpi-card bg-zinc-900/90 border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="stat-label">MRR Facturado</span>
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold text-emerald-400 mt-1">
            {formatCurrency(kpis.totalMRR)}
          </div>
          <div className="text-[11px] text-emerald-500 mt-1 font-medium">+{kpis.monthlyGrowthRate}% recurrente / mes</div>
        </div>

        <div className="kpi-card bg-zinc-900/90 border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="stat-label">Barberos Conectados</span>
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold text-zinc-100 mt-1">
            {kpis.totalBarbers}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">En sedes activas</div>
        </div>

        <div className="kpi-card bg-zinc-900/90 border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="stat-label">Citas Totales SaaS</span>
            <Calendar className="w-5 h-5 text-violet-400" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold text-violet-300 mt-1">
            {kpis.totalAppointments}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Procesadas en plataforma</div>
        </div>
      </div>

      {/* Barbershop List */}
      <div className="card p-5 border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-400" />
              Empresas / Barberías Registradas ({filteredShops.length})
            </h2>
            <p className="text-xs text-zinc-500">
              Cada empresa tiene su base de datos aislada, sus barberos y su personalización visual independiente.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, ciudad o dueño..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-9 text-xs w-full bg-zinc-950/60"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredShops.map((shop) => {
            const shopBarbers = barbers.filter((b) => b.shopId === shop.id);
            const shopAppts = appointments.filter((a) => a.shopId === shop.id);
            const isSelected = currentShop?.id === shop.id;
            const primaryHex = shop.theme?.primaryColor || '#7c3aed';

            return (
              <div
                key={shop.id}
                className={`card p-5 transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                  isSelected ? 'border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/30' : 'hover:border-zinc-700'
                }`}
              >
                {/* Accent line */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: primaryHex }}
                />

                <div>
                  {/* Shop header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-md shrink-0"
                        style={{ backgroundColor: primaryHex }}
                      >
                        {shop.theme?.logoUrl || '✂️'}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-zinc-100 truncate">{shop.name}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                          <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
                          <span className="truncate">{shop.city}, Colombia</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`badge text-[10px] font-semibold uppercase ${
                        shop.status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/15 text-red-400 border-red-500/30'
                      }`}
                    >
                      {shop.status === 'active' ? 'Activa' : 'Suspendida'}
                    </span>
                  </div>

                  {/* Owner info */}
                  <div className="bg-zinc-800/40 rounded-lg p-2.5 mb-3 text-xs space-y-1">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>Dueño:</span>
                      <span className="text-zinc-200 font-semibold truncate max-w-[150px]">
                        {shop.ownerName || 'Admin'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>Email:</span>
                      <span className="text-zinc-300 truncate max-w-[150px] font-mono text-[11px]">
                        {shop.ownerEmail || shop.email}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>Plan SaaS:</span>
                      <span className="font-semibold capitalize text-amber-400">
                        {shop.plan} ({formatCurrency(shop.mrr || 189000)}/mes)
                      </span>
                    </div>
                  </div>

                  {/* Metrics preview */}
                  <div className="grid grid-cols-2 gap-2 text-center text-xs mb-3">
                    <div className="bg-zinc-950/60 p-2 rounded border border-zinc-800">
                      <div className="font-bold text-zinc-200">{shopBarbers.length}</div>
                      <div className="text-[10px] text-zinc-500">Barberos</div>
                    </div>
                    <div className="bg-zinc-950/60 p-2 rounded border border-zinc-800">
                      <div className="font-bold text-zinc-200">{shopAppts.length}</div>
                      <div className="text-[10px] text-zinc-500">Citas</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2 border-t border-zinc-800/60">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        switchShop(shop.id);
                        router.push('/dashboard');
                      }}
                      className="btn-primary btn-sm flex-1 text-xs justify-center font-semibold shadow"
                      style={{ backgroundColor: primaryHex }}
                    >
                      <span>Entrar a Gestionar</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </button>

                    <button
                      onClick={() => openAccessCardForShop(shop)}
                      className="btn-secondary btn-sm p-2 text-zinc-300 hover:text-white"
                      title="Ver Ficha de Acceso y Enviar por WhatsApp"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => toggleShopStatus(shop.id)}
                      className={`btn-icon p-2 border ${
                        shop.status === 'active'
                          ? 'border-red-500/20 text-zinc-400 hover:text-red-400 hover:bg-red-500/10'
                          : 'border-emerald-500/20 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10'
                      }`}
                      title={shop.status === 'active' ? 'Suspender barbería' : 'Activar barbería'}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <Link
                    href={`/booking/${shop.slug}`}
                    target="_blank"
                    className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors w-full py-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Ver portal de reservas de {shop.name}</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal 1: Create New Barbershop */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-5 border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  Dar de Alta Nueva Empresa Barbería
                </h3>
                <p className="text-xs text-zinc-500">
                  Crea automáticamente la cuenta en Supabase Auth, base de datos y la URL de reservas.
                </p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="btn-icon p-1.5">
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-400 mb-4">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreateShop} className="space-y-4">
              <div className="form-group">
                <label className="label">Nombre de la Barbería</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ej. Vintage Club Barbería"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
                    setFormData({ ...formData, name, slug });
                  }}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="label">Identificador (Slug URL)</label>
                  <input
                    type="text"
                    className="input font-mono text-xs"
                    placeholder="vintage-club"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                  />
                  <span className="text-[10px] text-zinc-500 block mt-0.5">/booking/{formData.slug || 'url'}</span>
                </div>

                <div className="form-group">
                  <label className="label">Ciudad</label>
                  <select
                    className="input text-xs"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  >
                    <option value="Bogotá">Bogotá</option>
                    <option value="Medellín">Medellín</option>
                    <option value="Cali">Cali</option>
                    <option value="Barranquilla">Barranquilla</option>
                    <option value="Bucaramanga">Bucaramanga</option>
                    <option value="Cartagena">Cartagena</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="label">Nombre del Dueño</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ej. Juan Pérez"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="label">Correo del Dueño</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="juan@barberia.com"
                    value={formData.ownerEmail}
                    onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="label">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="+57 300 123 4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="label">Contraseña de Acceso</label>
                  <input
                    type="text"
                    className="input font-mono text-xs"
                    placeholder="Auto-generar si está vacía"
                    value={formData.ownerPassword}
                    onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="label">Plan SaaS Inicial</label>
                  <select
                    className="input text-xs"
                    value={formData.plan}
                    onChange={(e) => setFormData({ ...formData, plan: e.target.value as any })}
                  >
                    <option value="basic">Básico ($129.000 / mes)</option>
                    <option value="pro">Pro ($189.000 / mes)</option>
                    <option value="enterprise">Enterprise ($249.000 / mes)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Color de Marca</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="w-9 h-9 rounded cursor-pointer border border-zinc-700 bg-transparent p-0.5"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    />
                    <span className="text-xs font-mono text-zinc-300">{formData.primaryColor}</span>
                  </div>
                </div>
              </div>

              {/* Color Presets */}
              <div>
                <label className="label">Paletas sugeridas</label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_PRESETS.map((p) => (
                    <button
                      key={p.hex}
                      type="button"
                      onClick={() => setFormData({ ...formData, primaryColor: p.hex })}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border ${
                        formData.primaryColor === p.hex ? 'border-white bg-zinc-800' : 'border-zinc-800 bg-zinc-900'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.hex }} />
                      <span className="text-zinc-300">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-ghost btn-sm"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary btn-sm px-5 py-2 font-bold flex items-center gap-2"
                  style={{ backgroundColor: formData.primaryColor }}
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creando en Supabase...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Crear Empresa Barbería
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Access & Welcome Card Modal (Ficha de Entrega para el Cliente) */}
      {accessCardModal?.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg p-6 animate-scale-in border-amber-500/40 bg-zinc-950">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-100">
                    Ficha de Acceso: {accessCardModal.shopName}
                  </h3>
                  <span className="text-xs text-emerald-400 font-semibold">
                    ✓ Lista para enviar al dueño
                  </span>
                </div>
              </div>
              <button
                onClick={() => setAccessCardModal(null)}
                className="btn-icon p-1.5 text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Credentials Box */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-3">
                <div className="text-xs font-bold text-zinc-200 flex items-center justify-between">
                  <span>Credenciales del Administrador</span>
                  <span className="text-[10px] text-zinc-500">Supabase Auth Live</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between bg-zinc-950/80 p-2 rounded-lg border border-zinc-800">
                    <span className="text-zinc-400">Usuario (Email):</span>
                    <div className="flex items-center gap-2 font-mono text-zinc-100 font-semibold">
                      <span>{accessCardModal.email}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(accessCardModal.email, 'email')}
                        className="text-zinc-400 hover:text-white p-1"
                        title="Copiar correo"
                      >
                        {copiedKey === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {accessCardModal.password && (
                    <div className="flex items-center justify-between bg-zinc-950/80 p-2 rounded-lg border border-zinc-800">
                      <span className="text-zinc-400">Contraseña:</span>
                      <div className="flex items-center gap-2 font-mono text-amber-400 font-semibold">
                        <span>{accessCardModal.password}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(accessCardModal.password!, 'password')}
                          className="text-zinc-400 hover:text-white p-1"
                          title="Copiar contraseña"
                        >
                          {copiedKey === 'password' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between bg-zinc-950/80 p-2 rounded-lg border border-zinc-800">
                    <span className="text-zinc-400">Enlace de Inicio:</span>
                    <div className="flex items-center gap-2 font-mono text-zinc-300">
                      <span className="truncate max-w-[200px]">{accessCardModal.loginUrl}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(accessCardModal.loginUrl, 'loginUrl')}
                        className="text-zinc-400 hover:text-white p-1"
                        title="Copiar URL"
                      >
                        {copiedKey === 'loginUrl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Public Booking Link & QR */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-zinc-200 mb-1">
                    Portal de Reservas del Cliente
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono truncate mb-2">
                    {accessCardModal.bookingUrl}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(accessCardModal.bookingUrl, 'bookingUrl')}
                      className="btn-secondary btn-sm text-xs py-1 px-2.5 flex items-center gap-1.5"
                    >
                      {copiedKey === 'bookingUrl' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      Copiar Enlace
                    </button>
                    <Link
                      href={accessCardModal.bookingUrl}
                      target="_blank"
                      className="btn-ghost btn-sm text-xs py-1 px-2 text-zinc-400 hover:text-zinc-200"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Probar
                    </Link>
                  </div>
                </div>

                <div className="bg-white p-2 rounded-lg shrink-0 shadow-md">
                  <QRCodeCanvas value={accessCardModal.bookingUrl} size={70} />
                </div>
              </div>

              {/* Action Buttons: WhatsApp & Direct Impersonation */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <a
                  href={`https://api.whatsapp.com/send?phone=${(accessCardModal.phone || '').replace(/[^0-9]/g, '')}&text=${encodeURIComponent(accessCardModal.whatsappMessage)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-transform hover:scale-[1.02]"
                >
                  <MessageCircle className="w-4 h-4" />
                  Enviar Accesos por WhatsApp al Dueño
                </a>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      switchShop(accessCardModal.shopId);
                      setAccessCardModal(null);
                      router.push('/dashboard');
                    }}
                    className="btn-secondary flex-1 py-2 text-xs font-semibold justify-center"
                  >
                    Entrar a Gestionar como Admin
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleCopy(accessCardModal.whatsappMessage, 'allMsg');
                    }}
                    className="btn-ghost py-2 px-3 text-xs text-zinc-400 hover:text-white"
                    title="Copiar texto completo de WhatsApp"
                  >
                    {copiedKey === 'allMsg' ? '¡Copiado!' : 'Copiar Texto'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
