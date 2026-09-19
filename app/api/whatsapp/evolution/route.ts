import { NextRequest, NextResponse } from 'next/server';
import { EvolutionApiClient } from '@/lib/whatsapp/evolution';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, serverUrl, apiKey, instanceName, phone, message, webhookUrl } = body;

    const client = new EvolutionApiClient({
      serverUrl: serverUrl || process.env.EVOLUTION_SERVER_URL,
      apiKey: apiKey || process.env.EVOLUTION_API_KEY,
    });

    const targetInstance = instanceName || 'barberia_default';

    switch (action) {
      case 'create_instance': {
        const result = await client.createInstance({
          instanceName: targetInstance,
          webhookUrl: webhookUrl || `${req.nextUrl.origin}/api/whatsapp/webhook`,
        });
        return NextResponse.json(result);
      }

      case 'get_qr': {
        const result = await client.getQRCode(targetInstance);
        return NextResponse.json(result);
      }

      case 'get_status': {
        const result = await client.getConnectionState(targetInstance);
        return NextResponse.json(result);
      }

      case 'send_test': {
        if (!phone || !message) {
          return NextResponse.json({ success: false, error: 'Teléfono y mensaje requeridos' }, { status: 400 });
        }
        const result = await client.sendTextMessage({
          instanceName: targetInstance,
          phone,
          text: message,
        });
        return NextResponse.json(result);
      }

      case 'logout': {
        const result = await client.logout(targetInstance);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
