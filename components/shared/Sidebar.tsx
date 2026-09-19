'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, CalendarDays, Users, Scissors,
  BarChart3, Settings, LogOut, QrCode, Zap, MessageSquare,
  DollarSign, ShoppingBag, Archive, Star, UserX, Award, ChevronLeft,
  Palette, Building2, Tv, MessageCircle
} from 'lucide-react';
import { ShopLogo } from '@/components/shared/ShopLogo';

export function Sidebar() {
  const pathname = usePathname();
  const { currentUser, currentShop, logout, sidebarOpen, toggleSidebar } = useStore();

  const isSuperAdmin = currentUser?.role === 'superadmin';
  const isBarber = currentUser?.role === 'barber';

  const settings = (currentShop?.settings || {}) as any;

  // Navigation tailored by Role: SuperAdmin ONLY gets SaaS platform management
  const navSections = isSuperAdmin
    ? [
        {
          title: 'Plataforma SaaS',
          items: [
            { href: '/superadmin', label: 'Barberías & Negocios', icon: Building2 },
          ],
        },
      ]
    : isBarber
    ? [
        {
          title: 'Mi Agenda & Turnos',
          items: [
            ...(settings.enableQueue !== false ? [{ href: '/queue', label: 'Turnero en Vivo', icon: Tv }] : []),
            { href: '/calendar', label: 'Mi Calendario', icon: CalendarDays },
            { href: '/appointments', label: 'Mis Citas', icon: Scissors },
          ],
        },
        {
          title: 'Mi Rendimiento',
          items: [
            ...(settings.enableCommissions !== false ? [{ href: '/commissions', label: 'Mis Comisiones', icon: Award }] : []),
            { href: '/clients', label: 'Mis Clientes', icon: Users },
            { href: '/barbers', label: 'Mi Perfil & Horario', icon: Star },
          ],
        },
      ].filter(section => section.items.length > 0)
    : [
        {
          title: 'Plataforma Global',
          items: [
            { href: '/superadmin', label: '👑 Panel SuperAdmin', icon: Building2 },
          ],
        },
        {
          title: 'Principal',
          items: [
            { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            ...(settings.enableQueue !== false ? [{ href: '/queue', label: 'Turnero en Vivo', icon: Tv }] : []),
            { href: '/calendar', label: 'Calendario', icon: CalendarDays },
            { href: '/appointments', label: 'Citas', icon: Scissors },
          ],
        },
        {
          title: 'Gestión',
          items: [
            { href: '/barbers', label: 'Barberos', icon: Users },
            { href: '/clients', label: 'Clientes', icon: Users },
            { href: '/services', label: 'Servicios', icon: Scissors },
          ],
        },
        {
          title: 'Negocio',
          items: [
            { href: '/products', label: 'Productos', icon: ShoppingBag },
            ...(settings.enableInventory !== false ? [{ href: '/inventory', label: 'Inventario', icon: Archive }] : []),
            { href: '/finances', label: 'Finanzas', icon: DollarSign },
            ...(settings.enableCommissions !== false ? [{ href: '/commissions', label: 'Comisiones', icon: Award }] : []),
          ],
        },
        {
          title: 'Automatización',
          items: [
            ...(settings.enableWhatsApp !== false ? [{ href: '/whatsapp', label: '📱 WhatsApp Real (Meta API)', icon: MessageCircle }] : []),
            ...(settings.enableAutomations !== false ? [{ href: '/automations', label: 'Automatizaciones', icon: Zap }] : []),
          ],
        },
        {
          title: 'Clientes',
          items: [
            ...(settings.enableLoyalty !== false ? [{ href: '/loyalty', label: 'Fidelización', icon: Star }] : []),
            ...(settings.enableNoShow !== false ? [{ href: '/noshow', label: 'No Show', icon: UserX }] : []),
            ...(settings.allowOnlineBooking !== false ? [{ href: '/qr', label: 'Códigos QR', icon: QrCode }] : []),
          ],
        },
        {
          title: 'Analytics & Identidad',
          items: [
            { href: '/stats', label: 'Estadísticas', icon: BarChart3 },
            { href: '/branding', label: 'Personalizar Marca', icon: Palette },
            { href: '/settings', label: 'Configuración', icon: Settings },
          ],
        },
      ].filter(section => section.items.length > 0);

  const primaryColor = isSuperAdmin ? '#f59e0b' : (currentShop?.theme?.primaryColor || '#7c3aed');
  const logoEmoji = isSuperAdmin ? '👑' : (currentShop?.theme?.logoUrl || '✂️');

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-40 flex flex-col bg-zinc-900 border-r border-zinc-800 transition-all duration-300 shrink-0',
          sidebarOpen ? 'w-60 translate-x-0' : 'w-16 -translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5 min-w-0">
            {isSuperAdmin ? (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base shadow-lg transition-transform hover:scale-105"
                style={{
                  backgroundColor: primaryColor,
                  boxShadow: `0 0 15px ${primaryColor}55`,
                }}
              >
                <span className="text-base">👑</span>
              </div>
            ) : (
              <ShopLogo
                logoUrl={currentShop?.theme?.logoUrl}
                shopName={currentShop?.name || 'MartiArenas Labs'}
                primaryColor={primaryColor}
                size="md"
              />
            )}
            {sidebarOpen && (
              <div className="min-w-0">
                <span className="font-display font-bold text-base text-zinc-100 truncate block">
                  {isSuperAdmin ? 'MartiArenas Labs' : (currentShop?.name || 'MartiArenas Labs')}
                </span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">
                  {isSuperAdmin ? 'SuperAdmin Global' : isBarber ? 'Vista Barbero' : 'Panel Dueño'}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={toggleSidebar}
            className={cn('btn-icon hidden lg:flex', !sidebarOpen && 'mx-auto')}
          >
            <ChevronLeft className={cn('w-4 h-4 transition-transform', !sidebarOpen && 'rotate-180')} />
          </button>
        </div>

        {/* Shop Info / Status Tag */}
        {sidebarOpen && (
          <div className="px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-950/40 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 truncate">
              <span className="dot-online w-1.5 h-1.5 shrink-0" />
              <span className="truncate">{isSuperAdmin ? 'Control Global' : (currentShop?.city || 'Colombia')}</span>
            </div>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
              style={{
                backgroundColor: `${primaryColor}20`,
                color: primaryColor,
                border: `1px solid ${primaryColor}40`,
              }}
            >
              {isSuperAdmin ? 'SuperAdmin' : (currentShop?.plan || 'pro')}
            </span>
          </div>
        )}

        {/* Barber view indicator banner */}
        {sidebarOpen && isBarber && (
          <div className="mx-3 my-2.5 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
            <div className="text-[11px] font-bold text-blue-300 flex items-center justify-center gap-1.5">
              <span>✂️</span>
              <span>Vista Barbero ({currentUser?.name?.split(' ')[0]})</span>
            </div>
            <p className="text-[10px] text-zinc-400 mt-0.5 leading-tight">Acceso protegido a tu agenda y comisiones</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-5 no-scrollbar">
          {navSections.map((section) => (
            <div key={section.title}>
              {sidebarOpen && (
                <div className="stat-label px-1 mb-1.5 text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">
                  {section.title}
                </div>
              )}
              <ul className="space-y-0.5">
                {section.items.map(({ href, label, icon: Icon }) => {
                  const isActive = pathname === href || (href !== '/dashboard' && href !== '/superadmin' && pathname.startsWith(href));
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        className={cn('nav-item', isActive && 'active', !sidebarOpen && 'justify-center px-2')}
                        title={!sidebarOpen ? label : undefined}
                      >
                        <Icon
                          className={cn('nav-item-icon', isActive && 'text-brand')}
                          style={isActive ? { color: primaryColor } : undefined}
                        />
                        {sidebarOpen && <span className="truncate">{label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Bottom User Area */}
        <div className="border-t border-zinc-800 p-3 space-y-1 bg-zinc-950/30">
          {sidebarOpen && currentUser && (
            <div className="flex items-center gap-3 px-2 py-2">
              <div
                className="avatar w-8 h-8 text-xs font-bold shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-zinc-200 truncate">{currentUser.name}</div>
                <div className="text-[10px] text-zinc-500 capitalize flex items-center gap-1">
                  {currentUser.role === 'superadmin' ? '👑 SuperAdmin' : currentUser.role === 'barber' ? '✂️ Barbero' : '💼 Dueño'}
                </div>
              </div>
              <button onClick={logout} className="btn-icon p-1.5 text-zinc-400 hover:text-red-400 shrink-0" title="Cerrar sesión">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
          {!sidebarOpen && (
            <button onClick={logout} className="nav-item justify-center px-2 w-full" title="Cerrar sesión">
              <LogOut className="nav-item-icon text-zinc-400 hover:text-red-400" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
