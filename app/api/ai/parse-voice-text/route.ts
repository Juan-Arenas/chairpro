import { NextRequest, NextResponse } from 'next/server';
import { parseBarberMessage } from '@/lib/whatsapp/parser';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { input, isAudio, services = [], products = [], barbers = [], currentBarber } = body;

    if (!input || typeof input !== 'string') {
      return NextResponse.json({ error: 'Texto o transcripción requerida' }, { status: 400 });
    }

    const parsedAction = parseBarberMessage(input, {
      services,
      products,
      barbers,
      currentBarber,
      isAudio: Boolean(isAudio),
    });

    return NextResponse.json({
      success: true,
      parsed: parsedAction,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
