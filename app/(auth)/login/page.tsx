'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import {
  Scissors, Eye, EyeOff, ChevronRight, Shield, Zap, BarChart3,
  ToggleLeft, ToggleRight, Sparkles, Activity, CheckCircle2,
  Building2, Lock, ArrowRight, ExternalLink
} from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    company: 'The Black Chair (Bogotá)',
    email: 'admin@theblackchair.co',
    password: 'demo_admin_2024',
    role: 'Dueño / Administrador (Acceso Total)',
    desc: 'Control de las 18 secciones: Agenda, Clientes, Finanzas, etc.',
    badge: '💼 Dueño Completo',
    color: '#7c3aed',
  },
  {
    company: 'Plataforma SaaS',
    email: 'superadmin@chairpro.app',
    password: 'superadmin2024',
    role: 'SuperAdmin (Martín & Equipo)',
    desc: 'Gestión global de todas las barberías, sedes y MRR',
    badge: '👑 Global SaaS',
    color: '#f59e0b',
  },
  {
    company: 'The Black Chair (Bogotá)',
    email: 'carlos@theblackchair.co',
    password: 'demo_carlos_2024',
    role: 'Barbero (Carlos) [Vista Restringida]',
    desc: 'Solo su agenda personal y comisiones (sin finanzas de negocio)',
    badge: '✂️ Barbero',
    color: '#3b82f6',
  },
  {
    company: 'Fade Master Studio (Medellín)',
    email: 'admin@fademaster.co',
    password: 'demo_admin_2024',
    role: 'Dueño (Fade Master)',
    desc: 'Tema Azul Neón · Vista independiente',
    badge: '💈 Medellín',
    color: '#0ea5e9',
  },
  {
    company: 'La Clásica Barber Club (Cali)',
    email: 'admin@laclasica.co',
    password: 'demo_admin_2024',
    role: 'Dueño (La Clásica)',
    desc: 'Tema Verde Esmeralda · Vista independiente',
    badge: '👑 Cali',
    color: '#10b981',
  },
];

export default function LoginPage() {
  const [email, setEmail] = useState('admin@theblackchair.co');
  const [password, setPassword] = useState('demo_admin_2024');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false); // Default to live
  const [supabaseHealth, setSupabaseHealth] = useState<{
    checked: boolean;
    connected: boolean;
    latencyMs?: number;
  }>({ checked: false, connected: false });

  const { login, loginWithSupabase, initializeDemo } = useStore();
  const router = useRouter();

  // Test Supabase Live connection on mount
  useEffect(() => {
    fetch('/api/health/supabase')
      .then((res) => res.json())
      .then((data) => {
        setSupabaseHealth({
          checked: true,
          connected: data.connected,
          latencyMs: data.latencyMs,
        });
      })
      .catch(() => {
        setSupabaseHealth({ checked: true, connected: false });
      });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (isDemoMode) {
      // Demo mode
      initializeDemo();
      const result = await login(email, password);
      if (result.success) {
        if (email.toLowerCase().includes('superadmin')) {
          router.push('/superadmin');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError(result.error || 'Error al iniciar sesión');
        setIsLoading(false);
      }
    } else {
      // Live Supabase Auth mode
      const result = await loginWithSupabase(email, password);
      if (result.success) {
        const store = useStore.getState();
        if (store.currentUser?.role === 'superadmin') {
          router.push('/superadmin');
        } else {
          router.push('/dashboard');
        }
      } else {
        // If Supabase live fails with demo credentials, gracefully notify and offer demo mode
        if (email.includes('@theblackchair.co') || email.includes('@fademaster.co') || email.includes('@chairpro.app')) {
          setError(`${result.error}. (Tip: Si aún no has ejecutado el script en Supabase, pulsa 'Modo Demo' arriba para probar inmediatamente).`);
        } else {
          setError(result.error || 'Credenciales incorrectas en Supabase');
        }
        setIsLoading(false);
      }
    }
  };

  const quickLogin = async (account: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(account.email);
    setPassword(account.password);
    setIsLoading(true);
    setError('');

    if (isDemoMode) {
      initializeDemo();
      const result = await login(account.email, account.password);
      if (result.success) {
        if (account.email.toLowerCase().includes('superadmin')) {
          router.push('/superadmin');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError('Error al iniciar sesión en demo');
        setIsLoading(false);
      }
    } else {
      // Try live first, fallback to demo if not seeded in Supabase Auth yet
      const result = await loginWithSupabase(account.email, account.password);
      if (result.success) {
        const store = useStore.getState();
        if (store.currentUser?.role === 'superadmin') {
          router.push('/superadmin');
        } else {
          router.push('/dashboard');
        }
      } else {
        // Fallback into demo mode seamlessly for smooth sales demo
        initializeDemo();
        const demoRes = await login(account.email, account.password);
        if (demoRes.success) {
          if (account.email.toLowerCase().includes('superadmin')) {
            router.push('/superadmin');
          } else {
            router.push('/dashboard');
          }
        } else {
          setError('Error al iniciar sesión');
          setIsLoading(false);
        }
      }
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

          {/* Connection Status Pill & Mode Toggle */}
          <div className="flex items-center justify-between gap-2 mb-6 p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/80">
            <div className="flex items-center gap-2">
              {supabaseHealth.connected ? (
                <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Supabase Live ({supabaseHealth.latencyMs}ms)
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[11px] text-amber-400 font-semibold">
                  <Activity className="w-3.5 h-3.5" />
                  {supabaseHealth.checked ? 'Supabase Standby' : 'Comprobando...'}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setIsDemoMode(!isDemoMode);
                setError('');
                if (!isDemoMode) {
                  setEmail('admin@theblackchair.co');
                  setPassword('demo_admin_2024');
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                isDemoMode
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}
            >
              {isDemoMode ? <ToggleLeft className="w-4 h-4 text-amber-400" /> : <ToggleRight className="w-4 h-4 text-emerald-400" />}
              <span>{isDemoMode ? 'Modo Demo' : 'Modo Live'}</span>
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold font-display text-zinc-50 mb-1">Iniciar Sesión</h2>
            <p className="text-zinc-400 text-xs">
              {isDemoMode
                ? 'Elige un rol de prueba o ingresa credenciales locales'
                : 'Acceso seguro multi-tenant con Supabase Auth'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="form-group">
              <label className="label" htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="label" htmlFor="password">Contraseña</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
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

          {/* Quick Demo Accounts for effortless pitches */}
          <div className="mt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Accesos Rápidos Demo & Roles</span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => quickLogin(account)}
                  disabled={isLoading}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-zinc-800/90 hover:border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800/80 transition-all duration-150 group disabled:opacity-50 text-left"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm"
                      style={{ backgroundColor: account.color }}
                    >
                      {account.role[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-zinc-200 group-hover:text-white truncate">
                          {account.role}
                        </span>
                        <span
                          className="text-[9px] px-1.5 py-0.2 rounded font-semibold shrink-0"
                          style={{ backgroundColor: `${account.color}20`, color: account.color }}
                        >
                          {account.badge}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500 truncate">{account.company}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-300 transition-colors shrink-0 ml-2" />
                </button>
              ))}
            </div>

            {/* Quick link to client portal */}
            <div className="mt-3 pt-3 border-t border-zinc-800">
              <a
                href="/booking/the-black-chair"
                target="_blank"
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold transition-colors"
              >
                <span>🌐 Probar Portal Público del Cliente (The Black Chair)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <p className="text-center text-[11px] text-zinc-600 mt-6">
            © 2026 ChairPro · Plataforma Multi-Empresa SaaS
          </p>
        </div>
      </div>
    </div>
  );
}
