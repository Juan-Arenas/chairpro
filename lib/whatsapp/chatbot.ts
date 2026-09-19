import { formatCurrency } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Barbershop, Service, Barber, Appointment, ChatbotKnowledgeItem, ChatbotConfig } from '@/types';

export interface ChatbotResponse {
  replyText: string;
  suggestedButtons?: { id: string; title: string; payload?: string }[];
  actionTaken?: 'booking_intent' | 'booking_created' | 'status_check' | 'none';
  bookingDraft?: {
    serviceId?: string;
    barberId?: string;
    date?: string;
    time?: string;
    clientName?: string;
    clientPhone?: string;
  };
}

/**
 * AI Chatbot Engine for End Customers on WhatsApp and Web.
 * Uses the barbershop's live data + custom trained knowledge base.
 */
export function processCustomerMessage(
  message: string,
  context: {
    shop: Barbershop;
    services: Service[];
    barbers: Barber[];
    appointments: Appointment[];
    config?: ChatbotConfig;
    customKnowledge?: ChatbotKnowledgeItem[];
    clientPhone?: string;
    clientName?: string;
  }
): ChatbotResponse {
  const q = message.trim().toLowerCase();
  const { shop, services, barbers, appointments, customKnowledge = [] } = context;

  // 1. Check Custom Trained Knowledge Base first (Owner overrides)
  for (const item of customKnowledge) {
    if (!item.isActive) continue;
    const itemQuestion = item.question.toLowerCase();
    const itemTags = item.tags?.map(t => t.toLowerCase()) || [];

    // Check match by keywords or full question
    const words = itemQuestion.split(' ').filter(w => w.length > 3);
    const matchedWords = words.filter(w => q.includes(w));
    const tagMatch = itemTags.some(t => q.includes(t));

    if ((words.length > 0 && matchedWords.length >= Math.ceil(words.length * 0.6)) || tagMatch) {
      return {
        replyText: `✂️ *${shop.name}*\n\n${item.answer}\n\n¿Deseas que te reservemos un espacio hoy?`,
        suggestedButtons: [
          { id: 'btn_agendar', title: '📅 Agendar Cita' },
          { id: 'btn_precios', title: '💈 Ver Precios' },
        ],
        actionTaken: 'none',
      };
    }
  }

  // 2. Greeting / Welcome
  if (q.includes('hola') || q.includes('buenas') || q.includes('buenos dias') || q.includes('buenas tardes') || q.includes('saludos') || q === 'menu') {
    const activeBarbers = barbers.filter(b => b.isActive).map(b => b.name.split(' ')[0]).join(', ');
    return {
      replyText: `👋 ¡Hola${context.clientName ? ` ${context.clientName}` : ''}! Bienvenido a *${shop.name}* 💈\n\nSoy tu asistente virtual. Puedo ayudarte a agendar citas al instante, darte precios y horarios.\n\n✂️ *Barberos disponibles hoy:* ${activeBarbers}\n📍 *Ubicación:* ${shop.address}, ${shop.city}\n\n¿En qué te puedo ayudar?`,
      suggestedButtons: [
        { id: 'btn_agendar', title: '📅 Agendar Cita' },
        { id: 'btn_precios', title: '💰 Precios y Servicios' },
        { id: 'btn_horarios', title: '⏰ Horarios de Atención' },
      ],
      actionTaken: 'none',
    };
  }

  // 3. Prices and Services
  if (q.includes('precio') || q.includes('cuanto cuesta') || q.includes('cuánto cuesta') || q.includes('servicios') || q.includes('catalogo') || q.includes('catálogo') || q.includes('corte')) {
    const list = services
      .filter(s => s.isActive)
      .map(s => `• *${s.name}*: ${formatCurrency(s.price)} _(${s.duration} min)_`)
      .join('\n');

    return {
      replyText: `💈 *Nuestros Servicios y Tarifas:*\n\n${list}\n\n✨ *Incluye:* Bebida de cortesía y perfilado profesional.\n\n¿Cuál de estos servicios te gustaría reservar?`,
      suggestedButtons: [
        { id: 'btn_agendar', title: '📅 Reservar Ahora' },
        { id: 'btn_barberos', title: '✂️ Ver Barberos' },
      ],
      actionTaken: 'none',
    };
  }

  // 4. Hours & Days
  if (q.includes('horario') || q.includes('hora') || q.includes('abierto') || q.includes('cierran') || q.includes('domingo') || q.includes('sabado') || q.includes('sábado')) {
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
    const hoursText = days.map((d, i) => {
      const h = shop.workingHours[d];
      return h && h.isOpen ? `• *${dayNames[i]}:* ${h.open} – ${h.close}` : `• *${dayNames[i]}:* Cerrado`;
    }).join('\n');

    return {
      replyText: `⏰ *Horarios de Atención — ${shop.name}:*\n\n${hoursText}\n\n📍 *Dirección:* ${shop.address}\n🚗 *Parqueadero:* Disponible en la zona`,
      suggestedButtons: [
        { id: 'btn_agendar_hoy', title: '📅 Agendar para Hoy' },
        { id: 'btn_agendar_manana', title: '📆 Agendar para Mañana' },
      ],
      actionTaken: 'none',
    };
  }

  // 5. Barbers Team
  if (q.includes('barbero') || q.includes('equipo') || q.includes('quién atiende') || q.includes('quien atiende') || q.includes('personal')) {
    const active = barbers.filter(b => b.isActive);
    const list = active.map(b => `✂️ *${b.name}*\n   Especialidades: ${b.specialties.join(', ')}`).join('\n\n');

    return {
      replyText: `💈 *Equipo de Barberos Expertos:*\n\n${list}\n\n¿Con quién prefieres tu corte?`,
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
    const targetDate = isTomorrow ? addDays(new Date(), 1) : new Date();
    const dateStr = format(targetDate, 'yyyy-MM-dd');
    const dayLabel = format(targetDate, "EEEE d 'de' MMMM", { locale: es });

    // Detect preferred barber
    let targetBarber = barbers.find(b => {
      const first = b.name.toLowerCase().split(' ')[0];
      return q.includes(first) && first.length > 2;
    }) || barbers.find(b => b.isActive) || barbers[0];

    // Find real available slots for target date
    const dayAppointments = appointments.filter(
      a => a.date === dateStr && a.barberId === targetBarber?.id && ['scheduled', 'confirmed', 'in_progress'].includes(a.status)
    );
    const bookedTimes = new Set(dayAppointments.map(a => a.startTime));

    // Candidate slots
    const candidateSlots = ['10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
    const freeSlots = candidateSlots.filter(t => !bookedTimes.has(t));

    if (freeSlots.length === 0) {
      return {
        replyText: `📅 Para *${dayLabel}* la agenda de *${targetBarber?.name}* está completa.\n\n¿Deseas revisar disponibilidad con otro barbero o para el día siguiente?`,
        suggestedButtons: [
          { id: 'btn_slot_next_day', title: '📆 Ver Día Siguiente' },
          { id: 'btn_otro_barbero', title: '✂️ Ver Otro Barbero' },
        ],
        actionTaken: 'booking_intent',
      };
    }

    const slotsText = freeSlots.slice(0, 4).map((s, idx) => `${idx + 1}️⃣ *${s}*`).join('\n');

    return {
      replyText: `✅ ¡Perfecto! Para *${dayLabel}* con *${targetBarber?.name}*, tenemos estos horarios disponibles:\n\n${slotsText}\n\nEscribe la hora que prefieres o presiona un botón:`,
      suggestedButtons: freeSlots.slice(0, 3).map(s => ({
        id: `btn_confirm_time_${s.replace(':', '')}`,
        title: `⏰ ${s}`,
        payload: s,
      })),
      actionTaken: 'booking_intent',
      bookingDraft: {
        barberId: targetBarber?.id,
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
      { id: 'btn_precios', title: '💰 Ver Precios' },
      { id: 'btn_ubicacion', title: '📍 Ubicación y Horarios' },
    ],
    actionTaken: 'none',
  };
}
