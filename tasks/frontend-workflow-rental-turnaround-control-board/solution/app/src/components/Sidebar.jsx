import React from 'react';
import { Download, Upload, Activity, AlertCircle } from 'lucide-react';
import { InventoryCustody } from './InventoryCustody';
import { useStore } from '../store/useStore';

export function Sidebar() {
  const tasks = useStore((state) => state.tasks);
  const handoffs = useStore((state) => state.handoffs);
  const partialHandoff = useStore((state) => state.partialHandoff);

  const completed = tasks.filter(t => t.isVerified).length;
  const total = tasks.length;
  const isPartial = total > 0 && completed < total;

  return (
    <div className="w-72 border-r border-border bg-card h-full flex flex-col shrink-0">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-lg tracking-tight">Control Board</h2>
      </div>

      <InventoryCustody />

      <div className="p-4 border-t border-border bg-muted/20">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
          <Activity size={16} /> Readiness Status
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span>Tasks Scheduled</span>
            <span className="font-medium">{total}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Tasks Verified</span>
            <span className="font-medium text-emerald-600">{completed}</span>
          </div>
          {handoffs.length > 0 && (
            <div className="flex justify-between items-center mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 rounded text-xs border border-amber-200 dark:border-amber-900/50">
              <span className="flex items-center gap-1"><AlertCircle size={12}/> Handoff State</span>
              <span className="font-bold uppercase">{handoffs[handoffs.length - 1].type}</span>
            </div>
          )}
          {isPartial && (
             <button onClick={partialHandoff} className="w-full mt-2 py-1.5 border border-border bg-background rounded text-xs font-medium hover:bg-muted">Record Partial Handoff</button>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-border flex gap-2">
        <button
          onClick={() => {
            const data = window.webmcp_invokeTool('export_turnaround');
            console.log('Exported JSON:', data);
          }}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
        >
          <Download size={16} /> Export
        </button>
        <button
          onClick={() => window.webmcp_invokeTool('reset_state')}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-border bg-card rounded-md text-sm hover:bg-muted transition-colors"
        >
          <Upload size={16} /> Reset
        </button>
      </div>
    </div>
  );
}
