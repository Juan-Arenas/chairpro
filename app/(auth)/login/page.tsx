'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import {
  Scissors, Eye, EyeOff, ChevronRight, Shield, Zap, BarChart3,
  Sparkles, Lock, Mail, ArrowRight, ExternalLink
} from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, loginWithSupabase, initializeDemo } = useStore();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Por favor ingresa tu correo y contraseña.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 1. Try Supabase Auth first (Live mode)
      const liveRes = await loginWithSupabase(email.trim(), password);
      if (liveRes.success) {
        const store = useStore.getState();
        if (store.currentUser?.role === 'superadmin') {
          router.push('/superadmin');
        } else if (store.currentUser?.role === 'barber') {
          router.push('/calendar');
        } else {
          router.push('/dashboard');
        }
        return;
      }

      // 2. Fallback to local / demo credentials validation
      initializeDemo();
      const localRes = await login(email.trim(), password);
      if (localRes.success) {
        const store = useStore.getState();
        if (store.currentUser?.role === 'superadmin') {
          router.push('/superadmin');
        } else if (store.currentUser?.role === 'barber') {
          router.push('/calendar');
        } else {
          router.push('/dashboard');
        }
        return;
      }

      // If both fail, show clear error
      setError('Correo electrónico o contraseña incorrectos. Por favor verifica tus credenciales.');
      setIsLoading(false);
    } catch (err: any) {
      setError('Error al iniciar sesión. Intenta de nuevo.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-zinc-950">
      {/* Left panel — Luxury Branding & Pitch */}
      <div className="hidden lg:flex lg:w-1/2 flex-col bg-zinc-900 border-r border-zinc-800 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/30 via-zinc-900 to-zinc-950" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full p-12 justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-violet-800 rounded-xl flex items-center justify-center shadow-lg shadow-violet-600/30">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-zinc-100">
              Chair<span className="text-violet-400">Pro</span> <span className="text-xs font-mono font-normal text-zinc-500 uppercase tracking-wider">SaaS Multi-Tenant</span>
            </span>
          </div>

          {/* Main Hero copy */}
          <div className="my-auto py-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Plataforma White-Label para Barberías</span>
            </div>

            <h1 className="text-4xl font-extrabold font-display text-zinc-50 leading-tight mb-4">
              Cada barbería con su propia marca,<br />
              <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-amber-300 bg-clip-text text-transparent">
                gestionada en tiempo real.
              </span>
            </h1>

            <p className="text-zinc-400 text-base leading-relaxed max-w-lg mb-8">
              Centraliza agenda interactiva, comisiones de barberos, control de stock, finanzas y reservas públicas con branding 100% personalizable.
            </p>

            {/* Feature Highlights */}
            <div className="space-y-3.5">
              {[
                { icon: Zap, title: 'Alta Inmediata de Barberías', desc: 'Crea empresas y envía credenciales por WhatsApp en 1 clic.' },
                { icon: Shield, title: 'Base de Datos Aislada en Supabase', desc: 'Aislamiento estricto de clientes, citas y finanzas por sede.' },
                { icon: BarChart3, title: 'Branding en Tiempo Real', desc: 'Fondos, colores y logotipos personalizados sin recargar.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3 text-zinc-300 bg-zinc-950/40 border border-zinc-800/80 p-3 rounded-xl backdrop-blur-sm">
                  <div className="w-8 h-8 bg-violet-600/20 border border-violet-600/30 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-200">{title}</div>
                    <div className="text-[11px] text-zinc-400">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Connection Status */}
          <div className="flex items-center justify-between text-xs text-zinc-500 pt-4 border-t border-zinc-800/60">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>ChairPro SaaS Engine Live</span>
            </div>
            <span>v2.0 Producción</span>
          </div>
        </div>
      </div>

      {/* Right panel — Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md animate-fade-in my-auto">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-violet-800 rounded-xl flex items-center justify-center shadow-violet-glow">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-zinc-100">
              Chair<span className="text-violet-400">Pro</span>
            </span>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold font-display text-zinc-50 mb-1">Iniciar Sesión</h2>
            <p className="text-zinc-400 text-xs">
              Ingresa tus credenciales de acceso para entrar a tu cuenta.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="form-group">
              <label className="label" htmlFor="email">Correo electrónico</label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  className="input pl-10"
                  placeholder="tu-correo@barberia.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="form-group">
              <label className="label" htmlFor="password">Contraseña</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-xs text-red-400 animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full btn-lg mt-2 font-bold shadow-lg flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Client Booking Demo Link */}
          <div className="mt-8 pt-6 border-t border-zinc-800 text-center">
            <p className="text-xs text-zinc-500 mb-2.5">¿Eres cliente de una barbería?</p>
            <a
              href="/booking/the-black-chair"
              target="_blank"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-300 text-xs font-semibold transition-colors"
            >
              <span>🌐 Ir al portal público de reservas</span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
            </a>
          </div>

          <p className="text-center text-[11px] text-zinc-600 mt-6">
            © 2026 ChairPro · Plataforma Multi-Empresa SaaS
          </p>
        </div>
      </div>
    </div>
  );
}
