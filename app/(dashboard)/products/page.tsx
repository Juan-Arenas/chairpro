'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { Package, Plus, Edit2, ShoppingCart, AlertTriangle, X, CheckCircle2 } from 'lucide-react';
import type { Product } from '@/types';
import { cn } from '@/lib/utils';

const CATEGORY_LABELS: Record<string, string> = {
  cera: 'Cera', pomada: 'Pomada', shampoo: 'Shampoo', aceite: 'Aceite',
  barba: 'Barba', perfume: 'Perfume', herramienta: 'Herramienta', otro: 'Otro'
};

function SaleModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const { registerSale } = useStore();
  const [qty, setQty] = useState(1);
  const [done, setDone] = useState(false);
  const handleSell = () => {
    const ok = registerSale(product.id, qty);
    if (ok) { setDone(true); setTimeout(onClose, 800); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h3 className="font-semibold font-display text-zinc-100">Registrar venta</h3>
          <button onClick={onClose} className="btn-icon"><X className="w-4 h-4" /></button>
        </div>
        {done ? <div className="p-8 text-center"><CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" /><p className="text-zinc-300 font-semibold">¡Venta registrada!</p></div> : (
          <div className="p-5 space-y-4">
            <div className="card p-4 text-center">
              <div className="font-semibold text-zinc-100 mb-1">{product.name}</div>
              <div className="text-xl font-bold text-violet-400">{formatCurrency(product.price)}</div>
              <div className="text-xs text-zinc-600 mt-1">Stock disponible: {product.stock} unidades</div>
            </div>
            <div className="form-group">
              <label className="label">Cantidad</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="btn-secondary btn-sm px-3">−</button>
                <span className="text-xl font-bold text-zinc-100 w-10 text-center">{qty}</span>
                <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="btn-secondary btn-sm px-3">+</button>
              </div>
            </div>
            <div className="card p-3 flex justify-between">
              <span className="text-sm text-zinc-400">Total</span>
              <span className="font-bold text-emerald-400">{formatCurrency(product.price * qty)}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleSell} disabled={product.stock < qty} className="btn-primary flex-1">
                <ShoppingCart className="w-4 h-4" /> Vender
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductModal({ product, onClose }: { product?: Product; onClose: () => void }) {
  const { createProduct, updateProduct } = useStore();
  const [form, setForm] = useState({
    name: product?.name || '', description: product?.description || '',
    category: product?.category || 'cera',
    price: product?.price?.toString() || '', cost: product?.cost?.toString() || '',
    stock: product?.stock?.toString() || '0', minStock: product?.minStock?.toString() || '5',
    isActive: product?.isActive ?? true, featured: product?.featured ?? false,
  });
  const [saved, setSaved] = useState(false);
  const handleSave = () => {
    const data = { ...form, price: parseFloat(form.price), cost: parseFloat(form.cost), stock: parseInt(form.stock), minStock: parseInt(form.minStock) };
    if (product) updateProduct(product.id, data as any);
    else createProduct(data as any);
    setSaved(true); setTimeout(onClose, 800);
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h3 className="font-semibold font-display text-zinc-100">{product ? 'Editar producto' : 'Nuevo producto'}</h3>
          <button onClick={onClose} className="btn-icon"><X className="w-4 h-4" /></button>
        </div>
        {saved ? <div className="p-8 text-center"><CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" /><p className="text-zinc-300 font-semibold">¡Guardado!</p></div> : (
          <div className="p-5 space-y-4">
            <div className="form-group"><label className="label">Nombre *</label><input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div className="form-group"><label className="label">Descripción</label><textarea className="input" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div className="form-group"><label className="label">Categoría</label>
              <select className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value as any})}>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group"><label className="label">Precio venta</label><input className="input" type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} /></div>
              <div className="form-group"><label className="label">Costo</label><input className="input" type="number" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} /></div>
              <div className="form-group"><label className="label">Stock inicial</label><input className="input" type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} /></div>
              <div className="form-group"><label className="label">Stock mínimo</label><input className="input" type="number" value={form.minStock} onChange={e => setForm({...form, minStock: e.target.value})} /></div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.featured} onChange={e => setForm({...form, featured: e.target.checked})} className="w-4 h-4 accent-violet-500" /><span className="text-sm text-zinc-400">Destacado en página pública</span></label>
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

export default function ProductsPage() {
  const { products } = useStore();
  const [editing, setEditing] = useState<Product | undefined>();
  const [selling, setSelling] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);
  return (
    <div className="space-y-5 pb-20 lg:pb-4">
      <div className="flex items-center justify-between">
        <div><h2 className="section-title">Productos</h2><p className="section-desc">{products.length} productos</p></div>
        <button onClick={() => { setEditing(undefined); setShowModal(true); }} className="btn-primary btn-sm"><Plus className="w-3.5 h-3.5" /> Nuevo producto</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map(prod => {
          const isLow = prod.stock > 0 && prod.stock <= prod.minStock;
          const isOut = prod.stock === 0;
          return (
            <div key={prod.id} className="card-hover p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    <span className="badge-zinc text-xs">{CATEGORY_LABELS[prod.category]}</span>
                    {prod.featured && <span className="badge-amber text-xs">Destacado</span>}
                    {isOut && <span className="badge-red text-xs">Agotado</span>}
                    {isLow && !isOut && <span className="badge-amber text-xs">Stock bajo</span>}
                  </div>
                  <div className="font-semibold text-zinc-100 text-sm">{prod.name}</div>
                </div>
                <button onClick={() => { setEditing(prod); setShowModal(true); }} className="btn-icon p-1.5"><Edit2 className="w-3 h-3" /></button>
              </div>
              <p className="text-xs text-zinc-500 mb-4 line-clamp-2">{prod.description}</p>
              <div className="flex items-center justify-between mb-3">
                <div className="text-lg font-bold text-violet-400">{formatCurrency(prod.price)}</div>
                <div className="flex items-center gap-1.5">
                  {(isLow || isOut) && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                  <Package className={cn('w-4 h-4', isOut ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-zinc-500')} />
                  <span className={cn('text-sm font-bold', isOut ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-zinc-300')}>{prod.stock}</span>
                </div>
              </div>
              <button onClick={() => setSelling(prod)} disabled={isOut} className={cn('btn w-full btn-sm justify-center', isOut ? 'btn-secondary opacity-50' : 'btn-primary')}>
                <ShoppingCart className="w-3.5 h-3.5" /> {isOut ? 'Agotado' : 'Vender'}
              </button>
            </div>
          );
        })}
      </div>
      {showModal && <ProductModal product={editing} onClose={() => { setShowModal(false); setEditing(undefined); }} />}
      {selling && <SaleModal product={selling} onClose={() => setSelling(null)} />}
    </div>
  );
}
