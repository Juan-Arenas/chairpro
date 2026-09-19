import { NextRequest, NextResponse } from 'next/server';
import { processCustomerMessage } from '@/lib/whatsapp/chatbot';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, shop, services = [], barbers = [], appointments = [], customKnowledge = [], clientName, clientPhone } = body;

    if (!message || !shop) {
      return NextResponse.json({ error: 'Mensaje y datos de barbería requeridos' }, { status: 400 });
    }

    const response = processCustomerMessage(message, {
      shop,
      services,
      barbers,
      appointments,
      customKnowledge,
      clientName,
      clientPhone,
    });

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
