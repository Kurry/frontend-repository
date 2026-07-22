import React, { useState } from 'react';
import { useStore } from './store';
import { CheckCircle2, RotateCcw } from 'lucide-react';

export default function RecoveryBoard() {
  const { records, repairDownstream, undo } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const conflictRecords = records.filter(r => r.status === 'conflict');
  const resolvedRecords = records.filter(r => r.status === 'resolved');

  return (
    <div className="bg-slate-50 border-l border-slate-200 p-4 h-full flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-slate-800">Recovery Board</h2>
        <button
          onClick={undo}
          className="flex items-center gap-1 px-3 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50 text-sm text-slate-700 shadow-sm transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <RotateCcw size={14} />
          Undo
        </button>
      </div>

      <div className="flex-1 overflow-y-auto relative bg-white border border-slate-200 rounded p-4 shadow-inner space-y-4">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:24px_24px]" style={{ zIndex: 0 }}></div>

        <div className="relative z-10 flex flex-col gap-4">
          <h3 className="font-medium text-slate-500 text-sm">Needs Recovery ({conflictRecords.length})</h3>
          {conflictRecords.length === 0 && (
            <div className="text-sm text-slate-400 italic">No failed records in recovery path.</div>
          )}
          {conflictRecords.map(record => (
            <div
              key={record.id}
              onClick={() => setSelectedId(record.id)}
              className={`p-3 bg-red-50 border-2 rounded shadow-sm cursor-pointer transition-all transform hover:scale-[1.02] ${
                selectedId === record.id ? 'border-red-500 ring-2 ring-red-200' : 'border-red-200'
              }`}
            >
              <div className="font-semibold text-red-900">{record.name}</div>
              <div className="text-xs text-red-700 mt-1">Weight: {record.weightKg}kg | {record.category}</div>

              {selectedId === record.id && (
                <div className="mt-3 pt-3 border-t border-red-200 flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); repairDownstream(record.id, { weightKg: record.weightKg * 0.9, notes: 'Repaired downstream weight adjustment' }); setSelectedId(null); }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 px-2 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  >
                    <CheckCircle2 size={14} />
                    Repair & Resolve
                  </button>
                </div>
              )}
            </div>
          ))}

          <h3 className="font-medium text-slate-500 text-sm mt-6">Resolved ({resolvedRecords.length})</h3>
          {resolvedRecords.slice(0, 5).map(record => (
            <div key={record.id} className="p-3 bg-green-50 border border-green-200 rounded opacity-80">
              <div className="font-medium text-green-900 line-through decoration-green-400">{record.name}</div>
              <div className="text-xs text-green-700 mt-1">Recovered downstream</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
