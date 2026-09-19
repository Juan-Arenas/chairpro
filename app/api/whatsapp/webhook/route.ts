import { NextRequest, NextResponse } from 'next/server';
import { parseBarberMessage } from '@/lib/whatsapp/parser';
import { processCustomerMessage } from '@/lib/whatsapp/chatbot';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client for database operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 1. GET: Webhook Verification Handshake for Meta WhatsApp Cloud API
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'chairpro_barber_saas_secure_token';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[WhatsApp Webhook Verified Successfully]');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

/**
 * Helper: Download and Transcribe WhatsApp Audio using OpenAI Whisper or Groq
 */
async function transcribeWhatsAppAudio(audioId: string, accessToken: string): Promise<string | null> {
  try {
    const openaiKey = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;
    if (!openaiKey) {
      console.warn('[Whisper] No OPENAI_API_KEY / GROQ_API_KEY provided. Audio transcription bypassed.');
      return null;
    }

    // 1. Get Media URL from Meta
    const mediaRes = await fetch(`https://graph.facebook.com/v19.0/${audioId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const mediaData = await mediaRes.json();
    if (!mediaData.url) return null;

    // 2. Download the binary audio file
    const audioRes = await fetch(mediaData.url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const audioBlob = await audioRes.blob();

    // 3. Send to Whisper API
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.ogg');
    formData.append('model', 'whisper-1');
    formData.append('language', 'es');

    const whisperUrl = process.env.OPENAI_API_KEY
      ? 'https://api.openai.com/v1/audio/transcriptions'
      : 'https://api.groq.com/openai/v1/audio/transcriptions';

    const whisperRes = await fetch(whisperUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${openaiKey}` },
      body: formData,
    });

    const whisperData = await whisperRes.json();
    return whisperData.text || null;
  } catch (err) {
    console.error('[Whisper Audio Error]:', err);
    return null;
  }
}

/**
 * Helper: Send Real Outbound WhatsApp Message via Meta Cloud API
 */
async function sendMetaWhatsAppMessage(toPhone: string, messageText: string, phoneNumberId: string, accessToken: string) {
  try {
    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
    const cleanPhone = toPhone.replace(/\D/g, '');

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
        type: 'text',
        text: { preview_url: false, body: messageText },
      }),
    });

    const data = await res.json();
    console.log('[Meta WhatsApp Response]:', data);
    return data;
  } catch (err) {
    console.error('[Meta WhatsApp Send Error]:', err);
    return null;
  }
}

/**
 * 2. POST: Inbound WhatsApp Message Handler (Real Meta Cloud API & Evolution API)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[Inbound WhatsApp Event]:', JSON.stringify(body, null, 2));

    const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
    const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';

    // Handle Meta WhatsApp Cloud API
    if (body.object === 'whatsapp_business_account' && body.entry) {
      for (const entry of body.entry) {
        for (const change of entry.changes || []) {
          const value = change.value;
          const messages = value?.messages;

          if (messages && messages.length > 0) {
            for (const msg of messages) {
              const senderPhone = msg.from; // e.g. "573001234567"
              const msgType = msg.type;
              let content = '';

              // Extract text or transcribe audio
              if (msgType === 'text') {
                content = msg.text?.body || '';
              } else if (msgType === 'audio' || msgType === 'voice') {
                const audioId = msg.audio?.id || msg.voice?.id;
                if (audioId && ACCESS_TOKEN) {
                  const transcribed = await transcribeWhatsAppAudio(audioId, ACCESS_TOKEN);
                  content = transcribed || '[Audio sin transcripción]';
                }
              } else if (msgType === 'interactive') {
                content = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '';
              }

              if (!content.trim()) continue;

              // 1. Fetch Barbershop & Barbers from Database
              const { data: barbers } = await supabase.from('barbers').select('*');
              const { data: services } = await supabase.from('services').select('*');
              const { data: products } = await supabase.from('products').select('*');
              const { data: tenant } = await supabase.from('tenants').select('*').limit(1).single();

              // Check if sender is a registered Barber
              const matchedBarber = (barbers || []).find(
                (b: any) => b.phone?.replace(/\D/g, '') === senderPhone || senderPhone.includes(b.phone?.replace(/\D/g, ''))
              );

              if (matchedBarber) {
                // ── SENDER IS A BARBER ──────────────────────────────────
                const parsed = parseBarberMessage(content, {
                  services: services || [],
                  products: products || [],
                  barbers: barbers || [],
                  currentBarber: matchedBarber,
                  isAudio: msgType === 'audio' || msgType === 'voice',
                });

                if (parsed.actionType === 'register_service') {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const nowTime = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

                  // Create Appointment in DB
                  const { data: appt } = await supabase.from('appointments').insert({
                    tenant_id: tenant?.id || matchedBarber.tenant_id,
                    barber_id: matchedBarber.id,
                    service_id: parsed.serviceId || (services?.[0]?.id || null),
                    date: todayStr,
                    start_time: nowTime,
                    end_time: nowTime,
                    status: 'completed',
                    source: 'whatsapp',
                    price: parsed.price,
                    commission_amount: parsed.commissionAmount,
                    is_paid: true,
                    payment_method: parsed.paymentMethod,
                    notes: `Registrado por WhatsApp Real (${msgType}): "${content}"`,
                  }).select().single();

                  // Create Transaction in DB
                  await supabase.from('transactions').insert({
                    tenant_id: tenant?.id || matchedBarber.tenant_id,
                    type: 'income',
                    category: 'service',
                    description: `${parsed.serviceName || 'Servicio'} - ${matchedBarber.name} (${parsed.paymentMethod.toUpperCase()}) [WhatsApp Real]`,
                    amount: parsed.price,
                    date: todayStr,
                    related_appointment_id: appt?.id,
                    barber_id: matchedBarber.id,
                    commission_amount: parsed.commissionAmount,
                  });

                  // Format WhatsApp Reply
                  const methodIcons: Record<string, string> = {
                    nequi: '🟣 Nequi',
                    daviplata: '🔴 Daviplata',
                    cash: '💵 Efectivo',
                    card: '💳 Datáfono/Tarjeta',
                    transfer: '🏦 Transferencia',
                  };

                  const replyText = `✅ *¡Servicio Registrado Automáticamente en ChairPro!*

💈 *Barbero:* ${matchedBarber.name}
✂️ *Servicio:* ${parsed.serviceName || 'Corte'}
💰 *Valor:* $${parsed.price.toLocaleString('es-CO')} COP
💳 *Pago:* ${methodIcons[parsed.paymentMethod] || parsed.paymentMethod}
🏆 *Tu Comisión:* $${parsed.commissionAmount.toLocaleString('es-CO')} COP

_Registrado en la base de datos de la barbería al instante._`;

                  if (ACCESS_TOKEN && PHONE_NUMBER_ID) {
                    await sendMetaWhatsAppMessage(senderPhone, replyText, PHONE_NUMBER_ID, ACCESS_TOKEN);
                  }
                }
              } else {
                // ── SENDER IS A CUSTOMER / CLIENT ───────────────────────
                if (tenant) {
                  const botReply = processCustomerMessage(content, {
                    shop: tenant,
                    services: services || [],
                    barbers: barbers || [],
                    appointments: [],
                    clientPhone: senderPhone,
                  });

                  if (ACCESS_TOKEN && PHONE_NUMBER_ID) {
                    await sendMetaWhatsAppMessage(senderPhone, botReply.replyText, PHONE_NUMBER_ID, ACCESS_TOKEN);
                  }
                }
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Evento procesado' }, { status: 200 });
  } catch (error: any) {
    console.error('[WhatsApp Webhook Handler Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
