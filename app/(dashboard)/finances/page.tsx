'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { format, startOfMonth } from 'date-fns';
import { TrendingUp, TrendingDown, Award, DollarSign, Plus, X, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function ExpenseModal({ onClose }: { onClose: () => void }) {
  const { addTransaction, currentUser, currentShop } = useStore();
  const [form, setForm] = useState({ description: '', amount: '', category: 'supplies', date: format(new Date(), 'yyyy-MM-dd') });
  const [saved, setSaved] = useState(false);
  const handleSave = () => {
    addTransaction({ shopId: currentShop?.id || 'demo', type: 'expense', category: form.category as any, description: form.description, amount: parseFloat(form.amount), date: form.date, createdBy: currentUser?.id || 'system' });
    setSaved(true); setTimeout(onClose, 800);
  };
  const CATS = { supplies: 'Insumos', purchase: 'Compra inventario', rent: 'Arriendo', utilities: 'Servicios', salary: 'Nómina', other: 'Otro' };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h3 className="font-semibold font-display text-zinc-100">Registrar gasto</h3>
          <button onClick={onClose} className="btn-icon"><X className="w-4 h-4" /></button>
        </div>
        {saved ? <div className="p-8 text-center"><CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" /><p className="text-zinc-300 font-semibold">¡Gasto registrado!</p></div> : (
          <div className="p-5 space-y-4">
            <div className="form-group"><label className="label">Descripción *</label><input className="input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Compra de insumos..." /></div>
            <div className="form-group"><label className="label">Monto (COP) *</label><input className="input" type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="150000" /></div>
            <div className="form-group"><label className="label">Categoría</label>
              <select className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                {Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="label">Fecha</label><input className="input" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>
            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleSave} disabled={!form.description || !form.amount} className="btn-primary flex-1">Guardar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FinancesPage() {
  const { transactions } = useStore();
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const monthTx = transactions.filter(t => t.date >= monthStart);
  const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const commissions = monthTx.filter(t => t.type === 'income' && t.commissionAmount).reduce((s, t) => s + (t.commissionAmount || 0), 0);
  const net = income - expenses - commissions;

  const WEEK_DATA = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const dayStr = format(d, 'yyyy-MM-dd');
    const dayLabel = format(d, 'EEE').slice(0, 3);
    const dayInc = transactions.filter(t => t.date === dayStr && t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const dayExp = transactions.filter(t => t.date === dayStr && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { day: dayLabel, ingresos: dayInc, gastos: dayExp };
  });

  return (
    <div className="space-y-5 pb-20 lg:pb-4">
      <div className="flex items-center justify-between">
        <div><h2 className="section-title">Finanzas</h2><p className="section-desc">Mes actual</p></div>
        <button onClick={() => setShowExpenseModal(true)} className="btn-secondary btn-sm"><Plus className="w-3.5 h-3.5" /> Registrar gasto</button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card"><div className="stat-label flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5 text-emerald-400" />Ingresos</div><div className="stat-value text-emerald-400">{formatCurrency(income)}</div></div>
        <div className="kpi-card"><div className="stat-label flex items-center gap-2"><TrendingDown className="w-3.5 h-3.5 text-red-400" />Gastos</div><div className="stat-value text-red-400">{formatCurrency(expenses)}</div></div>
        <div className="kpi-card"><div className="stat-label flex items-center gap-2"><Award className="w-3.5 h-3.5 text-violet-400" />Comisiones</div><div className="stat-value text-violet-400">{formatCurrency(commissions)}</div></div>
        <div className="kpi-card border-emerald-500/20"><div className="stat-label flex items-center gap-2"><DollarSign className="w-3.5 h-3.5 text-emerald-400" />Resultado neto</div><div className={`stat-value ${net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(net)}</div></div>
      </div>

      {/* Chart */}
      <div className="card p-5">
        <h3 className="section-title mb-4">Ingresos vs Gastos — Últimos 7 días</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={WEEK_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="day" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => formatCurrency(Number(v) || 0)} contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#a1a1aa' }} />
              <Bar dataKey="ingresos" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transaction list */}
      <div className="table-container">
        <table className="table">
          <thead><tr><th>Fecha</th><th>Descripción</th><th>Categoría</th><th>Tipo</th><th>Monto</th></tr></thead>
          <tbody>
            {transactions.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30).map(tx => (
              <tr key={tx.id}>
                <td className="text-xs text-zinc-500">{formatDate(tx.date)}</td>
                <td className="text-xs text-zinc-300">{tx.description}</td>
                <td><span className="badge-zinc text-xs">{tx.category}</span></td>
                <td><span className={`badge text-xs ${tx.type === 'income' ? 'badge-emerald' : 'badge-red'}`}>{tx.type === 'income' ? 'Ingreso' : 'Gasto'}</span></td>
                <td className={`font-semibold text-sm ${tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showExpenseModal && <ExpenseModal onClose={() => setShowExpenseModal(false)} />}
    </div>
  );
}
