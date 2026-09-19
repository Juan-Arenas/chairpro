import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type {
  Barbershop,
  Appointment,
  Transaction,
  Barber,
  Client,
  DailyCloseReport
} from '@/types';

/**
 * Generates the Daily Close (Cierre de Caja) Report for the Barbershop Owner.
 * Consolidates cash in drawer vs Nequi/Daviplata/Card to prevent cash leaks and discrepancies.
 */
export function calculateDailyCloseReport(
  shop: Barbershop,
  dateStr: string,
  appointments: Appointment[],
  transactions: Transaction[],
  barbers: Barber[]
): DailyCloseReport {
  // Filter transactions for given date
  const dayTransactions = transactions.filter(t => t.date.startsWith(dateStr) && t.type === 'income');
  const dayAppointments = appointments.filter(a => a.date === dateStr && a.status === 'completed');

  let cashInDrawer = 0;
  let nequiAmount = 0;
  let daviplataAmount = 0;
  let cardAmount = 0;
  let transferAmount = 0;

  for (const t of dayTransactions) {
    const desc = t.description.toLowerCase();
    if (desc.includes('nequi')) nequiAmount += t.amount;
    else if (desc.includes('daviplata')) daviplataAmount += t.amount;
    else if (desc.includes('tarjeta') || desc.includes('card')) cardAmount += t.amount;
    else if (desc.includes('transferencia')) transferAmount += t.amount;
    else cashInDrawer += t.amount;
  }

  // Fallback if transactions didn't have explicit labels
  if (dayTransactions.length === 0 && dayAppointments.length > 0) {
    for (const a of dayAppointments) {
      if (a.paymentMethod === 'nequi') nequiAmount += a.price;
      else if (a.paymentMethod === 'daviplata') daviplataAmount += a.price;
      else if (a.paymentMethod === 'card') cardAmount += a.price;
      else if (a.paymentMethod === 'transfer') transferAmount += a.price;
      else cashInDrawer += a.price;
    }
  }

  const totalRevenue = cashInDrawer + nequiAmount + daviplataAmount + cardAmount + transferAmount;

  // Breakdown by Barber
  const barbersBreakdown = barbers.map(barber => {
    const barberAppts = dayAppointments.filter(a => a.barberId === barber.id);
    const totalEarned = barberAppts.reduce((sum, a) => sum + a.price, 0);
    const commissionAmount = Math.round(totalEarned * barber.commissionRate);

    return {
      barberId: barber.id,
      barberName: barber.name,
      servicesCount: barberAppts.length,
      totalEarned,
      commissionAmount,
    };
  }).filter(b => b.servicesCount > 0 || b.totalEarned > 0);

  const totalCommissionsAmount = barbersBreakdown.reduce((s, b) => s + b.commissionAmount, 0);
  const netShopProfit = totalRevenue - totalCommissionsAmount;

  return {
    id: `close_${shop.id}_${dateStr.replace(/-/g, '')}`,
    shopId: shop.id,
    date: dateStr,
    totalRevenue,
    cashInDrawer,
    nequiAmount,
    daviplataAmount,
    cardAmount,
    transferAmount,
    totalServicesCount: dayAppointments.length,
    totalProductsCount: dayTransactions.filter(t => t.category === 'product').length,
    totalCommissionsAmount,
    netShopProfit,
    barbersBreakdown,
    generatedAt: new Date().toISOString(),
    sentToWhatsApp: false,
    recipientPhone: shop.settings?.dailyClosePhone || shop.phone || shop.whatsapp,
  };
}

/**
 * Formats the Daily Close Report into a structured, elegant WhatsApp message for the owner.
 */
export function formatDailyCloseWhatsAppMessage(report: DailyCloseReport, shopName: string): string {
  const dateFormatted = format(new Date(report.date + 'T12:00:00'), "EEEE d 'de' MMMM yyyy", { locale: es });

  const barbersText = report.barbersBreakdown.map(b => (
    `• *${b.barberName}*: ${b.servicesCount} cortes | Prod: ${formatCurrency(b.totalEarned)} | *Comisión:* ${formatCurrency(b.commissionAmount)}`
  )).join('\n');

  return `📊 *CIERRE DE CAJA AUTOMÁTICO — ${shopName.toUpperCase()}*
📅 _${dateFormatted}_
⏰ Generado: ${format(new Date(), 'HH:mm')}

💰 *FACTURACIÓN TOTAL:* ${formatCurrency(report.totalRevenue)}
✂️ Servicios Realizados: ${report.totalServicesCount}

━━━━━━━━━━━━━━━━━━━━
💳 *DESGLOSE POR MÉTODO DE PAGO:*
💵 *Efectivo en Cajón Físico:* ${formatCurrency(report.cashInDrawer)}
🟣 *Nequi:* ${formatCurrency(report.nequiAmount)}
🔴 *Daviplata:* ${formatCurrency(report.daviplataAmount)}
💳 *Datáfono / Tarjeta:* ${formatCurrency(report.cardAmount)}
🏦 *Transferencias:* ${formatCurrency(report.transferAmount)}

━━━━━━━━━━━━━━━━━━━━
👥 *COMISIONES DE BARBEROS:*
${barbersText || '• Sin servicios registrados'}
*Total a Pagar a Barberos:* ${formatCurrency(report.totalCommissionsAmount)}

━━━━━━━━━━━━━━━━━━━━
🏆 *UTILIDAD NETA BARBERÍA:* *${formatCurrency(report.netShopProfit)}*

✅ _Reporte generado automáticamente por ChairPro SaaS._`;
}

/**
 * Generates an Anti-No-Show WhatsApp Reminder with 1-Click interactive buttons.
 */
export function formatAntiNoShowReminder(
  clientName: string,
  barberName: string,
  serviceName: string,
  time: string,
  dateStr: string,
  shop: Barbershop
): { messageText: string; buttons: { id: string; title: string }[] } {
  return {
    messageText: `👋 ¡Hola *${clientName}*!

Te recordamos tu cita de hoy en *${shop.name}* 💈:
✂️ *Servicio:* ${serviceName}
💈 *Barbero:* ${barberName}
⏰ *Hora:* ${time}
📍 *Dirección:* ${shop.address}

Por favor confirma tu asistencia presionando un botón:`,
    buttons: [
      { id: 'btn_confirm_appt', title: '✅ Confirmar Asistencia' },
      { id: 'btn_reschedule_appt', title: '🔄 Reprogramar Turno' },
      { id: 'btn_cancel_appt', title: '❌ No podré asistir' },
    ],
  };
}

/**
 * Generates a Google Maps Review Booster WhatsApp message.
 */
export function formatGoogleReviewBooster(
  clientName: string,
  barberName: string,
  shop: Barbershop
): string {
  const gLink = shop.settings?.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(shop.name + ' ' + shop.city)}`;

  return `🔥 ¡Hola *${clientName}*!

Esperamos que hayas quedado al 100% con tu corte de hoy con *${barberName}* en *${shop.name}* 💈✨

¿Nos regalarías 1 minuto dejando tu calificación de 5 estrellas en Google? Tu opinión nos ayuda muchísimo a seguir creciendo:

⭐ *Deja tu reseña aquí:*
👉 ${gLink}

¡Al mostrar tu reseña en tu próxima visita recibirás un *10% de descuento* en cualquier producto o tratamiento! 🎁`;
}

/**
 * Generates a Win-Back Client Re-engagement WhatsApp message.
 */
export function formatWinBackMessage(
  client: Client,
  barberName: string,
  shop: Barbershop,
  daysInactive: number = 21
): string {
  return `💈 ¡Hola *${client.name}*!

Han pasado *${daysInactive} días* desde tu última visita con *${barberName}* en *${shop.name}* ✂️.

Un buen corte siempre marca la diferencia. ¿Te apartamos tu espacio para este fin de semana?

📲 Responde *1* para ver horarios disponibles hoy o *2* para mañana.
O reserva en 1 clic aquí: https://${shop.slug || 'chairpro'}.barberia.co/booking`;
}
