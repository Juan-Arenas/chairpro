import type {
  Barbershop, User, Barber, Client, Service, Product,
  Appointment, Transaction, Notification, Automation
} from '@/types';
import { format, subDays, addDays } from 'date-fns';

const today = format(new Date(), 'yyyy-MM-dd');
const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
const twoDaysAgo = format(subDays(new Date(), 2), 'yyyy-MM-dd');
const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd');

// ── Barbershop ────────────────────────────────────────────────────────────────
export const demoBarbershop: Barbershop = {
  id: 'shop_demo',
  name: 'The Black Chair',
  slug: 'the-black-chair',
  address: 'Carrera 11 #82-45, Local 2',
  city: 'Bogotá',
  country: 'Colombia',
  phone: '+57 601 555 0100',
  whatsapp: '+57 316 555 0190',
  email: 'info@theblackchair.co',
  ownerEmail: 'admin@theblackchair.co',
  ownerName: 'Andrés Morales',
  website: 'https://theblackchair.co',
  instagram: '@theblackchair.co',
  timezone: 'America/Bogota',
  theme: {
    mode: 'dark',
    primaryColor: '#7c3aed', // Violeta Signature
    backgroundType: 'gradient',
    logoUrl: '✂️',
    tagline: 'Cortes exclusivos y barbería tradicional contemporánea',
    backgroundOpacity: 0.15,
  },
  status: 'active',
  mrr: 189000,
  workingHours: {
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
    rewardDescription: 'Corte gratis en tu próxima visita',
    currency: 'COP',
    currencySymbol: '$',
  },
  plan: 'pro',
  createdAt: '2024-01-15T00:00:00Z',
};

export const demoShops: Barbershop[] = [
  demoBarbershop,
  {
    id: 'shop_fade_master',
    name: 'Fade Master Studio',
    slug: 'fade-master',
    address: 'El Poblado, Calle 10 #36-24',
    city: 'Medellín',
    country: 'Colombia',
    phone: '+57 604 444 0220',
    whatsapp: '+57 300 444 0220',
    email: 'contacto@fademaster.co',
    ownerEmail: 'admin@fademaster.co',
    ownerName: 'Kevin Restrepo',
    website: 'https://fademaster.co',
    instagram: '@fademaster_medellin',
    timezone: 'America/Bogota',
    theme: {
      mode: 'dark',
      primaryColor: '#0ea5e9', // Azul Eléctrico
      backgroundType: 'solid',
      logoUrl: '💈',
      tagline: 'Especialistas en degradados y tendencias urbanas',
      backgroundOpacity: 0.15,
    },
    status: 'active',
    mrr: 249000,
    workingHours: {
      monday: { isOpen: true, open: '10:00', close: '20:00' },
      tuesday: { isOpen: true, open: '10:00', close: '20:00' },
      wednesday: { isOpen: true, open: '10:00', close: '20:00' },
      thursday: { isOpen: true, open: '10:00', close: '21:00' },
      friday: { isOpen: true, open: '10:00', close: '21:00' },
      saturday: { isOpen: true, open: '09:00', close: '20:00' },
      sunday: { isOpen: true, open: '11:00', close: '17:00' },
    },
    settings: {
      allowOnlineBooking: true,
      bookingWindowDays: 20,
      cancellationPolicyHours: 3,
      rewardThreshold: 6,
      rewardDescription: 'Perfilado de barba o descuento 50%',
      currency: 'COP',
      currencySymbol: '$',
    },
    plan: 'enterprise',
    createdAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 'shop_la_clasica',
    name: 'La Clásica Barber Club',
    slug: 'la-clasica',
    address: 'Granada, Av. 9N #14-22',
    city: 'Cali',
    country: 'Colombia',
    phone: '+57 602 333 0330',
    whatsapp: '+57 315 333 0330',
    email: 'info@laclasica.co',
    ownerEmail: 'admin@laclasica.co',
    ownerName: 'Mateo Osorio',
    website: 'https://laclasica.co',
    instagram: '@laclasicabarber',
    timezone: 'America/Bogota',
    theme: {
      mode: 'dark',
      primaryColor: '#10b981', // Verde Esmeralda Vintage
      backgroundType: 'gradient',
      logoUrl: '👑',
      tagline: 'Barbería clásica, toalla caliente y navaja fina',
      backgroundOpacity: 0.15,
    },
    status: 'active',
    mrr: 129000,
    workingHours: {
      monday: { isOpen: false, open: '09:00', close: '18:00' },
      tuesday: { isOpen: true, open: '09:00', close: '19:00' },
      wednesday: { isOpen: true, open: '09:00', close: '19:00' },
      thursday: { isOpen: true, open: '09:00', close: '19:00' },
      friday: { isOpen: true, open: '09:00', close: '20:00' },
      saturday: { isOpen: true, open: '08:30', close: '18:30' },
      sunday: { isOpen: false, open: '10:00', close: '15:00' },
    },
    settings: {
      allowOnlineBooking: true,
      bookingWindowDays: 15,
      cancellationPolicyHours: 2,
      rewardThreshold: 4,
      rewardDescription: 'Ritual de barba premium gratis',
      currency: 'COP',
      currencySymbol: '$',
    },
    plan: 'basic',
    createdAt: '2024-03-10T00:00:00Z',
  },
];

// ── Users ─────────────────────────────────────────────────────────────────────
export const demoUsers: User[] = [
  // SuperAdmin (Martín y Equipo)
  {
    id: 'user_superadmin',
    shopId: 'shop_demo',
    name: 'Martín (Admin SaaS)',
    email: 'superadmin@chairpro.app',
    role: 'superadmin',
    passwordHash: 'superadmin2024',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: new Date().toISOString(),
  },
  // The Black Chair (Bogotá)
  {
    id: 'user_admin', shopId: 'shop_demo', name: 'Andrés Morales (Dueño)', email: 'admin@theblackchair.co',
    role: 'admin', passwordHash: 'demo_admin_2024', isActive: true,
    createdAt: '2024-01-15T00:00:00Z', lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'user_carlos', shopId: 'shop_demo', name: 'Carlos Mendoza', email: 'carlos@theblackchair.co',
    role: 'barber', barberId: 'barber_carlos', passwordHash: 'demo_carlos_2024', isActive: true,
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'user_recep', shopId: 'shop_demo', name: 'Valentina Torres', email: 'recepcion@theblackchair.co',
    role: 'receptionist', passwordHash: 'demo_recepcion_2024', isActive: true,
    createdAt: '2024-06-01T00:00:00Z',
  },
  // Fade Master Studio (Medellín)
  {
    id: 'user_fm_admin', shopId: 'shop_fade_master', name: 'Kevin Restrepo (Dueño)', email: 'admin@fademaster.co',
    role: 'admin', passwordHash: 'demo_admin_2024', isActive: true,
    createdAt: '2024-02-01T00:00:00Z', lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'user_fm_barber', shopId: 'shop_fade_master', name: 'Kevin Restrepo', email: 'kevin@fademaster.co',
    role: 'barber', barberId: 'barber_fm_1', passwordHash: 'demo_barber_2024', isActive: true,
    createdAt: '2024-02-01T00:00:00Z',
  },
  // La Clásica Barber Club (Cali)
  {
    id: 'user_lc_admin', shopId: 'shop_la_clasica', name: 'Mateo Osorio (Dueño)', email: 'admin@laclasica.co',
    role: 'admin', passwordHash: 'demo_admin_2024', isActive: true,
    createdAt: '2024-03-10T00:00:00Z', lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'user_lc_barber', shopId: 'shop_la_clasica', name: 'Mateo Osorio', email: 'mateo@laclasica.co',
    role: 'barber', barberId: 'barber_lc_1', passwordHash: 'demo_barber_2024', isActive: true,
    createdAt: '2024-03-10T00:00:00Z',
  },
];

// ── Barbers ───────────────────────────────────────────────────────────────────
const SCHEDULE_FULL = [
  { day: 'monday' as const, isWorking: true, start: '09:00', end: '19:00', breakStart: '13:00', breakEnd: '14:00' },
  { day: 'tuesday' as const, isWorking: true, start: '09:00', end: '19:00', breakStart: '13:00', breakEnd: '14:00' },
  { day: 'wednesday' as const, isWorking: true, start: '09:00', end: '19:00', breakStart: '13:00', breakEnd: '14:00' },
  { day: 'thursday' as const, isWorking: true, start: '09:00', end: '20:00', breakStart: '13:00', breakEnd: '14:00' },
  { day: 'friday' as const, isWorking: true, start: '09:00', end: '20:00', breakStart: '13:00', breakEnd: '14:00' },
  { day: 'saturday' as const, isWorking: true, start: '08:00', end: '18:00', breakStart: '12:30', breakEnd: '13:30' },
  { day: 'sunday' as const, isWorking: false, start: '10:00', end: '15:00' },
];

export const demoBarbers: Barber[] = [
  {
    id: 'barber_carlos', shopId: 'shop_demo',
    name: 'Carlos Mendoza', phone: '+57 316 555 0191',
    email: 'carlos@theblackchair.co',
    description: 'Maestro barbero con 8 años de experiencia. Especialista en fade y diseños geométricos. Ha trabajado en México y España antes de unirse al equipo.',
    specialties: ['Fade', 'Diseños', 'Degradado'],
    commissionRate: 0.45,
    color: '#7C3AED',
    schedule: SCHEDULE_FULL,
    serviceIds: ['svc_1', 'svc_2', 'svc_3', 'svc_4', 'svc_5'],
    joinedAt: '2024-01-15T00:00:00Z',
    isActive: true,
  },
  {
    id: 'barber_miguel', shopId: 'shop_demo',
    name: 'Miguel Ángel Ruiz', phone: '+57 312 555 0192',
    email: 'miguel@theblackchair.co',
    description: 'Barbero clásico y moderno. Experto en cortes con navaja y diseño de barba. 5 años de experiencia en el sector premium.',
    specialties: ['Navaja', 'Barba', 'Clásico'],
    commissionRate: 0.40,
    color: '#0EA5E9',
    schedule: [
      { day: 'monday' as const, isWorking: false, start: '09:00', end: '19:00' },
      { day: 'tuesday' as const, isWorking: true, start: '10:00', end: '20:00', breakStart: '14:00', breakEnd: '15:00' },
      { day: 'wednesday' as const, isWorking: true, start: '10:00', end: '20:00', breakStart: '14:00', breakEnd: '15:00' },
      { day: 'thursday' as const, isWorking: true, start: '10:00', end: '20:00', breakStart: '14:00', breakEnd: '15:00' },
      { day: 'friday' as const, isWorking: true, start: '10:00', end: '20:00', breakStart: '14:00', breakEnd: '15:00' },
      { day: 'saturday' as const, isWorking: true, start: '09:00', end: '17:00', breakStart: '13:00', breakEnd: '14:00' },
      { day: 'sunday' as const, isWorking: false, start: '10:00', end: '15:00' },
    ],
    serviceIds: ['svc_1', 'svc_2', 'svc_3', 'svc_5', 'svc_6'],
    joinedAt: '2024-03-01T00:00:00Z',
    isActive: true,
  },
  {
    id: 'barber_santiago', shopId: 'shop_demo',
    name: 'Santiago Herrera', phone: '+57 300 555 0193',
    email: 'santiago@theblackchair.co',
    description: 'Junior con talento natural. Apasionado por las tendencias modernas. Certificado en cortes urbanos e internacionales.',
    specialties: ['Texturizado', 'Urbano', 'Tendencias'],
    commissionRate: 0.35,
    color: '#10B981',
    schedule: [
      { day: 'monday' as const, isWorking: true, start: '11:00', end: '20:00', breakStart: '14:30', breakEnd: '15:30' },
      { day: 'tuesday' as const, isWorking: true, start: '11:00', end: '20:00', breakStart: '14:30', breakEnd: '15:30' },
      { day: 'wednesday' as const, isWorking: false, start: '09:00', end: '19:00' },
      { day: 'thursday' as const, isWorking: true, start: '11:00', end: '20:00', breakStart: '14:30', breakEnd: '15:30' },
      { day: 'friday' as const, isWorking: true, start: '11:00', end: '20:00', breakStart: '14:30', breakEnd: '15:30' },
      { day: 'saturday' as const, isWorking: true, start: '08:00', end: '18:00', breakStart: '12:00', breakEnd: '13:00' },
      { day: 'sunday' as const, isWorking: false, start: '10:00', end: '15:00' },
    ],
    serviceIds: ['svc_1', 'svc_3', 'svc_4', 'svc_7'],
    joinedAt: '2024-07-01T00:00:00Z',
    isActive: true,
  },
  // Fade Master Studio (Medellín)
  {
    id: 'barber_fm_1', shopId: 'shop_fade_master',
    name: 'Kevin Restrepo', phone: '+57 300 444 0221',
    email: 'kevin@fademaster.co',
    description: 'Especialista en Taper Fade, High Fade y Diseños libres a navaja.',
    specialties: ['Taper Fade', 'Skin Fade', 'Diseños'],
    commissionRate: 0.50,
    color: '#0EA5E9',
    schedule: SCHEDULE_FULL,
    serviceIds: ['svc_fm_1', 'svc_fm_2', 'svc_fm_3'],
    joinedAt: '2024-02-01T00:00:00Z',
    isActive: true,
  },
  {
    id: 'barber_fm_2', shopId: 'shop_fade_master',
    name: 'Sebastián Toro', phone: '+57 301 444 0222',
    email: 'sebas@fademaster.co',
    description: 'Colorimetría capilar, platinados y texturizados modernos.',
    specialties: ['Platinados', 'Texturizado', 'Fade'],
    commissionRate: 0.45,
    color: '#38BDF8',
    schedule: SCHEDULE_FULL,
    serviceIds: ['svc_fm_1', 'svc_fm_2'],
    joinedAt: '2024-03-01T00:00:00Z',
    isActive: true,
  },
  // La Clásica Barber Club (Cali)
  {
    id: 'barber_lc_1', shopId: 'shop_la_clasica',
    name: 'Mateo Osorio', phone: '+57 315 333 0331',
    email: 'mateo@laclasica.co',
    description: 'Maestro tradicional. Ritual con toalla caliente, navaja recta y bálsamos orgánicos.',
    specialties: ['Navaja Recta', 'Toalla Caliente', 'Clásico Inglés'],
    commissionRate: 0.50,
    color: '#10B981',
    schedule: SCHEDULE_FULL,
    serviceIds: ['svc_lc_1', 'svc_lc_2', 'svc_lc_3'],
    joinedAt: '2024-03-10T00:00:00Z',
    isActive: true,
  },
  {
    id: 'barber_lc_2', shopId: 'shop_la_clasica',
    name: 'Camilo Silva', phone: '+57 316 333 0332',
    email: 'camilo@laclasica.co',
    description: 'Experto en barba leñador, perfilado al milímetro y peinados de época.',
    specialties: ['Barba Larga', 'Perfilado', 'Pompadour'],
    commissionRate: 0.42,
    color: '#059669',
    schedule: SCHEDULE_FULL,
    serviceIds: ['svc_lc_1', 'svc_lc_2'],
    joinedAt: '2024-04-01T00:00:00Z',
    isActive: true,
  },
];

// ── Services ──────────────────────────────────────────────────────────────────
export const demoServices: Service[] = [
  { id: 'svc_1', shopId: 'shop_demo', name: 'Corte Clásico', description: 'Corte de cabello clásico con terminado impecable. Incluye lavado y peinado.', duration: 30, price: 35000, commissionRate: 0, category: 'corte', isActive: true, popular: true },
  { id: 'svc_2', shopId: 'shop_demo', name: 'Corte Premium Fade', description: 'Corte con degradado profesional en máquinas. Efecto piel a cero si el cliente lo desea.', duration: 45, price: 50000, commissionRate: 0, category: 'corte', isActive: true, popular: true },
  { id: 'svc_3', shopId: 'shop_demo', name: 'Corte + Barba', description: 'Combo completo: corte de cabello a elección + arreglo y diseño de barba con navaja.', duration: 60, price: 70000, commissionRate: 0, category: 'combo', isActive: true, popular: true },
  { id: 'svc_4', shopId: 'shop_demo', name: 'Arreglo de Barba', description: 'Diseño, arreglo y perfilado de barba con navaja y lineado. Aplica aceite hidratante.', duration: 30, price: 30000, commissionRate: 0, category: 'barba', isActive: true, popular: false },
  { id: 'svc_5', shopId: 'shop_demo', name: 'Corte Infantil', description: 'Corte especial para niños hasta 12 años. Ambiente familiar y tranquilo.', duration: 25, price: 25000, commissionRate: 0, category: 'corte', isActive: true, popular: false },
  { id: 'svc_6', shopId: 'shop_demo', name: 'Afeitado Tradicional', description: 'Afeitado con navaja clásica, crema caliente, toalla caliente y aceite post-afeitado.', duration: 45, price: 45000, commissionRate: 0, category: 'barba', isActive: true, popular: false },
  { id: 'svc_7', shopId: 'shop_demo', name: 'Tratamiento Capilar', description: 'Hidratación profunda, tratamiento anticaída o neutralización. Incluye masaje de cuero cabelludo.', duration: 60, price: 60000, commissionRate: 0.05, category: 'tratamiento', isActive: true, popular: false },
  // Fade Master Services
  { id: 'svc_fm_1', shopId: 'shop_fade_master', name: 'Fade Master Signature', description: 'Degradado con máquina shaver y tijera fina con peinado texturizado.', duration: 45, price: 55000, commissionRate: 0, category: 'corte', isActive: true, popular: true },
  { id: 'svc_fm_2', shopId: 'shop_fade_master', name: 'Taper Fade + Barba Neón', description: 'Degradado lateral y de cuello con alineación de barba y toalla fría.', duration: 60, price: 75000, commissionRate: 0, category: 'combo', isActive: true, popular: true },
  { id: 'svc_fm_3', shopId: 'shop_fade_master', name: 'Diseño Freestyle Navaja', description: 'Líneas geométricas y diseños artísticos personalizados.', duration: 30, price: 40000, commissionRate: 0, category: 'corte', isActive: true, popular: false },
  // La Clásica Services
  { id: 'svc_lc_1', shopId: 'shop_la_clasica', name: 'Corte Caballero Vintage', description: 'Corte a tijera pura o peine y máquina, estilizado con pomada brillante.', duration: 40, price: 42000, commissionRate: 0, category: 'corte', isActive: true, popular: true },
  { id: 'svc_lc_2', shopId: 'shop_la_clasica', name: 'Ritual Barba Imperial', description: 'Toalla caliente vaporizada con eucalipto, espuma caliente y navaja.', duration: 50, price: 48000, commissionRate: 0, category: 'barba', isActive: true, popular: true },
  { id: 'svc_lc_3', shopId: 'shop_la_clasica', name: 'Experiencia Total Clásica', description: 'Corte + Barba + Masaje facial con bálsamo de cedro.', duration: 75, price: 85000, commissionRate: 0, category: 'combo', isActive: true, popular: true },
];

// ── Products ──────────────────────────────────────────────────────────────────
export const demoProducts: Product[] = [
  { id: 'prod_1', shopId: 'shop_demo', name: 'Cera Mate Premium', description: 'Fijación fuerte con acabado mate. Ideal para looks modernos y desestructurados.', category: 'cera', price: 35000, cost: 18000, stock: 12, minStock: 5, isActive: true, featured: true },
  { id: 'prod_2', shopId: 'shop_demo', name: 'Pomada Brillante', description: 'Pomada con base acuosa de fácil lavado. Fijación media con brillo natural.', category: 'pomada', price: 32000, cost: 15000, stock: 8, minStock: 5, isActive: true, featured: true },
  { id: 'prod_3', shopId: 'shop_demo', name: 'Shampoo para Barba', description: 'Limpieza suave especial para barba. Con aceites esenciales de argán y jojoba.', category: 'shampoo', price: 28000, cost: 12000, stock: 3, minStock: 5, isActive: true, featured: false },
  { id: 'prod_4', shopId: 'shop_demo', name: 'Aceite de Barba', description: 'Hidratación y suavidad superior. Elimina el picor y acondiciona el vello facial.', category: 'aceite', price: 38000, cost: 20000, stock: 0, minStock: 3, isActive: true, featured: true },
  { id: 'prod_5', shopId: 'shop_demo', name: 'Spray Fijador', description: 'Laca profesional de larga duración. Sin residuos ni efecto apelmazado.', category: 'cera', price: 22000, cost: 9000, stock: 15, minStock: 4, isActive: true, featured: false },
  { id: 'prod_6', shopId: 'shop_demo', name: 'Aftershave Premium', description: 'Loción post-afeitado con aloe vera y vitamina E. Calma y refresca la piel.', category: 'barba', price: 42000, cost: 22000, stock: 6, minStock: 4, isActive: true, featured: false },
  { id: 'prod_7', shopId: 'shop_demo', name: 'Perfume The Black Chair', description: 'Fragancia exclusiva de la barbería. Notas amaderadas y ambarinas. Edición limitada.', category: 'perfume', price: 95000, cost: 45000, stock: 4, minStock: 3, isActive: true, featured: true },
  { id: 'prod_8', shopId: 'shop_demo', name: 'Peinilla Profesional', description: 'Peinilla de carbono antiestática para barbero profesional.', category: 'herramienta', price: 15000, cost: 6000, stock: 10, minStock: 5, isActive: true, featured: false },
  { id: 'prod_9', shopId: 'shop_demo', name: 'Crema de Afeitar', description: 'Crema de alta densidad para afeitado suave. Aroma a sándalo y madera.', category: 'barba', price: 29000, cost: 13000, stock: 7, minStock: 4, isActive: true, featured: false },
  { id: 'prod_10', shopId: 'shop_demo', name: 'Pasta Texturizante', description: 'Textura arcillosa de fijación media. Ideal para looks naturales y desenfadados.', category: 'cera', price: 38000, cost: 19000, stock: 5, minStock: 4, isActive: true, featured: false },
];

// ── Clients ───────────────────────────────────────────────────────────────────
export const demoClients: Client[] = [
  { id: 'client_1', shopId: 'shop_demo', name: 'Alejandro Vargas', phone: '+57 310 123 4567', email: 'alejandro.v@gmail.com', totalVisits: 14, totalSpent: 980000, noShowCount: 0, lastVisitAt: subDays(new Date(), 5).toISOString(), registeredAt: '2024-03-10T00:00:00Z', tags: ['vip', 'frequent'], loyalty: { points: 140, visits: 4 }, preferredBarberId: 'barber_carlos', preferredServiceId: 'svc_2' },
  { id: 'client_2', shopId: 'shop_demo', name: 'Sebastián López', phone: '+57 315 234 5678', totalVisits: 9, totalSpent: 630000, noShowCount: 0, lastVisitAt: subDays(new Date(), 12).toISOString(), registeredAt: '2024-04-15T00:00:00Z', tags: ['frequent'], loyalty: { points: 90, visits: 4 }, preferredBarberId: 'barber_carlos', preferredServiceId: 'svc_3' },
  { id: 'client_3', shopId: 'shop_demo', name: 'Juan Diego Ríos', phone: '+57 316 345 6789', totalVisits: 7, totalSpent: 490000, noShowCount: 1, lastVisitAt: subDays(new Date(), 20).toISOString(), registeredAt: '2024-05-01T00:00:00Z', tags: ['frequent', 'no-show-risk'], loyalty: { points: 70, visits: 2 }, preferredBarberId: 'barber_miguel', preferredServiceId: 'svc_1' },
  { id: 'client_4', shopId: 'shop_demo', name: 'Camilo Rodríguez', phone: '+57 300 456 7890', totalVisits: 12, totalSpent: 840000, noShowCount: 0, lastVisitAt: subDays(new Date(), 3).toISOString(), registeredAt: '2024-02-20T00:00:00Z', tags: ['vip', 'frequent'], loyalty: { points: 120, visits: 2 }, preferredBarberId: 'barber_miguel', preferredServiceId: 'svc_3' },
  { id: 'client_5', shopId: 'shop_demo', name: 'Mateo González', phone: '+57 312 567 8901', totalVisits: 3, totalSpent: 210000, noShowCount: 0, lastVisitAt: subDays(new Date(), 30).toISOString(), registeredAt: '2024-08-10T00:00:00Z', tags: ['new'], loyalty: { points: 30, visits: 3 }, preferredBarberId: 'barber_santiago' },
  { id: 'client_6', shopId: 'shop_demo', name: 'Andrés Felipe Castro', phone: '+57 313 678 9012', totalVisits: 1, totalSpent: 70000, noShowCount: 2, lastVisitAt: subDays(new Date(), 60).toISOString(), registeredAt: '2024-07-05T00:00:00Z', tags: ['inactive', 'no-show-risk'], loyalty: { points: 10, visits: 1 }, notes: 'Ha cancelado 2 veces sin avisar. Solicitar prepago.' },
  { id: 'client_7', shopId: 'shop_demo', name: 'David Moreno', phone: '+57 318 789 0123', totalVisits: 5, totalSpent: 350000, noShowCount: 0, lastVisitAt: subDays(new Date(), 8).toISOString(), registeredAt: '2024-06-12T00:00:00Z', tags: ['frequent'], loyalty: { points: 50, visits: 5 }, preferredBarberId: 'barber_carlos', preferredServiceId: 'svc_2' },
  { id: 'client_8', shopId: 'shop_demo', name: 'Felipe Sánchez', phone: '+57 314 890 1234', totalVisits: 0, totalSpent: 0, noShowCount: 0, registeredAt: today + 'T09:30:00Z', tags: ['new'], loyalty: { points: 0, visits: 0 } },
  { id: 'client_9', shopId: 'shop_demo', name: 'Ricardo Peña', phone: '+57 317 901 2345', totalVisits: 8, totalSpent: 560000, noShowCount: 0, lastVisitAt: subDays(new Date(), 45).toISOString(), registeredAt: '2024-04-01T00:00:00Z', tags: ['inactive'], loyalty: { points: 80, visits: 3 }, preferredBarberId: 'barber_miguel' },
  { id: 'client_10', shopId: 'shop_demo', name: 'Nicolás Gómez', phone: '+57 311 012 3456', totalVisits: 6, totalSpent: 420000, noShowCount: 1, lastVisitAt: subDays(new Date(), 15).toISOString(), registeredAt: '2024-05-20T00:00:00Z', tags: ['frequent'], loyalty: { points: 60, visits: 1 } },
  { id: 'client_11', shopId: 'shop_demo', name: 'Santiago Jiménez', phone: '+57 319 123 4560', totalVisits: 2, totalSpent: 100000, noShowCount: 0, lastVisitAt: subDays(new Date(), 25).toISOString(), registeredAt: '2024-09-01T00:00:00Z', tags: ['new'], loyalty: { points: 20, visits: 2 } },
  { id: 'client_12', shopId: 'shop_demo', name: 'Luis Hernández', phone: '+57 302 234 5671', totalVisits: 11, totalSpent: 770000, noShowCount: 0, lastVisitAt: subDays(new Date(), 2).toISOString(), registeredAt: '2024-02-01T00:00:00Z', tags: ['vip', 'frequent'], loyalty: { points: 110, visits: 1 }, preferredBarberId: 'barber_santiago' },
  { id: 'client_13', shopId: 'shop_demo', name: 'Carlos Alberto Díaz', phone: '+57 305 345 6782', totalVisits: 4, totalSpent: 280000, noShowCount: 0, lastVisitAt: subDays(new Date(), 7).toISOString(), registeredAt: '2024-07-20T00:00:00Z', tags: ['frequent'], loyalty: { points: 40, visits: 4 } },
  { id: 'client_14', shopId: 'shop_demo', name: 'Jorge Eduardo Torres', phone: '+57 308 456 7893', totalVisits: 15, totalSpent: 1050000, noShowCount: 0, lastVisitAt: subDays(new Date(), 1).toISOString(), registeredAt: '2024-01-20T00:00:00Z', tags: ['vip', 'frequent'], loyalty: { points: 150, visits: 0 }, preferredBarberId: 'barber_carlos', preferredServiceId: 'svc_3' },
  { id: 'client_15', shopId: 'shop_demo', name: 'Miguel Antonio Ruiz', phone: '+57 309 567 8904', totalVisits: 0, totalSpent: 0, noShowCount: 0, registeredAt: today + 'T11:00:00Z', tags: ['new'], loyalty: { points: 0, visits: 0 } },
];

// ── Appointments ──────────────────────────────────────────────────────────────
export const demoAppointments: Appointment[] = [
  // Today's appointments
  { id: 'appt_t1', shopId: 'shop_demo', clientId: 'client_1', barberId: 'barber_carlos', serviceId: 'svc_2', date: today, startTime: '09:00', endTime: '09:45', status: 'completed', source: 'manual', price: 50000, commissionAmount: 22500, isPaid: true, paymentMethod: 'cash', reminderSent: true, createdAt: subDays(new Date(), 1).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'appt_t2', shopId: 'shop_demo', clientId: 'client_4', barberId: 'barber_miguel', serviceId: 'svc_3', date: today, startTime: '09:00', endTime: '10:00', status: 'completed', source: 'qr', price: 70000, commissionAmount: 28000, isPaid: true, paymentMethod: 'nequi', reminderSent: true, createdAt: subDays(new Date(), 2).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'appt_t3', shopId: 'shop_demo', clientId: 'client_7', barberId: 'barber_carlos', serviceId: 'svc_1', date: today, startTime: '10:00', endTime: '10:30', status: 'in_progress', source: 'manual', price: 35000, commissionAmount: 15750, isPaid: false, reminderSent: true, createdAt: subDays(new Date(), 1).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'appt_t4', shopId: 'shop_demo', clientId: 'client_12', barberId: 'barber_santiago', serviceId: 'svc_3', date: today, startTime: '10:00', endTime: '11:00', status: 'confirmed', source: 'online', price: 70000, commissionAmount: 24500, isPaid: false, reminderSent: true, createdAt: subDays(new Date(), 3).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'appt_t5', shopId: 'shop_demo', clientId: 'client_2', barberId: 'barber_carlos', serviceId: 'svc_3', date: today, startTime: '11:00', endTime: '12:00', status: 'scheduled', source: 'whatsapp', price: 70000, commissionAmount: 31500, isPaid: false, reminderSent: false, createdAt: subDays(new Date(), 1).toISOString(), updatedAt: subDays(new Date(), 1).toISOString() },
  { id: 'appt_t6', shopId: 'shop_demo', clientId: 'client_14', barberId: 'barber_miguel', serviceId: 'svc_6', date: today, startTime: '11:00', endTime: '11:45', status: 'scheduled', source: 'manual', price: 45000, commissionAmount: 18000, isPaid: false, reminderSent: true, createdAt: subDays(new Date(), 5).toISOString(), updatedAt: subDays(new Date(), 5).toISOString() },
  { id: 'appt_t7', shopId: 'shop_demo', clientId: 'client_13', barberId: 'barber_santiago', serviceId: 'svc_1', date: today, startTime: '14:00', endTime: '14:30', status: 'scheduled', source: 'qr', price: 35000, commissionAmount: 12250, isPaid: false, reminderSent: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'appt_t8', shopId: 'shop_demo', clientId: 'client_3', barberId: 'barber_carlos', serviceId: 'svc_4', date: today, startTime: '15:00', endTime: '15:30', status: 'scheduled', source: 'manual', price: 30000, commissionAmount: 13500, isPaid: false, reminderSent: false, createdAt: subDays(new Date(), 2).toISOString(), updatedAt: subDays(new Date(), 2).toISOString() },

  // Yesterday
  { id: 'appt_y1', shopId: 'shop_demo', clientId: 'client_5', barberId: 'barber_carlos', serviceId: 'svc_2', date: yesterday, startTime: '09:30', endTime: '10:15', status: 'completed', source: 'manual', price: 50000, commissionAmount: 22500, isPaid: true, paymentMethod: 'transfer', reminderSent: true, createdAt: subDays(new Date(), 3).toISOString(), updatedAt: yesterday + 'T10:15:00Z' },
  { id: 'appt_y2', shopId: 'shop_demo', clientId: 'client_6', barberId: 'barber_miguel', serviceId: 'svc_3', date: yesterday, startTime: '10:00', endTime: '11:00', status: 'no_show', source: 'manual', price: 70000, commissionAmount: 28000, isPaid: false, reminderSent: true, createdAt: subDays(new Date(), 4).toISOString(), updatedAt: yesterday + 'T11:00:00Z' },
  { id: 'appt_y3', shopId: 'shop_demo', clientId: 'client_10', barberId: 'barber_carlos', serviceId: 'svc_1', date: yesterday, startTime: '14:00', endTime: '14:30', status: 'completed', source: 'qr', price: 35000, commissionAmount: 15750, isPaid: true, paymentMethod: 'cash', reminderSent: true, createdAt: subDays(new Date(), 2).toISOString(), updatedAt: yesterday + 'T14:30:00Z' },
  { id: 'appt_y4', shopId: 'shop_demo', clientId: 'client_14', barberId: 'barber_carlos', serviceId: 'svc_3', date: yesterday, startTime: '16:00', endTime: '17:00', status: 'completed', source: 'manual', price: 70000, commissionAmount: 31500, isPaid: true, paymentMethod: 'card', reminderSent: true, createdAt: subDays(new Date(), 3).toISOString(), updatedAt: yesterday + 'T17:00:00Z' },

  // Two days ago
  { id: 'appt_d1', shopId: 'shop_demo', clientId: 'client_4', barberId: 'barber_miguel', serviceId: 'svc_3', date: twoDaysAgo, startTime: '09:00', endTime: '10:00', status: 'completed', source: 'manual', price: 70000, commissionAmount: 28000, isPaid: true, paymentMethod: 'nequi', reminderSent: true, createdAt: subDays(new Date(), 4).toISOString(), updatedAt: twoDaysAgo + 'T10:00:00Z' },
  { id: 'appt_d2', shopId: 'shop_demo', clientId: 'client_1', barberId: 'barber_carlos', serviceId: 'svc_2', date: twoDaysAgo, startTime: '11:00', endTime: '11:45', status: 'completed', source: 'qr', price: 50000, commissionAmount: 22500, isPaid: true, paymentMethod: 'cash', reminderSent: true, createdAt: subDays(new Date(), 4).toISOString(), updatedAt: twoDaysAgo + 'T11:45:00Z' },
  { id: 'appt_d3', shopId: 'shop_demo', clientId: 'client_11', barberId: 'barber_santiago', serviceId: 'svc_1', date: twoDaysAgo, startTime: '15:00', endTime: '15:30', status: 'cancelled', source: 'manual', price: 35000, commissionAmount: 0, isPaid: false, reminderSent: true, createdAt: subDays(new Date(), 5).toISOString(), updatedAt: twoDaysAgo + 'T14:00:00Z' },

  // Tomorrow
  { id: 'appt_m1', shopId: 'shop_demo', clientId: 'client_1', barberId: 'barber_carlos', serviceId: 'svc_2', date: tomorrow, startTime: '10:00', endTime: '10:45', status: 'confirmed', source: 'online', price: 50000, commissionAmount: 22500, isPaid: false, reminderSent: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'appt_m2', shopId: 'shop_demo', clientId: 'client_9', barberId: 'barber_miguel', serviceId: 'svc_3', date: tomorrow, startTime: '11:00', endTime: '12:00', status: 'scheduled', source: 'qr', price: 70000, commissionAmount: 28000, isPaid: false, reminderSent: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'appt_m3', shopId: 'shop_demo', clientId: 'client_15', barberId: 'barber_carlos', serviceId: 'svc_3', date: tomorrow, startTime: '14:00', endTime: '15:00', status: 'scheduled', source: 'manual', price: 70000, commissionAmount: 31500, isPaid: false, reminderSent: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

  // Next week
  { id: 'appt_w1', shopId: 'shop_demo', clientId: 'client_2', barberId: 'barber_carlos', serviceId: 'svc_3', date: nextWeek, startTime: '09:00', endTime: '10:00', status: 'scheduled', source: 'online', price: 70000, commissionAmount: 31500, isPaid: false, reminderSent: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'appt_w2', shopId: 'shop_demo', clientId: 'client_7', barberId: 'barber_miguel', serviceId: 'svc_1', date: nextWeek, startTime: '10:00', endTime: '10:30', status: 'scheduled', source: 'qr', price: 35000, commissionAmount: 14000, isPaid: false, reminderSent: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

  // Fade Master Appointments
  { id: 'appt_fm_1', shopId: 'shop_fade_master', clientId: 'client_1', barberId: 'barber_fm_1', serviceId: 'svc_fm_1', date: today, startTime: '10:30', endTime: '11:15', status: 'completed', source: 'qr', price: 55000, commissionAmount: 27500, isPaid: true, paymentMethod: 'nequi', reminderSent: true, createdAt: subDays(new Date(), 1).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'appt_fm_2', shopId: 'shop_fade_master', clientId: 'client_2', barberId: 'barber_fm_1', serviceId: 'svc_fm_2', date: today, startTime: '11:30', endTime: '12:30', status: 'in_progress', source: 'online', price: 75000, commissionAmount: 37500, isPaid: false, reminderSent: true, createdAt: subDays(new Date(), 2).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'appt_fm_3', shopId: 'shop_fade_master', clientId: 'client_3', barberId: 'barber_fm_2', serviceId: 'svc_fm_1', date: today, startTime: '14:00', endTime: '14:45', status: 'scheduled', source: 'manual', price: 55000, commissionAmount: 24750, isPaid: false, reminderSent: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

  // La Clásica Appointments
  { id: 'appt_lc_1', shopId: 'shop_la_clasica', clientId: 'client_4', barberId: 'barber_lc_1', serviceId: 'svc_lc_2', date: today, startTime: '10:00', endTime: '10:50', status: 'completed', source: 'manual', price: 48000, commissionAmount: 24000, isPaid: true, paymentMethod: 'cash', reminderSent: true, createdAt: subDays(new Date(), 1).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'appt_lc_2', shopId: 'shop_la_clasica', clientId: 'client_5', barberId: 'barber_lc_1', serviceId: 'svc_lc_3', date: today, startTime: '11:00', endTime: '12:15', status: 'confirmed', source: 'qr', price: 85000, commissionAmount: 42500, isPaid: false, reminderSent: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'appt_lc_3', shopId: 'shop_la_clasica', clientId: 'client_6', barberId: 'barber_lc_2', serviceId: 'svc_lc_1', date: today, startTime: '15:00', endTime: '15:40', status: 'scheduled', source: 'online', price: 42000, commissionAmount: 17640, isPaid: false, reminderSent: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

// ── Transactions (historical) ─────────────────────────────────────────────────
const monthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');

export const demoTransactions: Transaction[] = [
  // Current month income
  { id: 'tx_1', shopId: 'shop_demo', type: 'income', category: 'service', description: 'Corte Premium Fade - Alejandro Vargas', amount: 50000, commissionAmount: 22500, date: twoDaysAgo, barberId: 'barber_carlos', relatedAppointmentId: 'appt_d2', createdBy: 'user_admin', createdAt: twoDaysAgo + 'T11:45:00Z' },
  { id: 'tx_2', shopId: 'shop_demo', type: 'income', category: 'service', description: 'Corte + Barba - Camilo Rodríguez', amount: 70000, commissionAmount: 28000, date: twoDaysAgo, barberId: 'barber_miguel', relatedAppointmentId: 'appt_d1', createdBy: 'user_admin', createdAt: twoDaysAgo + 'T10:00:00Z' },
  { id: 'tx_3', shopId: 'shop_demo', type: 'income', category: 'service', description: 'Corte Premium Fade - Mateo González', amount: 50000, commissionAmount: 22500, date: yesterday, barberId: 'barber_carlos', relatedAppointmentId: 'appt_y1', createdBy: 'user_admin', createdAt: yesterday + 'T10:15:00Z' },
  { id: 'tx_4', shopId: 'shop_demo', type: 'income', category: 'service', description: 'Corte Clásico - Nicolás Gómez', amount: 35000, commissionAmount: 15750, date: yesterday, barberId: 'barber_carlos', relatedAppointmentId: 'appt_y3', createdBy: 'user_admin', createdAt: yesterday + 'T14:30:00Z' },
  { id: 'tx_5', shopId: 'shop_demo', type: 'income', category: 'service', description: 'Corte + Barba - Jorge Torres', amount: 70000, commissionAmount: 31500, date: yesterday, barberId: 'barber_carlos', relatedAppointmentId: 'appt_y4', createdBy: 'user_admin', createdAt: yesterday + 'T17:00:00Z' },
  { id: 'tx_6', shopId: 'shop_demo', type: 'income', category: 'service', description: 'Corte Premium Fade - Alejandro Vargas', amount: 50000, commissionAmount: 22500, date: today, barberId: 'barber_carlos', relatedAppointmentId: 'appt_t1', createdBy: 'user_admin', createdAt: today + 'T09:45:00Z' },
  { id: 'tx_7', shopId: 'shop_demo', type: 'income', category: 'service', description: 'Corte + Barba - Camilo Rodríguez', amount: 70000, commissionAmount: 28000, date: today, barberId: 'barber_miguel', relatedAppointmentId: 'appt_t2', createdBy: 'user_admin', createdAt: today + 'T10:00:00Z' },
  { id: 'tx_8', shopId: 'shop_demo', type: 'income', category: 'product', description: 'Venta: Cera Mate Premium x2', amount: 70000, date: yesterday, createdBy: 'user_admin', createdAt: yesterday + 'T15:00:00Z' },
  { id: 'tx_9', shopId: 'shop_demo', type: 'income', category: 'product', description: 'Venta: Pomada Brillante x1', amount: 32000, date: twoDaysAgo, createdBy: 'user_admin', createdAt: twoDaysAgo + 'T12:00:00Z' },
  // Expenses
  { id: 'tx_10', shopId: 'shop_demo', type: 'expense', category: 'supplies', description: 'Compra de insumos: navajas, cremas, hojas', amount: 180000, date: format(subDays(new Date(), 5), 'yyyy-MM-dd'), createdBy: 'user_admin', createdAt: format(subDays(new Date(), 5), 'yyyy-MM-dd') + 'T10:00:00Z' },
  { id: 'tx_11', shopId: 'shop_demo', type: 'expense', category: 'utilities', description: 'Servicios públicos (agua, luz)', amount: 250000, date: format(new Date(new Date().getFullYear(), new Date().getMonth(), 3), 'yyyy-MM-dd'), createdBy: 'user_admin', createdAt: format(new Date(new Date().getFullYear(), new Date().getMonth(), 3), 'yyyy-MM-dd') + 'T08:00:00Z' },
  { id: 'tx_12', shopId: 'shop_demo', type: 'expense', category: 'purchase', description: 'Reposición inventario de productos', amount: 320000, date: format(new Date(new Date().getFullYear(), new Date().getMonth(), 7), 'yyyy-MM-dd'), createdBy: 'user_admin', createdAt: format(new Date(new Date().getFullYear(), new Date().getMonth(), 7), 'yyyy-MM-dd') + 'T09:00:00Z' },
];

// ── Notifications ─────────────────────────────────────────────────────────────
export const demoNotifications: Notification[] = [
  { id: 'notif_1', shopId: 'shop_demo', type: 'new_appointment', title: 'Nueva reserva QR', message: 'Felipe Sánchez reservó via QR para hoy a las 2:00 PM con Carlos.', isRead: false, relatedId: 'appt_t7', createdAt: new Date().toISOString() },
  { id: 'notif_2', shopId: 'shop_demo', type: 'no_show', title: 'No se presentó', message: 'Andrés Felipe Castro no se presentó a su cita de ayer a las 10:00 AM.', isRead: false, relatedId: 'appt_y2', createdAt: yesterday + 'T11:01:00Z' },
  { id: 'notif_3', shopId: 'shop_demo', type: 'low_stock', title: 'Stock crítico', message: 'Aceite de Barba está agotado (0 unidades). Requiere reposición urgente.', isRead: false, relatedId: 'prod_4', createdAt: subDays(new Date(), 1).toISOString() },
  { id: 'notif_4', shopId: 'shop_demo', type: 'low_stock', title: 'Stock bajo', message: 'Shampoo para Barba tiene solo 3 unidades (mínimo: 5).', isRead: false, relatedId: 'prod_3', createdAt: subDays(new Date(), 2).toISOString() },
  { id: 'notif_5', shopId: 'shop_demo', type: 'commission_ready', title: 'Comisiones del mes', message: 'Las comisiones de septiembre están listas. Total: $385,000.', isRead: true, createdAt: subDays(new Date(), 3).toISOString() },
  { id: 'notif_6', shopId: 'shop_demo', type: 'new_appointment', title: 'Nueva reserva confirmada', message: 'Camilo Rodríguez confirmó su cita de mañana a las 11:00 AM.', isRead: true, relatedId: 'appt_m2', createdAt: subDays(new Date(), 1).toISOString() },
  { id: 'notif_7', shopId: 'shop_demo', type: 'appointment_reminder', title: 'Recordatorio enviado', message: 'Se envió recordatorio por WhatsApp a 3 clientes para mañana.', isRead: true, createdAt: subDays(new Date(), 1).toISOString() },
  { id: 'notif_8', shopId: 'shop_demo', type: 'inactive_client', title: 'Clientes inactivos', message: '5 clientes no han reservado en más de 45 días. Revisa la lista para activarlos.', isRead: true, createdAt: subDays(new Date(), 4).toISOString() },
];

// ── Automations ───────────────────────────────────────────────────────────────
export const demoAutomations: Automation[] = [
  {
    id: 'auto_1', shopId: 'shop_demo',
    name: 'Confirmación automática de cita',
    trigger: 'on_appointment_created',
    triggerLabel: 'Al crear una nueva cita',
    steps: [
      { action: 'send_confirmation', label: 'Enviar confirmación por WhatsApp', delay: 0 },
      { action: 'create_notification', label: 'Crear notificación interna', delay: 0 },
    ],
    isActive: true, runCount: 47, lastRunAt: new Date().toISOString(),
  },
  {
    id: 'auto_2', shopId: 'shop_demo',
    name: 'Recordatorio 2 horas antes',
    trigger: 'on_appointment_created',
    triggerLabel: 'Al crear una nueva cita (programado para 2h antes)',
    steps: [
      { action: 'send_reminder', label: 'Enviar recordatorio por WhatsApp', delay: -120 },
    ],
    isActive: true, runCount: 38, lastRunAt: yesterday + 'T08:00:00Z',
  },
  {
    id: 'auto_3', shopId: 'shop_demo',
    name: 'Registro de ingreso al completar cita',
    trigger: 'on_appointment_completed',
    triggerLabel: 'Al marcar una cita como completada',
    steps: [
      { action: 'register_income', label: 'Registrar ingreso en finanzas', delay: 0 },
      { action: 'calculate_commission', label: 'Calcular comisión del barbero', delay: 0 },
      { action: 'update_client_history', label: 'Actualizar historial del cliente', delay: 0 },
      { action: 'update_stats', label: 'Actualizar estadísticas del día', delay: 0 },
    ],
    isActive: true, runCount: 83, lastRunAt: today + 'T10:00:00Z',
  },
  {
    id: 'auto_4', shopId: 'shop_demo',
    name: 'Gestión de cancelaciones',
    trigger: 'on_appointment_cancelled',
    triggerLabel: 'Al cancelar una cita',
    steps: [
      { action: 'release_slot', label: 'Liberar el horario en el calendario', delay: 0 },
      { action: 'create_notification', label: 'Notificar al equipo de la cancelación', delay: 0 },
    ],
    isActive: true, runCount: 12, lastRunAt: twoDaysAgo + 'T14:00:00Z',
  },
  {
    id: 'auto_5', shopId: 'shop_demo',
    name: 'Alerta de no-show',
    trigger: 'on_no_show',
    triggerLabel: 'Al registrar un no-show',
    steps: [
      { action: 'flag_client', label: 'Marcar cliente como riesgo no-show', delay: 0 },
      { action: 'create_notification', label: 'Crear alerta interna de inasistencia', delay: 0 },
    ],
    isActive: true, runCount: 8, lastRunAt: yesterday + 'T11:00:00Z',
  },
  {
    id: 'auto_6', shopId: 'shop_demo',
    name: 'Alerta de stock bajo',
    trigger: 'on_low_stock',
    triggerLabel: 'Cuando un producto alcanza el stock mínimo',
    steps: [
      { action: 'create_notification', label: 'Crear notificación urgente de inventario', delay: 0 },
    ],
    isActive: true, runCount: 5, lastRunAt: subDays(new Date(), 1).toISOString(),
  },
  {
    id: 'auto_7', shopId: 'shop_demo',
    name: 'Campaña de reactivación',
    trigger: 'on_client_inactive',
    triggerLabel: 'Al detectar clientes sin reserva por 45 días',
    steps: [
      { action: 'add_to_recovery_list', label: 'Agregar a lista de reactivación', delay: 0 },
      { action: 'create_notification', label: 'Notificar para seguimiento manual', delay: 0 },
    ],
    isActive: false, runCount: 3, lastRunAt: subDays(new Date(), 4).toISOString(),
  },
];
