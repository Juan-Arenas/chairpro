'use client';

import { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import {
  Building2, Users, DollarSign, Plus, ExternalLink,
  Power, ShieldCheck, CheckCircle2, ArrowRight,
  Sparkles, MapPin, Mail, Phone, Calendar,
  Copy, Check, Share2, MessageCircle, KeyRound, Search,
  QrCode as QrIcon, AlertTriangle, Clock, Receipt, CreditCard,
  Filter, ChevronRight, FileText, Download, CheckCircle,
  RefreshCw, Smartphone, Send, Banknote, Edit3
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { format, addDays, subDays } from 'date-fns';
import type { Barbershop, SaasPayment, SubscriptionStatus } from '@/types';

const QRCodeCanvas = dynamic(() => import('qrcode.react').then(m => m.QRCodeCanvas), { ssr: false });

export default function SuperAdminPage() {
  const {
    shops,
    users,
    appointments,
    barbers,
    currentUser,
    currentShop,
    saasPayments,
    switchShop,
    toggleShopStatus,
    recordMonthlyPayment,
    updateShopSubscription,
    getSaaSPlatformKPIs,
    mode,
  } = useStore();

  const router = useRouter();

  // Role Protection: only SuperAdmin can view this page
  useEffect(() => {
    if (currentUser && currentUser.role !== 'superadmin') {
      router.replace('/dashboard');
    }
  }, [currentUser, router]);

  const kpis = getSaaSPlatformKPIs();

  // Active Tab: 'shops' | 'subscriptions' | 'history'
  const [activeTab, setActiveTab] = useState<'shops' | 'subscriptions' | 'history'>('subscriptions');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expiring_soon' | 'overdue' | 'suspended'>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Payment Recording Modal State
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    shop: Barbershop | null;
    amount: number;
    paymentMethod: SaasPayment['paymentMethod'];
    date: string;
    billingPeriodStart: string;
    billingPeriodEnd: string;
    autoDays: number;
    reference: string;
    notes: string;
  }>({
    isOpen: false,
    shop: null,
    amount: 189000,
    paymentMethod: 'nequi',
    date: format(new Date(), 'yyyy-MM-dd'),
    billingPeriodStart: format(new Date(), 'yyyy-MM-dd'),
    billingPeriodEnd: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    autoDays: 30,
    reference: '',
    notes: '',
  });

  // Receipt / Voucher Modal State
  const [receiptModal, setReceiptModal] = useState<{
    isOpen: boolean;
    payment: SaasPayment | null;
    shop: Barbershop | null;
  }>({
    isOpen: false,
    payment: null,
    shop: null,
  });

  // Edit Expiration Date Modal
  const [editExpirationModal, setEditExpirationModal] = useState<{
    isOpen: boolean;
    shop: Barbershop | null;
    newDate: string;
  }>({
    isOpen: false,
    shop: null,
    newDate: '',
  });

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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Form for creating shop
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

  // Helper to compute dynamic subscription details & status
  const getSubscriptionInfo = (shop: Barbershop) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!shop.nextBillingDate) {
      const defaultNext = format(addDays(today, 30), 'yyyy-MM-dd');
      return {
        nextDate: defaultNext,
        daysRemaining: 30,
        status: 'active' as SubscriptionStatus,
        label: 'Al Día (30d)',
        badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        textClass: 'text-emerald-400',
      };
    }

    const nextBilling = new Date(shop.nextBillingDate + 'T00:00:00');
    const diffTime = nextBilling.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (shop.status === 'suspended') {
      return {
        nextDate: shop.nextBillingDate,
        daysRemaining,
        status: 'suspended' as SubscriptionStatus,
        label: 'Suspendida',
        badgeClass: 'bg-zinc-700/30 text-zinc-400 border-zinc-700',
        textClass: 'text-zinc-500',
      };
    }

    if (daysRemaining < 0) {
      return {
        nextDate: shop.nextBillingDate,
        daysRemaining,
        status: 'overdue' as SubscriptionStatus,
        label: `Vencida (${Math.abs(daysRemaining)}d en mora)`,
        badgeClass: 'bg-red-500/15 text-red-400 border-red-500/30 ring-1 ring-red-500/40',
        textClass: 'text-red-400 font-bold',
      };
    }

    if (daysRemaining <= 7) {
      return {
        nextDate: shop.nextBillingDate,
        daysRemaining,
        status: 'expiring_soon' as SubscriptionStatus,
        label: `Vence en ${daysRemaining} día${daysRemaining === 1 ? '' : 's'}`,
        badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30 ring-1 ring-amber-500/40',
        textClass: 'text-amber-400 font-bold',
      };
    }

    return {
      nextDate: shop.nextBillingDate,
      daysRemaining,
      status: 'active' as SubscriptionStatus,
      label: `Al Día (${daysRemaining}d restantes)`,
      badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      textClass: 'text-emerald-400',
    };
  };

  // Subscription KPIs calculation
  const subscriptionStats = useMemo(() => {
    let collectedThisMonth = 0;
    let activeCount = 0;
    let expiringSoonCount = 0;
    let overdueCount = 0;
    let suspendedCount = 0;

    const currentMonthPrefix = format(new Date(), 'yyyy-MM');

    // Total collected this month from SaaS payments
    (saasPayments || []).forEach((p) => {
      if (p.date && p.date.startsWith(currentMonthPrefix)) {
        collectedThisMonth += Number(p.amount) || 0;
      }
    });

    shops.forEach((shop) => {
      const info = getSubscriptionInfo(shop);
      if (info.status === 'active') activeCount++;
      else if (info.status === 'expiring_soon') expiringSoonCount++;
      else if (info.status === 'overdue') overdueCount++;
      else if (info.status === 'suspended') suspendedCount++;
    });

    return {
      collectedThisMonth,
      activeCount,
      expiringSoonCount,
      overdueCount,
      suspendedCount,
      totalMRR: kpis.totalMRR,
    };
  }, [shops, saasPayments, kpis.totalMRR]);

  // Filtered shops based on search & tab & statusFilter
  const filteredShops = useMemo(() => {
    let list = shops;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          (s.ownerEmail && s.ownerEmail.toLowerCase().includes(q)) ||
          (s.ownerName && s.ownerName.toLowerCase().includes(q)) ||
          s.slug.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      list = list.filter((s) => {
        const info = getSubscriptionInfo(s);
        return info.status === statusFilter;
      });
    }

    return list;
  }, [shops, searchQuery, statusFilter]);

  // Filtered Payments History
  const filteredPayments = useMemo(() => {
    let list = saasPayments || [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.tenantName.toLowerCase().includes(q) ||
          (p.reference && p.reference.toLowerCase().includes(q)) ||
          (p.notes && p.notes.toLowerCase().includes(q))
      );
    }
    if (methodFilter !== 'all') {
      list = list.filter((p) => p.paymentMethod === methodFilter);
    }
    return list;
  }, [saasPayments, searchQuery, methodFilter]);

  // Handle open Record Payment Modal
  const openRecordPaymentModal = (shop: Barbershop) => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const defaultAmount = shop.mrr || (shop.plan === 'enterprise' ? 249000 : shop.plan === 'basic' ? 129000 : 189000);
    
    // Default period: if current nextBillingDate is valid and in future, start from it, otherwise start from today
    const currentNext = shop.nextBillingDate || todayStr;
    const isNextFuture = new Date(currentNext) > new Date(todayStr);
    const startDate = isNextFuture ? currentNext : todayStr;
    const endDate = format(addDays(new Date(startDate), 30), 'yyyy-MM-dd');

    setPaymentModal({
      isOpen: true,
      shop,
      amount: defaultAmount,
      paymentMethod: 'nequi',
      date: todayStr,
      billingPeriodStart: startDate,
      billingPeriodEnd: endDate,
      autoDays: 30,
      reference: `PAG-${Date.now().toString().slice(-6)}`,
      notes: `Pago mensualidad ${shop.plan.toUpperCase()} - 30 días de servicio`,
    });
  };

  // Submit Record Payment
  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModal.shop) return;

    setIsSubmitting(true);
    try {
      const newPayment = await recordMonthlyPayment({
        tenantId: paymentModal.shop.id,
        amount: Number(paymentModal.amount),
        paymentMethod: paymentModal.paymentMethod,
        date: paymentModal.date,
        billingPeriodStart: paymentModal.billingPeriodStart,
        billingPeriodEnd: paymentModal.billingPeriodEnd,
        reference: paymentModal.reference,
        notes: paymentModal.notes,
      });

      setPaymentModal((prev) => ({ ...prev, isOpen: false }));
      showToast(`✅ ¡Pago de ${formatCurrency(paymentModal.amount)} registrado con éxito! Vencimiento extendido al ${paymentModal.billingPeriodEnd}.`);

      if (newPayment) {
        // Open receipt modal right away
        setReceiptModal({
          isOpen: true,
          payment: newPayment,
          shop: paymentModal.shop,
        });
      }
    } catch (err: any) {
      alert('Error al registrar pago: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit Expiration Date
  const handleSaveExpirationDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editExpirationModal.shop || !editExpirationModal.newDate) return;

    updateShopSubscription(editExpirationModal.shop.id, {
      nextBillingDate: editExpirationModal.newDate,
    });

    setEditExpirationModal({ isOpen: false, shop: null, newDate: '' });
    showToast(`✅ Fecha de vencimiento actualizada a ${editExpirationModal.newDate}`);
  };

  // Handle WhatsApp Reminder Generator
  const openWhatsAppReminder = (shop: Barbershop) => {
    const info = getSubscriptionInfo(shop);
    const ownerName = shop.ownerName || shop.name;
    const phone = shop.phone ? shop.phone.replace(/[^0-9]/g, '') : '';
    const amountStr = formatCurrency(shop.mrr || (shop.plan === 'enterprise' ? 249000 : shop.plan === 'basic' ? 129000 : 189000));
    
    let intro = `💈 *Hola, ${ownerName}!* Te saludamos del equipo de *ChairPro SaaS*.`;
    let body = '';

    if (info.daysRemaining < 0) {
      body = `⚠️ Te informamos que la mensualidad de tu plataforma *${shop.name}* presentó vencimiento el pasado *${shop.nextBillingDate}* (${Math.abs(info.daysRemaining)} días en mora).
      
El valor a renovar es de *${amountStr}* (Plan ${shop.plan.toUpperCase()}).`;
    } else if (info.daysRemaining <= 7) {
      body = `🔔 Te recordamos que la mensualidad de tu plataforma *${shop.name}* vence en *${info.daysRemaining} días* (el próximo *${shop.nextBillingDate}*).
      
El valor de renovación es de *${amountStr}* (Plan ${shop.plan.toUpperCase()}).`;
    } else {
      body = `ℹ️ Tu suscripción para *${shop.name}* está activa hasta el *${shop.nextBillingDate}*.
      
Valor de tu plan: *${amountStr}* mensual.`;
    }

    const accounts = `
💳 *MÉTODOS DE PAGO DISPONIBLES:*
• *Nequi / Daviplata:* 300 123 4567
• *Bancolombia Ahorros:* 123-456789-00
• *Titular:* ChairPro SaaS Colombia

Una vez realices el pago, envíanos el comprobante por este medio para renovar tu acceso inmediatamente. ¡Gracias por confiar en nosotros! 🚀`;

    const fullMessage = `${intro}\n\n${body}\n${accounts}`;
    const encoded = encodeURIComponent(fullMessage);
    const whatsappUrl = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;

    window.open(whatsappUrl, '_blank');
  };

  // Generate Receipt WhatsApp Message
  const getReceiptWhatsAppMessage = (payment: SaasPayment, shop: Barbershop) => {
    return `🧾 *COMPROBANTE DE PAGO OFICIAL — CHAIRPRO SAAS*

🏢 *Empresa:* ${shop.name}
👤 *Titular:* ${shop.ownerName || 'Admin'}
💰 *Valor Pagado:* ${formatCurrency(payment.amount)} COP
📅 *Fecha de Pago:* ${payment.date}
🗓️ *Período Amparado:* ${payment.billingPeriodStart} al ${payment.billingPeriodEnd}
💳 *Medio de Pago:* ${payment.paymentMethod.toUpperCase()}
🔖 *Referencia / Comprobante:* ${payment.reference || 'N/A'}
👑 *Registrado por:* ${payment.recordedBy}
✅ *Estado:* APROBADO & RENOVADO

Tu plataforma *${shop.name}* se encuentra 100% activa en la nube hasta el *${payment.billingPeriodEnd}*. ¡Gracias por tu puntualidad! 💈`;
  };

  // Create New Barbershop handler
  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug || !formData.ownerEmail) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/superadmin/create-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Error al crear la barbería');
      }

      const defaultNextBilling = format(addDays(new Date(), 30), 'yyyy-MM-dd');
      const newShop: Barbershop = {
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
        nextBillingDate: defaultNextBilling,
        lastPaymentDate: format(new Date(), 'yyyy-MM-dd'),
        subscriptionStatus: 'active',
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

  const openAccessCardForShop = (shop: Barbershop) => {
    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://saas-barberias.netlify.app';
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

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'nequi':
        return <span className="badge text-[10px] bg-pink-500/20 text-pink-400 border-pink-500/30">Nequi</span>;
      case 'daviplata':
        return <span className="badge text-[10px] bg-red-500/20 text-red-400 border-red-500/30">Daviplata</span>;
      case 'transferencia':
      case 'banco':
        return <span className="badge text-[10px] bg-blue-500/20 text-blue-400 border-blue-500/30">Transferencia</span>;
      case 'efectivo':
        return <span className="badge text-[10px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Efectivo</span>;
      default:
        return <span className="badge text-[10px] bg-zinc-800 text-zinc-300">{method}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-200 shadow-2xl text-xs sm:text-sm flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/15 via-zinc-900 to-zinc-900 border border-amber-500/30 p-6 rounded-2xl shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="badge px-2.5 py-1 text-xs font-bold bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm flex items-center gap-1.5">
              👑 SuperAdmin SaaS
            </span>
            <span className="badge px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Supabase Realtime Sync Activo
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold font-display text-zinc-100">
            Control de Barberías & Gestión de Mensualidades
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Monitorea el estado de suscripción en tiempo real, registra cobros por Nequi/Daviplata/Banco, envía recordatorios automáticos por WhatsApp y emite comprobantes oficiales.
          </p>
        </div>

        <div className="flex items-center gap-2.5 relative z-10 shrink-0 flex-wrap">
          <button
            onClick={() => {
              if (shops.length > 0) openRecordPaymentModal(shops[0]);
            }}
            className="btn-primary py-2.5 px-4 flex items-center gap-2 text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-transform hover:scale-105"
          >
            <CreditCard className="w-4 h-4" />
            <span>Registrar Pago</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary py-2.5 px-4 flex items-center gap-2 text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-lg transition-transform hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Barbería</span>
          </button>
        </div>
      </div>

      {/* SaaS Subscription KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="kpi-card bg-zinc-900/90 border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="stat-label">Recaudado este Mes</span>
            <Receipt className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl lg:text-2xl font-bold text-emerald-400 mt-1">
            {formatCurrency(subscriptionStats.collectedThisMonth)}
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Cobros de suscripción registrados</div>
        </div>

        <div className="kpi-card bg-zinc-900/90 border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="stat-label">MRR Proyectado</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl lg:text-2xl font-bold text-amber-400 mt-1">
            {formatCurrency(kpis.totalMRR)}
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">{shops.length} barberías suscritas</div>
        </div>

        <div className="kpi-card bg-zinc-900/90 border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="stat-label">Al Día</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl lg:text-2xl font-bold text-emerald-400 mt-1">
            {subscriptionStats.activeCount} <span className="text-xs text-zinc-500 font-normal">empresas</span>
          </div>
          <div className="text-[10px] text-emerald-500/80 mt-0.5">Vencimiento mayor a 7 días</div>
        </div>

        <div className="kpi-card bg-zinc-900/90 border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="stat-label">Por Vencer</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl lg:text-2xl font-bold text-amber-400 mt-1">
            {subscriptionStats.expiringSoonCount} <span className="text-xs text-zinc-500 font-normal">empresas</span>
          </div>
          <div className="text-[10px] text-amber-500/80 mt-0.5">Vencen en menos de 7 días</div>
        </div>

        <div className="kpi-card bg-zinc-900/90 border-zinc-800 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="stat-label">Vencidas / En Mora</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-xl lg:text-2xl font-bold text-red-400 mt-1">
            {subscriptionStats.overdueCount} <span className="text-xs text-zinc-500 font-normal">empresas</span>
          </div>
          <div className="text-[10px] text-red-500/80 mt-0.5">Requieren cobro inmediato</div>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex border-b border-zinc-800 bg-zinc-900/40 rounded-xl p-1.5 gap-2">
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'subscriptions'
              ? 'bg-amber-500 text-zinc-950 font-bold shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Control de Mensualidades & Vencimientos ({shops.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'history'
              ? 'bg-amber-500 text-zinc-950 font-bold shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Historial de Pagos & Recibos ({saasPayments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('shops')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'shops'
              ? 'bg-amber-500 text-zinc-950 font-bold shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Empresas & Barberías ({shops.length})</span>
        </button>
      </div>

      {/* TAB 1: CONTROL DE MENSUALIDADES & VENCIMIENTOS */}
      {activeTab === 'subscriptions' && (
        <div className="card p-5 border-zinc-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-400" />
                Semáforo de Pagos & Vencimiento de Mensualidades
              </h2>
              <p className="text-xs text-zinc-400">
                Lleva el control exacto de quién pagó, fecha de vencimiento y genera cobros por WhatsApp en 1 clic.
              </p>
            </div>

            {/* Quick status filters */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs border transition-all ${
                  statusFilter === 'all'
                    ? 'bg-zinc-800 text-white font-bold border-zinc-600'
                    : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                Todos ({shops.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1 rounded-lg text-xs border transition-all ${
                  statusFilter === 'active'
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border-emerald-500/40'
                    : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-emerald-300'
                }`}
              >
                🟢 Al Día ({subscriptionStats.activeCount})
              </button>
              <button
                onClick={() => setStatusFilter('expiring_soon')}
                className={`px-3 py-1 rounded-lg text-xs border transition-all ${
                  statusFilter === 'expiring_soon'
                    ? 'bg-amber-500/20 text-amber-300 font-bold border-amber-500/40'
                    : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-amber-300'
                }`}
              >
                🟡 Por Vencer ({subscriptionStats.expiringSoonCount})
              </button>
              <button
                onClick={() => setStatusFilter('overdue')}
                className={`px-3 py-1 rounded-lg text-xs border transition-all ${
                  statusFilter === 'overdue'
                    ? 'bg-red-500/20 text-red-300 font-bold border-red-500/40'
                    : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-red-300'
                }`}
              >
                🔴 En Mora ({subscriptionStats.overdueCount})
              </button>
            </div>
          </div>

          {/* Subscriptions Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider bg-zinc-950/40">
                  <th className="py-3 px-4">Barbería / Empresa</th>
                  <th className="py-3 px-4">Plan & Mensualidad</th>
                  <th className="py-3 px-4">Último Pago</th>
                  <th className="py-3 px-4">Próximo Vencimiento</th>
                  <th className="py-3 px-4">Estado de Cuenta</th>
                  <th className="py-3 px-4 text-right">Acciones de Cobro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredShops.map((shop) => {
                  const info = getSubscriptionInfo(shop);
                  const lastPayment = saasPayments.find((p) => p.tenantId === shop.id);
                  const primaryHex = shop.theme?.primaryColor || '#7c3aed';

                  return (
                    <tr key={shop.id} className="hover:bg-zinc-900/60 transition-colors">
                      {/* Shop Name & Logo */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 shadow"
                            style={{ backgroundColor: primaryHex }}
                          >
                            {shop.theme?.logoUrl || '✂️'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-zinc-100 truncate">{shop.name}</div>
                            <div className="text-[11px] text-zinc-400 flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 text-zinc-500" />
                              <span>{shop.city} • {shop.ownerName || 'Dueño'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Plan & Amount */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-zinc-200">
                          {formatCurrency(shop.mrr || (shop.plan === 'enterprise' ? 249000 : shop.plan === 'basic' ? 129000 : 189000))}
                        </div>
                        <div className="text-[10px] text-amber-400 font-semibold uppercase">
                          Plan {shop.plan}
                        </div>
                      </td>

                      {/* Last Payment */}
                      <td className="py-3 px-4">
                        {shop.lastPaymentDate ? (
                          <div>
                            <div className="font-medium text-zinc-200">{shop.lastPaymentDate}</div>
                            {lastPayment && (
                              <div className="mt-0.5">{getMethodBadge(lastPayment.paymentMethod)}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-500 italic text-[11px]">Sin registro</span>
                        )}
                      </td>

                      {/* Next Billing & Days Remaining */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-zinc-100">{info.nextDate}</span>
                          <button
                            onClick={() =>
                              setEditExpirationModal({
                                isOpen: true,
                                shop,
                                newDate: shop.nextBillingDate || format(addDays(new Date(), 30), 'yyyy-MM-dd'),
                              })
                            }
                            className="text-zinc-500 hover:text-amber-400 p-1 rounded"
                            title="Editar fecha de vencimiento manualmente"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className={`text-[11px] font-medium mt-0.5 ${info.textClass}`}>
                          {info.daysRemaining < 0
                            ? `⚠️ En mora hace ${Math.abs(info.daysRemaining)} días`
                            : info.daysRemaining === 0
                            ? `🚨 Vence hoy`
                            : `${info.daysRemaining} días de servicio restantes`}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4">
                        <span className={`badge text-[11px] font-bold px-2.5 py-1 ${info.badgeClass}`}>
                          {info.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openRecordPaymentModal(shop)}
                            className="btn-primary py-1 px-2.5 text-xs font-semibold flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white shadow"
                            title="Registrar cobro de mensualidad"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Cobrar</span>
                          </button>

                          <button
                            onClick={() => openWhatsAppReminder(shop)}
                            className="p-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                            title="Enviar Recordatorio por WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              switchShop(shop.id);
                              router.push('/dashboard');
                            }}
                            className="p-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                            title="Entrar a Gestionar"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: HISTORIAL DE PAGOS & RECIBOS */}
      {activeTab === 'history' && (
        <div className="card p-5 border-zinc-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                Historial de Recaudos & Comprobantes de Pago SaaS ({filteredPayments.length})
              </h2>
              <p className="text-xs text-zinc-400">
                Auditoría completa de transferencias, Nequi, Daviplata y pagos en efectivo recibidos de cada barbería.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por barbería o referencia..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-9 text-xs w-48 sm:w-60 bg-zinc-950/60"
                />
              </div>

              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="input text-xs py-1.5 bg-zinc-950/60 w-36"
              >
                <option value="all">Todos los métodos</option>
                <option value="nequi">Nequi</option>
                <option value="daviplata">Daviplata</option>
                <option value="transferencia">Transferencia</option>
                <option value="efectivo">Efectivo</option>
              </select>
            </div>
          </div>

          {/* History Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider bg-zinc-950/40">
                  <th className="py-3 px-4">ID & Fecha</th>
                  <th className="py-3 px-4">Barbería</th>
                  <th className="py-3 px-4">Período Cubierto</th>
                  <th className="py-3 px-4">Monto</th>
                  <th className="py-3 px-4">Método & Referencia</th>
                  <th className="py-3 px-4">Registrado Por</th>
                  <th className="py-3 px-4 text-right">Comprobante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-zinc-500">
                      No se encontraron pagos registrados con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => {
                    const shop = shops.find((s) => s.id === payment.tenantId);

                    return (
                      <tr key={payment.id} className="hover:bg-zinc-900/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-zinc-200">{payment.date}</div>
                          <div className="text-[10px] text-zinc-500 font-mono">{payment.id.slice(0, 10)}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-zinc-100">{payment.tenantName}</div>
                          <div className="text-[10px] text-zinc-400">{shop?.city || 'Colombia'}</div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-mono text-zinc-300">
                            {payment.billingPeriodStart} → {payment.billingPeriodEnd}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-bold text-emerald-400 text-sm">
                            {formatCurrency(payment.amount)}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            {getMethodBadge(payment.paymentMethod)}
                            <span className="font-mono text-[11px] text-zinc-300">{payment.reference || 'Sin ref'}</span>
                          </div>
                          {payment.notes && (
                            <div className="text-[10px] text-zinc-500 mt-0.5 truncate max-w-[180px]">
                              {payment.notes}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span className="text-zinc-400 text-[11px]">{payment.recordedBy}</span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() =>
                              setReceiptModal({
                                isOpen: true,
                                payment,
                                shop: shop || null,
                              })
                            }
                            className="btn-secondary py-1 px-2.5 text-xs font-semibold flex items-center gap-1 ml-auto text-zinc-200 hover:text-white"
                          >
                            <Receipt className="w-3.5 h-3.5 text-amber-400" />
                            <span>Ver Recibo</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: EMPRESAS & BARBERÍAS (Original Tenant Cards) */}
      {activeTab === 'shops' && (
        <div className="card p-5 border-zinc-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                Empresas & Barberías Registradas ({filteredShops.length})
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
              const info = getSubscriptionInfo(shop);

              return (
                <div
                  key={shop.id}
                  className={`card p-5 transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                    isSelected ? 'border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/30' : 'hover:border-zinc-700'
                  }`}
                >
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: primaryHex }} />

                  <div>
                    {/* Header */}
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

                      <span className={`badge text-[10px] font-bold ${info.badgeClass}`}>
                        {info.label}
                      </span>
                    </div>

                    {/* Owner & Plan info */}
                    <div className="bg-zinc-800/40 rounded-lg p-2.5 mb-3 text-xs space-y-1.5">
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
                      <div className="flex items-center justify-between text-zinc-400 border-t border-zinc-700/50 pt-1.5">
                        <span>Próx. Vencimiento:</span>
                        <span className="font-mono font-bold text-zinc-200">{info.nextDate}</span>
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
                    <div className="flex items-center gap-1.5">
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
                        onClick={() => openRecordPaymentModal(shop)}
                        className="btn-secondary btn-sm p-2 text-emerald-400 hover:text-white"
                        title="Registrar pago de mensualidad"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
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
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          MODAL 1: REGISTRAR PAGO DE MENSUALIDAD
      ──────────────────────────────────────────────────────────────────────── */}
      {paymentModal.isOpen && paymentModal.shop && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  Registrar Pago de Mensualidad
                </h3>
                <p className="text-xs text-zinc-400">
                  {paymentModal.shop.name} ({paymentModal.shop.city})
                </p>
              </div>
              <button
                onClick={() => setPaymentModal((prev) => ({ ...prev, isOpen: false }))}
                className="btn-icon p-1.5"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-4">
              <div className="bg-zinc-800/40 p-3 rounded-xl border border-zinc-800 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Plan actual:</span>
                  <span className="text-amber-400 font-bold uppercase">{paymentModal.shop.plan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Vencimiento registrado:</span>
                  <span className="text-zinc-200 font-mono">{paymentModal.shop.nextBillingDate || 'Sin fecha'}</span>
                </div>
              </div>

              {/* Monto & Medio de Pago */}
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="label">Monto Recaudado (COP) *</label>
                  <input
                    type="number"
                    required
                    className="input font-mono font-bold text-emerald-400"
                    value={paymentModal.amount}
                    onChange={(e) => setPaymentModal({ ...paymentModal, amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="form-group">
                  <label className="label">Método de Pago *</label>
                  <select
                    className="input"
                    value={paymentModal.paymentMethod}
                    onChange={(e) =>
                      setPaymentModal({
                        ...paymentModal,
                        paymentMethod: e.target.value as SaasPayment['paymentMethod'],
                      })
                    }
                  >
                    <option value="nequi">Nequi</option>
                    <option value="daviplata">Daviplata</option>
                    <option value="transferencia">Transferencia Bancolombia / Banco</option>
                    <option value="efectivo">Efectivo</option>
                  </select>
                </div>
              </div>

              {/* Fechas de Cobertura */}
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="label">Fecha del Pago *</label>
                  <input
                    type="date"
                    required
                    className="input font-mono"
                    value={paymentModal.date}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setPaymentModal({
                        ...paymentModal,
                        date: newDate,
                        billingPeriodStart: newDate,
                        billingPeriodEnd: format(addDays(new Date(newDate), paymentModal.autoDays), 'yyyy-MM-dd'),
                      });
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="label">Nuevo Vencimiento (+30 días) *</label>
                  <input
                    type="date"
                    required
                    className="input font-mono font-bold text-amber-400"
                    value={paymentModal.billingPeriodEnd}
                    onChange={(e) => setPaymentModal({ ...paymentModal, billingPeriodEnd: e.target.value })}
                  />
                </div>
              </div>

              {/* Referencia & Notas */}
              <div className="form-group">
                <label className="label">Número de Comprobante / Referencia</label>
                <input
                  type="text"
                  className="input font-mono text-xs"
                  placeholder="Ej: NEQ-9823412 o Recibo #102"
                  value={paymentModal.reference}
                  onChange={(e) => setPaymentModal({ ...paymentModal, reference: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="label">Notas / Observaciones</label>
                <input
                  type="text"
                  className="input text-xs"
                  placeholder="Ej: Pago puntual mensualidad Plan Pro"
                  value={paymentModal.notes}
                  onChange={(e) => setPaymentModal({ ...paymentModal, notes: e.target.value })}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setPaymentModal((prev) => ({ ...prev, isOpen: false }))}
                  className="btn-secondary py-2 px-4 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary py-2 px-5 text-xs font-bold flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span>Confirmar y Renovar (+30 días)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          MODAL 2: COMPROBANTE OFICIAL / RECIBO DE PAGO DIGITAL
      ──────────────────────────────────────────────────────────────────────── */}
      {receiptModal.isOpen && receiptModal.payment && receiptModal.shop && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-zinc-100">Recibo de Pago Oficial</h3>
              </div>
              <button
                onClick={() => setReceiptModal({ isOpen: false, payment: null, shop: null })}
                className="btn-icon p-1.5"
              >
                ✕
              </button>
            </div>

            {/* Receipt Voucher Body */}
            <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 shadow-inner space-y-4 font-sans text-xs">
              {/* Header */}
              <div className="text-center border-b border-zinc-800 pb-3">
                <div className="text-sm font-bold text-zinc-100 tracking-wider">CHAIRPRO SAAS COLOMBIA</div>
                <div className="text-[10px] text-zinc-500">Comprobante de Recaudo de Mensualidad</div>
                <div className="mt-1 badge bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] font-bold">
                  ✓ ESTADO: PAGADO / APROBADO
                </div>
              </div>

              {/* Data Rows */}
              <div className="space-y-2 text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Recibo No:</span>
                  <span className="font-mono font-bold text-zinc-100">{receiptModal.payment.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Fecha de Pago:</span>
                  <span className="font-mono text-zinc-200">{receiptModal.payment.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Barbería / Empresa:</span>
                  <span className="font-bold text-zinc-100">{receiptModal.shop.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Titular:</span>
                  <span className="text-zinc-200">{receiptModal.shop.ownerName || 'Admin'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Período Amparado:</span>
                  <span className="font-mono text-amber-400 font-bold">
                    {receiptModal.payment.billingPeriodStart} al {receiptModal.payment.billingPeriodEnd}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Método de Pago:</span>
                  <span className="capitalize text-zinc-200 font-medium">{receiptModal.payment.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Referencia:</span>
                  <span className="font-mono text-zinc-300">{receiptModal.payment.reference || 'Sin ref'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Registrado por:</span>
                  <span className="text-zinc-400">{receiptModal.payment.recordedBy}</span>
                </div>
              </div>

              {/* Total Box */}
              <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 flex items-center justify-between">
                <span className="font-bold text-zinc-200">TOTAL PAGADO:</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">
                  {formatCurrency(receiptModal.payment.amount)} COP
                </span>
              </div>
            </div>

            {/* Actions: Send to WhatsApp & Copy */}
            <div className="pt-4 space-y-2">
              <button
                type="button"
                onClick={() => {
                  const phone = receiptModal.shop?.phone ? receiptModal.shop.phone.replace(/[^0-9]/g, '') : '';
                  const msg = getReceiptWhatsAppMessage(receiptModal.payment!, receiptModal.shop!);
                  const encoded = encodeURIComponent(msg);
                  window.open(phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`, '_blank');
                }}
                className="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar Comprobante por WhatsApp</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const msg = getReceiptWhatsAppMessage(receiptModal.payment!, receiptModal.shop!);
                    handleCopy(msg, 'receipt_copy');
                  }}
                  className="btn-secondary flex-1 py-2 text-xs flex items-center justify-center gap-1.5"
                >
                  {copiedKey === 'receipt_copy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'receipt_copy' ? '¡Copiado!' : 'Copiar Texto del Recibo'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-secondary py-2 px-3 text-xs flex items-center justify-center gap-1.5"
                  title="Imprimir Recibo"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          MODAL 3: EDITAR FECHA DE VENCIMIENTO MANUALMENTE
      ──────────────────────────────────────────────────────────────────────── */}
      {editExpirationModal.isOpen && editExpirationModal.shop && (
        <div className="modal-overlay">
          <div className="modal-content max-w-sm p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                Ajustar Vencimiento
              </h3>
              <button
                onClick={() => setEditExpirationModal({ isOpen: false, shop: null, newDate: '' })}
                className="btn-icon p-1.5"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveExpirationDate} className="space-y-4">
              <div className="text-xs text-zinc-300">
                Ajusta la fecha de vencimiento para <strong>{editExpirationModal.shop.name}</strong> en caso de prórroga o arreglo especial.
              </div>

              <div className="form-group">
                <label className="label">Nueva Fecha de Vencimiento</label>
                <input
                  type="date"
                  required
                  className="input font-mono font-bold text-amber-400"
                  value={editExpirationModal.newDate}
                  onChange={(e) => setEditExpirationModal({ ...editExpirationModal, newDate: e.target.value })}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditExpirationModal({ isOpen: false, shop: null, newDate: '' })}
                  className="btn-secondary py-2 px-3 text-xs"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary py-2 px-4 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950">
                  Guardar Fecha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          MODAL 4: DAR DE ALTA NUEVA BARBERÍA
      ──────────────────────────────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
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

            <form onSubmit={handleCreateShop} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="label">Nombre de la Barbería *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Barbería El Patrón"
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = name
                        .toLowerCase()
                        .trim()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/[^a-z0-9]/g, '-')
                        .replace(/-+/g, '-');
                      setFormData({ ...formData, name, slug });
                    }}
                    className="input text-xs"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Slug URL / Identificador *</label>
                  <div className="flex items-center rounded-xl border border-zinc-700 bg-zinc-950 px-2.5">
                    <span className="text-[11px] text-zinc-500 font-mono">/booking/</span>
                    <input
                      type="text"
                      required
                      placeholder="el-patron"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      className="bg-transparent border-0 text-xs font-mono text-amber-400 focus:ring-0 p-1.5 w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="label">Nombre del Dueño / Administrador *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Mateo Gómez"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="input text-xs"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Teléfono / WhatsApp de Contacto</label>
                  <input
                    type="text"
                    placeholder="+57 300 123 4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="label">Correo Electrónico (Acceso al SaaS) *</label>
                  <input
                    type="email"
                    required
                    placeholder="dueño@barberia.com"
                    value={formData.ownerEmail}
                    onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                    className="input text-xs font-mono"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Contraseña Inicial (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Auto-generada si queda vacío"
                    value={formData.ownerPassword}
                    onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })}
                    className="input text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="label">Ciudad</label>
                  <input
                    type="text"
                    placeholder="Bogotá, Medellín, etc."
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="input text-xs"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Plan SaaS Mensual</label>
                  <select
                    value={formData.plan}
                    onChange={(e) => setFormData({ ...formData, plan: e.target.value as any })}
                    className="input text-xs"
                  >
                    <option value="basic">Básico ($129.000/mes)</option>
                    <option value="pro">Pro ($189.000/mes) - Recomendado</option>
                    <option value="enterprise">Enterprise VIP ($249.000/mes)</option>
                  </select>
                </div>
              </div>

              {/* Color Preset */}
              <div className="form-group">
                <label className="label">Color de Marca Inicial</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => setFormData({ ...formData, primaryColor: preset.hex })}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all ${
                        formData.primaryColor === preset.hex
                          ? 'border-white bg-zinc-800 text-white font-bold scale-105'
                          : 'border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.hex }} />
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary py-2 px-4 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary py-2 px-5 text-xs font-bold flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-lg"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>Crear Empresa y Generar Accesos</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          MODAL 5: FICHA DE ACCESOS Y ENTREGA POR WHATSAPP
      ──────────────────────────────────────────────────────────────────────── */}
      {accessCardModal && accessCardModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  👑
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-100">Ficha de Acceso Oficial</h3>
                  <p className="text-xs text-zinc-400">{accessCardModal.shopName}</p>
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
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/80 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Barbería:</span>
                  <span className="font-bold text-zinc-100">{accessCardModal.shopName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Titular / Dueño:</span>
                  <span className="text-zinc-200">{accessCardModal.ownerName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Usuario de Ingreso:</span>
                  <span className="font-mono text-amber-400 font-bold">{accessCardModal.email}</span>
                </div>
                {accessCardModal.password && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Contraseña Asignada:</span>
                    <span className="font-mono text-emerald-400 font-bold">{accessCardModal.password}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">URL Panel Dueño:</span>
                  <span className="font-mono text-zinc-300 text-[11px] truncate max-w-[200px]">{accessCardModal.loginUrl}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">URL Reservas Clientes:</span>
                  <span className="font-mono text-zinc-300 text-[11px] truncate max-w-[200px]">{accessCardModal.bookingUrl}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    const phone = accessCardModal.phone ? accessCardModal.phone.replace(/[^0-9]/g, '') : '';
                    const encoded = encodeURIComponent(accessCardModal.whatsappMessage);
                    window.open(phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`, '_blank');
                  }}
                  className="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar Accesos por WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(accessCardModal.whatsappMessage, 'card_copy')}
                  className="btn-secondary w-full py-2 text-xs flex items-center justify-center gap-2"
                >
                  {copiedKey === 'card_copy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'card_copy' ? '¡Mensaje Copiado al Portapapeles!' : 'Copiar Texto Completo para WhatsApp'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
