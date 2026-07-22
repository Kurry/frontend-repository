import React, { useState } from 'react';
import { useGlobalState, updateCue } from '../store';

const Branching = () => {
  const [project] = useGlobalState('project');
  const [ui] = useGlobalState('ui');
  const { selectedCueId } = ui;
  const { cues } = project;

  const cue = cues.find(c => c.id === selectedCueId);

  const [branchText, setBranchText] = useState("");

  if (!cue) return <div className="p-4 text-gray-400">Select a cue to inspect branches.</div>;

  const branches = cue.branches || [];

  const handleCreateBranch = () => {
    if (!branchText) return;
    const newBranch = {
      id: `b-${Date.now()}`,
      text: branchText,
      timestamp: Date.now()
    };
    updateCue(cue.id, c => ({ branches: [...(c.branches || []), newBranch] }));
    setBranchText("");
  };

  const handleMergeBranch = (branch) => {
    // Merging resolves conflicts explicitly by taking branch text
    updateCue(cue.id, () => ({ text: branch.text }));
  };

  return (
    <div className="p-4 bg-gray-800 h-full flex flex-col border-l border-gray-700 w-80">
      <h2 className="font-bold border-b border-gray-700 pb-2 mb-4">Cue Inspector</h2>

      <div className="mb-4">
        <label className="text-xs text-gray-400">Current Text</label>
        <textarea
          className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm mt-1 focus:ring-1 focus:ring-blue-500"
          value={cue.text}
          onChange={(e) => updateCue(cue.id, () => ({ text: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
         <div>
            <label className="text-xs text-gray-400">Speaker</label>
            <select
               className="w-full bg-gray-900 border border-gray-700 rounded p-1 text-sm mt-1"
               value={cue.speaker || ''}
               onChange={(e) => updateCue(cue.id, () => ({ speaker: e.target.value }))}
            >
               <option value="">None</option>
               {project.speakers.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
         </div>
         <div>
            <label className="text-xs text-gray-400">Lane</label>
            <select
               className="w-full bg-gray-900 border border-gray-700 rounded p-1 text-sm mt-1"
               value={cue.lane}
               onChange={(e) => updateCue(cue.id, () => ({ lane: parseInt(e.target.value) }))}
            >
               <option value={0}>Speech 1</option>
               <option value={1}>Speech 2</option>
               <option value={2}>Sounds</option>
            </select>
         </div>
      </div>

      <div className="mt-4 border-t border-gray-700 pt-4">
        <h3 className="text-sm font-bold mb-2">Wording Branches</h3>

        <div className="space-y-2 mb-4">
          {branches.map(b => (
            <div key={b.id} className="bg-gray-900 p-2 rounded border border-gray-700 text-sm">
              <div className="text-gray-300 mb-1">{b.text}</div>
              <button
                onClick={() => handleMergeBranch(b)}
                className="text-xs bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded"
              >
                Merge to Master
              </button>
            </div>
          ))}
          {branches.length === 0 && <div className="text-xs text-gray-500">No branches.</div>}
        </div>

        <div className="flex gap-2">
           <input
             type="text"
             className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 text-sm"
             placeholder="New variant..."
             value={branchText}
             onChange={e => setBranchText(e.target.value)}
           />
           <button onClick={handleCreateBranch} className="bg-gray-700 hover:bg-gray-600 px-2 rounded text-sm">+</button>
        </div>
      </div>
    </div>
  );
};

export default Branching;
