'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { Sidebar } from '@/components/shared/Sidebar';
import { TopBar } from '@/components/shared/TopBar';
import { MobileNav } from '@/components/shared/MobileNav';
import { ThemeProvider } from '@/components/shared/ThemeProvider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, mode, initializeDemo, initializeLive, isInitialized } = useStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // If not initialized, initialize demo mode
    if (!isInitialized) {
      initializeDemo();
    }

    // Background check for live Supabase session if in live mode
    if (mode === 'live') {
      try {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user && !isAuthenticated) {
            initializeLive(user.id);
          }
        }).catch((err) => {
          console.warn('Supabase auth background check:', err);
        });
      } catch (err) {
        console.warn('Supabase client error:', err);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fast check: If mounted and definitively not authenticated (and initialized), redirect to login
  useEffect(() => {
    if (mounted && isInitialized && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isInitialized, isAuthenticated, router]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-xs text-zinc-600">Iniciando ChairPro...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Redirecting via useEffect
  }

  return (
    <ThemeProvider>
      <div className="flex h-screen overflow-hidden bg-zinc-950">
        {/* Sidebar */}
        <Sidebar />

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6">
            <div className="animate-fade-in max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile nav */}
        <MobileNav />

        {/* Mode indicator */}
        {mode === 'demo' && (
          <div className="fixed bottom-4 right-4 z-50 lg:bottom-6 lg:right-6 pointer-events-none">
            <div className="bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md shadow-lg">
              🎭 MODO DEMO
            </div>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}
