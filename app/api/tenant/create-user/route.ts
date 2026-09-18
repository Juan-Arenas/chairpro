import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      shopId,
      shopName,
      name,
      email,
      phone,
      role = 'barber',
      barberId,
      password,
    } = body;

    if (!shopId || !email || !name) {
      return NextResponse.json(
        { success: false, error: 'ShopId, email y nombre son obligatorios.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const tempPassword = password?.trim() || `Barber_${Math.random().toString(36).slice(-6)}!`;
    const userId = `user_${role}_${Date.now().toString().slice(-6)}`;

    const adminSupabase = createAdminSupabase();

    // 1. Create or Update user in Supabase Auth via Admin API
    let authUser = null;
    try {
      const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
        email: cleanEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          name,
          role,
          tenant_id: shopId,
          barber_id: barberId || null,
        },
      });

      if (!authError && authData?.user) {
        authUser = authData.user;
      } else if (authError) {
        console.warn('Auth user already exists or warning:', authError.message);
      }
    } catch (err: any) {
      console.warn('Auth creation error:', err.message);
    }

    // 2. Upsert in public.users
    await adminSupabase.from('users').upsert({
      id: userId,
      auth_id: authUser?.id || null,
      tenant_id: shopId,
      name,
      email: cleanEmail,
      role,
      barber_id: barberId || null,
      is_active: true,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const loginUrl = `${appUrl}/login`;

    const whatsappMessage = `✂️ *¡Hola, ${name}!*

Te han creado una cuenta de acceso para la barbería *${shopName || 'MartiArenas Labs'}*:

🔐 *TUS CREDENCIALES DE ACCESO:*
• *Enlace de Inicio:* ${loginUrl}
• *Usuario:* ${cleanEmail}
• *Contraseña:* ${tempPassword}
• *Rol:* ${role === 'barber' ? 'Barbero Profesional' : 'Recepcionista'}

Desde allí podrás ver tu agenda diaria de turnos, registrar tus servicios y consultar tus comisiones acumuladas. ¡Bienvenido al equipo! 💈`;

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        name,
        email: cleanEmail,
        role,
        barberId,
      },
      credentials: {
        email: cleanEmail,
        password: tempPassword,
        loginUrl,
      },
      whatsappMessage,
    });
  } catch (error: any) {
    console.error('Error creating tenant user:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
