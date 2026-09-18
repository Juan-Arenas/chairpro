// ── ID Types ──────────────────────────────────────────────────────────────────
export type ShopId = string;
export type UserId = string;
export type BarberId = string;
export type ClientId = string;
export type ServiceId = string;
export type ProductId = string;
export type AppointmentId = string;
export type TransactionId = string;
export type NotificationId = string;
export type AutomationId = string;

// ── Shop Theme & Branding ──────────────────────────────────────────────────
export interface ShopTheme {
  mode: 'dark' | 'light';
  primaryColor: string; // e.g. '#7c3aed', '#10b981', '#0ea5e9', '#d97706', '#dc2626'
  accentColor?: string;
  backgroundType: 'gradient' | 'solid' | 'image';
  backgroundImage?: string; // wallpaper URL or texture preset
  backgroundOpacity?: number; // 0.05 to 0.95
  logoUrl?: string;
  tagline?: string;
}

// ── Shop ──────────────────────────────────────────────────────────────────────
export interface Barbershop {
  id: ShopId;
  name: string;
  slug: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  whatsapp?: string;
  email: string;
  ownerEmail?: string;
  ownerName?: string;
  website?: string;
  instagram?: string;
  timezone: string;
  theme: ShopTheme;
  status: 'active' | 'suspended' | 'trial';
  mrr: number; // Monthly recurring revenue for SaaS tracking
  workingHours: Record<string, { isOpen: boolean; open: string; close: string }>;
  settings: {
    allowOnlineBooking: boolean;
    bookingWindowDays: number;
    cancellationPolicyHours: number;
    rewardThreshold: number;
    rewardDescription: string;
    currency: string;
    currencySymbol: string;
  };
  plan: 'trial' | 'basic' | 'pro' | 'enterprise';
  createdAt: string;
}

// ── User ──────────────────────────────────────────────────────────────────────
export type UserRole = 'superadmin' | 'admin' | 'barber' | 'receptionist' | 'client';

export interface User {
  id: UserId;
  shopId: ShopId;
  name: string;
  email: string;
  role: UserRole;
  barberId?: BarberId;
  passwordHash: string;
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

export interface SaaSPlatformKPIs {
  totalShops: number;
  activeShops: number;
  totalBarbers: number;
  totalAppointments: number;
  totalMRR: number;
  monthlyGrowthRate: number;
}

// ── Barber ────────────────────────────────────────────────────────────────────
export interface BarberScheduleDay {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  isWorking: boolean;
  start: string;
  end: string;
  breakStart?: string;
  breakEnd?: string;
}

export interface Barber {
  id: BarberId;
  shopId: ShopId;
  name: string;
  phone: string;
  email?: string;
  description: string;
  specialties: string[];
  commissionRate: number;
  color: string;
  schedule: BarberScheduleDay[];
  serviceIds: ServiceId[];
  joinedAt: string;
  isActive: boolean;
  preferredBarberId?: never;
}

export interface BarberStats {
  totalAppointments: number;
  completedAppointments: number;
  totalIncome: number;
  totalCommission: number;
  topServices: { serviceId: ServiceId; name: string; count: number }[];
  noShowRate: number;
}

// ── Client ────────────────────────────────────────────────────────────────────
export type ClientTag = 'new' | 'frequent' | 'inactive' | 'no-show-risk' | 'vip';

export interface Client {
  id: ClientId;
  shopId: ShopId;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  preferredBarberId?: BarberId;
  preferredServiceId?: ServiceId;
  totalVisits: number;
  totalSpent: number;
  noShowCount: number;
  lastVisitAt?: string;
  registeredAt: string;
  tags: ClientTag[];
  loyalty: { points: number; visits: number };
}

// ── Service ───────────────────────────────────────────────────────────────────
export interface Service {
  id: ServiceId;
  shopId: ShopId;
  name: string;
  description: string;
  duration: number;
  price: number;
  commissionRate: number;
  category: 'corte' | 'barba' | 'combo' | 'tratamiento' | 'otro';
  isActive: boolean;
  popular: boolean;
}

// ── Product ───────────────────────────────────────────────────────────────────
export interface Product {
  id: ProductId;
  shopId: ShopId;
  name: string;
  description: string;
  category: 'cera' | 'pomada' | 'shampoo' | 'aceite' | 'barba' | 'perfume' | 'herramienta' | 'otro';
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  isActive: boolean;
  featured: boolean;
}

// ── Appointment ───────────────────────────────────────────────────────────────
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type AppointmentSource = 'manual' | 'qr' | 'online' | 'whatsapp';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'nequi' | 'daviplata';

export interface Appointment {
  id: AppointmentId;
  shopId: ShopId;
  clientId: ClientId;
  barberId: BarberId;
  serviceId: ServiceId;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  source: AppointmentSource;
  price: number;
  commissionAmount: number;
  isPaid: boolean;
  paymentMethod?: PaymentMethod;
  notes?: string;
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Transaction ───────────────────────────────────────────────────────────────
export type TransactionType = 'income' | 'expense';
export type TransactionCategory = 'service' | 'product' | 'supplies' | 'rent' | 'utilities' | 'salary' | 'purchase' | 'other';

export interface Transaction {
  id: TransactionId;
  shopId: ShopId;
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  amount: number;
  date: string;
  relatedAppointmentId?: AppointmentId;
  relatedProductId?: ProductId;
  barberId?: BarberId;
  commissionAmount?: number;
  createdBy: UserId;
  createdAt: string;
}

// ── Notification ──────────────────────────────────────────────────────────────
export type NotificationType =
  | 'new_appointment' | 'appointment_reminder' | 'appointment_cancelled'
  | 'no_show' | 'low_stock' | 'inactive_client' | 'commission_ready' | 'system';

export interface Notification {
  id: NotificationId;
  shopId: ShopId;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedId?: string;
  createdAt: string;
}

// ── Automation ────────────────────────────────────────────────────────────────
export type AutomationTrigger =
  | 'on_appointment_created' | 'on_appointment_completed' | 'on_appointment_cancelled'
  | 'on_no_show' | 'on_low_stock' | 'on_client_inactive';

export interface AutomationStep {
  action: string;
  label: string;
  delay?: number;
}

export interface Automation {
  id: AutomationId;
  shopId: ShopId;
  name: string;
  trigger: AutomationTrigger;
  triggerLabel: string;
  steps: AutomationStep[];
  isActive: boolean;
  runCount: number;
  lastRunAt?: string;
}

// ── Inventory Movement ────────────────────────────────────────────────────────
export interface InventoryMovement {
  id: string;
  shopId: ShopId;
  productId: ProductId;
  type: 'in' | 'out' | 'sale' | 'adjustment';
  quantity: number;
  reason: string;
  createdAt: string;
  createdBy: UserId;
}

// ── Dashboard KPIs ────────────────────────────────────────────────────────────
export interface DashboardKPIs {
  todayIncome: number;
  todayAppointments: number;
  todayNewClients: number;
  todayServices: number;
  weekIncome: number;
  weekAppointments: number;
  monthIncome: number;
  monthAppointments: number;
  monthExpenses: number;
  monthCommissions: number;
  monthNetProfit: number;
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  pendingAppointments: number;
  lowStockProducts: number;
}
