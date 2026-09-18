import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      slug,
      ownerName,
      ownerEmail,
      ownerPassword,
      phone,
      city,
      address,
      plan = 'pro',
      primaryColor = '#7c3aed',
      logoUrl = '✂️',
      tagline = 'Cortes legendarios y estilo superior',
    } = body;

    if (!name || !slug || !ownerEmail) {
      return NextResponse.json(
        { success: false, error: 'Nombre, slug y correo del dueño son obligatorios.' },
        { status: 400 }
      );
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    const cleanEmail = ownerEmail.toLowerCase().trim();
    const tempPassword = ownerPassword?.trim() || `MartiArenas_${Math.random().toString(36).slice(-6)}!`;
    const shopId = `shop_${cleanSlug.replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;

    const mrr = plan === 'enterprise' ? 249000 : plan === 'basic' ? 129000 : 189000;

    const adminSupabase = createAdminSupabase();

    // 1. Insert Tenant in public.tenants
    const { data: tenant, error: tenantError } = await adminSupabase
      .from('tenants')
      .insert({
        id: shopId,
        name,
        slug: cleanSlug,
        address: address || 'Dirección principal por configurar',
        city: city || 'Bogotá',
        country: 'Colombia',
        phone: phone || '+57 300 000 0000',
        email: cleanEmail,
        owner_name: ownerName || 'Administrador',
        owner_email: cleanEmail,
        plan: plan,
        status: 'active',
        mrr: mrr,
        theme: {
          mode: 'dark',
          primaryColor: primaryColor,
          backgroundType: 'gradient',
          logoUrl: logoUrl,
          tagline: tagline,
          backgroundOpacity: 0.15,
        },
        working_hours: {
          monday: { isOpen: true, open: '09:00', close: '19:00' },
          tuesday: { isOpen: true, open: '09:00', close: '19:00' },
          wednesday: { isOpen: true, open: '09:00', close: '19:00' },
          thursday: { isOpen: true, open: '09:00', close: '20:00' },
          friday: { isOpen: true, open: '09:00', close: '20:00' },
          saturday: { isOpen: true, open: '08:00', close: '18:00' },
          sunday: { isOpen: false, open: '10:00', close: '15:00' },
        },
        settings: {
          allowOnlineBooking: true,
          bookingWindowDays: 30,
          cancellationPolicyHours: 2,
          rewardThreshold: 5,
          rewardDescription: 'Corte de cortesía en tu próxima visita',
          currency: 'COP',
          currencySymbol: '$',
        },
      })
      .select()
      .single();

    if (tenantError) {
      console.error('Error inserting tenant in Supabase:', tenantError);
      return NextResponse.json(
        { success: false, error: `Error creando empresa: ${tenantError.message}` },
        { status: 500 }
      );
    }

    // 2. Create User in Supabase Auth via Admin API (confirmed email & instant login)
    let authUser = null;
    try {
      const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
        email: cleanEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          name: ownerName || 'Administrador',
          role: 'admin',
          tenant_id: shopId,
        },
      });

      if (!authError && authData?.user) {
        authUser = authData.user;
      } else if (authError) {
        console.warn('Supabase Auth createUser warning (user may already exist):', authError.message);
      }
    } catch (err: any) {
      console.warn('Auth creation error:', err.message);
    }

    // 3. Insert or Update User in public.users
    const userId = `user_admin_${shopId}`;
    await adminSupabase.from('users').upsert({
      id: userId,
      auth_id: authUser?.id || null,
      tenant_id: shopId,
      name: ownerName || 'Administrador',
      email: cleanEmail,
      role: 'admin',
      is_active: true,
    });

    // 4. Create Initial Starter Barbers, Services & Products for turnkey operation
    const barberId = `barber_${shopId}_1`;
    await adminSupabase.from('barbers').insert([
      {
        id: barberId,
        tenant_id: shopId,
        name: `${(ownerName || 'Master').split(' ')[0]} Barber`,
        phone: phone || '+57 300 000 0000',
        email: cleanEmail,
        description: 'Barbero principal y fundador.',
        specialties: ['Fade', 'Clásico', 'Barba'],
        commission_rate: 0.50,
        color: primaryColor,
        is_active: true,
      },
    ]);

    await adminSupabase.from('services').insert([
      {
        id: `svc_${shopId}_1`,
        tenant_id: shopId,
        name: 'Corte Signature Fade',
        description: 'Corte degradado a navaja con lavado y peinado.',
        duration: 40,
        price: 38000,
        commission_rate: 0.45,
        category: 'corte',
        is_active: true,
        popular: true,
      },
      {
        id: `svc_${shopId}_2`,
        tenant_id: shopId,
        name: 'Corte + Barba Tradicional',
        description: 'Ritual completo con toalla caliente y perfilado a navaja.',
        duration: 60,
        price: 65000,
        commission_rate: 0.45,
        category: 'combo',
        is_active: true,
        popular: true,
      },
      {
        id: `svc_${shopId}_3`,
        tenant_id: shopId,
        name: 'Perfilado de Barba & Spa',
        description: 'Hidratación con aceites esenciales y toalla caliente.',
        duration: 30,
        price: 30000,
        commission_rate: 0.40,
        category: 'barba',
        is_active: true,
        popular: false,
      },
    ]);

    await adminSupabase.from('products').insert([
      {
        id: `prod_${shopId}_1`,
        tenant_id: shopId,
        name: 'Pomada Fijación Mate (100ml)',
        description: 'Acabado natural sin brillo y fijación 24h.',
        category: 'cera',
        price: 45000,
        cost: 22000,
        stock: 15,
        min_stock: 4,
        is_active: true,
        featured: true,
      },
      {
        id: `prod_${shopId}_2`,
        tenant_id: shopId,
        name: 'Aceite para Barba Wood & Spice',
        description: 'Nutrición con aceites de argán y almendras.',
        category: 'aceite',
        price: 52000,
        cost: 25000,
        stock: 10,
        min_stock: 3,
        is_active: true,
        featured: true,
      },
    ]);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const loginUrl = `${appUrl}/login`;
    const bookingUrl = `${appUrl}/booking/${cleanSlug}`;

    const whatsappMessage = `💈 *¡Bienvenido a MartiArenas Labs, ${ownerName || name}!*

Tu plataforma para *${name}* está 100% activa y lista para operar:

🔐 *TUS ACCESOS AL PANEL ADMINISTRATIVO:*
• *Enlace de Acceso:* ${loginUrl}
• *Usuario:* ${cleanEmail}
• *Contraseña Temporal:* ${tempPassword}

🌐 *TU PORTAL DE RESERVAS PARA CLIENTES:*
• *Enlace:* ${bookingUrl}
(Tus clientes pueden reservar turnos vía web o escaneando tu código QR).

Cualquier duda o ajuste de marca, estamos a tu disposición. ¡Éxitos con tu barbería! 🚀`;

    return NextResponse.json({
      success: true,
      tenant: {
        id: shopId,
        name,
        slug: cleanSlug,
        city: city || 'Bogotá',
        plan,
        mrr,
        primaryColor,
        ownerName,
        ownerEmail: cleanEmail,
        createdAt: new Date().toISOString(),
      },
      credentials: {
        email: cleanEmail,
        password: tempPassword,
        loginUrl,
        bookingUrl,
      },
      whatsappMessage,
    });
  } catch (error: any) {
    console.error('Unexpected error in create-tenant route:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
