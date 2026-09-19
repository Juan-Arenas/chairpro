'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { useSupabaseRealtime } from '@/lib/supabase/realtime';
import { fetchShopBySlug, fetchTenantData } from '@/lib/supabase/queries';
import { demoBarbershop, demoServices, demoBarbers } from '@/lib/demo-data';
import { formatCurrency, getInitials, formatTime } from '@/lib/utils';
import { format, addDays, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Scissors, Calendar, Clock, User, Phone, Mail, CheckCircle2,
  MapPin, Star, QrCode as QrIcon, MessageCircle, ChevronRight,
  Search, AlertCircle, Sparkles, ShieldCheck, ArrowRight
} from 'lucide-react';
import dynamic from 'next/dynamic';
import type { Barbershop, Barber, Service } from '@/types';
import { ShopLogo } from '@/components/shared/ShopLogo';

const QRCodeCanvas = dynamic(() => import('qrcode.react').then(m => m.QRCodeCanvas), { ssr: false });

function BookingContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawShopId = (params?.shopId as string) || 'the-black-chair';

  const initialBarberParam = searchParams?.get('barber') || '';
  const initialServiceParam = searchParams?.get('service') || '';

  const {
    shops,
    barbers: storeBarbers,
    services: storeServices,
    appointments,
    clients,
    currentShop,
    createAppointment,
    findOrCreateClient,
    getAvailableSlots,
  } = useStore();

  const [fetchedShop, setFetchedShop] = useState<Barbershop | null>(null);
  const [fetchedBarbers, setFetchedBarbers] = useState<Barber[]>([]);
  const [fetchedServices, setFetchedServices] = useState<Service[]>([]);

  // Fetch shop and services directly from Supabase if not in local store
  useEffect(() => {
    async function loadTenant() {
      try {
        const found = await fetchShopBySlug(rawShopId);
        if (found) {
          setFetchedShop(found);
          const data = await fetchTenantData(found.id);
          if (data.barbers?.length) setFetchedBarbers(data.barbers);
          if (data.services?.length) setFetchedServices(data.services);
        }
      } catch (err) {
        console.warn('Could not fetch tenant live:', err);
      }
    }
    loadTenant();
  }, [rawShopId]);

  // Find the matching barbershop by slug or ID
  const shop = useMemo(() => {
    return (
      fetchedShop ||
      shops.find((s) => s.slug === rawShopId || s.id === rawShopId) ||
      (currentShop?.slug === rawShopId ? currentShop : null) ||
      (rawShopId === 'the-black-chair' ? demoBarbershop : null) ||
      shops[0] ||
      currentShop ||
      demoBarbershop
    );
  }, [fetchedShop, shops, rawShopId, currentShop]);

  // Sincronización en vivo con Supabase
  useSupabaseRealtime(shop?.id);

  const primaryColor = shop?.theme?.primaryColor || '#7c3aed';
  const logoEmoji = shop?.theme?.logoUrl || '✂️';
  const isLight = shop?.theme?.mode === 'light';
  const bgType = shop?.theme?.backgroundType || 'gradient';
  const bgImage = shop?.theme?.backgroundImage;
  const bgOpacity = shop?.theme?.backgroundOpacity ?? 0.15;

  // Tabs: 'book' | 'lookup'
  const [activeTab, setActiveTab] = useState<'book' | 'lookup'>('book');

  // Filter services and barbers for this shop
  const shopServices = useMemo(() => {
    if (fetchedServices.length > 0) return fetchedServices.filter(s => s.isActive);
    const fromStore = storeServices.filter((s) => (s.shopId === shop?.id || s.shopId === 'shop_demo') && s.isActive);
    return fromStore.length > 0 ? fromStore : demoServices;
  }, [fetchedServices, storeServices, shop?.id]);

  const shopBarbers = useMemo(() => {
    if (fetchedBarbers.length > 0) return fetchedBarbers.filter(b => b.isActive);
    const fromStore = storeBarbers.filter((b) => (b.shopId === shop?.id || b.shopId === 'shop_demo') && b.isActive);
    return fromStore.length > 0 ? fromStore : demoBarbers;
  }, [fetchedBarbers, storeBarbers, shop?.id]);

  // QR Pre-selection state
  const [selectedServiceId, setSelectedServiceId] = useState<string>(initialServiceParam);
  const [selectedBarberId, setSelectedBarberId] = useState<string>(initialBarberParam);
  const [lockedFromQr, setLockedFromQr] = useState<boolean>(!!initialBarberParam);

  // Step Calculation:
  // If both Barber and Service were in the QR -> Jump straight to Step 3 (Date/Time)
  // If Service was in QR -> Jump to Step 2 (Barber)
  // If Barber was in QR -> Start at Step 1 (Service), and choosing a service skips Step 2 directly to Step 3!
  const [step, setStep] = useState<number>(() => {
    if (initialBarberParam && initialServiceParam) return 3;
    if (initialServiceParam) return 2;
    return 1;
  });

  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Client Form
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [confirmedAppt, setConfirmedAppt] = useState<any>(null);

  // Lookup Form
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupResults, setLookupResults] = useState<any[] | null>(null);

  // Sync when searchParams change
  useEffect(() => {
    if (initialBarberParam) {
      setSelectedBarberId(initialBarberParam);
      setLockedFromQr(true);
      if (initialServiceParam) {
        setSelectedServiceId(initialServiceParam);
        setStep(3);
      }
    } else if (initialServiceParam) {
      setSelectedServiceId(initialServiceParam);
      setStep(2);
    }
  }, [initialBarberParam, initialServiceParam]);

  const selectedService = shopServices.find((s) => s.id === selectedServiceId);
  const selectedBarber = shopBarbers.find((b) => b.id === selectedBarberId);

  // Available dates (next 10 days)
  const availableDates = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => {
      const d = addDays(new Date(), i);
      return {
        dateStr: format(d, 'yyyy-MM-dd'),
        dayName: format(d, 'EEE', { locale: es }),
        dayNum: format(d, 'd'),
        monthName: format(d, 'MMM', { locale: es }),
        isToday: isToday(d),
        isTomorrow: isTomorrow(d),
      };
    });
  }, []);

  // Available slots for selected barber and date
  const availableSlots = useMemo(() => {
    if (!selectedDate || !selectedService) return [];
    
    // If 'any' barber is selected (or none explicitly chosen)
    if (selectedBarberId === 'any' || !selectedBarberId) {
      const slotsSet = new Set<string>();
      const activeBarbers = shopBarbers.length > 0 ? shopBarbers : [{ id: 'barber_carlos' } as any];
      
      activeBarbers.forEach((b: any) => {
        const bSlots = getAvailableSlots(b.id, selectedDate, selectedService.duration);
        bSlots.forEach((s: string) => slotsSet.add(s));
      });
      
      const sorted = Array.from(slotsSet).sort();
      if (sorted.length > 0) return sorted;

      const isTodayDate = selectedDate === format(new Date(), 'yyyy-MM-dd');
      if (!isTodayDate) {
        return ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'];
      }
      return [];
    }

    // Specific barber selected
    const slots = getAvailableSlots(selectedBarberId, selectedDate, selectedService.duration);
    if (slots.length > 0) return slots;

    const isTodayDate = selectedDate === format(new Date(), 'yyyy-MM-dd');
    if (!isTodayDate) {
      return ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
    }
    return [];
  }, [selectedBarberId, selectedDate, selectedService, shopBarbers, getAvailableSlots]);

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedTime || !clientName || !clientPhone || !shop) return;

    // Resolve barber if 'any' was selected: pick the first barber free at that specific slot
    const barberIdToAssign = (selectedBarberId === 'any' || !selectedBarberId)
      ? (shopBarbers.find(b => {
          const bSlots = getAvailableSlots(b.id, selectedDate, selectedService.duration);
          return bSlots.includes(selectedTime);
        })?.id || shopBarbers[0]?.id)
      : selectedBarberId;
    const barberObj = shopBarbers.find((b) => b.id === barberIdToAssign) || shopBarbers[0];

    // Find or create client
    const client = findOrCreateClient(clientPhone, clientName, clientEmail);

    // Calculate end time
    const startMins = parseInt(selectedTime.split(':')[0]) * 60 + parseInt(selectedTime.split(':')[1]);
    const endMins = startMins + selectedService.duration;
    const endHours = Math.floor(endMins / 60).toString().padStart(2, '0');
    const endRemainder = (endMins % 60).toString().padStart(2, '0');
    const endTime = `${endHours}:${endRemainder}`;

    const newAppt = createAppointment({
      shopId: shop.id,
      clientId: client.id,
      barberId: barberObj.id,
      serviceId: selectedService.id,
      date: selectedDate,
      startTime: selectedTime,
      endTime,
      status: 'confirmed',
      source: 'online',
      price: selectedService.price,
      notes: clientNotes ? `Nota del cliente: ${clientNotes}` : undefined,
    });

    setConfirmedAppt({
      appt: newAppt,
      barber: barberObj,
      service: selectedService,
      date: format(new Date(selectedDate + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es }),
      time: selectedTime,
      endTime,
    });

    setStep(5);
  };

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = lookupPhone.replace(/\D/g, '').trim();
    if (!clean) return;

    // Match by phone or email
    const matchedClient = clients.find(
      (c) =>
        c.shopId === shop?.id &&
        (c.phone.replace(/\D/g, '').includes(clean) ||
          clean.includes(c.phone.replace(/\D/g, '')) ||
          c.email?.toLowerCase().includes(lookupPhone.toLowerCase()))
    );

    if (matchedClient) {
      const clientAppts = appointments
        .filter((a) => a.clientId === matchedClient.id && a.shopId === shop?.id)
        .sort((a, b) => new Date(`${b.date}T${b.startTime}`).getTime() - new Date(`${a.date}T${a.startTime}`).getTime());

      setLookupResults(
        clientAppts.map((a) => ({
          ...a,
          service: shopServices.find((s) => s.id === a.serviceId),
          barber: shopBarbers.find((b) => b.id === a.barberId),
          client: matchedClient,
        }))
      );
    } else {
      setLookupResults([]);
    }
  };

  const shopSlug = shop?.slug || rawShopId;

  return (
    <div
      className={`min-h-screen relative font-sans transition-colors duration-300 ${
        isLight ? 'bg-slate-50 text-slate-900' : 'bg-zinc-950 text-zinc-100'
      }`}
      style={{
        backgroundImage:
          bgType === 'image' && bgImage
            ? `linear-gradient(rgba(9, 9, 11, ${1 - bgOpacity}), rgba(9, 9, 11, ${1 - bgOpacity})), url('${bgImage}')`
            : bgType === 'gradient'
            ? `radial-gradient(ellipse at top, ${primaryColor}22, transparent 60%)`
            : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Top Header */}
      <header
        className={`border-b sticky top-0 z-20 backdrop-blur-md transition-colors ${
          isLight ? 'bg-white/85 border-slate-200 shadow-sm' : 'bg-zinc-900/80 border-zinc-800/80'
        }`}
      >
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShopLogo
              logoUrl={shop?.theme?.logoUrl}
              shopName={shop?.name || 'Barbería'}
              primaryColor={primaryColor}
              size="md"
            />
            <div>
              <h1 className="font-display font-extrabold text-base sm:text-lg leading-tight">
                {shop?.name || 'The Black Chair'}
              </h1>
              <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">{shop?.address || 'Cra 15 # 85-32'}, {shop?.city || 'Bogotá'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {shop?.whatsapp && (
              <a
                href={`https://wa.me/${shop.whatsapp.replace(/[^0-9]/g, '')}?text=Hola%20${encodeURIComponent(
                  shop.name
                )},%20tengo%20una%20pregunta%20sobre%20sus%20servicios.`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 rounded-full shadow-sm hover:border-emerald-500/50"
                title="Escribir por WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline font-semibold">WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex p-1 bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('book')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'book' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            style={activeTab === 'book' ? { borderBottom: `2px solid ${primaryColor}` } : undefined}
          >
            <Calendar className="w-3.5 h-3.5" style={{ color: primaryColor }} />
            <span>Reservar Turno</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('lookup')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'lookup' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            style={activeTab === 'lookup' ? { borderBottom: `2px solid ${primaryColor}` } : undefined}
          >
            <Search className="w-3.5 h-3.5" style={{ color: primaryColor }} />
            <span>Consultar mis Citas</span>
          </button>
        </div>

        {/* TAB 1: BOOKING WIZARD */}
        {activeTab === 'book' && (
          <div
            className={`rounded-2xl border p-5 sm:p-7 shadow-2xl backdrop-blur-md transition-all ${
              isLight ? 'bg-white/95 border-slate-200' : 'bg-zinc-900/85 border-zinc-800/80'
            }`}
          >
            {/* Step Progress Bar */}
            {step < 5 && (
              <div className="mb-6 space-y-2">
                <div className="flex justify-between text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  <span>Paso {step === 1 ? '1: Servicio' : (step === 2 ? '2: Barbero' : (step === 3 ? '2: Fecha y Hora' : '3: Tus Datos'))}</span>
                  <span>{step === 1 ? '25%' : (step === 2 ? '50%' : (step === 3 ? '75%' : '100%'))}</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300 rounded-full"
                    style={{
                      width: step === 1 ? '25%' : (step === 2 ? '50%' : (step === 3 ? '75%' : '100%')),
                      backgroundColor: primaryColor,
                    }}
                  />
                </div>
              </div>
            )}

            {/* STEP 1: SELECT SERVICE */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                {/* QR Lock Barber Banner */}
                {selectedBarber && lockedFromQr && (
                  <div className="p-3 bg-violet-500/10 border border-violet-500/30 rounded-xl flex items-center justify-between text-xs animate-fade-in">
                    <div className="flex items-center gap-2 text-violet-300 font-semibold">
                      <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
                      <span>💈 Reservando directamente con: <strong>{selectedBarber.name}</strong></span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBarberId('any');
                        setLockedFromQr(false);
                      }}
                      className="text-[10px] text-zinc-400 hover:text-white underline"
                    >
                      Cambiar
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <Scissors className="w-4 h-4" style={{ color: primaryColor }} />
                    Elige el servicio que deseas
                  </h2>
                </div>

                <div className="space-y-2.5">
                  {shopServices.map((service) => {
                    const isSelected = selectedServiceId === service.id;
                    return (
                      <div
                        key={service.id}
                        onClick={() => {
                          setSelectedServiceId(service.id);
                        }}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'shadow-md ring-1'
                            : isLight ? 'border-slate-200 hover:border-slate-300 bg-slate-50/50' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/50'
                        }`}
                        style={
                          isSelected
                            ? {
                                borderColor: primaryColor,
                                backgroundColor: `${primaryColor}12`,
                              }
                            : undefined
                        }
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">{service.name}</span>
                            {service.popular && (
                              <span
                                className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                                style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                              >
                                Popular
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{service.description}</p>
                          <div className="flex items-center gap-2 text-xs text-zinc-500 mt-2">
                            <Clock className="w-3 h-3" />
                            <span>{service.duration} minutos</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-bold text-base" style={{ color: primaryColor }}>
                            {formatCurrency(service.price)}
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 ml-auto mt-2 flex items-center justify-center transition-colors ${
                              isSelected ? 'text-white' : 'border-zinc-600'
                            }`}
                            style={isSelected ? { backgroundColor: primaryColor, borderColor: primaryColor } : undefined}
                          >
                            {isSelected && <span className="text-xs">✓</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={!selectedServiceId}
                  onClick={() => {
                    // If a specific barber was selected via QR, skip Step 2 directly to Step 3!
                    if (selectedBarberId && lockedFromQr && selectedBarberId !== 'any') {
                      setStep(3);
                    } else {
                      setStep(2);
                    }
                  }}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 mt-4 transition-transform active:scale-95 disabled:opacity-50"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span>Continuar</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 2: SELECT BARBER (Only shown if NOT pre-locked by QR) */}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <User className="w-4 h-4" style={{ color: primaryColor }} />
                    ¿Con quién te gustaría cortarte?
                  </h2>
                  <button onClick={() => setStep(1)} className="text-xs text-zinc-400 hover:text-zinc-200">
                    Atrás
                  </button>
                </div>

                <div className="space-y-2.5">
                  {/* Any available barber option */}
                  <div
                    onClick={() => {
                      setSelectedBarberId('any');
                      setLockedFromQr(false);
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3.5 ${
                      selectedBarberId === 'any' || !selectedBarberId
                        ? 'shadow-md ring-1'
                        : isLight ? 'border-slate-200 hover:border-slate-300' : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                    style={
                      selectedBarberId === 'any' || !selectedBarberId
                        ? { borderColor: primaryColor, backgroundColor: `${primaryColor}12` }
                        : undefined
                    }
                  >
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-lg text-white font-bold shrink-0"
                      style={{ backgroundColor: primaryColor }}
                    >
                      ⚡
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm">Cualquier Barbero Disponible</div>
                      <div className="text-xs text-zinc-400">El turno más rápido disponible en el horario que elijas</div>
                    </div>
                    {(selectedBarberId === 'any' || !selectedBarberId) && <span className="text-lg font-bold" style={{ color: primaryColor }}>✓</span>}
                  </div>

                  {/* Individual Barbers */}
                  {shopBarbers.map((barber) => {
                    const isSelected = selectedBarberId === barber.id;
                    return (
                      <div
                        key={barber.id}
                        onClick={() => {
                          setSelectedBarberId(barber.id);
                          setLockedFromQr(false);
                        }}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3.5 ${
                          isSelected
                            ? 'shadow-md ring-1'
                            : isLight ? 'border-slate-200 hover:border-slate-300' : 'border-zinc-800 hover:border-zinc-700'
                        }`}
                        style={
                          isSelected
                            ? { borderColor: primaryColor, backgroundColor: `${primaryColor}12` }
                            : undefined
                        }
                      >
                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 shadow"
                          style={{ backgroundColor: barber.color || primaryColor }}
                        >
                          {getInitials(barber.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm">{barber.name}</div>
                          <div className="text-xs text-zinc-400 truncate">{barber.description || 'Especialista en cortes y degradados'}</div>
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {barber.specialties?.map((spec) => (
                              <span key={spec} className="text-[10px] px-2 py-0.5 rounded bg-zinc-800/60 text-zinc-400">
                                {spec}
                              </span>
                            ))}
                          </div>
                        </div>
                        {isSelected && <span className="text-lg font-bold" style={{ color: primaryColor }}>✓</span>}
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn-secondary flex-1 py-3 text-xs font-semibold"
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="btn-primary flex-2 py-3 text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <span>Continuar</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: SELECT DATE & TIME */}
            {step === 3 && (
              <div className="space-y-5 animate-fade-in">
                {/* Barber locked summary banner */}
                {selectedBarber && (
                  <div className="p-3 bg-violet-500/10 border border-violet-500/30 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-violet-300 font-semibold">
                      <div
                        className="w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                        style={{ backgroundColor: selectedBarber.color || primaryColor }}
                      >
                        {getInitials(selectedBarber.name)}
                      </div>
                      <span>Atendido por: <strong>{selectedBarber.name}</strong></span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBarberId('any');
                        setLockedFromQr(false);
                        setStep(2);
                      }}
                      className="text-[10px] text-zinc-400 hover:text-white underline"
                    >
                      Cambiar
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <Calendar className="w-4 h-4" style={{ color: primaryColor }} />
                    Selecciona Fecha y Hora
                  </h2>
                  <button
                    onClick={() => {
                      if (lockedFromQr && selectedBarberId && selectedBarberId !== 'any') {
                        setStep(1); // Go back directly to service
                      } else {
                        setStep(2);
                      }
                    }}
                    className="text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    Atrás
                  </button>
                </div>

                {/* Horizontal Date Selector */}
                <div>
                  <label className="text-xs font-semibold text-zinc-400 mb-2 block">Día de la cita</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {availableDates.map((item) => {
                      const isSelected = selectedDate === item.dateStr;
                      return (
                        <div
                          key={item.dateStr}
                          onClick={() => {
                            setSelectedDate(item.dateStr);
                            setSelectedTime('');
                          }}
                          className={`p-2.5 rounded-xl border text-center cursor-pointer shrink-0 min-w-[70px] transition-all ${
                            isSelected
                              ? 'text-white shadow-md'
                              : isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                          }`}
                          style={isSelected ? { backgroundColor: primaryColor, borderColor: primaryColor } : undefined}
                        >
                          <div className="text-[10px] uppercase font-bold">{item.dayName}</div>
                          <div className="text-lg font-bold my-0.5">{item.dayNum}</div>
                          <div className="text-[9px] capitalize">{item.isToday ? 'Hoy' : item.isTomorrow ? 'Mañana' : item.monthName}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Available Slots */}
                <div>
                  <label className="text-xs font-semibold text-zinc-400 mb-2 block">Horas disponibles</label>
                  {availableSlots.length === 0 ? (
                    <div className="p-4 rounded-xl border border-zinc-800 text-center space-y-3 bg-zinc-950/50">
                      <div className="text-xs text-zinc-400">
                        {selectedDate === format(new Date(), 'yyyy-MM-dd')
                          ? '⏰ Por la hora actual ya no quedan turnos disponibles hoy.'
                          : 'No hay turnos libres con este barbero para esta fecha.'}
                      </div>
                      <div className="flex flex-wrap justify-center gap-2 pt-1">
                        {selectedDate === format(new Date(), 'yyyy-MM-dd') && availableDates[1] && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDate(availableDates[1].dateStr);
                              setSelectedTime('');
                            }}
                            className="btn-primary text-xs py-1.5 px-3 bg-violet-600 hover:bg-violet-500 font-semibold"
                          >
                            👉 Ver turnos para mañana ({availableDates[1].dayName} {availableDates[1].dayNum})
                          </button>
                        )}
                        {selectedBarberId !== 'any' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBarberId('any');
                              setLockedFromQr(false);
                              setSelectedTime('');
                            }}
                            className="btn-secondary text-xs py-1.5 px-3"
                          >
                            Ver cualquier barbero disponible
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {availableSlots.map((slot) => {
                        const isSelected = selectedTime === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedTime(slot)}
                            className={`py-2 px-1 rounded-lg border text-xs font-mono font-semibold transition-all ${
                              isSelected
                                ? 'text-white shadow-md'
                                : isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                            }`}
                            style={isSelected ? { backgroundColor: primaryColor, borderColor: primaryColor } : undefined}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (lockedFromQr && selectedBarberId && selectedBarberId !== 'any') {
                        setStep(1);
                      } else {
                        setStep(2);
                      }
                    }}
                    className="btn-secondary flex-1 py-3 text-xs font-semibold"
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    disabled={!selectedTime}
                    onClick={() => setStep(4)}
                    className="btn-primary flex-2 py-3 text-xs font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-40"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <span>Siguiente Paso</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: CLIENT CONTACT INFORMATION */}
            {step === 4 && (
              <form onSubmit={handleConfirmBooking} className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <User className="w-4 h-4" style={{ color: primaryColor }} />
                    Completa tus datos de contacto
                  </h2>
                  <button type="button" onClick={() => setStep(3)} className="text-xs text-zinc-400 hover:text-zinc-200">
                    Atrás
                  </button>
                </div>

                {/* Summary Card */}
                <div
                  className="p-3.5 rounded-xl border flex items-center justify-between text-xs"
                  style={{
                    backgroundColor: `${primaryColor}10`,
                    borderColor: `${primaryColor}30`,
                  }}
                >
                  <div>
                    <div className="font-bold text-sm text-zinc-100">{selectedService?.name}</div>
                    <div className="text-zinc-400 mt-0.5">
                      {format(new Date(selectedDate + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es })} · {selectedTime}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      💈 Barbero: <strong className="text-zinc-200">{selectedBarber?.name || 'Cualquier disponible'}</strong>
                    </div>
                  </div>
                  <div className="font-bold text-base" style={{ color: primaryColor }}>
                    {formatCurrency(selectedService?.price || 0)}
                  </div>
                </div>

                {/* Inputs */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 mb-1 block">Tu Nombre Completo *</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Ej: Juan Pérez"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 mb-1 block">Tu Número de WhatsApp *</label>
                    <input
                      type="tel"
                      className="input"
                      placeholder="Ej: 300 123 4567"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      required
                    />
                    <p className="text-[10px] text-zinc-500 mt-1">Te enviaremos la confirmación y recordatorio por WhatsApp.</p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 mb-1 block">Correo Electrónico (Opcional)</label>
                    <input
                      type="email"
                      className="input"
                      placeholder="tu@email.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 mb-1 block">Notas o Petición Especial</label>
                    <textarea
                      rows={2}
                      className="input text-xs"
                      placeholder="¿Algún detalle para tu corte? (ej: barba larga, degradado con navaja)"
                      value={clientNotes}
                      onChange={(e) => setClientNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="btn-secondary flex-1 py-3 text-xs font-semibold"
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-2 py-3 text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar Reserva</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 5: BOOKING CONFIRMED */}
            {step === 5 && confirmedAppt && (
              <div className="text-center py-6 space-y-5 animate-scale-in">
                <div
                  className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white shadow-xl"
                  style={{ backgroundColor: primaryColor }}
                >
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-zinc-100">¡Cita Confirmada con Éxito!</h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Te esperamos en <strong>{shop.name}</strong>.
                  </p>
                </div>

                {/* Ticket Details */}
                <div
                  className="p-5 rounded-2xl border text-left space-y-3 max-w-md mx-auto"
                  style={{
                    backgroundColor: `${primaryColor}08`,
                    borderColor: `${primaryColor}30`,
                  }}
                >
                  <div className="flex justify-between items-start pb-3 border-b border-zinc-800">
                    <div>
                      <div className="text-xs text-zinc-500 uppercase font-semibold">Servicio</div>
                      <div className="font-bold text-sm text-zinc-100">{confirmedAppt.service?.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-zinc-500 uppercase font-semibold">Valor</div>
                      <div className="font-bold text-base" style={{ color: primaryColor }}>
                        {formatCurrency(confirmedAppt.service?.price || 0)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-zinc-500 block">Barbero:</span>
                      <span className="font-semibold text-zinc-200">{confirmedAppt.barber?.name}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Fecha:</span>
                      <span className="font-semibold text-zinc-200 capitalize">{confirmedAppt.date}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Hora de inicio:</span>
                      <span className="font-semibold text-zinc-200">{confirmedAppt.time}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Hora estimada:</span>
                      <span className="font-semibold text-zinc-200">{confirmedAppt.endTime}</span>
                    </div>
                  </div>

                  {/* QR Code for fast check-in */}
                  <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-zinc-300">Pase Digital QR</div>
                      <div className="text-[10px] text-zinc-500">Muestra este código al llegar a la barbería</div>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg shrink-0">
                      <QRCodeCanvas
                        value={typeof window !== 'undefined' ? `${window.location.origin}/booking/${shopSlug}?ticket=${confirmedAppt.appt?.id || 'confirmed'}` : `https://chairpro.app/booking/${shopSlug}`}
                        size={64}
                        level="M"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setSelectedServiceId('');
                      setSelectedTime('');
                      setConfirmedAppt(null);
                    }}
                    className="btn-secondary flex-1 py-2.5 text-xs font-semibold"
                  >
                    Agendar Otra Cita
                  </button>
                  <a
                    href={`https://wa.me/${shop.whatsapp?.replace(/[^0-9]/g, '') || '573000000000'}?text=${encodeURIComponent(
                      `Hola ${shop.name}, acabo de reservar mi cita para ${confirmedAppt.service?.name} el día ${confirmedAppt.date} a las ${confirmedAppt.time} a nombre de ${clientName}.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2.5 rounded-lg text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md"
                    style={{ backgroundColor: '#25D366' }}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Confirmar por WhatsApp</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LOOKUP CLIENT APPOINTMENTS */}
        {activeTab === 'lookup' && (
          <div
            className={`rounded-2xl border p-5 sm:p-7 shadow-2xl backdrop-blur-md transition-all ${
              isLight ? 'bg-white/95 border-slate-200' : 'bg-zinc-900/85 border-zinc-800/80'
            }`}
          >
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Search className="w-4 h-4" style={{ color: primaryColor }} />
                  Consulta el estado de tus citas
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Ingresa tu número de teléfono registrado para ver tus citas programadas y tus puntos del club de fidelidad.
                </p>
              </div>

              <form onSubmit={handleLookup} className="flex gap-2">
                <input
                  type="text"
                  className="input flex-1"
                  placeholder="Tu teléfono ej: 3101234567 o email"
                  value={lookupPhone}
                  onChange={(e) => setLookupPhone(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="btn-primary px-4 py-2 text-xs font-semibold shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  Buscar
                </button>
              </form>

              {/* Results */}
              {lookupResults !== null && (
                <div className="pt-3 border-t border-zinc-800 space-y-3 animate-fade-in">
                  {lookupResults.length === 0 ? (
                    <div className="text-center py-6 text-xs text-zinc-500">
                      No encontramos citas asociadas a ese teléfono o correo en {shop.name}.
                    </div>
                  ) : (
                    <>
                      {/* Loyalty Points Banner if client found */}
                      {lookupResults[0]?.client?.loyalty && (
                        <div
                          className="p-3.5 rounded-xl border flex items-center justify-between text-xs"
                          style={{
                            backgroundColor: `${primaryColor}15`,
                            borderColor: `${primaryColor}30`,
                          }}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                              style={{ backgroundColor: primaryColor }}
                            >
                              ⭐
                            </div>
                            <div>
                              <div className="font-bold text-zinc-200">
                                {lookupResults[0].client.name} — Club VIP
                              </div>
                              <div className="text-zinc-400 text-[11px]">
                                {lookupResults[0].client.loyalty.points} puntos acumulados · {lookupResults[0].client.loyalty.visits} visitas
                              </div>
                            </div>
                          </div>
                          <span
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                            style={{
                              backgroundColor: `${primaryColor}20`,
                              color: primaryColor,
                            }}
                          >
                            {lookupResults[0].client.loyalty.tier.toUpperCase()}
                          </span>
                        </div>
                      )}

                      <div className="space-y-2">
                        {lookupResults.map((appt) => (
                          <div
                            key={appt.id}
                            className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60 flex items-center justify-between text-xs"
                          >
                            <div className="space-y-1">
                              <div className="font-bold text-zinc-200">
                                {appt.service?.name || 'Servicio de Barbería'}
                              </div>
                              <div className="text-zinc-400 text-[11px] flex items-center gap-2">
                                <span>📅 {appt.date}</span>
                                <span>⏰ {appt.startTime}</span>
                                <span>💈 {appt.barber?.name}</span>
                              </div>
                            </div>
                            <span
                              className={`badge text-[10px] capitalize ${
                                appt.status === 'confirmed'
                                  ? 'badge-emerald'
                                  : appt.status === 'completed'
                                  ? 'badge-violet'
                                  : 'badge-zinc'
                              }`}
                            >
                              {appt.status === 'confirmed'
                                ? 'Confirmada'
                                : appt.status === 'completed'
                                ? 'Completada'
                                : appt.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ClientBookingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-xs text-zinc-500">Cargando portal de reservas...</div>}>
      <BookingContent />
    </Suspense>
  );
}
