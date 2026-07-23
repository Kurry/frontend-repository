import React from 'react';
import { useStore } from '../store';

const ObjectiveRails = () => {
  const { objectives } = useStore();

  return (
    <div className="w-64 border-r border-slate-200 bg-slate-50 flex flex-col overflow-y-auto">
      <div className="p-4 font-bold border-b border-slate-200">Objectives</div>
      {objectives.map(obj => (
        <div key={obj.id} className="p-4 border-b border-slate-200 text-sm">
          <div className="font-semibold">{obj.title}</div>
          <div className="text-slate-500 text-xs mt-1">Target: {obj.targetMinutes}m | Weight: {obj.weightBps}</div>
        </div>
      ))}
    </div>
  );
};

export default ObjectiveRails;
