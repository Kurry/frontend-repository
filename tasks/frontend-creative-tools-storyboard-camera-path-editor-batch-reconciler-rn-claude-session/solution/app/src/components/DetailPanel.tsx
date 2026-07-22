import { useStore, calculateDerivedState } from '../store';
import { PieChart, Clock, FileText, CheckCircle, RotateCcw, Archive, Activity } from 'lucide-react';

export function DetailPanel() {
  const { records, history } = useStore();
  const derived = calculateDerivedState(records);
  const { summary } = derived;

  const StatBox = ({ label, value, icon: Icon, colorClass }: { label: string, value: number, icon: any, colorClass: string }) => (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-md ${colorClass}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</span>
      </div>
      <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{value}</span>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 uppercase tracking-wider">
          <PieChart className="w-4 h-4 text-zinc-500" />
          Derived Summary
        </h2>
      </div>

      <div className="p-4 space-y-3 overflow-y-auto flex-1">
        <StatBox
          label="Total Beats"
          value={summary.totalBeats}
          icon={FileText}
          colorClass="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
        />

        <div className="grid grid-cols-2 gap-3">
          <StatBox
            label="Draft"
            value={summary.draftBeats}
            icon={Clock}
            colorClass="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
          />
          <StatBox
            label="Ready"
            value={summary.readyBeats}
            icon={CheckCircle}
            colorClass="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
          />
          <StatBox
            label="Changed"
            value={summary.changedBeats}
            icon={RotateCcw}
            colorClass="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
          />
          <StatBox
            label="Archived"
            value={summary.archivedBeats}
            icon={Archive}
            colorClass="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          />
        </div>

        {summary.reconciledBatchSize !== undefined && summary.reconciledBatchSize > 0 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-lg flex items-center justify-between">
             <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                  <Activity className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-blue-900 dark:text-blue-200">Reconciled Batch Size</span>
              </div>
              <span className="text-lg font-bold text-blue-700 dark:text-blue-300">{summary.reconciledBatchSize}</span>
          </div>
        )}

        <div className="mt-6">
          <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Session Ledger</h3>
          <div className="space-y-2">
            {history.slice(-5).reverse().map((entry, i) => (
              <div key={i} className="text-[10px] flex gap-2">
                <span className="text-zinc-400 shrink-0">{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                <span className="font-medium text-zinc-700 dark:text-zinc-300 capitalize">{entry.action}</span>
              </div>
            ))}
            {history.length === 0 && (
              <div className="text-xs text-zinc-400 italic">No ledger activity yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
