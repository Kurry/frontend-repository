import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ScenarioStatus, ScenarioRecord } from '../types';

interface LaneProps {
  status: ScenarioStatus;
  records: ScenarioRecord[];
  children: React.ReactNode;
}

export const Lane: React.FC<LaneProps> = ({ status, records, children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const titles: Record<ScenarioStatus, string> = {
    draft: 'Draft',
    ready: 'Ready',
    changed: 'Changed',
    conflict: 'Conflict',
    resolved: 'Resolved',
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-72 shrink-0 bg-gray-100/50 rounded-xl border-2 transition-colors ${
        isOver ? 'border-blue-400 bg-blue-50/50' : 'border-transparent'
      }`}
    >
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h3 className="font-semibold text-sm text-gray-700 uppercase tracking-wider">{titles[status]}</h3>
        <span className="text-xs font-medium bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
          {records.length}
        </span>
      </div>
      <div className="p-2 flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
};
