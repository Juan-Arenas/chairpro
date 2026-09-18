'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';

export default function HomePage() {
  const { isAuthenticated, currentUser, isInitialized, initializeDemo } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) {
      initializeDemo();
    }
    if (isAuthenticated) {
      if (currentUser?.role === 'superadmin') {
        router.replace('/superadmin');
      } else {
        router.replace('/dashboard');
      }
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated, currentUser, isInitialized, router, initializeDemo]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <p className="text-xs text-zinc-600">Cargando MartiArenas Labs...</p>
      </div>
    </div>
  );
}
