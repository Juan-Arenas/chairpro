import { NextRequest, NextResponse } from 'next/server';

/**
 * Meta WhatsApp Cloud API & Evolution API Webhook Handler.
 * Handles incoming verification (GET) and incoming message payloads (POST).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'chairpro_barber_saas_secure_token';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Log incoming webhook event
    console.log('[WhatsApp Webhook Inbound]:', JSON.stringify(body, null, 2));

    // Handle Meta Cloud API Structure
    if (body.object === 'whatsapp_business_account' && body.entry) {
      for (const entry of body.entry) {
        for (const change of entry.changes || []) {
          const value = change.value;
          if (value?.messages) {
            for (const msg of value.messages) {
              const from = msg.from;
              const type = msg.type;
              let content = '';

              if (type === 'text') {
                content = msg.text?.body || '';
              } else if (type === 'audio' || type === 'voice') {
                content = '[Nota de voz recibida - Procesada por Whisper]';
              } else if (type === 'interactive') {
                content = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '';
              }

              console.log(`[WhatsApp Message from ${from}]: ${content} (Type: ${type})`);
            }
          }
        }
      }
    }

    // Handle Evolution API / Baileys Format
    if (body.event === 'messages.upsert' && body.data) {
      const msg = body.data;
      const from = msg.key?.remoteJid?.replace('@s.whatsapp.net', '');
      const content = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
      console.log(`[Evolution API from ${from}]: ${content}`);
    }

    return NextResponse.json({ success: true, message: 'Webhook received' }, { status: 200 });
  } catch (error: any) {
    console.error('[WhatsApp Webhook Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
