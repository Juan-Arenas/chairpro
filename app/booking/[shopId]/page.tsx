'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { useSupabaseRealtime } from '@/lib/supabase/realtime';
import { formatCurrency, getInitials, formatTime } from '@/lib/utils';
import { format, addDays, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Scissors, Calendar, Clock, User, Phone, Mail, CheckCircle2,
  MapPin, Star, QrCode as QrIcon, MessageCircle, ChevronRight,
  Search, AlertCircle, Sparkles, ShieldCheck
} from 'lucide-react';
import dynamic from 'next/dynamic';

const QRCodeCanvas = dynamic(() => import('qrcode.react').then(m => m.QRCodeCanvas), { ssr: false });

export default function ClientBookingPage() {
  const params = useParams();
  const rawShopId = params?.shopId as string;

  const {
    shops,
    barbers,
    services,
    appointments,
    clients,
    currentShop,
    createAppointment,
    findOrCreateClient,
    getAvailableSlots,
  } = useStore();

  // Find the matching barbershop by slug or ID
  const shop = useMemo(() => {
    return (
      shops.find((s) => s.slug === rawShopId || s.id === rawShopId) ||
      (currentShop?.slug === rawShopId ? currentShop : null) ||
      shops[0] ||
      currentShop
    );
  }, [shops, rawShopId, currentShop]);

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

  // Booking Flow Steps: 1: Service -> 2: Barber -> 3: Date/Time -> 4: Client Info -> 5: Confirmed
  const [step, setStep] = useState<number>(1);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedBarberId, setSelectedBarberId] = useState<string>('');
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

  // Filter services and barbers for this shop
  const shopServices = useMemo(() => {
    return services.filter((s) => s.shopId === shop?.id && s.isActive);
  }, [services, shop?.id]);

  const shopBarbers = useMemo(() => {
    return barbers.filter((b) => b.shopId === shop?.id && b.isActive);
  }, [barbers, shop?.id]);

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
    if (!selectedBarberId || !selectedDate || !selectedService) return [];
    if (selectedBarberId === 'any') {
      const firstBarber = shopBarbers[0];
      if (!firstBarber) return [];
      return getAvailableSlots(firstBarber.id, selectedDate, selectedService.duration);
    }
    return getAvailableSlots(selectedBarberId, selectedDate, selectedService.duration);
  }, [selectedBarberId, selectedDate, selectedService, shopBarbers, getAvailableSlots]);

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedTime || !clientName || !clientPhone || !shop) return;

    // Resolve barber if 'any' was selected
    const barberIdToAssign = selectedBarberId === 'any' ? shopBarbers[0]?.id : selectedBarberId;
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
      commissionAmount: selectedService.price * (barberObj.commissionRate || 0.4),
      isPaid: false,
      notes: clientNotes,
      reminderSent: false,
    });

    setConfirmedAppt({
      appt: newAppt,
      service: selectedService,
      barber: barberObj,
      client,
      date: selectedDate,
      time: selectedTime,
    });

    setStep(5);
  };

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupPhone.trim()) return;

    const matchedClient = clients.find(
      (c) => c.phone.includes(lookupPhone.trim()) || c.email?.toLowerCase() === lookupPhone.trim().toLowerCase()
    );

    if (matchedClient) {
      const clientAppts = appointments.filter(
        (a) => a.clientId === matchedClient.id && a.shopId === shop?.id
      );
      setLookupResults(clientAppts.map((a) => ({
        ...a,
        service: services.find((s) => s.id === a.serviceId),
        barber: barbers.find((b) => b.id === a.barberId),
        client: matchedClient,
      })));
    } else {
      setLookupResults([]);
    }
  };

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white p-4">
        <div className="text-center space-y-3 max-w-sm">
          <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
          <h2 className="text-lg font-bold">Barbería no encontrada</h2>
          <p className="text-sm text-zinc-400">El enlace no corresponde a ninguna barbería registrada en ChairPro.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen relative font-sans transition-colors duration-300 ${
        isLight ? 'bg-slate-50 text-slate-900' : 'bg-zinc-950 text-zinc-100'
      }`}
    >
      {/* Background wallpaper if configured */}
      {bgType === 'image' && bgImage && (
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: `url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            opacity: bgOpacity,
          }}
        />
      )}

      {/* Ambient gradient */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `radial-gradient(ellipse at 50% 10%, ${primaryColor}18 0%, transparent 60%)`,
        }}
      />

      {/* Main Container */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Brand Header */}
        <div className="text-center space-y-3 mb-8">
          <div
            className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl shadow-xl transition-transform hover:scale-105 overflow-hidden"
            style={{
              backgroundColor: primaryColor,
              boxShadow: `0 0 25px ${primaryColor}55`,
            }}
          >
            {logoEmoji.startsWith('http') || logoEmoji.startsWith('/') || logoEmoji.startsWith('data:image') ? (
              <img src={logoEmoji} alt={shop.name} className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <span>{logoEmoji}</span>
            )}
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {shop.name}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-md mx-auto">
              {shop.theme?.tagline || 'Reserva tu corte o arreglo de barba en línea sin llamadas.'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 text-xs text-zinc-400 flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" style={{ color: primaryColor }} />
              {shop.address}, {shop.city}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" style={{ color: primaryColor }} />
              {shop.phone}
            </span>
          </div>

          {/* Tabs switch: Reserva vs Mis Citas */}
          <div className="inline-flex rounded-xl p-1 bg-zinc-900/80 border border-zinc-800 text-xs font-semibold mt-3">
            <button
              onClick={() => setActiveTab('book')}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                activeTab === 'book'
                  ? 'text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              style={activeTab === 'book' ? { backgroundColor: primaryColor } : undefined}
            >
              📅 Reservar Cita
            </button>
            <button
              onClick={() => setActiveTab('lookup')}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                activeTab === 'lookup'
                  ? 'text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              style={activeTab === 'lookup' ? { backgroundColor: primaryColor } : undefined}
            >
              🔍 Consultar Mis Citas
            </button>
          </div>
        </div>

        {/* TAB 1: BOOKING FLOW */}
        {activeTab === 'book' && (
          <div
            className={`rounded-2xl border p-5 sm:p-7 shadow-2xl backdrop-blur-md transition-all ${
              isLight ? 'bg-white/95 border-slate-200' : 'bg-zinc-900/85 border-zinc-800/80'
            }`}
          >
            {/* Step Progress Bar */}
            {step < 5 && (
              <div className="mb-6">
                <div className="flex justify-between items-center text-xs font-semibold mb-2">
                  <span style={{ color: primaryColor }}>Paso {step} de 4</span>
                  <span className="text-zinc-400">
                    {step === 1 && 'Selecciona Servicio'}
                    {step === 2 && 'Selecciona Barbero'}
                    {step === 3 && 'Fecha y Hora'}
                    {step === 4 && 'Tus Datos de Contacto'}
                  </span>
                </div>
                <div className="w-full bg-zinc-800/60 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300 rounded-full"
                    style={{
                      width: `${(step / 4) * 100}%`,
                      backgroundColor: primaryColor,
                    }}
                  />
                </div>
              </div>
            )}

            {/* STEP 1: SELECT SERVICE */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
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
                        onClick={() => setSelectedServiceId(service.id)}
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
                  onClick={() => setStep(2)}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 mt-4 transition-transform active:scale-95 disabled:opacity-50"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span>Continuar</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 2: SELECT BARBER */}
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
                    onClick={() => setSelectedBarberId('any')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3.5 ${
                      selectedBarberId === 'any'
                        ? 'shadow-md ring-1'
                        : isLight ? 'border-slate-200 hover:border-slate-300' : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                    style={
                      selectedBarberId === 'any'
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
                    {selectedBarberId === 'any' && <span className="text-lg" style={{ color: primaryColor }}>✓</span>}
                  </div>

                  {/* Individual Barbers */}
                  {shopBarbers.map((barber) => {
                    const isSelected = selectedBarberId === barber.id;
                    return (
                      <div
                        key={barber.id}
                        onClick={() => setSelectedBarberId(barber.id)}
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
                        {isSelected && <span className="text-lg" style={{ color: primaryColor }}>✓</span>}
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn-secondary py-3 px-4 text-xs font-semibold"
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    disabled={!selectedBarberId}
                    onClick={() => setStep(3)}
                    className="flex-1 py-3 rounded-xl text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <span>Continuar a Horarios</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: SELECT DATE & TIME */}
            {step === 3 && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <Calendar className="w-4 h-4" style={{ color: primaryColor }} />
                    Selecciona Fecha y Hora
                  </h2>
                  <button onClick={() => setStep(2)} className="text-xs text-zinc-400 hover:text-zinc-200">
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
                    <div className="p-4 rounded-xl border border-zinc-800 text-center text-xs text-zinc-500">
                      No hay turnos libres para esta fecha. Prueba seleccionando otro día.
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
                    onClick={() => setStep(2)}
                    className="btn-secondary py-3 px-4 text-xs font-semibold"
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    disabled={!selectedTime}
                    onClick={() => setStep(4)}
                    className="flex-1 py-3 rounded-xl text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <span>Ingresar Datos</span>
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
                    Completa tu reserva
                  </h2>
                  <button type="button" onClick={() => setStep(3)} className="text-xs text-zinc-400 hover:text-zinc-200">
                    Atrás
                  </button>
                </div>

                {/* Summary badge */}
                <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/50 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Servicio:</span>
                    <span className="font-semibold text-zinc-200">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Barbero:</span>
                    <span className="font-semibold text-zinc-200">{selectedBarber?.name || 'Cualquier disponible'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Horario:</span>
                    <span className="font-semibold" style={{ color: primaryColor }}>
                      {selectedDate} a las {selectedTime}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-zinc-800/80">
                    <span className="text-zinc-400">Total a pagar en el local:</span>
                    <span className="font-bold text-sm" style={{ color: primaryColor }}>
                      {formatCurrency(selectedService?.price || 0)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <div className="form-group">
                    <label className="label">Tu Nombre Completo *</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Ej. Mateo Gómez"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="form-group">
                      <label className="label">WhatsApp / Teléfono *</label>
                      <input
                        type="tel"
                        className="input"
                        placeholder="+57 300 123 4567"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="label">Correo Electrónico (Opcional)</label>
                      <input
                        type="email"
                        className="input"
                        placeholder="tu@correo.com"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="label">Notas adicionales (Opcional)</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Ej. Prefiero corte sin máquina arriba"
                      value={clientNotes}
                      onChange={(e) => setClientNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="btn-secondary py-3 px-4 text-xs font-semibold"
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-95"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar Cita Ahora</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 5: CONFIRMATION TICKET */}
            {step === 5 && confirmedAppt && (
              <div className="text-center space-y-5 animate-scale-in py-2">
                <div
                  className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white text-2xl shadow-xl"
                  style={{ backgroundColor: primaryColor }}
                >
                  ✓
                </div>

                <div>
                  <h2 className="text-xl font-extrabold text-zinc-100">¡Cita Confirmada con Éxito!</h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Te esperamos en <strong>{shop.name}</strong>. Hemos reservado tu lugar.
                  </p>
                </div>

                {/* Ticket card */}
                <div className="card p-5 border-zinc-800 bg-zinc-950/70 text-left space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-zinc-500">Código de Reserva</div>
                      <div className="text-base font-mono font-bold text-zinc-200">
                        {confirmedAppt.appt?.id?.toUpperCase() || 'CP-RES-2026'}
                      </div>
                    </div>
                    <span
                      className="badge font-semibold text-xs"
                      style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                    >
                      Confirmada
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-zinc-500 block">Servicio</span>
                      <span className="font-semibold text-zinc-200">{confirmedAppt.service?.name}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Barbero Asignado</span>
                      <span className="font-semibold text-zinc-200">{confirmedAppt.barber?.name}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Fecha</span>
                      <span className="font-semibold text-zinc-200">{confirmedAppt.date}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Hora</span>
                      <span className="font-semibold text-zinc-200">{confirmedAppt.time}</span>
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
                        value={`chairpro://appointment/${confirmedAppt.appt?.id || 'demo'}`}
                        size={64}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
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
                            <span className="text-xl">👑</span>
                            <div>
                              <div className="font-bold text-zinc-100">Club de Fidelización {shop.name}</div>
                              <div className="text-zinc-400 text-[11px]">
                                Tienes {lookupResults[0].client.loyalty.points} puntos acumulados ({lookupResults[0].client.loyalty.visits} visitas)
                              </div>
                            </div>
                          </div>
                          <span className="font-bold" style={{ color: primaryColor }}>
                            {shop.settings?.rewardDescription || 'Corte gratis al 5to corte'}
                          </span>
                        </div>
                      )}

                      {lookupResults.map((item) => (
                        <div key={item.id} className="card p-4 border-zinc-800 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-bold text-sm text-zinc-200">{item.service?.name}</div>
                              <div className="text-xs text-zinc-400">Con {item.barber?.name}</div>
                            </div>
                            <span
                              className={`badge text-[10px] capitalize ${
                                item.status === 'confirmed'
                                  ? 'badge-violet'
                                  : item.status === 'completed'
                                  ? 'badge-emerald'
                                  : 'badge-zinc'
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-zinc-500 pt-1 border-t border-zinc-800">
                            <span>📅 {item.date} a las {item.startTime}</span>
                            <span className="font-semibold text-zinc-300">{formatCurrency(item.price)}</span>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Security & Powered Footer */}
        <div className="text-center pt-8 text-xs text-zinc-500 space-y-1">
          <div className="flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Reserva segura y directa con {shop.name}</span>
          </div>
          <div>Tecnología White-Label desarrollada por ChairPro SaaS</div>
        </div>
      </div>
    </div>
  );
}
