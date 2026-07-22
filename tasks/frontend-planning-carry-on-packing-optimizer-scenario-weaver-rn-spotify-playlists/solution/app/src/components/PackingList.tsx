import { useState } from 'react';
import { PackageOpen, Filter, Plus, Trash2 } from 'lucide-react';
import type { PackingItem, ItemStatus } from '../types';

interface PackingListProps {
  records: PackingItem[];
  filter: ItemStatus | 'all';
  setFilter: (f: ItemStatus | 'all') => void;
  updateRecord: (id: string, updates: Partial<PackingItem>) => void;
  deleteRecord: (id: string) => void;
  addRecord: (record: Omit<PackingItem, 'id'>) => void;
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
}

export function PackingList({
  records, filter, setFilter, updateRecord, deleteRecord, addRecord, selectedItemId, setSelectedItemId
}: PackingListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: '', quantity: 1, weight: 0 });

  const activeRecords = records.filter(r => r.status !== 'archived');
  const displayRecords = filter === 'all' ? activeRecords : activeRecords.filter(r => r.status === filter);

  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newItem.name || newItem.weight <= 0) {
      setError("Name is required and weight must be greater than 0");
      return;
    }
    setError(null);
    if (newItem.name && newItem.weight > 0) {
      addRecord({ ...newItem, status: 'empty' });
      setIsAdding(false);
      setNewItem({ name: '', category: '', quantity: 1, weight: 0 });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <PackageOpen className="w-5 h-5 text-indigo-400" />
          Packing Items
        </h2>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-slate-900 rounded-lg p-1 border border-slate-700">
            <Filter className="w-4 h-4 text-slate-400 ml-2" />
            <select
              value={filter}
              onChange={e => setFilter(e.target.value as any)}
              className="bg-transparent text-sm text-slate-200 outline-none pr-2"
            >
              <option value="all">All Status</option>
              <option value="empty">Empty</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="changed">Changed</option>
            </select>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="p-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors text-white"
            aria-label="Add Item"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {isAdding && (
          <div className="bg-slate-700 p-3 rounded-lg border border-slate-600 flex gap-2 items-end flex-wrap">
            <div className="flex-1 space-y-2 min-w-[200px]">
              <input
                type="text" placeholder="Item Name"
                value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})}
                className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm"
              />
              <div className="flex gap-2">
                 <input
                  type="text" placeholder="Category"
                  value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}
                  className="w-1/2 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm"
                />
                <input
                  type="number" placeholder="Weight (g)" min="0"
                  value={newItem.weight || ''} onChange={e => setNewItem({...newItem, weight: parseInt(e.target.value) || 0})}
                  className="w-1/4 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm"
                />
                <input
                  type="number" placeholder="Qty" min="1"
                  value={newItem.quantity || ''} onChange={e => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})}
                  className="w-1/4 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm"
                />
              </div>
            </div>
            {error && <div className="text-red-400 text-xs mt-1 w-full">{error}</div>}
            <div className="flex flex-col gap-2 w-full mt-2 sm:w-auto sm:mt-0">
               <button onClick={handleAdd} className="bg-green-600 hover:bg-green-700 text-xs px-3 py-1 rounded">Save</button>
               <button onClick={() => setIsAdding(false)} className="bg-slate-600 hover:bg-slate-500 text-xs px-3 py-1 rounded">Cancel</button>
            </div>
          </div>
        )}

        {displayRecords.length === 0 ? (
          <div className="text-center text-slate-500 py-8">No items match current filter.</div>
        ) : (
          displayRecords.map(item => (
            <div
              key={item.id}
              onClick={() => setSelectedItemId(item.id)}
              className={`flex items-center p-3 rounded-lg border transition-all cursor-pointer ${
                selectedItemId === item.id
                  ? 'bg-indigo-900/30 border-indigo-500 shadow-md transform scale-[1.01]'
                  : 'bg-slate-800 border-slate-700 hover:border-slate-500'
              } ${item.scenarioWeaverState?.isScenario ? 'border-l-4 border-l-amber-500' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-slate-200 truncate">{item.name}</h3>
                  {item.scenarioWeaverState?.isScenario && (
                    <span className="text-[10px] uppercase tracking-wider bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">Scenario</span>
                  )}
                </div>
                <div className="text-xs text-slate-400 mt-1 flex gap-3">
                  <span>{item.category}</span>
                  <span>{item.weight}g × {item.quantity}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={item.status}
                  onChange={(e) => { e.stopPropagation(); updateRecord(item.id, { status: e.target.value as ItemStatus }); }}
                  className={`text-xs px-2 py-1 rounded-full font-medium outline-none cursor-pointer ${
                    item.status === 'ready' ? 'bg-green-500/20 text-green-400' :
                    item.status === 'draft' ? 'bg-amber-500/20 text-amber-400' :
                    item.status === 'changed' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-slate-700 text-slate-300'
                  }`}
                >
                  <option value="empty">Empty</option>
                  <option value="draft">Draft</option>
                  <option value="ready">Ready</option>
                  <option value="changed">Changed</option>
                </select>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteRecord(item.id); if(selectedItemId === item.id) setSelectedItemId(null); }}
                  className="text-slate-500 hover:text-red-400 p-1"
                  aria-label="Archive item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
