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
    logout,
  } = useStore();

  const [showNotifs, setShowNotifs] = useState(false);
  const notifsRef = useRef<HTMLDivElement>(null);

  const unreadCount = getUnreadCount();
  const pageTitle = PAGE_TITLES[pathname] || 'ChairPro';
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const isBarber = currentUser?.role === 'barber';

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifsRef.current && !notifsRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
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

  const primaryColor = isSuperAdmin ? '#f59e0b' : (currentShop?.theme?.primaryColor || '#7c3aed');

  return (
    <header className="h-16 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 flex items-center px-4 gap-3 shrink-0 z-30">
      {/* Menu toggle for mobile */}
      <button onClick={toggleSidebar} className="btn-icon lg:hidden">
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title & greeting */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-sm md:text-base font-bold text-zinc-100 truncate">
            {isSuperAdmin ? 'Panel SaaS Global (Martín & Equipo)' : pageTitle}
          </h1>
          {isBarber && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20">
              ✂️ Barbero
            </span>
          )}
          {isSuperAdmin && (
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              👑 SuperAdmin
            </span>
          )}
        </div>
        {pathname === '/dashboard' && currentUser && !isSuperAdmin && (
          <p className="text-xs text-zinc-500">
            {getHour()}, <span className="text-zinc-300 font-medium">{currentUser.name}</span>
          </p>
        )}
      </div>

      {/* Center/Right Actions */}
      <div className="flex items-center gap-2.5">
        {/* Shop Badge (Only for Shop Owners / Employees) */}
        {!isSuperAdmin ? (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 text-xs font-medium text-zinc-200">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: primaryColor }}
            />
            <span className="max-w-[130px] md:max-w-[180px] truncate font-semibold">
              {currentShop?.name || 'Mi Barbería'}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs font-bold text-amber-300">
            <Building2 className="w-3.5 h-3.5" />
            <span>Control Multi-Tenant</span>
          </div>
        )}

        {/* Live Client Booking Portal Link (Only for Shop Owners / Admins) */}
        {!isSuperAdmin && (
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
        )}

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

