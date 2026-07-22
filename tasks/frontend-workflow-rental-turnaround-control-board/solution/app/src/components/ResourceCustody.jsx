import React from 'react';
import { useStore } from '../store';

export const ResourceCustody = () => {
  const inventoryLots = useStore(state => state.inventoryLots);
  const keys = useStore(state => state.keys);
  const custodyEvents = useStore(state => state.custodyEvents);
  const reserveInventory = useStore(state => state.reserveInventory);
  const checkOutKey = useStore(state => state.checkOutKey);
  const returnKey = useStore(state => state.returnKey);

  return (
    <div className="mt-4 border p-4 bg-white rounded shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <h3 className="font-bold mb-2">Inventory</h3>
        <ul className="text-sm max-h-32 overflow-y-auto">
          {inventoryLots.slice(0, 5).map(lot => (
            <li key={lot.id} className="flex justify-between items-center mb-1">
              <span>{lot.name} (Avail: {lot.available})</span>
              <button
                className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                onClick={() => reserveInventory(lot.id, 1)}
              >
                Reserve
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="font-bold mb-2">Key Custody</h3>
        <ul className="text-sm max-h-32 overflow-y-auto">
          {keys.map(key => (
            <li key={key.id} className="flex justify-between items-center mb-1">
              <span>{key.name}</span>
              {key.isCheckedOut ? (
                <button className="px-2 py-0.5 bg-red-100 text-red-700 rounded transition-colors hover:bg-red-200" onClick={() => returnKey(key.id)}>Return</button>
              ) : (
                <button className="px-2 py-0.5 bg-green-100 text-green-700 rounded transition-colors hover:bg-green-200" onClick={() => checkOutKey(key.id, 'worker-1')}>Check Out</button>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div className="md:col-span-2 mt-2">
        <h4 className="font-bold text-xs text-gray-500">Custody Events (Idempotent tracking)</h4>
        <div className="text-[10px] text-gray-400 font-mono h-12 overflow-y-auto border-t pt-1">
          {custodyEvents.map(e => (
            <div key={e.id}>{e.type.toUpperCase()} - {e.keyId} at Clock Day {e.clock}</div>
          ))}
        </div>
      </div>
    </div>
  );
};
