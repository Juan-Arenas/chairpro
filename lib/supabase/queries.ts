/**
 * ChairPro — Supabase Data Layer
 * 
 * Todas las queries hacia la base de datos centralizadas aquí.
 * El Zustand store usa estas funciones en vez de manipular arrays locales.
 * 
 * Convenciones:
 * - Todas las funciones reciben el cliente Supabase como primer arg
 * - Retornan { data, error } pattern
 * - Los nombres de columnas en Supabase son snake_case
 * - Los nombres en TypeScript son camelCase — se transforman al mapear
 */

import { createClient } from '@/lib/supabase/client';
import type {
  Barbershop, User, Barber, Client, Service, Product,
  Appointment, Transaction, Notification, Automation,
  InventoryMovement, ShopTheme, SaasPayment, SubscriptionStatus
} from '@/types';

// ═══════════════════════════════════════════════════════════════
// HELPERS: Mapeo snake_case ↔ camelCase
// ═══════════════════════════════════════════════════════════════

function mapTenantToBarbershop(row: any): Barbershop {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    address: row.address,
    city: row.city,
    country: row.country,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    ownerEmail: row.owner_email,
    ownerName: row.owner_name,
    website: row.website,
    instagram: row.instagram,
    timezone: row.timezone,
    theme: row.theme || {
      mode: 'dark',
      primaryColor: '#7c3aed',
      backgroundType: 'gradient',
      logoUrl: '✂️',
      tagline: '',
      backgroundOpacity: 0.15,
    },
    status: row.status,
    mrr: Number(row.mrr) || 0,
    nextBillingDate: row.next_billing_date,
    lastPaymentDate: row.last_payment_date,
    subscriptionStatus: row.subscription_status || 'active',
    workingHours: row.working_hours || {},
    settings: row.settings || {},
    plan: row.plan,
    createdAt: row.created_at,
  };
}

function mapRowToUser(row: any): User {
  return {
    id: row.id,
    shopId: row.tenant_id,
    name: row.name,
    email: row.email,
    role: row.role,
    barberId: row.barber_id,
    passwordHash: '', // No se expone
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
    isActive: row.is_active,
  };
}

function mapRowToBarber(row: any): Barber {
  return {
    id: row.id,
    shopId: row.tenant_id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    description: row.description || '',
    specialties: row.specialties || [],
    commissionRate: Number(row.commission_rate) || 0.40,
    color: row.color || '#7C3AED',
    schedule: row.schedule || [],
    serviceIds: row.service_ids || [],
    joinedAt: row.joined_at || row.created_at,
    isActive: row.is_active,
  };
}

function mapRowToClient(row: any): Client {
  return {
    id: row.id,
    shopId: row.tenant_id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    notes: row.notes,
    preferredBarberId: row.preferred_barber_id,
    preferredServiceId: row.preferred_service_id,
    totalVisits: row.total_visits || 0,
    totalSpent: Number(row.total_spent) || 0,
    noShowCount: row.no_show_count || 0,
    loyalty: row.loyalty || { points: 0, visits: 0 },
    tags: row.tags || ['new'],
    lastVisitAt: row.last_visit_at,
    registeredAt: row.registered_at,
  };
}

function mapRowToService(row: any): Service {
  return {
    id: row.id,
    shopId: row.tenant_id,
    name: row.name,
    description: row.description || '',
    duration: row.duration,
    price: Number(row.price),
    commissionRate: Number(row.commission_rate) || 0,
    category: row.category || 'corte',
    isActive: row.is_active,
    popular: row.popular || false,
  };
}

function mapRowToProduct(row: any): Product {
  return {
    id: row.id,
    shopId: row.tenant_id,
    name: row.name,
    description: row.description || '',
    category: row.category || 'otro',
    price: Number(row.price),
    cost: Number(row.cost) || 0,
    stock: row.stock || 0,
    minStock: row.min_stock || 3,
    isActive: row.is_active,
    featured: row.featured || false,
  };
}

function mapRowToAppointment(row: any): Appointment {
  return {
    id: row.id,
    shopId: row.tenant_id,
    clientId: row.client_id,
    barberId: row.barber_id,
    serviceId: row.service_id,
    date: row.date,
    startTime: row.start_time?.slice(0, 5) || '', // "09:00:00" → "09:00"
    endTime: row.end_time?.slice(0, 5) || '',
    status: row.status,
    source: row.source,
    price: Number(row.price),
    commissionAmount: Number(row.commission_amount) || 0,
    isPaid: row.is_paid || false,
    paymentMethod: row.payment_method,
    notes: row.notes,
    reminderSent: row.reminder_sent || false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRowToTransaction(row: any): Transaction {
  return {
    id: row.id,
    shopId: row.tenant_id,
    type: row.type,
    category: row.category,
    description: row.description,
    amount: Number(row.amount),
    date: row.date,
    relatedAppointmentId: row.related_appointment_id,
    relatedProductId: row.related_product_id,
    barberId: row.barber_id,
    commissionAmount: Number(row.commission_amount) || 0,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function mapRowToNotification(row: any): Notification {
  return {
    id: row.id,
    shopId: row.tenant_id,
    type: row.type,
    title: row.title,
    message: row.message,
    isRead: row.is_read || false,
    relatedId: row.related_id,
    createdAt: row.created_at,
  };
}

function mapRowToAutomation(row: any): Automation {
  return {
    id: row.id,
    shopId: row.tenant_id,
    name: row.name,
    trigger: row.trigger,
    triggerLabel: row.trigger_label || '',
    steps: row.steps || [],
    isActive: row.is_active,
    runCount: row.run_count || 0,
    lastRunAt: row.last_run_at,
  };
}

function mapRowToSaasPayment(row: any): SaasPayment {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    tenantName: row.tenants?.name || row.tenant_name || 'Barbería',
    amount: Number(row.amount) || 0,
    date: row.date,
    billingPeriodStart: row.billing_period_start,
    billingPeriodEnd: row.billing_period_end,
    paymentMethod: row.payment_method,
    reference: row.reference,
    notes: row.notes,
    recordedBy: row.recorded_by || 'SuperAdmin',
    createdAt: row.created_at,
  };
}

// ═══════════════════════════════════════════════════════════════
// QUERIES: Auth & User
// ═══════════════════════════════════════════════════════════════

export async function getUserByAuthId(authId: string): Promise<User | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authId)
    .single();

  if (error || !data) {
    // If not found by auth_id directly, inspect auth session
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user) {
      const email = authData.user.email?.toLowerCase();
      if (email === 'jl087521@gmail.com' || email === 'superadmin@chairpro.app') {
        return {
          id: 'user_superadmin_jl',
          shopId: 'shop_demo',
          name: 'Juan Arenas (SuperAdmin)',
          email: authData.user.email!,
          role: 'superadmin',
          passwordHash: '',
          isActive: true,
          createdAt: new Date().toISOString(),
        };
      }
    }
    return null;
  }
  return mapRowToUser(data);
}

export async function updateLastLogin(userId: string) {
  const supabase = createClient();
  await supabase
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', userId);
}

// ═══════════════════════════════════════════════════════════════
// QUERIES: Tenants (Barberías)
// ═══════════════════════════════════════════════════════════════

export async function fetchAllShops(): Promise<Barbershop[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return data.map(mapTenantToBarbershop);
}

export async function fetchShopById(shopId: string): Promise<Barbershop | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', shopId)
    .single();

  if (error || !data) return null;
  return mapTenantToBarbershop(data);
}

export async function fetchShopBySlug(slug: string): Promise<Barbershop | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (error || !data) return null;
  return mapTenantToBarbershop(data);
}

export async function createTenant(tenantData: {
  name: string;
  slug: string;
  ownerEmail: string;
  ownerName: string;
  city: string;
  plan?: string;
  primaryColor?: string;
}): Promise<Barbershop | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('tenants')
    .insert({
      name: tenantData.name,
      slug: tenantData.slug,
      email: tenantData.ownerEmail,
      owner_email: tenantData.ownerEmail,
      owner_name: tenantData.ownerName,
      city: tenantData.city,
      plan: tenantData.plan || 'pro',
      theme: {
        mode: 'dark',
        primaryColor: tenantData.primaryColor || '#7c3aed',
        backgroundType: 'gradient',
        logoUrl: '✂️',
        tagline: 'Experiencia y estilo superior',
        backgroundOpacity: 0.15,
      },
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Error creating tenant:', error);
    return null;
  }
  return mapTenantToBarbershop(data);
}

export async function updateTenantBranding(shopId: string, branding: Partial<ShopTheme & { name?: string }>) {
  const supabase = createClient();

  // First get current theme to merge
  const { data: current } = await supabase
    .from('tenants')
    .select('theme, name')
    .eq('id', shopId)
    .single();

  if (!current) return null;

  const updatedTheme = { ...current.theme, ...branding };
  const updateData: any = { theme: updatedTheme };
  if (branding.name) updateData.name = branding.name;

  const { data, error } = await supabase
    .from('tenants')
    .update(updateData)
    .eq('id', shopId)
    .select()
    .single();

  if (error) {
    console.error('Error updating branding:', error);
    return null;
  }
  return mapTenantToBarbershop(data);
}

export async function toggleTenantStatus(shopId: string) {
  const supabase = createClient();
  const { data: current } = await supabase
    .from('tenants')
    .select('status')
    .eq('id', shopId)
    .single();

  if (!current) return;

  await supabase
    .from('tenants')
    .update({ status: current.status === 'active' ? 'suspended' : 'active' })
    .eq('id', shopId);
}

// ═══════════════════════════════════════════════════════════════
// QUERIES: Cargar todos los datos de un tenant
// ═══════════════════════════════════════════════════════════════

export async function fetchTenantData(tenantId: string) {
  const supabase = createClient();

  const [
    { data: barbers },
    { data: clients },
    { data: services },
    { data: products },
    { data: appointments },
    { data: transactions },
    { data: notifications },
    { data: automations },
  ] = await Promise.all([
    supabase.from('barbers').select('*').eq('tenant_id', tenantId),
    supabase.from('clients').select('*').eq('tenant_id', tenantId),
    supabase.from('services').select('*').eq('tenant_id', tenantId),
    supabase.from('products').select('*').eq('tenant_id', tenantId),
    supabase.from('appointments').select('*').eq('tenant_id', tenantId).order('date', { ascending: false }).limit(500),
    supabase.from('transactions').select('*').eq('tenant_id', tenantId).order('date', { ascending: false }).limit(500),
    supabase.from('notifications').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(100),
    supabase.from('automations').select('*').eq('tenant_id', tenantId),
  ]);

  return {
    barbers: (barbers || []).map(mapRowToBarber),
    clients: (clients || []).map(mapRowToClient),
    services: (services || []).map(mapRowToService),
    products: (products || []).map(mapRowToProduct),
    appointments: (appointments || []).map(mapRowToAppointment),
    transactions: (transactions || []).map(mapRowToTransaction),
    notifications: (notifications || []).map(mapRowToNotification),
    automations: (automations || []).map(mapRowToAutomation),
  };
}

// ═══════════════════════════════════════════════════════════════
// QUERIES: Appointments
// ═══════════════════════════════════════════════════════════════

export async function insertAppointment(appt: {
  tenantId: string;
  clientId: string;
  barberId: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  status?: string;
  source?: string;
  price: number;
  commissionAmount?: number;
  notes?: string;
}): Promise<Appointment | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      tenant_id: appt.tenantId,
      client_id: appt.clientId,
      barber_id: appt.barberId,
      service_id: appt.serviceId,
      date: appt.date,
      start_time: appt.startTime,
      end_time: appt.endTime,
      status: appt.status || 'scheduled',
      source: appt.source || 'online',
      price: appt.price,
      commission_amount: appt.commissionAmount || 0,
      notes: appt.notes,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Error inserting appointment:', error);
    return null;
  }
  return mapRowToAppointment(data);
}

export async function updateAppointmentStatus(id: string, updates: {
  status?: string;
  isPaid?: boolean;
  paymentMethod?: string;
  commissionAmount?: number;
}) {
  const supabase = createClient();
  const updateData: any = {};
  if (updates.status) updateData.status = updates.status;
  if (updates.isPaid !== undefined) updateData.is_paid = updates.isPaid;
  if (updates.paymentMethod) updateData.payment_method = updates.paymentMethod;
  if (updates.commissionAmount !== undefined) updateData.commission_amount = updates.commissionAmount;

  const { data, error } = await supabase
    .from('appointments')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) console.error('Error updating appointment:', error);
  return data ? mapRowToAppointment(data) : null;
}

// ═══════════════════════════════════════════════════════════════
// QUERIES: Clients
// ═══════════════════════════════════════════════════════════════

export async function insertClient(client: {
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}): Promise<Client | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('clients')
    .insert({
      tenant_id: client.tenantId,
      name: client.name,
      phone: client.phone,
      email: client.email,
      notes: client.notes,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Error inserting client:', error);
    return null;
  }
  return mapRowToClient(data);
}

export async function updateClientData(id: string, updates: Partial<{
  name: string;
  phone: string;
  email: string;
  notes: string;
  preferredBarberId: string;
  totalVisits: number;
  totalSpent: number;
  noShowCount: number;
  loyalty: { points: number; visits: number };
  tags: string[];
  lastVisitAt: string;
}>) {
  const supabase = createClient();
  const updateData: any = {};
  if (updates.name) updateData.name = updates.name;
  if (updates.phone) updateData.phone = updates.phone;
  if (updates.email !== undefined) updateData.email = updates.email;
  if (updates.notes !== undefined) updateData.notes = updates.notes;
  if (updates.preferredBarberId !== undefined) updateData.preferred_barber_id = updates.preferredBarberId;
  if (updates.totalVisits !== undefined) updateData.total_visits = updates.totalVisits;
  if (updates.totalSpent !== undefined) updateData.total_spent = updates.totalSpent;
  if (updates.noShowCount !== undefined) updateData.no_show_count = updates.noShowCount;
  if (updates.loyalty) updateData.loyalty = updates.loyalty;
  if (updates.tags) updateData.tags = updates.tags;
  if (updates.lastVisitAt) updateData.last_visit_at = updates.lastVisitAt;

  const { error } = await supabase
    .from('clients')
    .update(updateData)
    .eq('id', id);

  if (error) console.error('Error updating client:', error);
}

export async function findClientByPhone(tenantId: string, phone: string): Promise<Client | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('clients')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('phone', phone)
    .single();

  return data ? mapRowToClient(data) : null;
}

// ═══════════════════════════════════════════════════════════════
// QUERIES: Barbers
// ═══════════════════════════════════════════════════════════════

export async function insertBarber(barber: {
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  description?: string;
  specialties?: string[];
  commissionRate?: number;
  color?: string;
  schedule?: any[];
  serviceIds?: string[];
}): Promise<Barber | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('barbers')
    .insert({
      tenant_id: barber.tenantId,
      name: barber.name,
      phone: barber.phone,
      email: barber.email,
      description: barber.description || '',
      specialties: barber.specialties || ['Fade', 'Clásico'],
      commission_rate: barber.commissionRate || 0.40,
      color: barber.color || '#7C3AED',
      schedule: barber.schedule || [],
      service_ids: barber.serviceIds || [],
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Error inserting barber:', error);
    return null;
  }
  return mapRowToBarber(data);
}

export async function updateBarberData(id: string, updates: Partial<Barber>) {
  const supabase = createClient();
  const updateData: any = {};
  if (updates.name) updateData.name = updates.name;
  if (updates.phone) updateData.phone = updates.phone;
  if (updates.email !== undefined) updateData.email = updates.email;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.specialties) updateData.specialties = updates.specialties;
  if (updates.commissionRate !== undefined) updateData.commission_rate = updates.commissionRate;
  if (updates.color) updateData.color = updates.color;
  if (updates.schedule) updateData.schedule = updates.schedule;
  if (updates.serviceIds) updateData.service_ids = updates.serviceIds;
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

  const { error } = await supabase
    .from('barbers')
    .update(updateData)
    .eq('id', id);

  if (error) console.error('Error updating barber:', error);
}

// ═══════════════════════════════════════════════════════════════
// QUERIES: Services
// ═══════════════════════════════════════════════════════════════

export async function insertService(service: {
  tenantId: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  commissionRate?: number;
  category?: string;
  popular?: boolean;
}): Promise<Service | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('services')
    .insert({
      tenant_id: service.tenantId,
      name: service.name,
      description: service.description || '',
      duration: service.duration,
      price: service.price,
      commission_rate: service.commissionRate || 0,
      category: service.category || 'corte',
      popular: service.popular || false,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Error inserting service:', error);
    return null;
  }
  return mapRowToService(data);
}

// ═══════════════════════════════════════════════════════════════
// QUERIES: Products
// ═══════════════════════════════════════════════════════════════

export async function insertProduct(product: {
  tenantId: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  cost: number;
  stock?: number;
  minStock?: number;
}): Promise<Product | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .insert({
      tenant_id: product.tenantId,
      name: product.name,
      description: product.description || '',
      category: product.category || 'otro',
      price: product.price,
      cost: product.cost,
      stock: product.stock || 0,
      min_stock: product.minStock || 3,
    })
    .select()
    .single();

  if (error || !data) return null;
  return mapRowToProduct(data);
}

export async function updateProductStock(id: string, stock: number) {
  const supabase = createClient();
  await supabase
    .from('products')
    .update({ stock })
    .eq('id', id);
}

// ═══════════════════════════════════════════════════════════════
// QUERIES: Transactions
// ═══════════════════════════════════════════════════════════════

export async function insertTransaction(tx: {
  tenantId: string;
  type: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  barberId?: string;
  commissionAmount?: number;
  relatedAppointmentId?: string;
  relatedProductId?: string;
  createdBy: string;
}) {
  const supabase = createClient();
  const { error } = await supabase
    .from('transactions')
    .insert({
      tenant_id: tx.tenantId,
      type: tx.type,
      category: tx.category,
      description: tx.description,
      amount: tx.amount,
      date: tx.date,
      barber_id: tx.barberId,
      commission_amount: tx.commissionAmount || 0,
      related_appointment_id: tx.relatedAppointmentId,
      related_product_id: tx.relatedProductId,
      created_by: tx.createdBy,
    });

  if (error) console.error('Error inserting transaction:', error);
}

// ═══════════════════════════════════════════════════════════════
// QUERIES: Notifications
// ═══════════════════════════════════════════════════════════════

export async function insertNotification(notif: {
  tenantId: string;
  type: string;
  title: string;
  message: string;
  relatedId?: string;
}) {
  const supabase = createClient();
  await supabase
    .from('notifications')
    .insert({
      tenant_id: notif.tenantId,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      related_id: notif.relatedId,
    });
}

export async function markNotificationAsRead(id: string) {
  const supabase = createClient();
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);
}

export async function markAllNotificationsRead(tenantId: string) {
  const supabase = createClient();
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('tenant_id', tenantId)
    .eq('is_read', false);
}

// ═══════════════════════════════════════════════════════════════
// QUERIES: Public Portal (Sin autenticación)
// ═══════════════════════════════════════════════════════════════

export async function fetchPublicShopData(slug: string) {
  const supabase = createClient();

  const { data: shop } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (!shop) return null;

  const [
    { data: barbers },
    { data: services },
  ] = await Promise.all([
    supabase.from('barbers').select('*').eq('tenant_id', shop.id).eq('is_active', true),
    supabase.from('services').select('*').eq('tenant_id', shop.id).eq('is_active', true),
  ]);

  return {
    shop: mapTenantToBarbershop(shop),
    barbers: (barbers || []).map(mapRowToBarber),
    services: (services || []).map(mapRowToService),
  };
}

// ═══════════════════════════════════════════════════════════════
// QUERIES: SaaS Subscriptions & Payments (SuperAdmin)
// ═══════════════════════════════════════════════════════════════

export async function fetchSaasPayments(): Promise<SaasPayment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('saas_payments')
    .select('*, tenants(name)')
    .order('date', { ascending: false });

  if (error || !data) return [];
  return data.map((row: any) => ({
    ...mapRowToSaasPayment(row),
    tenantName: row.tenants?.name || row.tenant_id,
  }));
}

export async function recordSaasPayment(payment: {
  tenantId: string;
  amount: number;
  date: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  paymentMethod: SaasPayment['paymentMethod'];
  reference?: string;
  notes?: string;
  recordedBy?: string;
}): Promise<SaasPayment | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('saas_payments')
    .insert({
      tenant_id: payment.tenantId,
      amount: payment.amount,
      date: payment.date,
      billing_period_start: payment.billingPeriodStart,
      billing_period_end: payment.billingPeriodEnd,
      payment_method: payment.paymentMethod,
      reference: payment.reference,
      notes: payment.notes,
      recorded_by: payment.recordedBy || 'SuperAdmin',
    })
    .select('*, tenants(name)')
    .single();

  if (error || !data) {
    console.error('Error recording SaaS payment in Supabase:', error);
    return null;
  }

  // Automatically update the tenant's next_billing_date and last_payment_date in Supabase
  await supabase
    .from('tenants')
    .update({
      next_billing_date: payment.billingPeriodEnd,
      last_payment_date: payment.date,
      subscription_status: 'active',
    })
    .eq('id', payment.tenantId);

  return {
    ...mapRowToSaasPayment(data),
    tenantName: data.tenants?.name || payment.tenantId,
  };
}

export async function updateTenantSubscription(
  shopId: string,
  data: {
    nextBillingDate?: string;
    lastPaymentDate?: string;
    subscriptionStatus?: SubscriptionStatus;
  }
) {
  const supabase = createClient();
  const updateData: any = {};
  if (data.nextBillingDate) updateData.next_billing_date = data.nextBillingDate;
  if (data.lastPaymentDate) updateData.last_payment_date = data.lastPaymentDate;
  if (data.subscriptionStatus) updateData.subscription_status = data.subscriptionStatus;

  const { error } = await supabase
    .from('tenants')
    .update(updateData)
    .eq('id', shopId);

  if (error) {
    console.error('Error updating tenant subscription in Supabase:', error);
    return false;
  }
  return true;
}

