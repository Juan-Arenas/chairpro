import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { formatRelativeTime } from '@/lib/utils';
import { Bell, Menu, Search, X, Check, CheckCheck, ExternalLink, ChevronDown, Building2, UserCircle2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const PAGE_TITLES: Record<string, string> = {
  '/superadmin': 'Panel SaaS Global (Martín & Equipo)',
  '/branding': 'Personalización de Marca & Tema',
  '/dashboard': 'Dashboard',
  '/calendar': 'Calendario de Turnos',
  '/appointments': 'Gestión de Citas',
  '/barbers': 'Equipo de Barberos',
  '/clients': 'Directorio de Clientes',
  '/services': 'Catálogo de Servicios',
  '/products': 'Productos & Tienda',
  '/inventory': 'Control de Inventario',
  '/finances': 'Finanzas del Negocio',
  '/commissions': 'Liquidación de Comisiones',
  '/loyalty': 'Club de Fidelización',
  '/noshow': 'Control y Prevención No-Show',
  '/stats': 'Estadísticas & KPIs',
  '/qr': 'Generador de Códigos QR',
  '/automations': 'Flujos y Automatizaciones',
  '/assistant': 'Asistente de IA',
  '/settings': 'Configuración de la Barbería',
};

const NOTIF_TYPE_ICONS: Record<string, string> = {
  new_appointment: '📅',
  appointment_reminder: '⏰',
  appointment_cancelled: '❌',
  no_show: '⚠️',
  low_stock: '📦',
  inactive_client: '👤',
  commission_ready: '💰',
  system: '🔔',
};

export function TopBar() {
  const pathname = usePathname();
  const {
    toggleSidebar,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    getUnreadCount,
    currentUser,
    currentShop,
    shops,
    switchShop,
    switchRole,
  } = useStore();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showShopDropdown, setShowShopDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const notifsRef = useRef<HTMLDivElement>(null);
  const shopRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  const unreadCount = getUnreadCount();
  const pageTitle = PAGE_TITLES[pathname] || 'ChairPro';

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifsRef.current && !notifsRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
      if (shopRef.current && !shopRef.current.contains(e.target as Node)) {
        setShowShopDropdown(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setShowRoleDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getHour = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const primaryColor = currentShop?.theme?.primaryColor || '#7c3aed';

  return (
    <header className="h-16 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 flex items-center px-4 gap-3 shrink-0 z-30">
      {/* Menu toggle for mobile */}
      <button onClick={toggleSidebar} className="btn-icon lg:hidden">
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title & greeting */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-sm md:text-base font-bold text-zinc-100 truncate">{pageTitle}</h1>
          {currentUser?.role === 'barber' && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20">
              Vista Barbero Protegida
            </span>
          )}
          {currentUser?.role === 'superadmin' && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
              👑 Modo SuperAdmin
            </span>
          )}
        </div>
        {pathname === '/dashboard' && currentUser && (
          <p className="text-xs text-zinc-500">
            {getHour()}, <span className="text-zinc-300 font-medium">{currentUser.name}</span>
          </p>
        )}
      </div>

      {/* Center/Right Actions: Tenant Selector, Role Switcher, Client Portal, Notifications */}
      <div className="flex items-center gap-2">
        {/* Company/Shop Switcher - Restricted: Only SuperAdmin can view and switch between all shops */}
        {currentUser?.role === 'superadmin' ? (
          <div className="relative" ref={shopRef}>
            <button
              onClick={() => setShowShopDropdown(!showShopDropdown)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-amber-500/30 hover:border-amber-500/60 bg-amber-500/10 text-xs font-medium text-amber-200 transition-all"
              title="Panel SuperAdmin: Cambiar barbería activa"
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: primaryColor }}
              />
              <span className="max-w-[110px] md:max-w-[150px] truncate font-semibold">
                {currentShop?.name || 'Seleccionar Empresa'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            </button>

            {showShopDropdown && (
              <div className="absolute right-0 top-full mt-2 w-64 card p-1.5 shadow-modal z-50 animate-scale-in">
                <div className="px-3 py-2 text-[11px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 flex items-center justify-between">
                  <span>Todas las Barberías</span>
                  <span className="badge-violet text-[10px]">{shops.length} activas</span>
                </div>
                <div className="py-1 max-h-60 overflow-y-auto space-y-0.5">
                  {shops.map((shop) => (
                    <button
                      key={shop.id}
                      onClick={() => {
                        switchShop(shop.id);
                        setShowShopDropdown(false);
                      }}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-colors',
                        currentShop?.id === shop.id
                          ? 'bg-violet-600/15 text-zinc-100 font-semibold'
                          : 'hover:bg-zinc-800 text-zinc-300'
                      )}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: shop.theme?.primaryColor || '#7c3aed' }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="truncate font-medium">{shop.name}</div>
                        <div className="text-[10px] text-zinc-500 truncate">{shop.city}</div>
                      </div>
                      {currentShop?.id === shop.id && (
                        <Check className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="pt-1.5 mt-1 border-t border-zinc-800">
                  <Link
                    href="/superadmin"
                    onClick={() => setShowShopDropdown(false)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-violet-400 hover:text-violet-300 font-medium hover:bg-violet-600/10 rounded-md transition-colors"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    Gestionar todas las empresas
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Non-superadmin view (Shop owner / Barber): strictly lock to their own shop, no dropdown */
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 text-xs font-medium text-zinc-200">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: primaryColor }}
            />
            <span className="max-w-[130px] md:max-w-[180px] truncate font-semibold">
              {currentShop?.name || 'Mi Barbería'}
            </span>
          </div>
        )}


        {/* Role Fast Switcher (for testing and demoing) */}
        <div className="relative" ref={roleRef}>
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-800/40 text-xs font-medium text-zinc-300 transition-all"
            title="Cambiar rol para probar permisos"
          >
            <UserCircle2 className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline capitalize font-semibold">
              {currentUser?.role === 'superadmin'
                ? 'SuperAdmin'
                : currentUser?.role === 'barber'
                ? 'Barbero'
                : 'Dueño'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 top-full mt-2 w-56 card p-1.5 shadow-modal z-50 animate-scale-in">
              <div className="px-3 py-2 text-[11px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
                Probar como:
              </div>
              <div className="py-1 space-y-0.5">
                <button
                  onClick={() => {
                    switchRole('superadmin');
                    setShowRoleDropdown(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs transition-colors',
                    currentUser?.role === 'superadmin' ? 'bg-amber-500/15 text-amber-300 font-semibold' : 'hover:bg-zinc-800 text-zinc-300'
                  )}
                >
                  <span className="text-sm">👑</span>
                  <div>
                    <div>SuperAdmin (Martín)</div>
                    <div className="text-[10px] text-zinc-500">Métricas SaaS globales</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    switchRole('admin');
                    setShowRoleDropdown(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs transition-colors',
                    currentUser?.role === 'admin' ? 'bg-violet-500/15 text-violet-300 font-semibold' : 'hover:bg-zinc-800 text-zinc-300'
                  )}
                >
                  <span className="text-sm">💼</span>
                  <div>
                    <div>Dueño / Administrador</div>
                    <div className="text-[10px] text-zinc-500">Finanzas, branding y control</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    switchRole('barber');
                    setShowRoleDropdown(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs transition-colors',
                    currentUser?.role === 'barber' ? 'bg-blue-500/15 text-blue-300 font-semibold' : 'hover:bg-zinc-800 text-zinc-300'
                  )}
                >
                  <span className="text-sm">✂️</span>
                  <div>
                    <div>Barbero / Empleado</div>
                    <div className="text-[10px] text-zinc-500">Solo su agenda y comisiones</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live Client Booking Portal Link */}
        <Link
          href={`/booking/${currentShop?.slug || 'the-black-chair'}`}
          target="_blank"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all shadow-sm hover:scale-[1.02]"
          style={{
            backgroundColor: primaryColor,
            boxShadow: `0 0 12px ${primaryColor}40`,
          }}
          title="Ver cómo lo ve el cliente"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Ver Portal Cliente</span>
        </Link>

        {/* Notifications */}
        <div className="relative" ref={notifsRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="btn-icon relative"
            id="notifications-btn"
            aria-label="Notificaciones"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: primaryColor }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Panel */}
          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-80 card shadow-modal z-50 animate-scale-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-zinc-100">Notificaciones</span>
                  {unreadCount > 0 && (
                    <span className="badge-violet text-xs">{unreadCount} nuevas</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="btn-ghost btn-sm flex items-center gap-1 text-xs"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Marcar todas
                    </button>
                  )}
                  <button onClick={() => setShowNotifs(false)} className="btn-icon p-1.5">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="empty-state py-8">
                    <Bell className="empty-state-icon w-8 h-8" />
                    <p className="empty-state-text">Sin notificaciones</p>
                  </div>
                ) : (
                  notifications.slice(0, 15).map((notif) => (
                    <div
                      key={notif.id}
                      className={cn(
                        'px-4 py-3 border-b border-zinc-800/50 cursor-pointer hover:bg-zinc-800/40 transition-colors',
                        !notif.isRead && 'border-l-2'
                      )}
                      style={!notif.isRead ? { borderLeftColor: primaryColor } : undefined}
                      onClick={() => markNotificationRead(notif.id)}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-base mt-0.5">{NOTIF_TYPE_ICONS[notif.type] || '🔔'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn('text-xs font-semibold truncate', notif.isRead ? 'text-zinc-400' : 'text-zinc-200')}>
                              {notif.title}
                            </p>
                            {!notif.isRead && (
                              <div
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: primaryColor }}
                              />
                            )}
                          </div>
                          <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{notif.message}</p>
                          <p className="text-xs text-zinc-700 mt-1">{formatRelativeTime(notif.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

