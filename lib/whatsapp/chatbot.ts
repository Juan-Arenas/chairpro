import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Barbershop, Service, Barber, Appointment, ChatbotKnowledge } from '@/types';

export interface ChatbotContext {
  shop: Barbershop;
  services: Service[];
  barbers: Barber[];
  appointments: Appointment[];
  customKnowledge?: ChatbotKnowledge[];
  clientName?: string;
  clientPhone?: string;
}

export interface ChatbotReply {
  replyText: string;
  suggestedButtons?: { id: string; title: string; payload?: string }[];
  actionTaken: 'faq' | 'price_list' | 'booking_intent' | 'schedule_info' | 'location_info' | 'none';
  bookingDraft?: {
    barberId?: string;
    date?: string;
    time?: string;
    serviceId?: string;
  };
}

/**
 * Intelligent Customer WhatsApp Bot Engine
 * Handles natural language questions, FAQs, pricing, and appointment booking.
 */
export function processCustomerMessage(queryText: string, context: ChatbotContext): ChatbotReply {
  const q = queryText.toLowerCase().trim();
  const { shop, services, barbers, appointments, customKnowledge } = context;

  // 1. Custom Knowledge Base FAQ Match
  if (customKnowledge && customKnowledge.length > 0) {
    const matchedFaq = customKnowledge.find(k => {
      const qWords = k.question.toLowerCase().split(' ');
      const matchCount = qWords.filter(w => w.length > 3 && q.includes(w)).length;
      return matchCount >= 2 || q.includes(k.question.toLowerCase());
    });

    if (matchedFaq) {
      return {
        replyText: matchedFaq.answer,
        suggestedButtons: [
          { id: 'btn_agendar', title: '📅 Agendar Cita' },
          { id: 'btn_servicios', title: '💰 Ver Precios' },
        ],
        actionTaken: 'faq',
      };
    }
  }

  // 2. Greetings
  if (q === 'hola' || q === 'buenas' || q === 'buenos dias' || q === 'buenas tardes' || q === 'buenas noches' || q === 'inicio' || q === 'menu') {
    const activeBarbers = barbers.filter(b => b.isActive).map(b => b.name.split(' ')[0]).join(', ');
    return {
      replyText: `👋 ¡Hola${context.clientName ? ` ${context.clientName}` : ''}! Bienvenido a *${shop.name}* 💈\n\nSoy tu asistente virtual. Puedo ayudarte a agendar citas al instante, darte precios y resolver tus dudas.\n\n✂️ *Barberos disponibles:* ${activeBarbers || 'Equipo profesional'}\n📍 *Ubicación:* ${shop.address}, ${shop.city}\n\n¿En qué te podemos ayudar hoy?`,
      suggestedButtons: [
        { id: 'btn_agendar', title: '📅 Agendar Cita' },
        { id: 'btn_servicios', title: '💰 Precios y Servicios' },
        { id: 'btn_horarios', title: '⏰ Horarios y Ubicación' },
      ],
      actionTaken: 'faq',
    };
  }

  // 3. Price and Services Catalog Query
  if (q.includes('precio') || q.includes('cuanto vale') || q.includes('cuanto cuesta') || q.includes('catalogo') || q.includes('servicios') || q.includes('cortes')) {
    const serviceLines = services
      .filter(s => s.isActive)
      .map(s => `• *${s.name}:* $${s.price.toLocaleString('es-CO')} COP _(${s.duration} min)_`)
      .join('\n');

    return {
      replyText: `✂️ *Catálogo de Servicios — ${shop.name}:*\n\n${serviceLines}\n\n¿Deseas agendar alguno de estos servicios?`,
      suggestedButtons: [
        { id: 'btn_agendar_corte', title: '📅 Agendar Turno' },
        { id: 'btn_preguntar_horario', title: '⏰ Ver Horarios' },
      ],
      actionTaken: 'price_list',
    };
  }

  // 4. Working Hours and Location
  if (q.includes('horario') || q.includes('abierto') || q.includes('hora') || q.includes('donde') || q.includes('ubicacion') || q.includes('direccion') || q.includes('llegar')) {
    const hoursText = `• Lunes a Viernes: 09:00 AM – 08:00 PM\n• Sábados: 08:00 AM – 07:00 PM\n• Domingos: 10:00 AM – 04:00 PM`;

    return {
      replyText: `⏰ *Horarios de Atención — ${shop.name}:*\n\n${hoursText}\n\n📍 *Dirección:* ${shop.address}, ${shop.city}\n🚗 *Parqueadero:* Disponible en la zona`,
      suggestedButtons: [
        { id: 'btn_agendar_ahora', title: '📅 Agendar Cita' },
        { id: 'btn_precios', title: '💰 Ver Precios' },
      ],
      actionTaken: 'schedule_info',
    };
  }

  // 5. Barber Team Query
  if (q.includes('barbero') || q.includes('quien atiende') || q.includes('equipo')) {
    const active = barbers.filter(b => b.isActive);
    const list = active.map(b => `• *${b.name}* — ${b.specialties?.join(', ') || 'Maestro Barbero'}`).join('\n');

    return {
      replyText: `💈 *Nuestro Equipo de Barberos:* \n\n${list}\n\n¿Con quién te gustaría agendar tu cita?`,
      suggestedButtons: active.slice(0, 3).map(b => ({
        id: `btn_barber_${b.id}`,
        title: `Cita con ${b.name.split(' ')[0]}`,
        payload: b.id,
      })),
      actionTaken: 'none',
    };
  }

  // 6. Direct Natural Language Booking Intent
  // e.g. "Quiero agendar para hoy a las 4pm con Mateo", "Cita mañana a las 10am"
  if (q.includes('cita') || q.includes('agendar') || q.includes('reservar') || q.includes('turno') || q.includes('espacio') || q.includes('apartar')) {
    const isTomorrow = q.includes('mañana') || q.includes('manana');
    const now = new Date();
    const currentHour = now.getHours();

    // If asking for today but it's already late (after 7 PM), automatically offer tomorrow
    const shouldOfferTomorrow = !isTomorrow && currentHour >= 19;
    const targetDate = isTomorrow || shouldOfferTomorrow ? addDays(now, 1) : now;
    const dateStr = format(targetDate, 'yyyy-MM-dd');
    const dayLabel = format(targetDate, "EEEE d 'de' MMMM", { locale: es });

    // Detect preferred barber
    let targetBarber = barbers.find(b => {
      const first = b.name.toLowerCase().split(' ')[0];
      return q.includes(first) && first.length > 2;
    }) || barbers.find(b => b.isActive) || barbers[0] || { id: 'barber_carlos', name: 'Carlos Mendoza' };

    // Find real available slots for target date
    const dayAppointments = appointments.filter(
      a => a.date === dateStr && a.barberId === targetBarber?.id && ['scheduled', 'confirmed', 'in_progress'].includes(a.status)
    );
    const bookedTimes = new Set(dayAppointments.map(a => a.startTime));

    // Full Day Candidate slots
    const allSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
    const isToday = dateStr === format(now, 'yyyy-MM-dd');
    const nowMinutes = isToday ? now.getHours() * 60 + now.getMinutes() : 0;

    let freeSlots = allSlots.filter(t => {
      if (bookedTimes.has(t)) return false;
      if (isToday) {
        const [h, m] = t.split(':').map(Number);
        return (h * 60 + m) > (nowMinutes + 15);
      }
      return true;
    });

    // If today is completely out of hours, provide tomorrow's slots
    if (freeSlots.length === 0 && isToday) {
      const tomorrowDate = addDays(now, 1);
      const tomorrowLabel = format(tomorrowDate, "EEEE d 'de' MMMM", { locale: es });
      const tomorrowSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
      const slotsText = tomorrowSlots.slice(0, 4).map((s, idx) => `${idx + 1}️⃣ *${s}*`).join('\n');

      return {
        replyText: `⏰ Por la hora actual ya no quedan turnos disponibles hoy.\n\n📅 Para *mañana ${tomorrowLabel}* con *${targetBarber.name}*, tenemos estos horarios disponibles:\n\n${slotsText}\n\n¿A qué hora te apartamos el turno?`,
        suggestedButtons: tomorrowSlots.slice(0, 3).map(s => ({
          id: `btn_confirm_time_${s.replace(':', '')}`,
          title: `⏰ ${s}`,
          payload: s,
        })),
        actionTaken: 'booking_intent',
        bookingDraft: {
          barberId: targetBarber.id,
          date: format(tomorrowDate, 'yyyy-MM-dd'),
          serviceId: services[0]?.id,
        },
      };
    }

    const slotsText = freeSlots.slice(0, 4).map((s, idx) => `${idx + 1}️⃣ *${s}*`).join('\n');

    return {
      replyText: `✅ ¡Perfecto! Para *${dayLabel}* con *${targetBarber.name}*, tenemos estos horarios disponibles:\n\n${slotsText}\n\nEscribe la hora que prefieres o presiona un botón:`,
      suggestedButtons: freeSlots.slice(0, 3).map(s => ({
        id: `btn_confirm_time_${s.replace(':', '')}`,
        title: `⏰ ${s}`,
        payload: s,
      })),
      actionTaken: 'booking_intent',
      bookingDraft: {
        barberId: targetBarber.id,
        date: dateStr,
        serviceId: services[0]?.id,
      },
    };
  }

  // 7. General / Fallback with smart recommendations
  return {
    replyText: `💈 *${shop.name}* está a tu servicio.\n\nPuedes decirme frases como:\n• _"Quiero cita hoy a las 5pm con Camilo"_\n• _"¿Cuánto cuesta corte y barba?"_\n• _"¿Qué horarios tienen el sábado?"_\n• _"¿Dónde están ubicados?"_`,
    suggestedButtons: [
      { id: 'btn_agendar', title: '📅 Agendar Cita' },
      { id: 'btn_servicios', title: '💰 Ver Precios' },
      { id: 'btn_horarios', title: '📍 Ubicación' },
    ],
    actionTaken: 'none',
  };
}
