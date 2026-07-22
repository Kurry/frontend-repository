import React from 'react';
import { useAppStore } from '../store';
import { PieChart, ListChecks, CheckCircle2 } from 'lucide-react';

export function DerivedSummary() {
  const { records } = useAppStore();

  const total = records.length;
  const readyForHandoff = records.filter(r => r.readiness === 'ready_for_handoff').length;
  const handoffComplete = records.filter(r => r.readiness === 'handoff_complete').length;
  const notReady = total - readyForHandoff - handoffComplete;

  return (
    <div className="bg-white border-b border-slate-200 p-4 shrink-0 flex gap-6 overflow-x-auto">
      <div className="flex items-center gap-3 pr-6 border-r border-slate-200 min-w-max">
        <div className="p-2 bg-slate-100 rounded text-slate-600">
          <PieChart size={20} />
        </div>
        <div>
          <div className="text-xs text-slate-500 font-medium">Total Segments</div>
          <div className="text-xl font-bold text-slate-800">{total}</div>
        </div>
      </div>

      <div className="flex items-center gap-3 pr-6 border-r border-slate-200 min-w-max">
        <div className="p-2 bg-slate-100 rounded text-slate-600">
          <ListChecks size={20} />
        </div>
        <div>
          <div className="text-xs text-slate-500 font-medium">Not Ready</div>
          <div className="text-xl font-bold text-slate-800">{notReady}</div>
        </div>
      </div>

      <div className="flex items-center gap-3 pr-6 border-r border-slate-200 min-w-max">
        <div className="p-2 bg-blue-100 rounded text-blue-600">
          <CheckCircle2 size={20} />
        </div>
        <div>
          <div className="text-xs text-blue-600 font-medium">Ready for Handoff</div>
          <div className="text-xl font-bold text-blue-800">{readyForHandoff}</div>
        </div>
      </div>

      <div className="flex items-center gap-3 min-w-max">
        <div className="p-2 bg-green-100 rounded text-green-600">
          <CheckCircle2 size={20} />
        </div>
        <div>
          <div className="text-xs text-green-600 font-medium">Handoff Complete</div>
          <div className="text-xl font-bold text-green-800">{handoffComplete}</div>
        </div>
      </div>
    </div>
  );
}
