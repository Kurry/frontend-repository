import React from 'react';
import { useStore } from '../store.jsx';
import { Layers, Activity, AlertTriangle, Volume2 } from 'lucide-react';

export const Summary = () => {
  const { session } = useStore();
  const { summary } = session.derived;

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4" data-testid="derived-summary-panel">
      <h3 className="text-sm font-semibold mb-3 text-slate-300">Session Summary</h3>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-900 rounded p-3 border border-slate-700/50">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1">
            <Layers size={14} />
            <span className="text-xs uppercase tracking-wider">Layers</span>
          </div>
          <div className="text-xl font-semibold text-slate-200" data-testid="summary-total">
            {summary.totalLayers}
          </div>
        </div>

        <div className={`bg-slate-900 rounded p-3 border ${summary.failedLayers > 0 ? 'border-amber-500/50 bg-amber-950/20' : 'border-slate-700/50'}`}>
          <div className={`flex items-center gap-1.5 mb-1 ${summary.failedLayers > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
            <AlertTriangle size={14} />
            <span className="text-xs uppercase tracking-wider">Failed</span>
          </div>
          <div className={`text-xl font-semibold ${summary.failedLayers > 0 ? 'text-amber-400' : 'text-slate-200'}`} data-testid="summary-failed">
            {summary.failedLayers}
          </div>
        </div>

        <div className="bg-slate-900 rounded p-3 border border-slate-700/50">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1">
            <Activity size={14} />
            <span className="text-xs uppercase tracking-wider">Duration</span>
          </div>
          <div className="text-xl font-semibold text-slate-200" data-testid="summary-duration">
            {summary.totalDuration}s
          </div>
        </div>

        <div className="bg-slate-900 rounded p-3 border border-slate-700/50">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1">
            <Volume2 size={14} />
            <span className="text-xs uppercase tracking-wider">Avg Vol</span>
          </div>
          <div className="text-xl font-semibold text-slate-200" data-testid="summary-volume">
            {Math.round(summary.averageVolume)}%
          </div>
        </div>
      </div>
    </div>
  );
};
