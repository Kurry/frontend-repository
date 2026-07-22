import React from 'react';
import { useStore } from '../store';

export function Summary() {
  const { derived } = useStore();

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
      <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-2">Derived Summary</h2>
      <div className="flex gap-4 items-center">
        <div className="text-3xl font-light text-neutral-800">{derived.total}</div>
        <div className="flex-1">
          <div className="text-sm text-neutral-600">Total Pieces</div>
          <div className="text-xs font-medium text-neutral-400 mt-0.5">{derived.summary}</div>
        </div>
      </div>
    </div>
  );
}
