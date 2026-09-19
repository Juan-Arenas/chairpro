import { NextRequest, NextResponse } from 'next/server';
import { calculateDailyCloseReport, formatDailyCloseWhatsAppMessage } from '@/lib/whatsapp/automations';
import { format } from 'date-fns';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shop, date, appointments = [], transactions = [], barbers = [] } = body;

    const targetDate = date || format(new Date(), 'yyyy-MM-dd');
    const report = calculateDailyCloseReport(shop, targetDate, appointments, transactions, barbers);
    const whatsappMessage = formatDailyCloseWhatsAppMessage(report, shop?.name || 'Barbería');

    return NextResponse.json({
      success: true,
      report,
      whatsappMessage,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
