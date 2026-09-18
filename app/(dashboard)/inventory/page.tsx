'use client';
import { useStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { Package, AlertTriangle, TrendingDown, TrendingUp, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function InventoryPage() {
  const { products, inventoryMovements, adjustStock } = useStore();
  const outOfStock = products.filter(p => p.stock === 0);
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minStock);
  const healthy = products.filter(p => p.stock > p.minStock);

  return (
    <div className="space-y-5 pb-20 lg:pb-4">
      <div>
        <h2 className="section-title">Inventario</h2>
        <p className="section-desc">Control de stock en tiempo real</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center border-emerald-500/20">
          <div className="text-2xl font-bold text-emerald-400">{healthy.length}</div>
          <div className="stat-label">Stock OK</div>
        </div>
        <div className="card p-4 text-center border-amber-500/20">
          <div className="text-2xl font-bold text-amber-400">{lowStock.length}</div>
          <div className="stat-label">Stock bajo</div>
        </div>
        <div className="card p-4 text-center border-red-500/20">
          <div className="text-2xl font-bold text-red-400">{outOfStock.length}</div>
          <div className="stat-label">Agotados</div>
        </div>
      </div>

      {/* Alerts */}
      {(outOfStock.length > 0 || lowStock.length > 0) && (
        <div className="space-y-2">
          {outOfStock.map(p => (
            <div key={p.id} className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl animate-slide-up">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-red-300">AGOTADO: {p.name}</div>
                <div className="text-xs text-zinc-500">Requiere reposición urgente</div>
              </div>
              <button onClick={() => adjustStock(p.id, 10, 'Reposición de inventario')} className="btn-danger btn-sm">+ Reponer</button>
            </div>
          ))}
          {lowStock.map(p => (
            <div key={p.id} className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl animate-slide-up">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-amber-300">Stock bajo: {p.name}</div>
                <div className="text-xs text-zinc-500">{p.stock} unidades (mínimo: {p.minStock})</div>
              </div>
              <button onClick={() => adjustStock(p.id, 10, 'Reposición de inventario')} className="btn-sm bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg px-3 py-1.5 text-xs font-medium">+ Reponer</button>
            </div>
          ))}
        </div>
      )}

      {/* Full inventory table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Costo</th>
              <th>Stock</th>
              <th>Mínimo</th>
              <th>Estado</th>
              <th>Ajustar</th>
            </tr>
          </thead>
          <tbody>
            {products.map(prod => {
              const isOut = prod.stock === 0;
              const isLow = prod.stock > 0 && prod.stock <= prod.minStock;
              return (
                <tr key={prod.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className={cn('w-2 h-2 rounded-full shrink-0', isOut ? 'bg-red-400' : isLow ? 'bg-amber-400' : 'bg-emerald-400')} />
                      <span className="text-sm font-medium text-zinc-200">{prod.name}</span>
                    </div>
                  </td>
                  <td><span className="badge-zinc text-xs">{prod.category}</span></td>
                  <td><span className="text-sm text-violet-400 font-semibold">{formatCurrency(prod.price)}</span></td>
                  <td><span className="text-sm text-zinc-500">{formatCurrency(prod.cost)}</span></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className={cn('font-bold text-sm', isOut ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-zinc-200')}>{prod.stock}</span>
                      <div className="progress-bar h-1.5 w-16">
                        <div className={cn('h-1.5 rounded-full transition-all', isOut ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500')}
                          style={{ width: `${Math.min(100, (prod.stock / (prod.minStock * 3)) * 100)}%` }} />
                      </div>
                    </div>
                  </td>
                  <td><span className="text-sm text-zinc-600">{prod.minStock}</span></td>
                  <td>
                    <span className={cn('badge text-xs', isOut ? 'badge-red' : isLow ? 'badge-amber' : 'badge-emerald')}>
                      {isOut ? 'Agotado' : isLow ? 'Stock bajo' : 'Disponible'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => adjustStock(prod.id, 5, 'Entrada manual')} className="btn-icon p-1.5 text-emerald-400" title="Agregar 5">
                        <TrendingUp className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => adjustStock(prod.id, -1, 'Salida manual')} disabled={prod.stock === 0} className="btn-icon p-1.5 text-red-400" title="Quitar 1">
                        <TrendingDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Recent movements */}
      {inventoryMovements.length > 0 && (
        <div className="card p-5">
          <h3 className="section-title mb-4 flex items-center gap-2"><Archive className="w-4 h-4 text-zinc-500" />Movimientos recientes</h3>
          <div className="space-y-2">
            {inventoryMovements.slice(-10).reverse().map(mov => {
              const prod = products.find(p => p.id === mov.productId);
              return (
                <div key={mov.id} className="flex items-center gap-3 py-2 border-b border-zinc-800/50">
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', mov.type === 'in' ? 'bg-emerald-500/10' : 'bg-red-500/10')}>
                    {mov.type === 'in' ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> : <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-zinc-300">{prod?.name}</div>
                    <div className="text-xs text-zinc-600">{mov.reason}</div>
                  </div>
                  <span className={cn('text-sm font-bold', mov.type === 'in' ? 'text-emerald-400' : 'text-red-400')}>
                    {mov.type === 'in' ? '+' : '-'}{mov.quantity}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
