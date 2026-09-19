import type { ParsedBarberAction, PaymentMethod, BarberStatus, Service, Product, Barber } from '@/types';

/**
 * Intelligent Speech/Text Natural Language Parser for Barbers.
 * Extracts: Service, Price, Payment Method, Products, Status, and Barber information.
 * Supports Colombian & Latin American natural vernacular (e.g. "35k", "35 mil", "Nequi", "Daviplata", "Fade").
 */
export function parseBarberMessage(
  input: string,
  context: {
    services: Service[];
    products: Product[];
    barbers: Barber[];
    currentBarber?: Barber;
    isAudio?: boolean;
  }
): ParsedBarberAction {
  const text = input.trim();
  const lower = text.toLowerCase();

  // 1. Check for Status Change commands
  if (
    lower.includes('disponible') ||
    lower.includes('libre') ||
    lower.includes('desocupado') ||
    lower.includes('listo para el siguiente')
  ) {
    return {
      actionType: 'change_status',
      newStatus: 'available',
      price: 0,
      paymentMethod: 'cash',
      commissionAmount: 0,
      confidence: 0.95,
      rawText: text,
      isAudio: context.isAudio,
    };
  }

  if (
    lower.includes('ocupado') ||
    lower.includes('en turno') ||
    lower.includes('empezando corte') ||
    lower.includes('en silla')
  ) {
    return {
      actionType: 'change_status',
      newStatus: 'busy',
      price: 0,
      paymentMethod: 'cash',
      commissionAmount: 0,
      confidence: 0.95,
      rawText: text,
      isAudio: context.isAudio,
    };
  }

  if (
    lower.includes('descanso') ||
    lower.includes('almuerzo') ||
    lower.includes('break') ||
    lower.includes('pausa') ||
    lower.includes('a comer')
  ) {
    return {
      actionType: 'change_status',
      newStatus: 'break',
      price: 0,
      paymentMethod: 'cash',
      commissionAmount: 0,
      confidence: 0.95,
      rawText: text,
      isAudio: context.isAudio,
    };
  }

  if (
    lower.includes('me voy') ||
    lower.includes('fuera de turno') ||
    lower.includes('cerré turno') ||
    lower.includes('terminé por hoy')
  ) {
    return {
      actionType: 'change_status',
      newStatus: 'off',
      price: 0,
      paymentMethod: 'cash',
      commissionAmount: 0,
      confidence: 0.95,
      rawText: text,
      isAudio: context.isAudio,
    };
  }

  // 2. Check for Wallet / Earnings Query
  if (
    lower.includes('cuanto llevo') ||
    lower.includes('cuánto llevo') ||
    lower.includes('mi saldo') ||
    lower.includes('mi billetera') ||
    lower.includes('mis cortes de hoy') ||
    lower.includes('cuanto gane')
  ) {
    return {
      actionType: 'check_wallet',
      price: 0,
      paymentMethod: 'cash',
      commissionAmount: 0,
      confidence: 0.95,
      rawText: text,
      isAudio: context.isAudio,
    };
  }

  // 3. Service Registration Extraction
  // A. Detect Payment Method
  let paymentMethod: PaymentMethod = 'cash';
  if (lower.includes('nequi')) paymentMethod = 'nequi';
  else if (lower.includes('daviplata')) paymentMethod = 'daviplata';
  else if (lower.includes('tarjeta') || lower.includes('datafono') || lower.includes('datáfono') || lower.includes('card')) paymentMethod = 'card';
  else if (lower.includes('transferencia') || lower.includes('transfiya') || lower.includes('bancolombia')) paymentMethod = 'transfer';
  else if (lower.includes('efectivo') || lower.includes('cash') || lower.includes('plata')) paymentMethod = 'cash';

  // B. Detect Price from numbers or expressions (e.g. 35000, 35 mil, 35k, $35.000)
  let extractedPrice = 0;
  const kMatch = lower.match(/(\d+)\s*(?:k|mil)/i);
  const rawNumMatch = lower.match(/\$?\s*(\d{2,3}[\.,]?\d{3})/);
  const plainNumMatch = lower.match(/\b(\d{2,3})\b/);

  if (kMatch) {
    extractedPrice = parseInt(kMatch[1], 10) * 1000;
  } else if (rawNumMatch) {
    extractedPrice = parseInt(rawNumMatch[1].replace(/[\.,]/g, ''), 10);
  }

  // C. Detect Barber (if mentioned by name or defaulted to context barber)
  let matchedBarber = context.currentBarber;
  for (const barber of context.barbers) {
    const firstName = barber.name.toLowerCase().split(' ')[0];
    if (lower.includes(firstName) && firstName.length > 2) {
      matchedBarber = barber;
      break;
    }
  }

  // D. Match Service
  let matchedService: Service | undefined;
  let highestScore = 0;

  for (const s of context.services) {
    const sName = s.name.toLowerCase();
    let score = 0;

    if (lower.includes(sName)) {
      score = 10;
    } else {
      const keywords = sName.split(' ');
      for (const kw of keywords) {
        if (kw.length > 3 && lower.includes(kw)) {
          score += 3;
        }
      }
    }

    if (score > highestScore) {
      highestScore = score;
      matchedService = s;
    }
  }

  // Fallback Service matching by keywords if exact service title wasn't found
  if (!matchedService) {
    if (lower.includes('barba') && (lower.includes('corte') || lower.includes('combo'))) {
      matchedService = context.services.find(s => s.category === 'combo') || context.services[0];
    } else if (lower.includes('barba')) {
      matchedService = context.services.find(s => s.category === 'barba') || context.services[0];
    } else if (lower.includes('corte') || lower.includes('fade') || lower.includes('clasico') || lower.includes('degrade')) {
      matchedService = context.services.find(s => s.category === 'corte') || context.services[0];
    } else {
      matchedService = context.services[0];
    }
  }

  // Final Price resolution
  const finalPrice = extractedPrice > 0 ? extractedPrice : (matchedService ? matchedService.price : 30000);

  // E. Detect Products sold (e.g. "mas cera", "pomada", "minoxidil")
  const productsSold: { productId: string; productName: string; price: number; quantity: number }[] = [];
  for (const prod of context.products) {
    const pName = prod.name.toLowerCase();
    const pCat = prod.category.toLowerCase();
    if (lower.includes(pName) || lower.includes(pCat)) {
      productsSold.push({
        productId: prod.id,
        productName: prod.name,
        price: prod.price,
        quantity: 1,
      });
      break;
    }
  }

  // F. Calculate commission
  const commissionRate = matchedBarber ? matchedBarber.commissionRate : 0.45;
  const commissionAmount = Math.round(finalPrice * commissionRate);

  // G. Detect optional client name (e.g. "cliente Carlos", "con Don Pedro")
  let clientName: string | undefined;
  const clientMatch = text.match(/(?:cliente|para|con)\s+([A-ZÁÉÍÓÚÑa-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]+)?)/i);
  if (clientMatch && clientMatch[1]) {
    const candidate = clientMatch[1].trim();
    if (!candidate.toLowerCase().includes('nequi') && !candidate.toLowerCase().includes('efectivo') && !candidate.toLowerCase().includes('daviplata')) {
      clientName = candidate;
    }
  }

  return {
    actionType: 'register_service',
    barberId: matchedBarber?.id,
    barberName: matchedBarber?.name,
    serviceId: matchedService?.id,
    serviceName: matchedService?.name,
    price: finalPrice,
    paymentMethod,
    clientName,
    commissionAmount,
    productsSold: productsSold.length > 0 ? productsSold : undefined,
    confidence: highestScore > 0 || extractedPrice > 0 ? 0.95 : 0.8,
    rawText: text,
    isAudio: context.isAudio,
  };
}
