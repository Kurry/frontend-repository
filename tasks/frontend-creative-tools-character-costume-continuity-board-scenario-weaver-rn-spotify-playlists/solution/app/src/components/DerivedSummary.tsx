import React from 'react';
import { useStore, computeDerived } from '../store';
import { Layers, CheckCircle2, Film } from 'lucide-react';

export function DerivedSummary() {
  const records = useStore(state => state.records);
  const derived = computeDerived(records);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 bg-surface-hover rounded-md">
        <div className="flex items-center gap-3 text-text-muted">
          <Layers size={18} />
          <span className="text-sm">Total Looks</span>
        </div>
        <span className="text-lg font-bold text-white">{derived.totalLooks}</span>
      </div>

      <div className="flex items-center justify-between p-3 bg-surface-hover rounded-md">
        <div className="flex items-center gap-3 text-text-muted">
          <CheckCircle2 size={18} className="text-primary" />
          <span className="text-sm">Ready</span>
        </div>
        <span className="text-lg font-bold text-white">{derived.readyCount}</span>
      </div>

      <div className="flex items-center justify-between p-3 bg-surface-hover rounded-md">
        <div className="flex items-center gap-3 text-text-muted">
          <Film size={18} />
          <span className="text-sm">Scenes Impacted</span>
        </div>
        <span className="text-sm font-medium text-white truncate max-w-[120px]" title={derived.scenesImpacted.join(', ')}>
          {derived.scenesImpacted.length > 0 ? derived.scenesImpacted.join(', ') : 'None'}
        </span>
      </div>
    </div>
  );
}
