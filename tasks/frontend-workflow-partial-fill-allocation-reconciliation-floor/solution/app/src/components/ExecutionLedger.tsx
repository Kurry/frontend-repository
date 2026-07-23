import React, { useState } from 'react';
import { useAppStore } from '../store/store';

export const ExecutionLedger: React.FC = () => {
  const { fills, currentTime, scrubToTime } = useAppStore();
  const sortedFills = [...fills].sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());

  return (
    <div className="p-2 border mt-2">
      <h3 className="font-bold">Execution Ledger</h3>
      <div className="flex overflow-x-auto gap-2 py-2">
        {sortedFills.map(f => (
          <div
            key={f.id}
            className={`flex-shrink-0 p-2 border cursor-pointer ${currentTime === f.occurredAt ? 'bg-blue-200' : 'bg-gray-50'}`}
            onClick={() => scrubToTime(f.occurredAt)}
          >
            <div className="text-xs font-bold">{f.id}</div>
            <div className="text-xs">{new Date(f.occurredAt).toLocaleTimeString()}</div>
          </div>
        ))}
        <button className="text-xs text-blue-500 underline" onClick={() => scrubToTime(null)}>Clear Scrub</button>
      </div>
    </div>
  );
};
