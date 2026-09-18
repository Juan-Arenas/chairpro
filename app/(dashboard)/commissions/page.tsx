'use client';
import { useStore } from '@/lib/store';
import { formatCurrency, getInitials } from '@/lib/utils';
import { format, startOfMonth } from 'date-fns';
import { Award, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];

export default function CommissionsPage() {
  const { barbers, transactions, services, currentUser, currentShop } = useStore();
  const currentShopId = currentShop?.id || 'shop_demo';
  const isBarber = currentUser?.role === 'barber';
  const myBarberId = currentUser?.barberId;

  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const monthTx = transactions.filter(
    t => t.date >= monthStart && t.type === 'income' && t.shopId === currentShopId
  );

  // If barber, only show that specific barber's data
  const visibleBarbers = isBarber && myBarberId
    ? barbers.filter(b => b.id === myBarberId)
    : barbers.filter(b => b.shopId === currentShopId && b.isActive);

  const barberCommissions = visibleBarbers.map(barber => {
    const barberTx = monthTx.filter(t => t.barberId === barber.id);
    const totalIncome = barberTx.reduce((s, t) => s + t.amount, 0);
    const totalCommission = barberTx.reduce((s, t) => s + (t.commissionAmount || 0), 0);
    return { barber, totalIncome, totalCommission, txCount: barberTx.length };
  }).sort((a, b) => b.totalIncome - a.totalIncome);

  const pieData = barberCommissions.map(bc => ({ name: bc.barber.name.split(' ')[0], value: bc.totalIncome }));
  const totalIncome = barberCommissions.reduce((s, bc) => s + bc.totalIncome, 0);
  const totalCommissions = barberCommissions.reduce((s, bc) => s + bc.totalCommission, 0);

  return (
    <div className="space-y-5 pb-20 lg:pb-4">
      <div>
        <h2 className="section-title">{isBarber ? 'Mis Comisiones y Ganancias' : 'Liquidación de Comisiones'}</h2>
        <p className="section-desc">
          {isBarber
            ? `Resumen personal de ${currentUser?.name} — Mes en curso`
            : 'Mes actual — calculado automáticamente por servicio realizado'}
        </p>
      </div>

      <div className={`grid ${isBarber ? 'grid-cols-2' : 'grid-cols-2'} gap-4`}>
        <div className="kpi-card">
          <div className="stat-label">{isBarber ? 'Total facturado por ti' : 'Total ingresos brutos'}</div>
          <div className="stat-value text-brand">{formatCurrency(totalIncome)}</div>
        </div>
        <div className="kpi-card">
          <div className="stat-label">{isBarber ? 'Tu comisión a cobrar' : 'Total comisiones equipo'}</div>
          <div className="stat-value text-emerald-400">{formatCurrency(totalCommissions)}</div>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${isBarber ? '' : 'lg:grid-cols-2'} gap-6`}>
        {/* Pie only for admin */}
        {!isBarber && (
          <div className="card p-5">
            <h3 className="section-title mb-4">Distribución de ingresos</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatCurrency(Number(v) || 0)} contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#a1a1aa' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* By barber */}
        <div className="card p-5">
          <h3 className="section-title mb-4">{isBarber ? 'Detalle de mi rendimiento' : 'Rendimiento por barbero'}</h3>
          <div className="space-y-4">
            {barberCommissions.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">No hay servicios registrados este mes aún.</p>
            ) : (
              barberCommissions.map(({ barber, totalIncome: bIncome, totalCommission: bComm, txCount }, i) => (
                <div key={barber.id} className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="avatar w-9 h-9 text-xs" style={{ background: `linear-gradient(135deg, ${barber.color}99, ${barber.color})` }}>
                      {getInitials(barber.name)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-200 font-semibold">{barber.name}</span>
                        <span className="text-zinc-400 font-medium">{txCount} cortes realizados</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-500">Facturado: <span className="text-brand font-semibold">{formatCurrency(bIncome)}</span></span>
                        <span className="text-zinc-500">Tu Pago: <span className="text-emerald-400 font-bold">{formatCurrency(bComm)}</span></span>
                      </div>
                      <div className="progress-bar h-2 mt-1.5 bg-zinc-800">
                        <div
                          className="progress-fill h-2"
                          style={{
                            width: bIncome > 0 ? `${(bComm / bIncome) * 100}%` : '0%',
                            background: barber.color || COLORS[i % COLORS.length]
                          }}
                        />
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-1 flex justify-between">
                        <span>Tasa acordada: <strong className="text-zinc-200">{(barber.commissionRate * 100).toFixed(0)}%</strong></span>
                        <span>Promedio/corte: <strong className="text-zinc-200">{txCount > 0 ? formatCurrency(bIncome / txCount) : '$0'}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Summary box */}
      <div className="card p-5 bg-gradient-to-br from-violet-600/10 to-transparent border-violet-600/20">
        <div className="flex items-center gap-3 mb-3">
          <Award className="w-5 h-5 text-brand" />
          <h3 className="font-semibold text-zinc-100">{isBarber ? 'Tu balance del mes' : 'Resumen financiero del mes'}</h3>
        </div>
        <div className={`grid ${isBarber ? 'grid-cols-2' : 'grid-cols-3'} gap-4 text-center`}>
          <div>
            <div className="text-lg font-bold text-brand">{formatCurrency(totalIncome)}</div>
            <div className="stat-label">{isBarber ? 'Total generado' : 'Ingresos brutos'}</div>
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-400">{formatCurrency(totalCommissions)}</div>
            <div className="stat-label">{isBarber ? 'Comisiones a recibir' : 'Comisiones pagadas'}</div>
          </div>
          {!isBarber && (
            <div>
              <div className="text-lg font-bold text-zinc-200">{formatCurrency(totalIncome - totalCommissions)}</div>
              <div className="stat-label">Margen de la barbería</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
