import React, { useState } from 'react';
import { DrumPattern, PatternStatus } from '../store';
import { Plus, Archive, Trash2, Edit2, CheckCircle2 } from 'lucide-react';

interface Props {
  records: DrumPattern[];
  onAdd: () => void;
  onUpdate: (id: string, updates: Partial<DrumPattern>) => void;
  onDelete: (id: string) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function PatternList({ records, onAdd, onUpdate, onDelete, selectedId, onSelect }: Props) {
  const [filter, setFilter] = useState<PatternStatus | 'all'>('all');

  const filtered = records.filter(r => filter === 'all' || r.status === filter);

  return (
    <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
        <h2 className="text-lg font-semibold text-slate-800">Patterns</h2>
        <button onClick={onAdd} className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500" aria-label="Add Pattern">
          <Plus size={16} />
        </button>
      </div>
      <div className="p-2 bg-slate-100 flex gap-2 overflow-x-auto">
        {(['all', 'empty', 'draft', 'ready', 'changed', 'archived'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-sm rounded-full capitalize whitespace-nowrap ${filter === f ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filtered.map(r => (
          <div
            key={r.id}
            onClick={() => onSelect(r.id)}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedId === r.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 bg-white hover:border-slate-300'}`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-slate-800">{r.name}</h3>
              <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                r.status === 'ready' ? 'bg-green-100 text-green-700' :
                r.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                r.status === 'archived' ? 'bg-slate-200 text-slate-700' :
                'bg-slate-100 text-slate-600'
              }`}>{r.status}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-slate-500">
              <span className="truncate max-w-[120px]">{r.owner ? `Owner: ${r.owner}` : 'Unassigned'}</span>
              <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                <button onClick={() => onUpdate(r.id, { status: 'archived' })} className="p-1 hover:text-slate-700" title="Archive"><Archive size={14}/></button>
                <button onClick={() => onDelete(r.id)} className="p-1 text-red-400 hover:text-red-600" title="Delete"><Trash2 size={14}/></button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center p-8 text-slate-400 text-sm">
            No patterns found for this filter.
          </div>
        )}
      </div>
    </div>
  );
}
