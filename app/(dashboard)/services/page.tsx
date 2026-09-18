'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { Plus, Edit2, Power, X, CheckCircle2, Clock } from 'lucide-react';
import type { Service } from '@/types';
import { cn } from '@/lib/utils';

const CATEGORY_LABELS: Record<string, string> = {
  corte: 'Corte', barba: 'Barba', combo: 'Combo', tratamiento: 'Tratamiento', otro: 'Otro'
};

function ServiceModal({ service, onClose }: { service?: Service; onClose: () => void }) {
  const { createService, updateService, currentShop } = useStore();
  const [form, setForm] = useState({
    name: service?.name || '', description: service?.description || '',
    duration: service?.duration?.toString() || '30',
    price: service?.price?.toString() || '',
    commissionRate: service?.commissionRate ? (service.commissionRate * 100).toString() : '0',
    category: service?.category || 'corte',
    popular: service?.popular ?? false, isActive: service?.isActive ?? true,
  });
  const [saved, setSaved] = useState(false);
  const handleSave = () => {
    const data = { ...form, duration: parseInt(form.duration), price: parseFloat(form.price), commissionRate: parseFloat(form.commissionRate) / 100 };
    if (service) updateService(service.id, data as any);
    else createService(data as any);
    setSaved(true);
    setTimeout(onClose, 800);
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h3 className="font-semibold font-display text-zinc-100">{service ? 'Editar servicio' : 'Nuevo servicio'}</h3>
          <button onClick={onClose} className="btn-icon"><X className="w-4 h-4" /></button>
        </div>
        {saved ? <div className="p-8 text-center"><CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" /><p className="text-zinc-300 font-semibold">¡Guardado!</p></div> : (
          <div className="p-5 space-y-4">
            <div className="form-group"><label className="label">Nombre *</label><input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Corte Clásico" /></div>
            <div className="form-group"><label className="label">Descripción</label><textarea className="input" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group"><label className="label">Precio (COP) *</label><input className="input" type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="35000" /></div>
              <div className="form-group"><label className="label">Duración (min)</label><input className="input" type="number" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} /></div>
              <div className="form-group"><label className="label">Comisión extra (%)</label><input className="input" type="number" value={form.commissionRate} onChange={e => setForm({...form, commissionRate: e.target.value})} placeholder="0 = usar comisión del barbero" /></div>
              <div className="form-group"><label className="label">Categoría</label>
                <select className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value as any})}>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.popular} onChange={e => setForm({...form, popular: e.target.checked})} className="w-4 h-4 accent-violet-500" />
                <span className="text-sm text-zinc-400">Servicio popular</span>
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleSave} disabled={!form.name || !form.price} className="btn-primary flex-1">Guardar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const { services, toggleServiceActive } = useStore();
  const [editing, setEditing] = useState<Service | undefined>();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-5 pb-20 lg:pb-4">
      <div className="flex items-center justify-between">
        <div><h2 className="section-title">Servicios</h2><p className="section-desc">{services.filter(s => s.isActive).length} activos</p></div>
        <button onClick={() => { setEditing(undefined); setShowModal(true); }} className="btn-primary btn-sm"><Plus className="w-3.5 h-3.5" /> Nuevo servicio</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map(svc => (
          <div key={svc.id} className={cn('card-hover p-5', !svc.isActive && 'opacity-50')}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge-violet text-xs">{CATEGORY_LABELS[svc.category]}</span>
                  {svc.popular && <span className="badge-amber text-xs">Popular</span>}
                </div>
                <div className="font-semibold text-zinc-100">{svc.name}</div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditing(svc); setShowModal(true); }} className="btn-icon p-1.5"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => toggleServiceActive(svc.id)} className="btn-icon p-1.5"><Power className={cn('w-3.5 h-3.5', svc.isActive ? 'text-emerald-400' : 'text-zinc-600')} /></button>
              </div>
            </div>
            <p className="text-xs text-zinc-500 mb-4 line-clamp-2">{svc.description}</p>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl font-bold font-display text-violet-400">{formatCurrency(svc.price)}</div>
                <div className="flex items-center gap-1 text-xs text-zinc-600 mt-0.5"><Clock className="w-3 h-3" />{svc.duration} min</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-zinc-600">Comisión especial</div>
                <div className="text-sm font-semibold text-emerald-400">{svc.commissionRate > 0 ? `${(svc.commissionRate * 100).toFixed(0)}%` : 'Por barbero'}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {showModal && <ServiceModal service={editing} onClose={() => { setShowModal(false); setEditing(undefined); }} />}
    </div>
  );
}
