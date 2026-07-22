import React from 'react';
import { clsx } from 'clsx';
import { Play, Pause, Archive, Edit2, Trash2 } from 'lucide-react';

export function PracticeSegments({ records, selectedRecordId, onSelect, onDelete }) {
  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 w-80 overflow-y-auto">
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-lg font-semibold text-slate-100 uppercase tracking-wider text-sm">Practice Segments</h2>
        <div className="text-xs text-slate-400 mt-1">{records.length} total records</div>
      </div>
      <div className="flex-1 p-2 space-y-1">
        {records.map(record => (
          <button
            key={record.id}
            onClick={() => onSelect(record.id)}
            className={clsx(
              "w-full text-left p-3 rounded-md transition-colors flex items-center justify-between group",
              selectedRecordId === record.id
                ? "bg-indigo-600 text-white"
                : "bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white"
            )}
          >
            <div className="flex flex-col gap-1 overflow-hidden">
              <span className="font-medium truncate">{record.name}</span>
              <div className="flex items-center gap-2 text-xs">
                <span className={clsx(
                  "px-1.5 py-0.5 rounded text-[10px] uppercase font-bold",
                  record.status === 'draft' ? "bg-amber-500/20 text-amber-300" :
                  record.status === 'ready' ? "bg-emerald-500/20 text-emerald-300" :
                  record.status === 'changed' ? "bg-blue-500/20 text-blue-300" :
                  record.status === 'conflict' ? "bg-red-500/20 text-red-300" :
                  record.status === 'archived' ? "bg-slate-500/20 text-slate-300" :
                  "bg-slate-700 text-slate-400"
                )}>
                  {record.status}
                </span>
                <span className="opacity-70">Cap: {record.capacity}</span>
              </div>
            </div>
            {record.status !== 'archived' && (
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                 <button onClick={(e) => { e.stopPropagation(); onDelete(record.id); }} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400" aria-label="Delete">
                    <Trash2 size={14} />
                 </button>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
