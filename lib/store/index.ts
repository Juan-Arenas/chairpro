'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  User, Barbershop, Barber, Client, Service, Product,
  Appointment, Transaction, Notification, Automation,
  InventoryMovement, AppointmentId, BarberId, ClientId,
  ProductId, ServiceId, DashboardKPIs, BarberStats,
  ShopTheme, UserRole, SaaSPlatformKPIs, SaasPayment,
  SubscriptionStatus, BarberStatus, WhatsAppMessage,
  ParsedBarberAction, ChatbotKnowledgeItem, ChatbotConfig,
  BarberQueueItem, DailyCloseReport
} from '@/types';
import {
  demoBarbershop, demoUsers, demoBarbers, demoClients,
  demoServices, demoProducts, demoAppointments,
  demoTransactions, demoNotifications, demoAutomations,
  demoShops, demoSaasPayments
} from '@/lib/demo-data';
import {
  generateId, getDayName, timeToMinutes, minutesToTime
} from '@/lib/utils';
import { format, addDays } from 'date-fns';
import { parseBarberMessage } from '@/lib/whatsapp/parser';
import { processCustomerMessage } from '@/lib/whatsapp/chatbot';
import {
  calculateDailyCloseReport,
  formatDailyCloseWhatsAppMessage,
  formatAntiNoShowReminder,
  formatGoogleReviewBooster,
  formatWinBackMessage
} from '@/lib/whatsapp/automations';

// Supabase imports
import { createClient } from '@/lib/supabase/client';
import * as db from '@/lib/supabase/queries';

// ═══════════════════════════════════════════════════════════════
// Store Mode: 'demo' = datos locales | 'live' = Supabase real
// ═══════════════════════════════════════════════════════════════

type StoreMode = 'demo' | 'live';

export const defaultChatbotKnowledge: ChatbotKnowledgeItem[] = [
  {
    id: 'kb_1',
    shopId: 'shop_demo',
    category: 'parking',
    question: '¿Tienen parqueadero disponible?',
    answer: 'Sí, contamos con parqueadero gratuito para clientes durante la primera hora justo al lado del local.',
    tags: ['parqueadero', 'estacionamiento', 'carro', 'moto'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb_2',
    shopId: 'shop_demo',
    category: 'amenities',
    question: '¿Ofrecen bebidas o comodidades?',
    answer: '¡Por supuesto! Con cada servicio tienes incluida cerveza artesanal, café premium o agua mineral de cortesía, además de WiFi de alta velocidad y PlayStation 5 en la sala de espera.',
    tags: ['cerveza', 'cafe', 'bebida', 'wifi', 'cortesia'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb_3',
    shopId: 'shop_demo',
    category: 'rules',
    question: '¿Atienden a niños?',
    answer: 'Sí, atendemos a niños de todas las edades con barberos especializados en cortes modernos y diseño.',
    tags: ['niños', 'ninos', 'hijos', 'infantil'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb_4',
    shopId: 'shop_demo',
    category: 'rules',
    question: '¿Aceptan mascotas (Pet Friendly)?',
    answer: '¡Sí! Somos 100% Pet Friendly. Tu mascota es bienvenida.',
    tags: ['mascotas', 'perros', 'pet friendly', 'perro'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb_5',
    shopId: 'shop_demo',
    category: 'promotions',
    question: '¿Qué promociones tienen activas?',
    answer: 'Los días martes y miércoles tenemos 15% de descuento en Combo Corte + Barba Spa.',
    tags: ['promocion', 'descuento', 'oferta', 'martes', 'miercoles'],
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
];

interface ChairProStore {
  // ── Mode ───────────────────────────────────────────────────────
  mode: StoreMode;
  setMode: (mode: StoreMode) => void;

  // ── Auth & Tenancy ────────────────────────────────────────────
  currentUser: User | null;
  currentShop: Barbershop | null;
  shops: Barbershop[];
  users: User[];
  saasPayments: SaasPayment[];
  isAuthenticated: boolean;
  isInitialized: boolean;

  // ── Data ──────────────────────────────────────────────────────
  barbers: Barber[];
  clients: Client[];
  services: Service[];
  products: Product[];
  appointments: Appointment[];
  transactions: Transaction[];
  notifications: Notification[];
  automations: Automation[];
  inventoryMovements: InventoryMovement[];
  whatsappMessages: WhatsAppMessage[];
  chatbotKnowledge: ChatbotKnowledgeItem[];
  chatbotConfig: ChatbotConfig | null;
  dailyCloseReports: DailyCloseReport[];

  // ── UI ────────────────────────────────────────────────────────
  activeView: string;
  sidebarOpen: boolean;
  isLoading: boolean;

  // ── Actions ───────────────────────────────────────────────────
  initializeDemo: () => void;
  initializeLive: (authId: string) => Promise<void>;
  loadShopData: (shopId: string) => Promise<void>;
  switchShop: (shopId: string) => void;
  switchRole: (role: UserRole, barberId?: string) => void;
  updateShopBranding: (shopId: string, branding: Partial<ShopTheme & { name?: string; logoUrl?: string; address?: string; phone?: string }>) => void;
  updateShopSettings: (shopId: string, settings: Partial<Barbershop>) => Promise<void>;
  updateShopAutomationSettings: (settings: Partial<Barbershop['settings']>) => Promise<void>;
  createShop: (data: { name: string; slug: string; ownerEmail: string; ownerName: string; city: string; plan?: 'basic' | 'pro' | 'enterprise'; primaryColor?: string }) => Promise<Barbershop | null>;
  toggleShopStatus: (shopId: string) => void;
  recordMonthlyPayment: (data: { tenantId: string; amount: number; paymentMethod: SaasPayment['paymentMethod']; date?: string; billingPeriodStart?: string; billingPeriodEnd?: string; reference?: string; notes?: string; autoExtendDays?: number }) => Promise<SaasPayment | null>;
  updateShopSubscription: (shopId: string, updates: { nextBillingDate?: string; lastPaymentDate?: string; subscriptionStatus?: SubscriptionStatus }) => void;
  getSaaSPlatformKPIs: () => SaaSPlatformKPIs;

  // ── Auth Actions ──────────────────────────────────────────────
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithSupabase: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setActiveView: (view: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // ── Appointment Actions ────────────────────────────────────────
  createAppointment: (data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => Appointment | null;
  updateAppointment: (id: AppointmentId, data: Partial<Appointment>) => void;
  cancelAppointment: (id: AppointmentId) => void;
  markNoShow: (id: AppointmentId) => void;
  completeAppointment: (id: AppointmentId, paymentMethod: Appointment['paymentMethod']) => void;
  markInProgress: (id: AppointmentId) => void;

  // ── Client Actions ─────────────────────────────────────────────
  createClient: (data: Omit<Client, 'id' | 'shopId' | 'registeredAt' | 'loyalty' | 'tags' | 'noShowCount' | 'totalSpent' | 'totalVisits'>) => Client;
  updateClient: (id: ClientId, data: Partial<Client>) => void;
  findOrCreateClient: (phone: string, name: string, email?: string) => Client;

  // ── Barber Actions ─────────────────────────────────────────────
  createBarber: (data: Omit<Barber, 'id' | 'shopId'>) => Barber;
  updateBarber: (id: BarberId, data: Partial<Barber>) => void;
  toggleBarberActive: (id: BarberId) => void;
  setBarberStatus: (id: BarberId, status: BarberStatus) => void;

  // ── WhatsApp & Automation Engine ──────────────────────────────
  processBarberWhatsAppMessage: (phoneOrBarberId: string, messageText: string, isAudio?: boolean) => { success: boolean; reply: string; actionType?: string; data?: any };
  processClientWhatsAppMessage: (phone: string, clientName: string, messageText: string) => { success: boolean; reply: string; actionType?: string; appointment?: any; buttons?: any[] };
  sendDailyCashCloseWhatsApp: (dateStr?: string) => { summary: string; targetPhone: string; closingHour: string; report: DailyCloseReport };
  addWhatsAppMessage: (msg: Omit<WhatsAppMessage, 'id' | 'timestamp'>) => WhatsAppMessage;
  
  // ── Knowledge Base Actions ────────────────────────────────────
  addKnowledgeItem: (item: Omit<ChatbotKnowledgeItem, 'id' | 'shopId' | 'updatedAt'>) => ChatbotKnowledgeItem;
  updateKnowledgeItem: (id: string, updates: Partial<ChatbotKnowledgeItem>) => void;
  deleteKnowledgeItem: (id: string) => void;
  updateChatbotConfig: (updates: Partial<ChatbotConfig>) => void;

  // ── Service Actions ────────────────────────────────────────────
  createService: (data: Omit<Service, 'id' | 'shopId'>) => Service;
  updateService: (id: ServiceId, data: Partial<Service>) => void;
  toggleServiceActive: (id: ServiceId) => void;

  // ── Product Actions ────────────────────────────────────────────
  createProduct: (data: Omit<Product, 'id' | 'shopId'>) => Product;
  updateProduct: (id: ProductId, data: Partial<Product>) => void;
  registerSale: (productId: ProductId, quantity: number, clientId?: ClientId) => boolean;
  adjustStock: (productId: ProductId, quantity: number, reason: string) => void;

  // ── Finance Actions ────────────────────────────────────────────
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt'>) => void;

  // ── Notification Actions ───────────────────────────────────────
  addNotification: (data: Omit<Notification, 'id' | 'createdAt'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // ── Automation Actions ─────────────────────────────────────────
  toggleAutomation: (id: string) => void;

  // ── Modular Feature Toggles & Data Management ─────────────────
  toggleFeatureToggle: (key: string, value?: boolean) => void;
  resetDemoData: () => void;
  clearAppointmentsAndTransactions: () => void;
  clearWhatsAppMessages: () => void;
  clearAllBusinessData: () => void;

  // ── Computed ──────────────────────────────────────────────────
  getKPIs: () => DashboardKPIs;
  getAvailableSlots: (barberId: BarberId, date: string, serviceDuration: number) => string[];
  getBarberStats: (barberId: BarberId) => BarberStats;
  getBarberQueue: () => BarberQueueItem[];
  getClientAppointments: (clientId: ClientId) => Appointment[];
  getInactiveClients: (daysSince: number) => Client[];
  getUnreadCount: () => number;
}

export const useStore = create<ChairProStore>()(
  persist(
    (set, get) => ({
      // ── Initial State ──────────────────────────────────────────
      mode: 'demo' as StoreMode,
      currentUser: null,
      currentShop: null,
      shops: [],
      users: [],
      saasPayments: [],
      isAuthenticated: false,
      isInitialized: false,
      barbers: [],
      clients: [],
      services: [],
      products: [],
      appointments: [],
      transactions: [],
      notifications: [],
      automations: [],
      inventoryMovements: [],
      whatsappMessages: [],
      chatbotKnowledge: defaultChatbotKnowledge,
      chatbotConfig: {
        shopId: 'shop_demo',
        botName: 'Asistente Virtual ChairPro',
        tone: 'profesional',
        systemPrompt: 'Eres el asistente inteligente oficial de la barbería.',
        welcomeMessage: '¡Hola! Bienvenido a nuestra barbería. ¿En qué te puedo ayudar hoy?',
        fallbackMessage: 'Disculpa, no entendí tu solicitud. Puedes preguntarme por precios, horarios o agendar tu cita.',
        autoBookingEnabled: true,
        notifyBarberOnBooking: true,
        cancellationNoticeHours: 2,
        customFaqs: defaultChatbotKnowledge,
      },
      dailyCloseReports: [],
      activeView: 'dashboard',
      sidebarOpen: true,
      isLoading: false,

      setMode: (mode) => set({ mode }),

      // ── Demo Init (datos estáticos para presentaciones) ──────
      initializeDemo: () => {
        const state = get();
        const defaultShop = state.currentShop || demoBarbershop;
        
        if (state.isInitialized && state.shops?.length > 0 && state.barbers?.length > 0 && state.services?.length > 0) {
          if (state.saasPayments.length === 0) {
            set({ saasPayments: demoSaasPayments });
          }
          return;
        }

        set({
          shops: demoShops,
          users: demoUsers,
          currentShop: defaultShop,
          saasPayments: demoSaasPayments,
          barbers: demoBarbers,
          clients: demoClients,
          services: demoServices,
          products: demoProducts,
          appointments: demoAppointments,
          transactions: demoTransactions,
          notifications: demoNotifications,
          automations: demoAutomations,
          inventoryMovements: [],
          isInitialized: true,
        });
      },

      // ── Live Init (Supabase real) ────────────────────────────
      initializeLive: async (authId: string) => {
        set({ isLoading: true });
        try {
          // Get user profile from DB
          const user = await db.getUserByAuthId(authId);
          if (!user) {
            set({ isLoading: false });
            return;
          }

          // Update last login
          await db.updateLastLogin(user.id);

          // Determine which shops to load
          let shops: Barbershop[] = [];
          let saasPayments: SaasPayment[] = [];

          if (user.role === 'superadmin') {
            shops = await db.fetchAllShops();
            try {
              saasPayments = await db.fetchSaasPayments();
            } catch (e) {
              console.error('Error loading saas payments:', e);
            }
          } else {
            const shop = await db.fetchShopById(user.shopId);
            if (shop) shops = [shop];
          }

          const currentShop = shops.find(s => s.id === user.shopId) || shops[0] || null;

          // Load tenant-specific data
          if (currentShop) {
            const tenantData = await db.fetchTenantData(currentShop.id);
            set({
              mode: 'live',
              currentUser: user,
              currentShop,
              shops,
              saasPayments,
              isAuthenticated: true,
              isInitialized: true,
              isLoading: false,
              activeView: user.role === 'superadmin' ? 'superadmin' : 'dashboard',
              ...tenantData,
            });
          } else {
            set({
              mode: 'live',
              currentUser: user,
              currentShop: null,
              shops,
              saasPayments,
              isAuthenticated: true,
              isInitialized: true,
              isLoading: false,
            });
          }
        } catch (err) {
          console.error('Error initializing live mode:', err);
          set({ isLoading: false });
        }
      },

      // ── Load data for a specific shop ────────────────────────
      loadShopData: async (shopId: string) => {
        if (get().mode === 'demo') return;
        set({ isLoading: true });
        try {
          const tenantData = await db.fetchTenantData(shopId);
          const shop = await db.fetchShopById(shopId);
          set({
            currentShop: shop || get().currentShop,
            ...tenantData,
            isLoading: false,
          });
        } catch (err) {
          console.error('Error loading shop data:', err);
          set({ isLoading: false });
        }
      },

      // ── Tenant & Role Management ──────────────────────────────
      switchShop: (shopId: string) => {
        const { shops, users, mode } = get();
        const targetShop = shops.find((s) => s.id === shopId) || shops.find((s) => s.slug === shopId);
        if (!targetShop) return;

        const shopAdmin = users.find((u) => u.shopId === targetShop.id && u.role === 'admin') || {
          id: `user_admin_${targetShop.id}`,
          shopId: targetShop.id,
          name: `${targetShop.ownerName || 'Administrador Dueño'}`,
          email: targetShop.ownerEmail || targetShop.email,
          role: 'admin' as const,
          passwordHash: '',
          isActive: true,
          createdAt: new Date().toISOString(),
        };

        set({
          currentShop: targetShop,
          currentUser: shopAdmin,
          activeView: 'dashboard',
        });

        // In live mode, also reload data from Supabase
        if (mode === 'live') {
          get().loadShopData(targetShop.id);
        }
      },

      switchRole: (role: UserRole, barberId?: string) => {
        const { currentShop, barbers } = get();

        if (role === 'superadmin') {
          set({
            currentUser: {
              id: 'user_superadmin_jl',
              shopId: currentShop?.id || 'shop_demo',
              name: 'Juan Arenas (SuperAdmin)',
              email: 'jl087521@gmail.com',
              role: 'superadmin',
              passwordHash: '1089385741',
              isActive: true,
              createdAt: '2024-01-01T00:00:00Z',
            },
            activeView: 'superadmin',
          });
          return;
        }

        const shopBarbers = barbers.filter((b) => b.shopId === currentShop?.id);
        const assignedBarberId = barberId || shopBarbers[0]?.id || 'barber_default';
        const assignedBarber = shopBarbers.find((b) => b.id === assignedBarberId) || shopBarbers[0];

        if (role === 'barber') {
          set({
            currentUser: {
              id: `user_barber_${assignedBarberId}`,
              shopId: currentShop?.id || 'shop_demo',
              name: assignedBarber ? assignedBarber.name : 'Barbero Activo',
              email: assignedBarber?.email || 'barbero@chairpro.app',
              role: 'barber',
              barberId: assignedBarberId,
              passwordHash: '',
              isActive: true,
              createdAt: '2024-01-15T00:00:00Z',
            },
          });
        } else {
          set({
            currentUser: {
              id: `user_admin_${currentShop?.id}`,
              shopId: currentShop?.id || 'shop_demo',
              name: currentShop?.ownerName || 'Administrador Dueño',
              email: currentShop?.ownerEmail || currentShop?.email || 'admin@chairpro.app',
              role: role,
              barberId: undefined,
              passwordHash: '',
              isActive: true,
              createdAt: '2024-01-15T00:00:00Z',
            },
          });
        }
      },

      updateShopBranding: (shopId, branding) => {
        // Update locally first (instant feedback)
        set((state) => {
          const updatedShops = state.shops.map((shop) => {
            if (shop.id === shopId || shop.slug === shopId) {
              const updatedTheme: ShopTheme = {
                ...shop.theme,
                ...(branding.mode ? { mode: branding.mode } : {}),
                ...(branding.primaryColor ? { primaryColor: branding.primaryColor } : {}),
                ...(branding.accentColor !== undefined ? { accentColor: branding.accentColor } : {}),
                ...(branding.backgroundType ? { backgroundType: branding.backgroundType } : {}),
                ...(branding.backgroundImage !== undefined ? { backgroundImage: branding.backgroundImage } : {}),
                ...(branding.backgroundOpacity !== undefined ? { backgroundOpacity: branding.backgroundOpacity } : {}),
                ...(branding.logoUrl !== undefined ? { logoUrl: branding.logoUrl } : {}),
                ...(branding.tagline !== undefined ? { tagline: branding.tagline } : {}),
              };

              return {
                ...shop,
                name: branding.name || shop.name,
                address: branding.address || shop.address,
                phone: branding.phone || shop.phone,
                theme: updatedTheme,
              };
            }
            return shop;
          });

          const currentShop = updatedShops.find((s) => s.id === state.currentShop?.id) || state.currentShop;
          return { shops: updatedShops, currentShop };
        });

        // Persist to Supabase in live mode
        if (get().mode === 'live') {
          db.updateTenantBranding(shopId, branding);
        }
      },

      updateShopSettings: async (shopId, settingsData) => {
        set((state) => {
          const updatedShops = state.shops.map((shop) => {
            if (shop.id === shopId || shop.slug === shopId) {
              return {
                ...shop,
                ...settingsData,
                settings: {
                  ...shop.settings,
                  ...(settingsData.settings || {}),
                },
                workingHours: {
                  ...shop.workingHours,
                  ...(settingsData.workingHours || {}),
                },
                theme: {
                  ...shop.theme,
                  ...(settingsData.theme || {}),
                },
              };
            }
            return shop;
          });

          const currentShop = updatedShops.find((s) => s.id === state.currentShop?.id) || state.currentShop;
          return { shops: updatedShops, currentShop };
        });

        if (get().mode === 'live') {
          await db.updateTenantSettings(shopId, settingsData);
        }
      },

      updateShopAutomationSettings: async (settings) => {
        const currentShop = get().currentShop;
        if (!currentShop) return;
        await get().updateShopSettings(currentShop.id, {
          settings: {
            ...currentShop.settings,
            ...settings,
          },
        });
      },

      createShop: async (data) => {
        const { mode } = get();

        if (mode === 'live') {
          const newShop = await db.createTenant({
            name: data.name,
            slug: data.slug.toLowerCase().trim().replace(/\s+/g, '-'),
            ownerName: data.ownerName || 'Dueño',
            ownerEmail: data.ownerEmail.toLowerCase().trim(),
            city: data.city,
            plan: data.plan,
            primaryColor: data.primaryColor,
          });

          if (newShop) {
            set((s) => ({ shops: [...s.shops, newShop] }));
          }
          return newShop;
        }

        // Demo mode: keep existing local logic
        const id = `shop_${data.slug.replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;
        const newShop: Barbershop = {
          id,
          name: data.name,
          slug: data.slug,
          address: 'Dirección por configurar',
          city: data.city || 'Bogotá',
          country: 'Colombia',
          phone: '+57 300 000 0000',
          email: data.ownerEmail,
          ownerEmail: data.ownerEmail,
          ownerName: data.ownerName,
          timezone: 'America/Bogota',
          theme: {
            mode: 'dark',
            primaryColor: data.primaryColor || '#7c3aed',
            backgroundType: 'gradient',
            logoUrl: '✂️',
            tagline: 'Experiencia y estilo superior',
            backgroundOpacity: 0.15,
          },
          status: 'active',
          mrr: data.plan === 'enterprise' ? 249000 : data.plan === 'basic' ? 129000 : 189000,
          plan: data.plan || 'pro',
          createdAt: new Date().toISOString(),
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
            rewardDescription: 'Corte de cortesía en tu próxima visita',
            currency: 'COP',
            currencySymbol: '$',
          },
        };

        const newOwner: User = {
          id: `user_owner_${id}`,
          shopId: id,
          name: data.ownerName,
          email: data.ownerEmail,
          role: 'admin',
          passwordHash: 'demo_admin_2024',
          isActive: true,
          createdAt: new Date().toISOString(),
        };

        const newBarber: Barber = {
          id: `barber_${id}_1`,
          shopId: id,
          name: `${data.ownerName.split(' ')[0]} Master`,
          phone: '+57 300 000 0000',
          email: data.ownerEmail,
          description: 'Barbero principal y fundador.',
          specialties: ['Fade', 'Clásico', 'Barba'],
          commissionRate: 0.50,
          color: data.primaryColor || '#7c3aed',
          schedule: [
            { day: 'monday', isWorking: true, start: '09:00', end: '19:00', breakStart: '13:00', breakEnd: '14:00' },
            { day: 'tuesday', isWorking: true, start: '09:00', end: '19:00', breakStart: '13:00', breakEnd: '14:00' },
            { day: 'wednesday', isWorking: true, start: '09:00', end: '19:00', breakStart: '13:00', breakEnd: '14:00' },
            { day: 'thursday', isWorking: true, start: '09:00', end: '20:00', breakStart: '13:00', breakEnd: '14:00' },
            { day: 'friday', isWorking: true, start: '09:00', end: '20:00', breakStart: '13:00', breakEnd: '14:00' },
            { day: 'saturday', isWorking: true, start: '08:00', end: '18:00', breakStart: '12:30', breakEnd: '13:30' },
            { day: 'sunday', isWorking: false, start: '10:00', end: '15:00' },
          ],
          serviceIds: [`svc_${id}_1`, `svc_${id}_2`],
          joinedAt: new Date().toISOString(),
          isActive: true,
        };

        const svc1: Service = {
          id: `svc_${id}_1`, shopId: id, name: 'Corte Clásico',
          description: 'Corte personalizado con lavado y peinado.',
          duration: 35, price: 35000, commissionRate: 0, category: 'corte', isActive: true, popular: true,
        };
        const svc2: Service = {
          id: `svc_${id}_2`, shopId: id, name: 'Corte + Barba',
          description: 'Combo completo de corte con toalla caliente y barba.',
          duration: 60, price: 65000, commissionRate: 0, category: 'combo', isActive: true, popular: true,
        };

        set((s) => ({
          shops: [...s.shops, newShop],
          users: [...s.users, newOwner],
          barbers: [...s.barbers, newBarber],
          services: [...s.services, svc1, svc2],
        }));

        return newShop;
      },

      toggleShopStatus: (shopId: string) => {
        set((state) => ({
          shops: state.shops.map((s) =>
            s.id === shopId ? { ...s, status: s.status === 'active' ? 'suspended' : 'active' } : s
          ),
        }));
        if (get().mode === 'live') {
          db.toggleTenantStatus(shopId);
        }
      },

      recordMonthlyPayment: async (data) => {
        const { shops, mode, currentUser } = get();
        const shop = shops.find((s) => s.id === data.tenantId) || shops.find((s) => s.slug === data.tenantId);
        if (!shop) return null;

        const paymentDate = data.date || format(new Date(), 'yyyy-MM-dd');
        const periodStart = data.billingPeriodStart || paymentDate;
        
        let periodEnd = data.billingPeriodEnd;
        if (!periodEnd) {
          const daysToAdd = data.autoExtendDays || 30;
          const baseDate = new Date(periodStart);
          periodEnd = format(addDays(baseDate, daysToAdd), 'yyyy-MM-dd');
        }

        const paymentRecord: SaasPayment = {
          id: `spay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          tenantId: shop.id,
          tenantName: shop.name,
          amount: Number(data.amount) || shop.mrr || 189000,
          date: paymentDate,
          billingPeriodStart: periodStart,
          billingPeriodEnd: periodEnd,
          paymentMethod: data.paymentMethod,
          reference: data.reference || '',
          notes: data.notes || '',
          recordedBy: currentUser ? `${currentUser.name}` : 'SuperAdmin',
          createdAt: new Date().toISOString(),
        };

        // Update local state immediately
        set((state) => ({
          saasPayments: [paymentRecord, ...state.saasPayments],
          shops: state.shops.map((s) =>
            s.id === shop.id
              ? {
                  ...s,
                  nextBillingDate: periodEnd,
                  lastPaymentDate: paymentDate,
                  subscriptionStatus: 'active' as const,
                }
              : s
          ),
        }));

        // In live mode, save in Supabase
        if (mode === 'live') {
          try {
            await db.recordSaasPayment({
              tenantId: shop.id,
              amount: paymentRecord.amount,
              date: paymentRecord.date,
              billingPeriodStart: paymentRecord.billingPeriodStart,
              billingPeriodEnd: paymentRecord.billingPeriodEnd,
              paymentMethod: paymentRecord.paymentMethod,
              reference: paymentRecord.reference,
              notes: paymentRecord.notes,
              recordedBy: paymentRecord.recordedBy,
            });
          } catch (err) {
            console.error('Error saving SaaS payment to Supabase:', err);
          }
        }

        return paymentRecord;
      },

      updateShopSubscription: (shopId, updates) => {
        set((state) => ({
          shops: state.shops.map((s) =>
            s.id === shopId
              ? {
                  ...s,
                  ...(updates.nextBillingDate ? { nextBillingDate: updates.nextBillingDate } : {}),
                  ...(updates.lastPaymentDate ? { lastPaymentDate: updates.lastPaymentDate } : {}),
                  ...(updates.subscriptionStatus ? { subscriptionStatus: updates.subscriptionStatus } : {}),
                }
              : s
          ),
        }));

        if (get().mode === 'live') {
          db.updateTenantSubscription(shopId, updates);
        }
      },

      getSaaSPlatformKPIs: (): SaaSPlatformKPIs => {
        const { shops, appointments, barbers } = get();
        const activeShops = shops.filter((s) => s.status === 'active').length;
        const totalMRR = shops
          .filter((s) => s.status === 'active')
          .reduce((sum, s) => sum + (s.mrr || 0), 0);

        return {
          totalShops: shops.length,
          activeShops,
          totalBarbers: barbers.filter((b) => b.isActive).length,
          totalAppointments: appointments.length,
          totalMRR,
          monthlyGrowthRate: 18.4,
        };
      },

      // ── Auth ──────────────────────────────────────────────────
      login: async (email, password) => {
        get().initializeDemo();
        const { users, shops } = get();
        const allUsers = users.length > 0 ? users : demoUsers;
        const allShops = shops.length > 0 ? shops : demoShops;

        const cleanEmail = email.toLowerCase().trim();

        // Direct check for user's SuperAdmin account
        if (cleanEmail === 'jl087521@gmail.com' && (password === '1089385741' || password === 'superadmin2024')) {
          const superAdminUser: User = {
            id: 'user_superadmin_jl',
            shopId: 'shop_demo',
            name: 'Juan Arenas (SuperAdmin)',
            email: 'jl087521@gmail.com',
            role: 'superadmin',
            passwordHash: '1089385741',
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
          };
          set({
            mode: 'demo',
            currentUser: superAdminUser,
            currentShop: allShops[0] || null,
            isAuthenticated: true,
            activeView: 'superadmin',
          });
          return { success: true };
        }

        const user = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);

        if (!user) {
          return { success: false, error: 'Usuario no encontrado con este correo electrónico.' };
        }

        const isPasswordValid =
          user.passwordHash === password ||
          (user.role === 'superadmin' && (password === 'superadmin2024' || password === '1089385741' || password === user.passwordHash)) ||
          (user.role === 'admin' && (password === 'demo_admin_2024' || password === user.passwordHash)) ||
          (user.role === 'barber' && (password === 'demo_carlos_2024' || password === 'demo_barber_2024' || password === user.passwordHash)) ||
          (user.role === 'receptionist' && password === 'demo_recepcion_2024');

        if (!isPasswordValid) {
          return { success: false, error: 'Contraseña incorrecta. Por favor verifica tus datos.' };
        }

        let matchingShop = allShops.find((s) => s.id === user.shopId);
        if (!matchingShop && allShops.length > 0) {
          matchingShop = allShops[0];
        }

        set({
          mode: 'demo',
          currentUser: user,
          currentShop: matchingShop || allShops[0] || null,
          isAuthenticated: true,
          activeView: user.role === 'superadmin' ? 'superadmin' : 'dashboard',
        });
        return { success: true };
      },

      loginWithSupabase: async (email, password) => {
        try {
          const supabase = createClient();
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            return { success: false, error: error.message === 'Invalid login credentials'
              ? 'Email o contraseña incorrectos'
              : error.message
            };
          }

          if (data.user) {
            await get().initializeLive(data.user.id);
            return { success: true };
          }

          return { success: false, error: 'Error desconocido' };
        } catch (err: any) {
          return { success: false, error: err.message || 'Error de conexión' };
        }
      },

      logout: () => {
        try {
          const supabase = createClient();
          supabase.auth.signOut();
        } catch (e) {
          console.warn('Supabase signout:', e);
        }
        set({
          currentUser: null,
          isAuthenticated: false,
          activeView: 'dashboard',
          mode: 'demo',
          isInitialized: true,
        });
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      },

      setActiveView: (view) => set({ activeView: view }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // ── Appointments ──────────────────────────────────────────
      createAppointment: (data) => {
        const id = generateId('appt');
        const now = new Date().toISOString();
        const newAppt: Appointment = { ...data, id, createdAt: now, updatedAt: now };
        set((s) => ({ appointments: [...s.appointments, newAppt] }));

        get().addNotification({
          shopId: data.shopId,
          type: 'new_appointment',
          title: 'Nueva reserva',
          message: `Nueva cita agendada para el ${data.date} a las ${data.startTime}.`,
          isRead: false,
        });

        set((s) => ({
          automations: s.automations.map((a) =>
            a.trigger === 'on_appointment_created'
              ? { ...a, runCount: a.runCount + 1, lastRunAt: now }
              : a
          ),
        }));

        // Persist in live mode
        if (get().mode === 'live') {
          db.insertAppointment({
            tenantId: data.shopId,
            clientId: data.clientId,
            barberId: data.barberId,
            serviceId: data.serviceId,
            date: data.date,
            startTime: data.startTime,
            endTime: data.endTime,
            status: data.status,
            source: data.source,
            price: data.price,
            commissionAmount: data.commissionAmount,
            notes: data.notes,
          });
        }

        return newAppt;
      },

      updateAppointment: (id, data) => {
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === id ? { ...a, ...data, updatedAt: new Date().toISOString() } : a
          ),
        }));
        if (get().mode === 'live') {
          db.updateAppointmentStatus(id, {
            status: data.status,
            isPaid: data.isPaid,
            paymentMethod: data.paymentMethod,
            commissionAmount: data.commissionAmount,
          });
        }
      },

      cancelAppointment: (id) => {
        const appt = get().appointments.find((a) => a.id === id);
        if (!appt) return;
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === id ? { ...a, status: 'cancelled', updatedAt: new Date().toISOString() } : a
          ),
          automations: s.automations.map((a) =>
            a.trigger === 'on_appointment_cancelled'
              ? { ...a, runCount: a.runCount + 1, lastRunAt: new Date().toISOString() }
              : a
          ),
        }));
        if (get().mode === 'live') {
          db.updateAppointmentStatus(id, { status: 'cancelled' });
        }
      },

      markNoShow: (id) => {
        const appt = get().appointments.find((a) => a.id === id);
        if (!appt) return;
        const now = new Date().toISOString();
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === id ? { ...a, status: 'no_show', updatedAt: now } : a
          ),
          clients: s.clients.map((c) =>
            c.id === appt.clientId ? { ...c, noShowCount: c.noShowCount + 1 } : c
          ),
        }));
        get().addNotification({
          shopId: appt.shopId,
          type: 'no_show',
          title: 'No se presentó',
          message: `Un cliente no se presentó a su cita del ${appt.date} a las ${appt.startTime}.`,
          isRead: false,
          relatedId: id,
        });
        if (get().mode === 'live') {
          db.updateAppointmentStatus(id, { status: 'no_show' });
          const client = get().clients.find(c => c.id === appt.clientId);
          if (client) {
            db.updateClientData(client.id, { noShowCount: client.noShowCount + 1 });
          }
        }
      },

      completeAppointment: (id, paymentMethod) => {
        const { appointments, clients, services, barbers, currentUser, mode } = get();
        const appt = appointments.find((a) => a.id === id);
        if (!appt) return;
        const service = services.find((s) => s.id === appt.serviceId);
        const barber = barbers.find((b) => b.id === appt.barberId);
        if (!service || !barber) return;

        const commissionRate = service.commissionRate > 0 ? service.commissionRate : barber.commissionRate;
        const commissionAmount = Math.round(service.price * commissionRate);
        const now = new Date().toISOString();

        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === id
              ? { ...a, status: 'completed', isPaid: true, paymentMethod, commissionAmount, updatedAt: now }
              : a
          ),
          clients: s.clients.map((c) =>
            c.id === appt.clientId
              ? {
                  ...c,
                  totalVisits: c.totalVisits + 1,
                  totalSpent: c.totalSpent + service.price,
                  lastVisitAt: now,
                  loyalty: {
                    ...c.loyalty,
                    visits: c.loyalty.visits + 1,
                    points: c.loyalty.points + Math.floor(service.price / 1000),
                  },
                }
              : c
          ),
        }));

        const client = clients.find((c) => c.id === appt.clientId);
        get().addTransaction({
          shopId: appt.shopId,
          type: 'income',
          category: 'service',
          description: `${service.name} - ${client?.name || 'Cliente'}`,
          amount: service.price,
          date: appt.date,
          relatedAppointmentId: id,
          barberId: appt.barberId,
          commissionAmount,
          createdBy: currentUser?.id || 'system',
        });

        set((s) => ({
          automations: s.automations.map((a) =>
            a.trigger === 'on_appointment_completed'
              ? { ...a, runCount: a.runCount + 1, lastRunAt: now }
              : a
          ),
        }));

        if (mode === 'live') {
          db.updateAppointmentStatus(id, {
            status: 'completed',
            isPaid: true,
            paymentMethod: paymentMethod || undefined,
            commissionAmount,
          });
          if (client) {
            db.updateClientData(client.id, {
              totalVisits: client.totalVisits + 1,
              totalSpent: client.totalSpent + service.price,
              lastVisitAt: now,
              loyalty: {
                visits: client.loyalty.visits + 1,
                points: client.loyalty.points + Math.floor(service.price / 1000),
              },
            });
          }
        }
      },

      markInProgress: (id) => {
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === id ? { ...a, status: 'in_progress', updatedAt: new Date().toISOString() } : a
          ),
        }));
        if (get().mode === 'live') {
          db.updateAppointmentStatus(id, { status: 'in_progress' });
        }
      },

      // ── Clients ───────────────────────────────────────────────
      createClient: (data) => {
        const newClient: Client = {
          ...data,
          id: generateId('client'),
          shopId: get().currentShop?.id || 'shop_demo',
          registeredAt: new Date().toISOString(),
          loyalty: { points: 0, visits: 0 },
          tags: ['new'],
          noShowCount: 0,
          totalSpent: 0,
          totalVisits: 0,
        };
        set((s) => ({ clients: [...s.clients, newClient] }));
        if (get().mode === 'live') {
          db.insertClient({
            tenantId: newClient.shopId,
            name: newClient.name,
            phone: newClient.phone,
            email: newClient.email,
          });
        }
        return newClient;
      },

      updateClient: (id, data) => {
        set((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, ...data } : c)) }));
        if (get().mode === 'live') {
          db.updateClientData(id, data);
        }
      },

      findOrCreateClient: (phone, name, email) => {
        const existing = get().clients.find((c) => c.phone === phone);
        if (existing) return existing;
        return get().createClient({ name, phone, email });
      },

      // ── Barbers ───────────────────────────────────────────────
      createBarber: (data) => {
        const newBarber: Barber = {
          ...data,
          id: generateId('barber'),
          shopId: get().currentShop?.id || 'shop_demo',
        };
        set((s) => ({ barbers: [...s.barbers, newBarber] }));
        if (get().mode === 'live') {
          db.insertBarber({
            tenantId: newBarber.shopId,
            name: newBarber.name,
            phone: newBarber.phone,
            email: newBarber.email,
            description: newBarber.description,
            specialties: newBarber.specialties,
            commissionRate: newBarber.commissionRate,
            color: newBarber.color,
            schedule: newBarber.schedule,
            serviceIds: newBarber.serviceIds,
          });
        }
        return newBarber;
      },

      updateBarber: (id, data) => {
        set((s) => ({ barbers: s.barbers.map((b) => (b.id === id ? { ...b, ...data } : b)) }));
        if (get().mode === 'live') {
          db.updateBarberData(id, data);
        }
      },

      toggleBarberActive: (id) => {
        const barber = get().barbers.find(b => b.id === id);
        set((s) => ({
          barbers: s.barbers.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b)),
        }));
        if (get().mode === 'live' && barber) {
          db.updateBarberData(id, { isActive: !barber.isActive });
        }
      },

      setBarberStatus: (id, status) => {
        const now = new Date().toISOString();
        set((s) => ({
          barbers: s.barbers.map((b) => (b.id === id ? { ...b, status, statusUpdatedAt: now } : b)),
        }));
      },

      addWhatsAppMessage: (msg) => {
        const newMsg: WhatsAppMessage = {
          ...msg,
          id: generateId('wmsg'),
          timestamp: new Date().toISOString(),
        };
        set((s) => ({ whatsappMessages: [newMsg, ...s.whatsappMessages] }));
        return newMsg;
      },

      processBarberWhatsAppMessage: (phoneOrBarberId, messageText, isAudio = false) => {
        const state = get();
        const currentShop = state.currentShop || state.shops[0] || demoBarbershop;
        const barbers = state.barbers.filter(b => b.shopId === currentShop.id);
        const currentBarber = barbers.find(b => b.id === phoneOrBarberId || b.phone === phoneOrBarberId) || barbers[0];

        // 1. Parse natural language message/audio
        const parsed = parseBarberMessage(messageText, {
          services: state.services.filter(s => s.shopId === currentShop.id),
          products: state.products.filter(p => p.shopId === currentShop.id),
          barbers,
          currentBarber,
          isAudio,
        });

        // 2. Handle Status Change
        if (parsed.actionType === 'change_status' && parsed.newStatus && currentBarber) {
          get().setBarberStatus(currentBarber.id, parsed.newStatus);
          const statusLabels: Record<string, string> = {
            available: '🟢 Disponible para atender',
            busy: '🟡 En turno / Ocupado',
            break: '☕ En descanso / Almuerzo',
            off: '🔴 Fuera de turno / Libre',
          };
          const reply = `💈 *Estado actualizado*\n\nHola ${currentBarber.name.split(' ')[0]}, tu estado ahora es: *${statusLabels[parsed.newStatus]}*.`;
          
          get().addWhatsAppMessage({
            shopId: currentShop.id,
            direction: 'inbound',
            from: currentBarber.phone || '+573000000000',
            to: currentShop.whatsapp || '+573160000000',
            type: isAudio ? 'audio' : 'text',
            content: messageText,
            transcription: isAudio ? messageText : undefined,
            senderRole: 'barber',
            senderName: currentBarber.name,
            barberId: currentBarber.id,
            status: 'processed',
          });

          get().addWhatsAppMessage({
            shopId: currentShop.id,
            direction: 'outbound',
            from: currentShop.whatsapp || '+573160000000',
            to: currentBarber.phone || '+573000000000',
            type: 'text',
            content: reply,
            senderRole: 'system',
            barberId: currentBarber.id,
            status: 'sent',
          });

          return { success: true, reply, actionType: 'change_status', data: { newStatus: parsed.newStatus } };
        }

        // 3. Handle Wallet / Earnings Query
        if (parsed.actionType === 'check_wallet' && currentBarber) {
          const today = format(new Date(), 'yyyy-MM-dd');
          const barberAppts = state.appointments.filter(
            a => a.barberId === currentBarber.id && a.date === today && a.status === 'completed'
          );
          const totalEarned = barberAppts.reduce((sum, a) => sum + a.price, 0);
          const totalCommission = Math.round(totalEarned * currentBarber.commissionRate);

          const reply = `💰 *Billetera del Barbero — ${currentBarber.name.split(' ')[0]}*\n📅 Hoy (${today})\n\n✂️ Cortes realizados: *${barberAppts.length}*\n💵 Total generado: *$${totalEarned.toLocaleString('es-CO')}*\n🏆 *Tu comisión a cobrar hoy:* *$${totalCommission.toLocaleString('es-CO')}*\n\n¡Gran trabajo! 💪`;

          return { success: true, reply, actionType: 'check_wallet', data: { totalCommission, servicesCount: barberAppts.length } };
        }

        // 4. Handle Service Registration
        if (parsed.actionType === 'register_service') {
          const targetBarber = currentBarber;
          const targetService = state.services.find(s => s.id === parsed.serviceId) || state.services[0];
          const todayStr = format(new Date(), 'yyyy-MM-dd');
          const nowTime = format(new Date(), 'HH:mm');

          // Find or create client if name was mentioned
          let client = state.clients.find(c => parsed.clientName && c.name.toLowerCase().includes(parsed.clientName.toLowerCase()));
          if (!client) {
            client = state.clients[0] || get().createClient({
              name: parsed.clientName || 'Cliente Mostrador (WhatsApp)',
              phone: '+57 300 000 0000',
            });
          }

          // A. Create Completed Appointment
          const newAppt: Appointment = {
            id: generateId('appt'),
            shopId: currentShop.id,
            clientId: client.id,
            barberId: targetBarber.id,
            serviceId: targetService.id,
            date: todayStr,
            startTime: nowTime,
            endTime: nowTime,
            status: 'completed',
            source: 'whatsapp',
            price: parsed.price,
            commissionAmount: parsed.commissionAmount,
            isPaid: true,
            paymentMethod: parsed.paymentMethod,
            notes: `Auto-registrado por WhatsApp (${isAudio ? 'Nota de Voz' : 'Texto'}): "${messageText}"`,
            reminderSent: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // B. Create Financial Income Transaction
          const newTx: Transaction = {
            id: generateId('tx'),
            shopId: currentShop.id,
            type: 'income',
            category: 'service',
            description: `${targetService.name} - ${targetBarber.name} (${parsed.paymentMethod.toUpperCase()}) [WhatsApp Bot]`,
            amount: parsed.price,
            date: todayStr,
            relatedAppointmentId: newAppt.id,
            barberId: targetBarber.id,
            commissionAmount: parsed.commissionAmount,
            createdBy: targetBarber.id,
            createdAt: new Date().toISOString(),
          };

          // C. If products sold, reduce stock & register tx
          let productsSummary = '';
          if (parsed.productsSold && parsed.productsSold.length > 0) {
            for (const item of parsed.productsSold) {
              get().registerSale(item.productId, item.quantity, client.id);
              productsSummary += `\n📦 Producto: ${item.productName} ($${item.price.toLocaleString('es-CO')})`;
            }
          }

          // D. Update state
          set((s) => ({
            appointments: [newAppt, ...s.appointments],
            transactions: [newTx, ...s.transactions],
            clients: s.clients.map((c) =>
              c.id === client.id
                ? {
                    ...c,
                    totalVisits: c.totalVisits + 1,
                    totalSpent: c.totalSpent + parsed.price,
                    lastVisitAt: new Date().toISOString(),
                    loyalty: {
                      visits: c.loyalty.visits + 1,
                      points: c.loyalty.points + Math.floor(parsed.price / 1000),
                    },
                  }
                : c
            ),
          }));

          // Compute barber's updated daily total
          const todayBarberAppts = [...state.appointments, newAppt].filter(
            a => a.barberId === targetBarber.id && a.date === todayStr && a.status === 'completed'
          );
          const dailyEarned = todayBarberAppts.reduce((sum, a) => sum + (a.commissionAmount || Math.round(a.price * targetBarber.commissionRate)), 0);

          const methodIcons: Record<string, string> = {
            nequi: '🟣 Nequi',
            daviplata: '🔴 Daviplata',
            cash: '💵 Efectivo',
            card: '💳 Datáfono/Tarjeta',
            transfer: '🏦 Transferencia',
          };

          const reply = `✅ *¡Servicio Registrado Automáticamente!*
${isAudio ? '🎙️ _Nota de voz procesada con IA_' : '💬 _Mensaje procesado con IA_'}

💈 *Barbero:* ${targetBarber.name}
✂️ *Servicio:* ${targetService.name}
💰 *Valor:* $${parsed.price.toLocaleString('es-CO')} COP
💳 *Método de Pago:* ${methodIcons[parsed.paymentMethod] || parsed.paymentMethod}
🏆 *Tu Comisión:* $${parsed.commissionAmount.toLocaleString('es-CO')} COP${productsSummary}

━━━━━━━━━━━━━━━━━━━━
📊 *Tu acumulado de hoy:* *$${dailyEarned.toLocaleString('es-CO')} COP* (${todayBarberAppts.length} servicios)`;

          get().addWhatsAppMessage({
            shopId: currentShop.id,
            direction: 'inbound',
            from: targetBarber.phone || '+573000000000',
            to: currentShop.whatsapp || '+573160000000',
            type: isAudio ? 'audio' : 'text',
            content: messageText,
            transcription: isAudio ? messageText : undefined,
            senderRole: 'barber',
            senderName: targetBarber.name,
            barberId: targetBarber.id,
            status: 'processed',
          });

          get().addWhatsAppMessage({
            shopId: currentShop.id,
            direction: 'outbound',
            from: currentShop.whatsapp || '+573160000000',
            to: targetBarber.phone || '+573000000000',
            type: 'text',
            content: reply,
            senderRole: 'bot',
            barberId: targetBarber.id,
            status: 'sent',
          });

          get().addNotification({
            shopId: currentShop.id,
            type: 'new_appointment',
            title: `Corte registrado vía WhatsApp (${targetBarber.name})`,
            message: `${targetService.name} por $${parsed.price.toLocaleString('es-CO')} (${parsed.paymentMethod})`,
            isRead: false,
          });

          return {
            success: true,
            reply,
            actionType: 'register_service',
            data: { appointmentId: newAppt.id, parsed },
          };
        }

        return {
          success: false,
          reply: 'No se pudo interpretar el servicio. Escribe por ejemplo: "Corte clásico 35 mil nequi".',
        };
      },

      processClientWhatsAppMessage: (phone, clientName, messageText) => {
        const state = get();
        const currentShop = state.currentShop || state.shops[0] || demoBarbershop;
        const response = processCustomerMessage(messageText, {
          shop: currentShop,
          services: state.services.filter(s => s.shopId === currentShop.id),
          barbers: state.barbers.filter(b => b.shopId === currentShop.id),
          appointments: state.appointments.filter(a => a.shopId === currentShop.id),
          customKnowledge: state.chatbotKnowledge,
          clientName,
          clientPhone: phone,
        });

        get().addWhatsAppMessage({
          shopId: currentShop.id,
          direction: 'inbound',
          from: phone,
          to: currentShop.whatsapp || '+573160000000',
          type: 'text',
          content: messageText,
          senderRole: 'client',
          senderName: clientName,
          status: 'processed',
        });

        get().addWhatsAppMessage({
          shopId: currentShop.id,
          direction: 'outbound',
          from: currentShop.whatsapp || '+573160000000',
          to: phone,
          type: 'text',
          content: response.replyText,
          senderRole: 'bot',
          status: 'sent',
        });

        return {
          success: true,
          reply: response.replyText,
          actionType: response.actionTaken,
          buttons: response.suggestedButtons,
        };
      },

      sendDailyCashCloseWhatsApp: (dateStr) => {
        const state = get();
        const currentShop = state.currentShop || state.shops[0] || demoBarbershop;
        const targetDate = dateStr || format(new Date(), 'yyyy-MM-dd');
        const report = calculateDailyCloseReport(
          currentShop,
          targetDate,
          state.appointments.filter(a => a.shopId === currentShop.id),
          state.transactions.filter(t => t.shopId === currentShop.id),
          state.barbers.filter(b => b.shopId === currentShop.id)
        );
        const message = formatDailyCloseWhatsAppMessage(report, currentShop.name);

        set((s) => ({
          dailyCloseReports: [report, ...s.dailyCloseReports.filter(r => r.id !== report.id)],
        }));

        get().addWhatsAppMessage({
          shopId: currentShop.id,
          direction: 'outbound',
          from: currentShop.whatsapp || '+573160000000',
          to: report.recipientPhone || currentShop.phone || '+573000000000',
          type: 'text',
          content: message,
          senderRole: 'system',
          status: 'sent',
        });

        return {
          summary: message,
          targetPhone: report.recipientPhone || currentShop.phone,
          closingHour: format(new Date(), 'HH:mm'),
          report,
        };
      },

      addKnowledgeItem: (item) => {
        const newItem: ChatbotKnowledgeItem = {
          ...item,
          id: generateId('kb'),
          shopId: get().currentShop?.id || 'shop_demo',
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ chatbotKnowledge: [...s.chatbotKnowledge, newItem] }));
        return newItem;
      },

      updateKnowledgeItem: (id, updates) => {
        set((s) => ({
          chatbotKnowledge: s.chatbotKnowledge.map((k) =>
            k.id === id ? { ...k, ...updates, updatedAt: new Date().toISOString() } : k
          ),
        }));
      },

      deleteKnowledgeItem: (id) => {
        set((s) => ({ chatbotKnowledge: s.chatbotKnowledge.filter((k) => k.id !== id) }));
      },

      updateChatbotConfig: (updates) => {
        set((s) => ({
          chatbotConfig: s.chatbotConfig ? { ...s.chatbotConfig, ...updates } : null,
        }));
      },

      getBarberQueue: () => {
        const state = get();
        const currentShop = state.currentShop || state.shops[0] || demoBarbershop;
        const barbers = state.barbers.filter(b => b.shopId === currentShop.id && b.isActive);
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const todayAppts = state.appointments.filter(a => a.shopId === currentShop.id && a.date === todayStr);

        return barbers.map(barber => {
          const barberAppts = todayAppts.filter(a => a.barberId === barber.id);
          const inProgress = barberAppts.find(a => a.status === 'in_progress');
          const completed = barberAppts.filter(a => a.status === 'completed');
          const totalEarned = completed.reduce((sum, a) => sum + (a.commissionAmount || Math.round(a.price * barber.commissionRate)), 0);

          const client = inProgress ? state.clients.find(c => c.id === inProgress.clientId) : undefined;
          const service = inProgress ? state.services.find(s => s.id === inProgress.serviceId) : undefined;

          return {
            barberId: barber.id,
            barberName: barber.name,
            avatarColor: barber.color || '#7C3AED',
            status: barber.status || (inProgress ? 'busy' : 'available'),
            statusUpdatedAt: barber.statusUpdatedAt || new Date().toISOString(),
            currentAppointmentId: inProgress?.id,
            currentClientName: client?.name,
            currentServiceName: service?.name,
            startedAt: inProgress?.startTime,
            estimatedEndAt: inProgress?.endTime,
            remainingMinutes: inProgress ? 25 : 0,
            dailyServicesCount: completed.length,
            dailyEarnings: totalEarned,
          };
        });
      },

      // ── Services ──────────────────────────────────────────────
      createService: (data) => {
        const newService: Service = {
          ...data,
          id: generateId('svc'),
          shopId: get().currentShop?.id || 'shop_demo',
        };
        set((s) => ({ services: [...s.services, newService] }));
        if (get().mode === 'live') {
          db.insertService({
            tenantId: newService.shopId,
            name: newService.name,
            description: newService.description,
            duration: newService.duration,
            price: newService.price,
            commissionRate: newService.commissionRate,
            category: newService.category,
            popular: newService.popular,
          });
        }
        return newService;
      },

      updateService: (id, data) => {
        set((s) => ({ services: s.services.map((s2) => (s2.id === id ? { ...s2, ...data } : s2)) }));
      },

      toggleServiceActive: (id) => {
        set((s) => ({
          services: s.services.map((s2) => (s2.id === id ? { ...s2, isActive: !s2.isActive } : s2)),
        }));
      },

      // ── Products ──────────────────────────────────────────────
      createProduct: (data) => {
        const newProduct: Product = {
          ...data,
          id: generateId('prod'),
          shopId: get().currentShop?.id || 'shop_demo',
        };
        set((s) => ({ products: [...s.products, newProduct] }));
        if (get().mode === 'live') {
          db.insertProduct({
            tenantId: newProduct.shopId,
            name: newProduct.name,
            description: newProduct.description,
            category: newProduct.category,
            price: newProduct.price,
            cost: newProduct.cost,
            stock: newProduct.stock,
            minStock: newProduct.minStock,
          });
        }
        return newProduct;
      },

      updateProduct: (id, data) => {
        set((s) => ({ products: s.products.map((p) => (p.id === id ? { ...p, ...data } : p)) }));
      },

      registerSale: (productId, quantity, clientId) => {
        const product = get().products.find((p) => p.id === productId);
        if (!product || product.stock < quantity) return false;
        const newStock = product.stock - quantity;
        set((s) => ({
          products: s.products.map((p) =>
            p.id === productId ? { ...p, stock: newStock } : p
          ),
        }));

        const movement: InventoryMovement = {
          id: generateId('mov'),
          shopId: get().currentShop?.id || 'shop_demo',
          productId,
          type: 'sale',
          quantity,
          reason: 'Venta al cliente',
          createdAt: new Date().toISOString(),
          createdBy: get().currentUser?.id || 'system',
        };
        set((s) => ({ inventoryMovements: [...s.inventoryMovements, movement] }));

        get().addTransaction({
          shopId: get().currentShop?.id || 'shop_demo',
          type: 'income',
          category: 'product',
          description: `Venta: ${product.name} x${quantity}`,
          amount: product.price * quantity,
          date: format(new Date(), 'yyyy-MM-dd'),
          relatedProductId: productId,
          createdBy: get().currentUser?.id || 'system',
        });

        if (newStock <= product.minStock) {
          const now = new Date().toISOString();
          get().addNotification({
            shopId: get().currentShop?.id || 'shop_demo',
            type: 'low_stock',
            title: newStock === 0 ? 'Producto agotado' : 'Stock bajo',
            message: `${product.name} tiene ${newStock} unidades${newStock === 0 ? ' (agotado)' : ''}.`,
            isRead: false,
            relatedId: productId,
          });
          set((s) => ({
            automations: s.automations.map((a) =>
              a.trigger === 'on_low_stock'
                ? { ...a, runCount: a.runCount + 1, lastRunAt: now }
                : a
            ),
          }));
        }

        if (get().mode === 'live') {
          db.updateProductStock(productId, newStock);
        }

        return true;
      },

      adjustStock: (productId, quantity, reason) => {
        set((s) => ({
          products: s.products.map((p) =>
            p.id === productId ? { ...p, stock: Math.max(0, p.stock + quantity) } : p
          ),
        }));
        const movement: InventoryMovement = {
          id: generateId('mov'),
          shopId: get().currentShop?.id || 'shop_demo',
          productId,
          type: quantity > 0 ? 'in' : 'out',
          quantity: Math.abs(quantity),
          reason,
          createdAt: new Date().toISOString(),
          createdBy: get().currentUser?.id || 'system',
        };
        set((s) => ({ inventoryMovements: [...s.inventoryMovements, movement] }));

        if (get().mode === 'live') {
          const product = get().products.find(p => p.id === productId);
          if (product) {
            db.updateProductStock(productId, Math.max(0, product.stock + quantity));
          }
        }
      },

      // ── Transactions ──────────────────────────────────────────
      addTransaction: (data) => {
        const newTx: Transaction = {
          ...data,
          id: generateId('tx'),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ transactions: [...s.transactions, newTx] }));
        if (get().mode === 'live') {
          db.insertTransaction({
            tenantId: data.shopId,
            type: data.type,
            category: data.category,
            description: data.description,
            amount: data.amount,
            date: data.date,
            barberId: data.barberId,
            commissionAmount: data.commissionAmount,
            relatedAppointmentId: data.relatedAppointmentId,
            relatedProductId: data.relatedProductId,
            createdBy: data.createdBy,
          });
        }
      },

      // ── Notifications ─────────────────────────────────────────
      addNotification: (data) => {
        const newNotif: Notification = {
          ...data,
          id: generateId('notif'),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ notifications: [newNotif, ...s.notifications] }));
        if (get().mode === 'live') {
          db.insertNotification({
            tenantId: data.shopId,
            type: data.type,
            title: data.title,
            message: data.message,
            relatedId: data.relatedId,
          });
        }
      },

      markNotificationRead: (id) => {
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        }));
        if (get().mode === 'live') {
          db.markNotificationAsRead(id);
        }
      },

      markAllNotificationsRead: () => {
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, isRead: true })) }));
        if (get().mode === 'live' && get().currentShop) {
          db.markAllNotificationsRead(get().currentShop!.id);
        }
      },

      // ── Automations ───────────────────────────────────────────
      toggleAutomation: (id) => {
        set((s) => ({
          automations: s.automations.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a)),
        }));
      },

      // ── Modular Feature Toggles & Data Management ─────────────
      toggleFeatureToggle: (key: string, value?: boolean) => {
        const state = get();
        if (!state.currentShop) return;
        const currentSettings = state.currentShop.settings || {};
        const newVal = value !== undefined ? value : !(currentSettings as any)[key];
        const updatedShop = {
          ...state.currentShop,
          settings: {
            ...currentSettings,
            [key]: newVal,
          },
        };
        set((s) => ({
          currentShop: updatedShop,
          shops: s.shops.map((shop) => (shop.id === updatedShop.id ? updatedShop : shop)),
        }));
      },

      resetDemoData: () => {
        set({
          shops: demoShops,
          users: demoUsers,
          currentShop: demoBarbershop,
          saasPayments: demoSaasPayments,
          barbers: demoBarbers,
          clients: demoClients,
          services: demoServices,
          products: demoProducts,
          appointments: demoAppointments,
          transactions: demoTransactions,
          notifications: demoNotifications,
          automations: demoAutomations,
          whatsappMessages: [],
          inventoryMovements: [],
          isInitialized: true,
        });
      },

      clearAppointmentsAndTransactions: () => {
        set({
          appointments: [],
          transactions: [],
          whatsappMessages: [],
        });
      },

      clearWhatsAppMessages: () => {
        set({
          whatsappMessages: [],
        });
      },

      clearAllBusinessData: () => {
        set({
          appointments: [],
          transactions: [],
          clients: [],
          whatsappMessages: [],
          notifications: [],
          inventoryMovements: [],
        });
      },

      // ── Computed ──────────────────────────────────────────────
      getKPIs: (): DashboardKPIs => {
        const { appointments, transactions, clients, currentShop, currentUser } = get();
        const currentShopId = currentShop?.id || 'shop_demo';
        const isBarber = currentUser?.role === 'barber';
        const barberId = currentUser?.barberId;

        const shopAppts = appointments.filter((a) => a.shopId === currentShopId);
        const shopTx = transactions.filter((t) => t.shopId === currentShopId);
        const shopClients = clients.filter((c) => c.shopId === currentShopId);

        const relevantAppts = isBarber && barberId
          ? shopAppts.filter((a) => a.barberId === barberId)
          : shopAppts;

        const relevantTx = isBarber && barberId
          ? shopTx.filter((t) => t.barberId === barberId)
          : shopTx;

        const today = format(new Date(), 'yyyy-MM-dd');
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const todayAppts = relevantAppts.filter((a) => a.date === today);
        const todayCompleted = todayAppts.filter((a) => a.status === 'completed');

        const todayIncome = isBarber
          ? todayCompleted.reduce((sum, a) => sum + (a.commissionAmount || 0), 0)
          : todayCompleted.reduce((sum, a) => sum + a.price, 0);

        const todayNewClients = isBarber
          ? 0
          : shopClients.filter((c) => c.registeredAt.startsWith(today)).length;

        const weekStartStr = format(weekStart, 'yyyy-MM-dd');
        const monthStartStr = format(monthStart, 'yyyy-MM-dd');

        const weekTx = relevantTx.filter((t) => t.type === 'income' && t.date >= weekStartStr);
        const monthTx = relevantTx.filter((t) => t.date >= monthStartStr);

        const monthIncome = isBarber
          ? monthTx.reduce((s, t) => s + (t.commissionAmount || 0), 0)
          : monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);

        const monthExpenses = isBarber
          ? 0
          : monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

        const monthCommissions = isBarber
          ? monthIncome
          : monthTx
              .filter((t) => t.type === 'income' && t.commissionAmount)
              .reduce((s, t) => s + (t.commissionAmount || 0), 0);

        const weekIncome = isBarber
          ? weekTx.reduce((s, t) => s + (t.commissionAmount || 0), 0)
          : weekTx.reduce((s, t) => s + t.amount, 0);

        const myClientsCount = isBarber && barberId
          ? shopClients.filter((c) => c.preferredBarberId === barberId).length
          : shopClients.length;

        return {
          todayIncome,
          todayAppointments: todayAppts.length,
          todayNewClients,
          todayServices: todayCompleted.length,
          weekIncome,
          weekAppointments: relevantAppts.filter((a) => a.date >= weekStartStr).length,
          monthIncome,
          monthAppointments: relevantAppts.filter((a) => a.date >= monthStartStr).length,
          monthExpenses,
          monthCommissions,
          monthNetProfit: isBarber ? monthIncome : monthIncome - monthExpenses - monthCommissions,
          totalClients: myClientsCount,
          activeClients: isBarber ? myClientsCount : shopClients.filter((c) => c.tags.includes('frequent') || c.tags.includes('new')).length,
          inactiveClients: isBarber ? 0 : shopClients.filter((c) => c.tags.includes('inactive')).length,
          pendingAppointments: relevantAppts.filter(
            (a) => a.date === today && ['scheduled', 'confirmed'].includes(a.status)
          ).length,
          lowStockProducts: isBarber ? 0 : get().products.filter((p) => p.shopId === currentShopId && p.stock <= p.minStock).length,
        };
      },

      getAvailableSlots: (barberId, date, serviceDuration = 30) => {
        const { barbers, appointments, currentShop, shops } = get();
        const barber = barbers.find((b) => b.id === barberId);
        if (!barber) return [];
        const shop = currentShop || shops?.find((s) => s.id === barber.shopId) || demoBarbershop;

        const dateObj = new Date(date + 'T12:00:00');
        const dayName = getDayName(dateObj) as Barber['schedule'][0]['day'];
        
        // Find or fallback barber schedule
        const scheduleDay = barber.schedule?.find((s) => s.day === dayName) || {
          day: dayName,
          isWorking: dayName !== 'sunday' || (shop?.workingHours?.sunday?.isOpen ?? false),
          start: '09:00',
          end: '20:00',
          breakStart: '13:00',
          breakEnd: '14:00',
        };

        // Fallback shop hours
        const shopDay = shop?.workingHours?.[dayName] || { isOpen: true, open: '09:00', close: '20:00' };
        if (!shopDay.isOpen && !scheduleDay.isWorking) return [];

        const slotSize = 30;
        const slots: string[] = [];
        const startStr = scheduleDay.start || shopDay.open || '09:00';
        const endStr = scheduleDay.end || shopDay.close || '20:00';

        let current = timeToMinutes(startStr);
        const end = timeToMinutes(endStr) - serviceDuration;
        const breakStart = scheduleDay.breakStart ? timeToMinutes(scheduleDay.breakStart) : null;
        const breakEnd = scheduleDay.breakEnd ? timeToMinutes(scheduleDay.breakEnd) : null;

        const existingAppts = appointments.filter(
          (a) =>
            a.barberId === barberId &&
            a.date === date &&
            ['scheduled', 'confirmed', 'in_progress'].includes(a.status)
        );

        while (current <= end) {
          const slotEnd = current + serviceDuration;
          const slotTime = minutesToTime(current);

          const inBreak =
            breakStart !== null &&
            breakEnd !== null &&
            current < breakEnd &&
            slotEnd > breakStart;

          const hasConflict = existingAppts.some((a) => {
            const apptStart = timeToMinutes(a.startTime);
            const apptEnd = timeToMinutes(a.endTime);
            return current < apptEnd && slotEnd > apptStart;
          });

          const isToday = date === format(new Date(), 'yyyy-MM-dd');
          const nowMinutes = isToday ? new Date().getHours() * 60 + new Date().getMinutes() : 0;
          const inPast = isToday && current < (nowMinutes + 15);

          if (!inBreak && !hasConflict && !inPast) {
            slots.push(slotTime);
          }
          current += slotSize;
        }

        // If today has passed all slots, return empty for today, but next days will have full slots
        return slots;
      },

      getBarberStats: (barberId): BarberStats => {
        const { appointments, services } = get();
        const barberAppts = appointments.filter((a) => a.barberId === barberId);
        const completed = barberAppts.filter((a) => a.status === 'completed');
        const noShows = barberAppts.filter((a) => a.status === 'no_show');

        const totalIncome = completed.reduce((s, a) => s + a.price, 0);
        const totalCommission = completed.reduce((s, a) => s + a.commissionAmount, 0);

        const serviceCounts: Record<string, number> = {};
        completed.forEach((a) => {
          serviceCounts[a.serviceId] = (serviceCounts[a.serviceId] || 0) + 1;
        });

        const topServices = Object.entries(serviceCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([serviceId, count]) => ({
            serviceId,
            count,
            name: services.find((s) => s.id === serviceId)?.name || serviceId,
          }));

        return {
          totalAppointments: barberAppts.length,
          completedAppointments: completed.length,
          totalIncome,
          totalCommission,
          topServices,
          noShowRate: barberAppts.length > 0 ? noShows.length / barberAppts.length : 0,
        };
      },

      getClientAppointments: (clientId) => {
        return get().appointments.filter((a) => a.clientId === clientId);
      },

      getInactiveClients: (daysSince) => {
        const threshold = new Date();
        threshold.setDate(threshold.getDate() - daysSince);
        return get().clients.filter((c) => {
          if (!c.lastVisitAt) return true;
          return new Date(c.lastVisitAt) < threshold;
        });
      },

      getUnreadCount: () => {
        return get().notifications.filter((n) => !n.isRead).length;
      },
    }),
    {
      name: 'chairpro-store',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} })),
      partialize: (state) => ({
        mode: state.mode,
        currentUser: state.currentUser,
        currentShop: state.currentShop,
        shops: state.shops,
        users: state.users,
        isAuthenticated: state.isAuthenticated,
        barbers: state.barbers,
        clients: state.clients,
        services: state.services,
        products: state.products,
        appointments: state.appointments,
        transactions: state.transactions,
        notifications: state.notifications,
        automations: state.automations,
        inventoryMovements: state.inventoryMovements,
        activeView: state.activeView,
        isInitialized: state.isInitialized,
      }),
    }
  )
);
