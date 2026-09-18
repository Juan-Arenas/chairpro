import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET() {
  const start = Date.now();
  try {
    const supabase = createServerSupabase();
    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('id, name, slug, status')
      .limit(10);

    const latency = Date.now() - start;

    if (error) {
      return NextResponse.json(
        {
          connected: false,
          error: error.message,
          latencyMs: latency,
          configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      connected: true,
      latencyMs: latency,
      tenantsCount: tenants?.length || 0,
      tenants: tenants || [],
      timestamp: new Date().toISOString(),
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configurado' : 'No configurado',
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        connected: false,
        error: err.message || 'Error de conexión',
        latencyMs: Date.now() - start,
      },
      { status: 200 }
    );
  }
}
