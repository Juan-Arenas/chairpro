-- ==============================================================================
-- CHAIRPRO SAAS — ESQUEMA MULTI-TENANT POSTGRESQL / SUPABASE
-- Con soporte de Row Level Security (RLS) para aislamiento estricto por tenant
-- VERSIÓN PRODUCCIÓN — Conectado a Supabase Auth
-- ==============================================================================

-- 1. Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. TABLAS PRINCIPALES (Creadas en orden de dependencia)
-- ═══════════════════════════════════════════════════════════════════════════════

-- 2.1 TABLA DE EMPRESAS / BARBERÍAS (TENANTS)
CREATE TABLE IF NOT EXISTS public.tenants (
    id TEXT PRIMARY KEY DEFAULT 'shop_' || substr(gen_random_uuid()::text, 1, 12),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    address TEXT NOT NULL DEFAULT 'Dirección por configurar',
    city VARCHAR(100) NOT NULL DEFAULT 'Bogotá',
    country VARCHAR(100) DEFAULT 'Colombia',
    phone VARCHAR(50) NOT NULL DEFAULT '+57 300 000 0000',
    whatsapp VARCHAR(50),
    email VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255),
    owner_email VARCHAR(255),
    website VARCHAR(500),
    instagram VARCHAR(255),
    timezone VARCHAR(50) DEFAULT 'America/Bogota',
    plan VARCHAR(50) DEFAULT 'pro' CHECK (plan IN ('trial', 'basic', 'pro', 'enterprise')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial')),
    mrr NUMERIC(12, 2) DEFAULT 189000.00,
    theme JSONB DEFAULT '{
        "mode": "dark",
        "primaryColor": "#7c3aed",
        "backgroundType": "gradient",
        "logoUrl": "✂️",
        "tagline": "Cortes legendarios y estilo superior",
        "backgroundOpacity": 0.15
    }'::jsonb,
    working_hours JSONB DEFAULT '{
        "monday": {"isOpen": true, "open": "09:00", "close": "19:00"},
        "tuesday": {"isOpen": true, "open": "09:00", "close": "19:00"},
        "wednesday": {"isOpen": true, "open": "09:00", "close": "19:00"},
        "thursday": {"isOpen": true, "open": "09:00", "close": "20:00"},
        "friday": {"isOpen": true, "open": "09:00", "close": "20:00"},
        "saturday": {"isOpen": true, "open": "08:00", "close": "18:00"},
        "sunday": {"isOpen": false, "open": "10:00", "close": "15:00"}
    }'::jsonb,
    settings JSONB DEFAULT '{
        "allowOnlineBooking": true,
        "bookingWindowDays": 30,
        "cancellationPolicyHours": 2,
        "rewardThreshold": 5,
        "rewardDescription": "Corte gratis en tu próxima visita",
        "currency": "COP",
        "currencySymbol": "$"
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 TABLA DE USUARIOS Y ROLES (RBAC) — Vinculada a Supabase Auth
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY DEFAULT 'user_' || substr(gen_random_uuid()::text, 1, 12),
    auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id TEXT REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('superadmin', 'admin', 'barber', 'receptionist', 'client')),
    barber_id TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- 2.3 TABLA DE BARBEROS (PROFESIONALES)
CREATE TABLE IF NOT EXISTS public.barbers (
    id TEXT PRIMARY KEY DEFAULT 'barber_' || substr(gen_random_uuid()::text, 1, 12),
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    description TEXT DEFAULT '',
    specialties TEXT[] DEFAULT ARRAY['Fade', 'Clásico'],
    commission_rate NUMERIC(5, 4) DEFAULT 0.4500,
    color VARCHAR(20) DEFAULT '#7C3AED',
    schedule JSONB DEFAULT '[]'::jsonb,
    service_ids TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.4 TABLA DE CLIENTES
CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY DEFAULT 'client_' || substr(gen_random_uuid()::text, 1, 12),
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    notes TEXT,
    preferred_barber_id TEXT REFERENCES public.barbers(id) ON DELETE SET NULL,
    preferred_service_id TEXT,
    total_visits INT DEFAULT 0,
    total_spent NUMERIC(12, 2) DEFAULT 0,
    no_show_count INT DEFAULT 0,
    loyalty JSONB DEFAULT '{"points": 0, "visits": 0}'::jsonb,
    tags TEXT[] DEFAULT ARRAY['new'],
    last_visit_at TIMESTAMPTZ,
    registered_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.5 TABLA DE SERVICIOS
CREATE TABLE IF NOT EXISTS public.services (
    id TEXT PRIMARY KEY DEFAULT 'svc_' || substr(gen_random_uuid()::text, 1, 12),
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    duration INT NOT NULL DEFAULT 30,
    price NUMERIC(10, 2) NOT NULL,
    commission_rate NUMERIC(5, 4) DEFAULT 0,
    category VARCHAR(50) DEFAULT 'corte',
    is_active BOOLEAN DEFAULT TRUE,
    popular BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.6 TABLA DE PRODUCTOS E INVENTARIO
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY DEFAULT 'prod_' || substr(gen_random_uuid()::text, 1, 12),
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    category VARCHAR(50) NOT NULL DEFAULT 'otro',
    price NUMERIC(10, 2) NOT NULL,
    cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
    stock INT NOT NULL DEFAULT 0,
    min_stock INT NOT NULL DEFAULT 3,
    is_active BOOLEAN DEFAULT TRUE,
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.7 TABLA DE CITAS (APPOINTMENTS)
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY DEFAULT 'appt_' || substr(gen_random_uuid()::text, 1, 12),
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    barber_id TEXT NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
    service_id TEXT NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    source VARCHAR(50) DEFAULT 'online' CHECK (source IN ('manual', 'qr', 'online', 'whatsapp')),
    price NUMERIC(10, 2) NOT NULL,
    commission_amount NUMERIC(10, 2) DEFAULT 0,
    is_paid BOOLEAN DEFAULT FALSE,
    payment_method VARCHAR(50),
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.8 TABLA DE TRANSACCIONES FINANCIERAS
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY DEFAULT 'tx_' || substr(gen_random_uuid()::text, 1, 12),
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    date DATE NOT NULL,
    related_appointment_id TEXT REFERENCES public.appointments(id) ON DELETE SET NULL,
    related_product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
    barber_id TEXT REFERENCES public.barbers(id) ON DELETE SET NULL,
    commission_amount NUMERIC(10, 2) DEFAULT 0,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.9 TABLA DE NOTIFICACIONES
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY DEFAULT 'notif_' || substr(gen_random_uuid()::text, 1, 12),
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.10 TABLA DE AUTOMATIZACIONES
CREATE TABLE IF NOT EXISTS public.automations (
    id TEXT PRIMARY KEY DEFAULT 'auto_' || substr(gen_random_uuid()::text, 1, 12),
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    trigger VARCHAR(100) NOT NULL,
    trigger_label VARCHAR(255),
    steps JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    run_count INT DEFAULT 0,
    last_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.11 TABLA DE MOVIMIENTOS DE INVENTARIO
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id TEXT PRIMARY KEY DEFAULT 'mov_' || substr(gen_random_uuid()::text, 1, 12),
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('in', 'out', 'sale', 'adjustment')),
    quantity INT NOT NULL,
    reason TEXT,
    related_sale_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT NOT NULL
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. FUNCIONES AUXILIARES Y TRIGGERS (Definidas tras crear las tablas)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE TRIGGER appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Función para obtener el tenant_id del usuario autenticado
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS TEXT AS $$
  SELECT tenant_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Función para obtener el rol del usuario autenticado
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Función para saber si el usuario es superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'superadmin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Función para crear usuario en public.users al registrarse en Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'tenant_id' IS NOT NULL THEN
    INSERT INTO public.users (auth_id, tenant_id, name, email, role, barber_id)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'tenant_id',
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'role', 'admin'),
      NEW.raw_user_meta_data->>'barber_id'
    )
    ON CONFLICT (email) DO UPDATE SET auth_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. ÍNDICES DE ALTO RENDIMIENTO
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_barbers_tenant_id ON public.barbers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clients_tenant_phone ON public.clients(tenant_id, phone);
CREATE INDEX IF NOT EXISTS idx_services_tenant_id ON public.services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON public.products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_date ON public.appointments(tenant_id, date);
CREATE INDEX IF NOT EXISTS idx_appointments_barber ON public.appointments(barber_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tenant ON public.transactions(tenant_id, date);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON public.notifications(tenant_id, is_read);
CREATE INDEX IF NOT EXISTS idx_automations_tenant ON public.automations(tenant_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. ROW LEVEL SECURITY (RLS) — AISLAMIENTO REAL POR TENANT
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- ─── TENANTS ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "superadmin_select_all_tenants" ON public.tenants;
CREATE POLICY "superadmin_select_all_tenants" ON public.tenants
  FOR SELECT USING (public.is_superadmin());

DROP POLICY IF EXISTS "superadmin_all_tenants" ON public.tenants;
CREATE POLICY "superadmin_all_tenants" ON public.tenants
  FOR ALL USING (public.is_superadmin());

DROP POLICY IF EXISTS "tenant_member_select_own" ON public.tenants;
CREATE POLICY "tenant_member_select_own" ON public.tenants
  FOR SELECT USING (id = public.get_user_tenant_id());

DROP POLICY IF EXISTS "admin_update_own_tenant" ON public.tenants;
CREATE POLICY "admin_update_own_tenant" ON public.tenants
  FOR UPDATE USING (
    id = public.get_user_tenant_id()
    AND public.get_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "public_read_active_tenants" ON public.tenants;
CREATE POLICY "public_read_active_tenants" ON public.tenants
  FOR SELECT USING (status = 'active');

-- ─── USERS ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "superadmin_all_users" ON public.users;
CREATE POLICY "superadmin_all_users" ON public.users
  FOR ALL USING (public.is_superadmin());

DROP POLICY IF EXISTS "user_select_own_tenant" ON public.users;
CREATE POLICY "user_select_own_tenant" ON public.users
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS "user_select_self" ON public.users;
CREATE POLICY "user_select_self" ON public.users
  FOR SELECT USING (auth_id = auth.uid());

-- ─── BARBERS ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "superadmin_all_barbers" ON public.barbers;
CREATE POLICY "superadmin_all_barbers" ON public.barbers
  FOR ALL USING (public.is_superadmin());

DROP POLICY IF EXISTS "tenant_select_barbers" ON public.barbers;
CREATE POLICY "tenant_select_barbers" ON public.barbers
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS "admin_manage_barbers" ON public.barbers;
CREATE POLICY "admin_manage_barbers" ON public.barbers
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "public_read_active_barbers" ON public.barbers;
CREATE POLICY "public_read_active_barbers" ON public.barbers
  FOR SELECT USING (is_active = true);

-- ─── CLIENTS ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "superadmin_all_clients" ON public.clients;
CREATE POLICY "superadmin_all_clients" ON public.clients
  FOR ALL USING (public.is_superadmin());

DROP POLICY IF EXISTS "tenant_select_clients" ON public.clients;
CREATE POLICY "tenant_select_clients" ON public.clients
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS "admin_manage_clients" ON public.clients;
CREATE POLICY "admin_manage_clients" ON public.clients
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_role() IN ('admin', 'receptionist')
  );

DROP POLICY IF EXISTS "public_insert_clients" ON public.clients;
CREATE POLICY "public_insert_clients" ON public.clients
  FOR INSERT WITH CHECK (true);

-- ─── SERVICES ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "superadmin_all_services" ON public.services;
CREATE POLICY "superadmin_all_services" ON public.services
  FOR ALL USING (public.is_superadmin());

DROP POLICY IF EXISTS "tenant_select_services" ON public.services;
CREATE POLICY "tenant_select_services" ON public.services
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS "admin_manage_services" ON public.services;
CREATE POLICY "admin_manage_services" ON public.services
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "public_read_active_services" ON public.services;
CREATE POLICY "public_read_active_services" ON public.services
  FOR SELECT USING (is_active = true);

-- ─── PRODUCTS ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "superadmin_all_products" ON public.products;
CREATE POLICY "superadmin_all_products" ON public.products
  FOR ALL USING (public.is_superadmin());

DROP POLICY IF EXISTS "tenant_select_products" ON public.products;
CREATE POLICY "tenant_select_products" ON public.products
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS "admin_manage_products" ON public.products;
CREATE POLICY "admin_manage_products" ON public.products
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_role() = 'admin'
  );

-- ─── APPOINTMENTS ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "superadmin_all_appointments" ON public.appointments;
CREATE POLICY "superadmin_all_appointments" ON public.appointments
  FOR ALL USING (public.is_superadmin());

DROP POLICY IF EXISTS "tenant_select_appointments" ON public.appointments;
CREATE POLICY "tenant_select_appointments" ON public.appointments
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS "admin_manage_appointments" ON public.appointments;
CREATE POLICY "admin_manage_appointments" ON public.appointments
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_role() IN ('admin', 'receptionist')
  );

DROP POLICY IF EXISTS "barber_select_own_appointments" ON public.appointments;
CREATE POLICY "barber_select_own_appointments" ON public.appointments
  FOR SELECT USING (
    tenant_id = public.get_user_tenant_id()
    AND barber_id = (SELECT barber_id FROM public.users WHERE auth_id = auth.uid())
  );

DROP POLICY IF EXISTS "barber_update_own_appointments" ON public.appointments;
CREATE POLICY "barber_update_own_appointments" ON public.appointments
  FOR UPDATE USING (
    tenant_id = public.get_user_tenant_id()
    AND barber_id = (SELECT barber_id FROM public.users WHERE auth_id = auth.uid())
  );

DROP POLICY IF EXISTS "public_insert_appointments" ON public.appointments;
CREATE POLICY "public_insert_appointments" ON public.appointments
  FOR INSERT WITH CHECK (true);

-- ─── TRANSACTIONS ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "superadmin_all_transactions" ON public.transactions;
CREATE POLICY "superadmin_all_transactions" ON public.transactions
  FOR ALL USING (public.is_superadmin());

DROP POLICY IF EXISTS "admin_manage_transactions" ON public.transactions;
CREATE POLICY "admin_manage_transactions" ON public.transactions
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "barber_select_own_transactions" ON public.transactions;
CREATE POLICY "barber_select_own_transactions" ON public.transactions
  FOR SELECT USING (
    tenant_id = public.get_user_tenant_id()
    AND barber_id = (SELECT barber_id FROM public.users WHERE auth_id = auth.uid())
  );

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "superadmin_all_notifications" ON public.notifications;
CREATE POLICY "superadmin_all_notifications" ON public.notifications
  FOR ALL USING (public.is_superadmin());

DROP POLICY IF EXISTS "tenant_manage_notifications" ON public.notifications;
CREATE POLICY "tenant_manage_notifications" ON public.notifications
  FOR ALL USING (tenant_id = public.get_user_tenant_id());

-- ─── AUTOMATIONS ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "superadmin_all_automations" ON public.automations;
CREATE POLICY "superadmin_all_automations" ON public.automations
  FOR ALL USING (public.is_superadmin());

DROP POLICY IF EXISTS "tenant_select_automations" ON public.automations;
CREATE POLICY "tenant_select_automations" ON public.automations
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS "admin_manage_automations" ON public.automations;
CREATE POLICY "admin_manage_automations" ON public.automations
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_role() = 'admin'
  );

-- ─── INVENTORY MOVEMENTS ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "superadmin_all_inventory" ON public.inventory_movements;
CREATE POLICY "superadmin_all_inventory" ON public.inventory_movements
  FOR ALL USING (public.is_superadmin());

DROP POLICY IF EXISTS "admin_manage_inventory" ON public.inventory_movements;
CREATE POLICY "admin_manage_inventory" ON public.inventory_movements
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_role() = 'admin'
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. DATOS INICIALES (SEED DATA PARA EMPEZAR A OPERAR DE INMEDIATO)
-- ═══════════════════════════════════════════════════════════════════════════════

-- 6.1 Barbería Principal
INSERT INTO public.tenants (id, name, slug, address, city, phone, email, owner_name, owner_email, theme, plan, status, mrr)
VALUES (
  'shop_the_black_chair',
  'The Black Chair',
  'the-black-chair',
  'Calle 93 #14-20, Chico',
  'Bogotá',
  '+57 310 555 0192',
  'admin@theblackchair.co',
  'Martín Dueño',
  'admin@theblackchair.co',
  '{"mode": "dark", "primaryColor": "#7c3aed", "backgroundType": "gradient", "logoUrl": "✂️", "tagline": "Cortes legendarios y estilo superior", "backgroundOpacity": 0.15}'::jsonb,
  'pro',
  'active',
  189000
) ON CONFLICT (id) DO NOTHING;

-- 6.2 Servicios Iniciales
INSERT INTO public.services (id, tenant_id, name, description, duration, price, commission_rate, category, is_active, popular)
VALUES
  ('svc_tbc_1', 'shop_the_black_chair', 'Corte Signature', 'Corte a tijera o máquina con lavado y peinado con producto premium.', 40, 38000.00, 0.45, 'corte', true, true),
  ('svc_tbc_2', 'shop_the_black_chair', 'Corte + Barba Tradicional', 'Servicio completo con toalla caliente, perfilado de barba a navaja y diseño de corte.', 60, 65000.00, 0.45, 'combo', true, true),
  ('svc_tbc_3', 'shop_the_black_chair', 'Perfilado de Barba & Spa', 'Ritual de barba con toalla caliente, aceite de argán y masaje facial express.', 30, 30000.00, 0.40, 'barba', true, false),
  ('svc_tbc_4', 'shop_the_black_chair', 'Fade Master', 'Degradado perfecto a la piel (Skin Fade / Low / Mid / High Fade) con navaja.', 45, 42000.00, 0.45, 'corte', true, true)
ON CONFLICT (id) DO NOTHING;

-- 6.3 Barberos Iniciales
INSERT INTO public.barbers (id, tenant_id, name, phone, email, description, specialties, commission_rate, color, is_active)
VALUES
  ('barber_carlos', 'shop_the_black_chair', 'Carlos Mendoza', '+57 312 456 7890', 'carlos@theblackchair.co', 'Master Barber con 8 años de experiencia, especialista en Fades.', ARRAY['Skin Fade', 'Barba Tradicional', 'Diseño de Cejas'], 0.45, '#7c3aed', true),
  ('barber_mateo', 'shop_the_black_chair', 'Mateo Restrepo', '+57 315 789 1234', 'mateo@theblackchair.co', 'Especialista en cortes clásicos a tijera y tratamientos de barba.', ARRAY['Corte Clásico', 'Tijera', 'Barba Spa'], 0.40, '#0ea5e9', true)
ON CONFLICT (id) DO NOTHING;

-- 6.4 Productos Iniciales (The Black Chair)
INSERT INTO public.products (id, tenant_id, name, description, category, price, cost, stock, min_stock, is_active, featured)
VALUES
  ('prod_tbc_1', 'shop_the_black_chair', 'Pomada Fijación Mate (100ml)', 'Acabado natural sin brillo y fijación fuerte todo el día.', 'cera', 45000.00, 22000.00, 18, 5, true, true),
  ('prod_tbc_2', 'shop_the_black_chair', 'Aceite para Barba Wood & Spice', 'Hidrata, suaviza y aromatiza la barba con aceites esenciales.', 'aceite', 52000.00, 25000.00, 12, 4, true, true),
  ('prod_tbc_3', 'shop_the_black_chair', 'Shampoo Anticaída & Refrescante', 'Fórmula con mentol y biotina para cuero cabelludo exigente.', 'shampoo', 48000.00, 24000.00, 8, 3, true, false)
ON CONFLICT (id) DO NOTHING;

-- 6.5 Barbería 2: Fade Master Studio (Medellín)
INSERT INTO public.tenants (id, name, slug, address, city, phone, email, owner_name, owner_email, theme, plan, status, mrr)
VALUES (
  'shop_fade_master',
  'Fade Master Studio',
  'fade-master',
  'Cra 35 #7-45, El Poblado',
  'Medellín',
  '+57 304 654 3210',
  'admin@fademaster.co',
  'Santiago Duque',
  'admin@fademaster.co',
  '{"mode": "dark", "primaryColor": "#0ea5e9", "backgroundType": "image", "backgroundImage": "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1920&q=80", "logoUrl": "⚡", "tagline": "Estilo vanguardista y arte urbano", "backgroundOpacity": 0.2}'::jsonb,
  'enterprise',
  'active',
  249000
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.services (id, tenant_id, name, description, duration, price, commission_rate, category, is_active, popular)
VALUES
  ('svc_fm_1', 'shop_fade_master', 'Skin Fade & Line Up', 'Degradado afeitado al cero con diseño de navaja.', 45, 45000.00, 0.50, 'corte', true, true),
  ('svc_fm_2', 'shop_fade_master', 'Fade + Barba Urbana', 'Corte completo con perfilado de barba y toalla fría con menta.', 60, 70000.00, 0.45, 'combo', true, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.barbers (id, tenant_id, name, phone, email, description, specialties, commission_rate, color, is_active)
VALUES
  ('barber_santi', 'shop_fade_master', 'Santiago Master', '+57 304 654 3210', 'santiago@fademaster.co', 'Especialista en degradados y tinturas urbanas.', ARRAY['Skin Fade', 'Colorimetría', 'Diseño'], 0.50, '#0ea5e9', true)
ON CONFLICT (id) DO NOTHING;

-- 6.6 Barbería 3: La Clásica Barber Club (Cali)
INSERT INTO public.tenants (id, name, slug, address, city, phone, email, owner_name, owner_email, theme, plan, status, mrr)
VALUES (
  'shop_la_clasica',
  'La Clásica Barber Club',
  'la-clasica',
  'Av. 6N #22-08, Granada',
  'Cali',
  '+57 318 987 6543',
  'admin@laclasica.co',
  'Alejandro Morales',
  'admin@laclasica.co',
  '{"mode": "dark", "primaryColor": "#10b981", "backgroundType": "gradient", "logoUrl": "👑", "tagline": "Tradición, elegancia y distinción", "backgroundOpacity": 0.15}'::jsonb,
  'basic',
  'active',
  129000
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.services (id, tenant_id, name, description, duration, price, commission_rate, category, is_active, popular)
VALUES
  ('svc_lc_1', 'shop_la_clasica', 'Corte Clásico Caballero', 'Corte a tijera con peinado pompadour o slick back.', 40, 35000.00, 0.40, 'corte', true, true),
  ('svc_lc_2', 'shop_la_clasica', 'Afeitado Clásico a Navaja', 'Afeitado tradicional con espuma caliente y bálsamo calmante.', 35, 32000.00, 0.40, 'barba', true, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.barbers (id, tenant_id, name, phone, email, description, specialties, commission_rate, color, is_active)
VALUES
  ('barber_alejo', 'shop_la_clasica', 'Alejandro Morales', '+57 318 987 6543', 'admin@laclasica.co', 'Barbero clásico de tercera generación.', ARRAY['Tijera', 'Navaja Clásica', 'Barba'], 0.40, '#10b981', true)
ON CONFLICT (id) DO NOTHING;

-- 6.7 Usuario SuperAdmin Inicial
INSERT INTO public.users (id, tenant_id, name, email, role, is_active)
VALUES (
  'user_superadmin_master',
  'shop_the_black_chair',
  'SuperAdmin ChairPro',
  'superadmin@chairpro.app',
  'superadmin',
  true
) ON CONFLICT (email) DO UPDATE SET role = 'superadmin';

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. SUPABASE REALTIME REPLICATION (Habilitar cambios en vivo para WebSocket)
-- ═══════════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'tenants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tenants;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'appointments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'barbers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.barbers;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'services'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

