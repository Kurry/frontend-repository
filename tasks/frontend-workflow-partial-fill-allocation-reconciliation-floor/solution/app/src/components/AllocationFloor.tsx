import React, { useState } from 'react';
import { useAppStore } from '../store/store';
import { calculateRemainingFill, calculateRemainingIntent } from '../utils/allocations';
import { RuleGuard } from './RuleGuard';

export const AllocationFloor: React.FC = () => {
  const { fills, intents, allocations, allocate, addException } = useAppStore();
  const [draggedFill, setDraggedFill] = useState<string | null>(null);
  const [splitOverlay, setSplitOverlay] = useState<{fillId: string, intentId: string} | null>(null);
  const [splitQty, setSplitQty] = useState('');
  const [violations, setViolations] = useState<string[]>([]);

  const handleDrop = (intentId: string) => {
    if (!draggedFill) return;
    setSplitOverlay({ fillId: draggedFill, intentId });
    setDraggedFill(null);
  };

  const handleAllocate = () => {
    if (!splitOverlay) return;
    const qty = parseInt(splitQty, 10);
    if (isNaN(qty) || qty <= 0) return;

    const res = allocate(splitOverlay.fillId, splitOverlay.intentId, qty);
    if (res.success) {
      setSplitOverlay(null);
      setSplitQty('');
      setViolations([]);
    } else {
      setViolations(res.violations || ['Unknown error']);
    }
  };

  return (
    <div className="flex h-full gap-2 p-2">
      <div className="w-1/3 border p-2 overflow-y-auto">
        <h3 className="font-bold mb-2">Fills</h3>
        {fills.map(f => {
          const rem = calculateRemainingFill(f, allocations);
          return (
            <div
              key={f.id}
              draggable={rem > 0}
              onDragStart={() => setDraggedFill(f.id)}
              className={`p-2 border mb-2 cursor-move ${rem === 0 ? 'bg-gray-200' : 'bg-white'}`}
            >
              <div>{f.id} - {f.symbol} {f.side}</div>
              <div className="text-sm text-gray-500">Qty: {f.quantity} (Rem: {rem})</div>
            </div>
          );
        })}
      </div>

      <div className="w-1/3 border p-2 flex items-center justify-center relative">
        <h3 className="absolute top-2 font-bold">Sankey (Logical)</h3>
        <div className="text-center text-sm text-gray-500">
          Drag Fill &gt; Intent
          <br/><br/>
          {allocations.map(a => (
            <div key={a.id} className="border p-1 mb-1 text-xs bg-blue-50">
              {a.fillId} &rarr; {a.intentId} ({a.quantity})
            </div>
          ))}
        </div>

        {splitOverlay && (
          <div className="absolute inset-0 bg-white/90 p-4 flex flex-col items-center justify-center border z-10">
            <h4 className="font-bold">Split Lot</h4>
            <div className="my-2">
              <input
                type="number"
                value={splitQty}
                onChange={e => setSplitQty(e.target.value)}
                className="border p-1"
                placeholder="Quantity"
              />
            </div>
            <div className="flex gap-2">
              <button className="bg-blue-500 text-white px-2 py-1" onClick={handleAllocate}>Allocate</button>
              <button className="bg-gray-500 text-white px-2 py-1" onClick={() => { setSplitOverlay(null); setViolations([]); }}>Cancel</button>
            </div>
            {violations.length > 0 && (
              <div className="text-red-500 mt-2 text-sm">
                {violations.map((v, i) => <div key={i}>{v}</div>)}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="w-1/3 border p-2 overflow-y-auto">
        <h3 className="font-bold mb-2">Intents</h3>
        {intents.map(i => {
          const rem = calculateRemainingIntent(i, allocations);
          return (
            <div
              key={i.id}
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(i.id)}
              className={`p-2 border mb-2 ${rem === 0 ? 'bg-gray-200' : 'bg-white'}`}
            >
              <div>{i.id} - {i.accountId} {i.symbol} {i.side}</div>
              <div className="text-sm text-gray-500">Qty: {i.quantity} (Rem: {rem})</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
