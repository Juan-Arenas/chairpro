'use client';
import { useStore } from '@/lib/store';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';
import { Star, Gift, Settings } from 'lucide-react';

export default function LoyaltyPage() {
  const { clients, currentShop } = useStore();
  const settings = currentShop?.settings;
  const THRESHOLD = settings?.rewardThreshold || 5;

  const sorted = [...clients].sort((a, b) => b.loyalty.visits - a.loyalty.visits);
  const eligible = clients.filter(c => c.loyalty.visits >= THRESHOLD);
  const nearReward = clients.filter(c => c.loyalty.visits >= THRESHOLD - 1 && c.loyalty.visits < THRESHOLD);

  return (
    <div className="space-y-5 pb-20 lg:pb-4">
      <div className="flex items-center justify-between">
        <div><h2 className="section-title">Fidelización</h2><p className="section-desc">Programa de recompensas por visitas</p></div>
      </div>

      {/* Program config */}
      <div className="card p-5 bg-gradient-to-br from-amber-600/10 to-transparent border-amber-600/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-500/15 rounded-xl flex items-center justify-center"><Gift className="w-5 h-5 text-amber-400" /></div>
          <div>
            <div className="font-semibold text-zinc-100">Programa activo: Sistema de Visitas</div>
            <div className="text-sm text-zinc-500">Cada visita suma 1 progreso</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div><div className="text-xl font-bold text-amber-400">{THRESHOLD}</div><div className="stat-label">Visitas para recompensa</div></div>
          <div><div className="text-xl font-bold text-emerald-400">{eligible.length}</div><div className="stat-label">Clientes elegibles</div></div>
          <div><div className="text-xl font-bold text-blue-400">{nearReward.length}</div><div className="stat-label">A 1 visita de lograrlo</div></div>
        </div>
        <div className="mt-4 p-3 bg-amber-500/10 rounded-lg">
          <div className="text-xs text-amber-300 font-medium">Recompensa: {settings?.rewardDescription || 'Corte gratis'}</div>
        </div>
      </div>

      {/* Eligible */}
      {eligible.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-zinc-100 mb-4 flex items-center gap-2"><Star className="w-4 h-4 text-amber-400" />Clientes elegibles para recompensa ({eligible.length})</h3>
          <div className="space-y-3">
            {eligible.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                <div className="avatar w-9 h-9 text-xs">{getInitials(c.name)}</div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-zinc-200">{c.name}</div>
                  <div className="text-xs text-zinc-500">{c.loyalty.visits} visitas · {formatCurrency(c.totalSpent)} gastados</div>
                </div>
                <div className="badge-amber">¡Recompensa lista!</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All clients progress */}
      <div className="card p-5">
        <h3 className="section-title mb-4">Progreso de todos los clientes</h3>
        <div className="space-y-4">
          {sorted.map(c => {
            const progress = Math.min(100, (c.loyalty.visits / THRESHOLD) * 100);
            const isEligible = c.loyalty.visits >= THRESHOLD;
            return (
              <div key={c.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="avatar w-7 h-7 text-xs">{getInitials(c.name)}</div>
                    <span className="text-sm text-zinc-300">{c.name}</span>
                    {isEligible && <Star className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <span className="text-xs text-zinc-500">{c.loyalty.visits}/{THRESHOLD} visitas</span>
                </div>
                <div className="progress-bar h-2">
                  <div className={`progress-fill h-2 ${isEligible ? 'bg-gradient-to-r from-amber-500 to-amber-400' : ''}`} style={{ width: `${progress}%` }} />
                </div>
                <div className="text-xs text-zinc-700 mt-0.5">Última visita: {c.lastVisitAt ? formatDate(c.lastVisitAt) : 'Sin visitas'}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
