'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { LayoutDashboard, CalendarDays, Users, BarChart3, Scissors, Building2, Award } from 'lucide-react';

export function MobileNav() {
  const pathname = usePathname();
  const { currentUser, currentShop } = useStore();

  const isSuperAdmin = currentUser?.role === 'superadmin';
  const isBarber = currentUser?.role === 'barber';

  const navItems = isSuperAdmin
    ? [
        { href: '/superadmin', label: 'Barberías & Negocios', icon: Building2 },
      ]
    : isBarber
    ? [
        { href: '/calendar', label: 'Mi Agenda', icon: CalendarDays },
        { href: '/appointments', label: 'Mis Citas', icon: Scissors },
        { href: '/commissions', label: 'Comisiones', icon: Award },
        { href: '/clients', label: 'Clientes', icon: Users },
      ]
    : [
        { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
        { href: '/calendar', label: 'Agenda', icon: CalendarDays },
        { href: '/appointments', label: 'Citas', icon: Scissors },
        { href: '/clients', label: 'Clientes', icon: Users },
        { href: '/stats', label: 'Stats', icon: BarChart3 },
      ];

  const primaryColor = isSuperAdmin ? '#f59e0b' : (currentShop?.theme?.primaryColor || '#7c3aed');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-zinc-900/95 backdrop-blur-sm border-t border-zinc-800 safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && href !== '/superadmin' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-150',
                isActive ? 'text-zinc-100 font-semibold' : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <Icon
                className="w-5 h-5"
                style={isActive ? { color: primaryColor } : undefined}
              />
              <span className="text-[10px] font-medium truncate">{label}</span>
              {isActive && (
                <div
                  className="w-1 h-1 rounded-full"
                  style={{ backgroundColor: primaryColor }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

