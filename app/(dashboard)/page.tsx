'use client';

import { useStore } from '@/lib/store';
import { formatCurrency, formatTime, STATUS_COLORS, STATUS_LABELS, getInitials, formatRelativeTime } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import {
  TrendingUp, Calendar, Users, Scissors, Package, ArrowRight,
  Clock, CheckCircle2, AlertTriangle, Zap, ChevronRight, BarChart2,
  DollarSign, Award, Activity,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

function KPICard({ label, value, icon: Icon, change, changePositive, sub, color = 'violet' }: {
  label: string; value: string; icon: React.ElementType;
  change?: string; changePositive?: boolean; sub?: string;
  color?: 'violet' | 'emerald' | 'blue' | 'amber';
}) {
  const colorMap = {
    violet: 'text-violet-400 bg-violet-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    blue: 'text-blue-400 bg-blue-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
  };
  return (
    <div className="kpi-card card-hover animate-slide-up">
      <div className="flex items-center justify-between">
        <span className="stat-label">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div>
        <div className="stat-value">{value}</div>
        {sub && <div className="text-xs text-zinc-600 mt-0.5">{sub}</div>}
      </div>
      {change && (
        <div className={changePositive ? 'stat-change-up' : 'stat-change-down'}>
          <TrendingUp className="w-3 h-3" />
          {change}
        </div>
      )}
    </div>
  );
}

const WEEKDAY_INCOME = [
  { day: 'Lun', income: 182000 },
  { day: 'Mar', income: 245000 },
  { day: 'Mié', income: 198000 },
  { day: 'Jue', income: 321000 },
  { day: 'Vie', income: 287000 },
  { day: 'Sáb', income: 405000 },
  { day: 'Dom', income: 95000 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="card px-3 py-2 text-xs">
        <p className="text-zinc-400 mb-1">{label}</p>
        <p className="text-violet-400 font-semibold">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const router = useRouter();
  const {
    getKPIs,
    appointments,
    barbers,
    clients,
    services,
    notifications,
    automations,
    currentUser,
    currentShop,
  } = useStore();

  useEffect(() => {
    if (currentUser?.role === 'superadmin') {
      router.replace('/superadmin');
    }
  }, [currentUser, router]);

  const isBarber = currentUser?.role === 'barber';
  const myBarberId = currentUser?.barberId;
  const currentShopId = currentShop?.id || 'shop_demo';

  const kpis = getKPIs();
  const today = format(new Date(), 'yyyy-MM-dd');

  // Filter appointments strictly by current shop and barber if role is barber
  const shopAppts = appointments.filter(
    (a) => a.shopId === currentShopId && (isBarber && myBarberId ? a.barberId === myBarberId : true)
  );

  const todayAppts = shopAppts
    .filter((a) => a.date === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const upcomingAppts = todayAppts.filter((a) => ['scheduled', 'confirmed', 'in_progress'].includes(a.status));
  const recentNotifs = notifications.slice(0, 5);
  const activeAutomations = automations.filter((a) => a.isActive);

  const todayStr = format(new Date(), "EEEE d 'de' MMMM", { locale: es });
  const capitalizedToday = todayStr.charAt(0).toUpperCase() + todayStr.slice(1);

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Role Notice Banner if Barber */}
      {isBarber && (
        <div className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>✂️</span>
            <span>Estás viendo tu <strong>panel privado de barbero ({currentUser?.name})</strong>. Solo tienes acceso a tu agenda, citas y comisiones personales.</span>
          </div>
          <Link href="/commissions" className="font-bold underline hover:text-white">Ver mis comisiones ↗</Link>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-zinc-600 font-medium uppercase tracking-widest mb-1">{capitalizedToday}</div>
          <h2 className="text-xl font-bold font-display text-zinc-100">
            {isBarber ? `Tu agenda de hoy, ${currentUser?.name.split(' ')[0]}` : `Resumen operativo — ${currentShop?.name || 'MartiArenas Labs'}`}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/appointments" className="btn-primary btn-sm">
            <Scissors className="w-3.5 h-3.5" />
            Nueva cita
          </Link>
          <Link href="/calendar" className="btn-secondary btn-sm">
            <Calendar className="w-3.5 h-3.5" />
            {isBarber ? 'Mi agenda' : 'Calendario'}
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label={isBarber ? 'Tu comisión hoy' : 'Ingresos hoy'}
          value={formatCurrency(kpis.todayIncome)}
          icon={DollarSign}
          change={isBarber ? 'Ganancia directa' : '+12% vs ayer'}
          changePositive
          color="violet"
        />
        <KPICard
          label={isBarber ? 'Tus citas hoy' : 'Citas hoy'}
          value={String(kpis.todayAppointments)}
          icon={Calendar}
          sub={`${kpis.pendingAppointments} pendientes`}
          color="blue"
        />
        <KPICard
          label={isBarber ? 'Cortes completados' : 'Clientes activos'}
          value={String(isBarber ? kpis.todayServices : kpis.activeClients)}
          icon={Users}
          sub={isBarber ? 'Hoy' : `${kpis.todayNewClients} nuevos hoy`}
          color="emerald"
        />
        <KPICard
          label={isBarber ? 'Tus comisiones mes' : 'Margen neto mes'}
          value={formatCurrency(isBarber ? kpis.monthCommissions : kpis.monthNetProfit)}
          icon={Award}
          sub={isBarber ? 'Acumulado' : 'Ingresos - Gastos - Comisiones'}
          color="amber"
        />
      </div>

      {/* Month summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="stat-label">Ingresos del mes</div>
            <div className="text-lg font-bold font-display text-zinc-100">{formatCurrency(kpis.monthIncome)}</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <div className="stat-label">Gastos del mes</div>
            <div className="text-lg font-bold font-display text-zinc-100">{formatCurrency(kpis.monthExpenses)}</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-violet-500/10 rounded-lg flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <div className="stat-label">Resultado neto</div>
            <div className="text-lg font-bold font-display text-emerald-400">{formatCurrency(kpis.monthNetProfit)}</div>
          </div>
        </div>
      </div>

      {/* Charts + Agenda */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income chart */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="section-title">Ingresos esta semana</div>
              <div className="section-desc">{formatCurrency(kpis.weekIncome)} en 7 días</div>
            </div>
            <div className="badge-violet">
              <BarChart2 className="w-3 h-3" />
              Semana actual
            </div>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={WEEKDAY_INCOME}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="day" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="income" stroke="#8b5cf6" strokeWidth={2} fill="url(#incomeGradient)" dot={{ fill: '#8b5cf6', r: 3 }} activeDot={{ r: 5, fill: '#a78bfa' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's agenda */}
        <div className="card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="section-title">Agenda de hoy</div>
            <Link href="/calendar" className="btn-ghost btn-sm">
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
            {todayAppts.length === 0 ? (
              <div className="empty-state py-6">
                <Calendar className="empty-state-icon w-8 h-8" />
                <p className="empty-state-text">Sin citas hoy</p>
              </div>
            ) : (
              todayAppts.slice(0, 6).map((appt) => {
                const barber = barbers.find((b) => b.id === appt.barberId);
                const client = clients.find((c) => c.id === appt.clientId);
                const service = useStore.getState().services.find((s) => s.id === appt.serviceId);
                return (
                  <div key={appt.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/40 transition-colors group">
                    <div className="text-center shrink-0">
                      <div className="text-xs font-bold text-zinc-300">{formatTime(appt.startTime)}</div>
                    </div>
                    <div className="w-0.5 h-8 rounded-full shrink-0" style={{ backgroundColor: barber?.color || '#7c3aed' }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-zinc-300 truncate">{client?.name || 'Cliente'}</div>
                      <div className="text-xs text-zinc-600 truncate">{service?.name} · {barber?.name.split(' ')[0]}</div>
                    </div>
                    <span className={`badge text-[10px] ${STATUS_COLORS[appt.status]}`}>
                      {STATUS_LABELS[appt.status]}
                    </span>
                  </div>
                );
              })
            )}
          </div>
          {todayAppts.length > 6 && (
            <Link href="/calendar" className="btn-ghost btn-sm mt-3 w-full justify-center text-xs">
              Ver {todayAppts.length - 6} más
            </Link>
          )}
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Barber summary */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="section-title">Barberos</div>
            <Link href="/barbers" className="btn-ghost btn-sm">Ver todos <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
          <div className="space-y-3">
            {barbers.filter((b) => b.isActive).map((barber) => {
              const stats = useStore.getState().getBarberStats(barber.id);
              const todayBarberAppts = todayAppts.filter((a) => a.barberId === barber.id);
              return (
                <div key={barber.id} className="flex items-center gap-3">
                  <div className="avatar w-8 h-8 text-xs shrink-0" style={{ background: `linear-gradient(135deg, ${barber.color}cc, ${barber.color})` }}>
                    {getInitials(barber.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-zinc-300 truncate">{barber.name.split(' ')[0]}</div>
                    <div className="text-xs text-zinc-600">{todayBarberAppts.length} citas hoy</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold text-zinc-300">{formatCurrency(stats.totalIncome)}</div>
                    <div className="text-xs text-zinc-600">este mes</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notifications */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="section-title">Actividad reciente</div>
            <span className="badge-violet text-xs">{notifications.filter(n => !n.isRead).length} nuevas</span>
          </div>
          <div className="space-y-3">
            {recentNotifs.map((notif) => (
              <div key={notif.id} className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${!notif.isRead ? 'bg-violet-600/5' : ''}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${!notif.isRead ? 'bg-violet-500/10' : 'bg-zinc-800'}`}>
                  {notif.type === 'new_appointment' && <Calendar className="w-3.5 h-3.5 text-violet-400" />}
                  {notif.type === 'low_stock' && <Package className="w-3.5 h-3.5 text-amber-400" />}
                  {notif.type === 'no_show' && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                  {!['new_appointment', 'low_stock', 'no_show'].includes(notif.type) && <Activity className="w-3.5 h-3.5 text-zinc-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-zinc-300 truncate">{notif.title}</p>
                  <p className="text-xs text-zinc-600 mt-0.5 line-clamp-2">{notif.message}</p>
                  <p className="text-xs text-zinc-700 mt-1">{formatRelativeTime(notif.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Automations */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="section-title">Automatizaciones</div>
            <Link href="/automations" className="btn-ghost btn-sm">Ver <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
          <div className="space-y-2">
            {automations.slice(0, 5).map((auto) => (
              <div key={auto.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/40 transition-colors">
                <div className={`w-2 h-2 rounded-full shrink-0 ${auto.isActive ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-zinc-300 truncate">{auto.name}</div>
                  <div className="text-xs text-zinc-600">{auto.runCount} ejecuciones</div>
                </div>
                <div className={`badge text-[10px] ${auto.isActive ? 'badge-emerald' : 'badge-zinc'}`}>
                  {auto.isActive ? 'Activa' : 'Inactiva'}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
            <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs text-zinc-400">{activeAutomations.length} automatizaciones activas ejecutándose en segundo plano</span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {kpis.lowStockProducts > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl animate-slide-up">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-amber-300">Productos con stock bajo</div>
            <div className="text-xs text-zinc-400">{kpis.lowStockProducts} productos requieren reposición</div>
          </div>
          <Link href="/inventory" className="btn-sm bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors rounded-lg px-3 py-1.5 text-xs font-medium">
            Ver inventario
          </Link>
        </div>
      )}
    </div>
  );
}
