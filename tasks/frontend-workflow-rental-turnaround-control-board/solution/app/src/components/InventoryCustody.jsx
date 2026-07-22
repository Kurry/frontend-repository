import React from 'react';
import { Package, Key } from 'lucide-react';
import { useStore } from '../store/useStore';

export function InventoryCustody() {
  const inventory = useStore((state) => state.inventory);
  const keys = useStore((state) => state.keys);
  const reserveInventory = useStore((state) => state.reserveInventory);
  const issueKey = useStore((state) => state.issueKey);
  const returnKey = useStore((state) => state.returnKey);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
          <Package size={16} /> Inventory
        </h3>
        <div className="space-y-3">
          {inventory.slice(0, 5).map(lot => (
            <div key={lot.id} className="text-sm flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="font-medium">{lot.name}</span>
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{lot.total - lot.consumed} total</span>
              </div>
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Reserved: {lot.reserved}</span>
                <button
                  onClick={() => reserveInventory(lot.id, 1)}
                  disabled={lot.reserved >= (lot.total - lot.consumed)}
                  className="hover:text-primary disabled:opacity-50"
                >
                  Reserve +1
                </button>
              </div>
            </div>
          ))}
          <div className="text-xs text-muted-foreground italic">+ 9 more lots</div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
          <Key size={16} /> Key Custody
        </h3>
        <div className="space-y-2">
          {keys.map(k => (
            <div key={k.id} className="text-sm flex justify-between items-center p-2 border border-border rounded">
              <span>{k.name}</span>
              {k.status === 'available' ? (
                <button onClick={() => issueKey(k.id, 'Alice')} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded hover:bg-secondary/80">Issue</button>
              ) : (
                <button onClick={() => returnKey(k.id)} className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 px-2 py-1 rounded hover:opacity-80">Return</button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
