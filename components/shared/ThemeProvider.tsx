'use client';

import React, { useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useSupabaseRealtime } from '@/lib/supabase/realtime';

// Helper to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return { r, g, b };
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return { r, g, b };
  }
  return null;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { currentShop, shops } = useStore();
  const targetShop = currentShop || shops[0];
  const theme = targetShop?.theme;

  // Activar escucha de cambios en tiempo real desde Supabase
  useSupabaseRealtime(targetShop?.id);

  useEffect(() => {
    if (!theme) return;

    const root = document.documentElement;
    const primaryColor = theme.primaryColor || '#7c3aed';
    const rgb = hexToRgb(primaryColor) || { r: 124, g: 58, b: 237 };

    // Set CSS variables for primary brand
    root.style.setProperty('--brand-primary', primaryColor);
    root.style.setProperty('--brand-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    root.style.setProperty(
      '--brand-glow',
      `0 0 20px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`
    );
    root.style.setProperty(
      '--brand-glow-sm',
      `0 0 10px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`
    );

    // Light vs Dark Mode class
    if (theme.mode === 'light') {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
    } else {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
    }
  }, [theme]);

  const bgImage = theme?.backgroundImage;
  const bgType = theme?.backgroundType || (bgImage ? 'image' : 'gradient');
  const bgOpacity = theme?.backgroundOpacity ?? 0.35;
  const isLight = theme?.mode === 'light';

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 overflow-x-hidden">
      {/* Background wallpaper layer if configured */}
      {bgImage && (bgType === 'image' || bgType === 'solid' || bgType === 'gradient') && (
        <div
          className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-700 ease-in-out"
          style={{
            backgroundImage: `url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            opacity: bgOpacity,
            filter: 'contrast(105%) brightness(95%)',
          }}
        />
      )}

      {/* Ambient gradient glow layer */}
      <div
        className="fixed inset-0 pointer-events-none z-0 transition-all duration-700"
        style={{
          background: isLight
            ? `radial-gradient(ellipse at 20% 20%, rgba(var(--brand-primary-rgb, 124, 58, 237), 0.08) 0%, transparent 60%),
               radial-gradient(ellipse at 80% 80%, rgba(var(--brand-primary-rgb, 124, 58, 237), 0.05) 0%, transparent 60%)`
            : `radial-gradient(ellipse at 15% 25%, rgba(var(--brand-primary-rgb, 124, 58, 237), 0.18) 0%, transparent 60%),
               radial-gradient(ellipse at 85% 75%, rgba(var(--brand-primary-rgb, 124, 58, 237), 0.12) 0%, transparent 65%)`,
        }}
      />

      {/* Dark overlay backdrop for crystal clear text readability */}
      {bgImage && (
        <div className="fixed inset-0 pointer-events-none z-0 bg-zinc-950/50 backdrop-blur-[1px]" />
      )}

      {/* Children content container */}
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </div>
  );
}
