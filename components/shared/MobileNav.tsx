'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, CalendarDays, Users, BarChart3, Scissors } from 'lucide-react';

const MOBILE_NAV = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/calendar', label: 'Agenda', icon: CalendarDays },
  { href: '/appointments', label: 'Citas', icon: Scissors },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/stats', label: 'Stats', icon: BarChart3 },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-zinc-900/95 backdrop-blur-sm border-t border-zinc-800 safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
        {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-150',
                isActive ? 'text-violet-400' : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'drop-shadow-[0_0_6px_rgba(167,139,250,0.6)]')} />
              <span className="text-[10px] font-medium">{label}</span>
              {isActive && (
                <div className="w-1 h-1 bg-violet-400 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
