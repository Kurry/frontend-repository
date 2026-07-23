import React from 'react';
import { useStore } from '../store';

const Toolbar = () => {
  const { workspace, forkScenario, compareScenarios, startRehearsal, approvePlan } = useStore();

  return (
    <div className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-4">
      <div className="font-bold">Fictional Syllabus Coverage-Weave Planner</div>
      <div className="flex space-x-2">
        <button className="px-3 py-1 bg-slate-100 rounded text-sm hover:bg-slate-200" onClick={() => forkScenario(workspace.activeScenarioId, 'Recovery')}>Compare Recovery</button>
        <button className="px-3 py-1 bg-slate-100 rounded text-sm hover:bg-slate-200" onClick={startRehearsal}>Rehearse</button>
        <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700" onClick={approvePlan}>Approve Plan</button>
      </div>
    </div>
  );
};

export default Toolbar;
