import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/whatsapp/send-test
 * Sends a real outbound WhatsApp message using Meta WhatsApp Cloud API
 */
export async function POST(req: NextRequest) {
  try {
    const { phone, message, phoneNumberId, accessToken } = await req.json();

    const targetPhone = (phone || '').replace(/\D/g, '');
    const targetPhoneId = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
    const targetToken = accessToken || process.env.WHATSAPP_ACCESS_TOKEN;

    if (!targetPhone) {
      return NextResponse.json({ success: false, error: 'Ingresa un número de teléfono válido con indicativo (ej: 573001234567).' }, { status: 400 });
    }

    if (!targetPhoneId || !targetToken) {
      return NextResponse.json({
        success: false,
        error: 'Faltan credenciales de Meta WhatsApp Cloud API. Configura WHATSAPP_PHONE_NUMBER_ID y WHATSAPP_ACCESS_TOKEN en tu archivo .env o en el formulario.',
      }, { status: 400 });
    }

    const url = `https://graph.facebook.com/v19.0/${targetPhoneId}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${targetToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: targetPhone,
        type: 'text',
        text: { preview_url: false, body: message || '💈 Mensaje de prueba oficial enviado desde ChairPro SaaS.' },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: data.error?.message || 'Error al conectar con Meta Graph API',
        metaError: data.error,
      }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      messageId: data.messages?.[0]?.id,
      data,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Error de servidor' }, { status: 500 });
  }
}
