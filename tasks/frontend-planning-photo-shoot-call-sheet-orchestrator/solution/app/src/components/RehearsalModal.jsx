import React, { useState } from 'react';
import { useStore } from '../store';

export default function RehearsalModal() {
  const activeDisruptionId = useStore(state => state.activeDisruption);
  const triggerDisruption = useStore(state => state.triggerDisruption);
  const disruptions = useStore(state => state.disruptions);
  const branchSchedule = useStore(state => state.branchSchedule);

  const [branchName, setBranchName] = useState('');

  const disruption = disruptions.find(d => d.id === activeDisruptionId);

  if (!disruption) return null;

  const handleBranch = () => {
    branchSchedule(branchName || `Recovery from ${disruption.type}`);
    triggerDisruption(null); // Close modal
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95">
        <div className="bg-red-600 text-white p-4">
          <h2 id="modal-title" className="text-xl font-bold">Disruption Alert</h2>
          <p className="text-sm opacity-90 mt-1">Logical rehearsal injected an event.</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-red-50 text-red-900 p-3 rounded border border-red-200">
            <strong>Event:</strong> {disruption.description} <br />
            {disruption.targetId && <span><strong>Target:</strong> {disruption.targetId}</span>}
          </div>

          <p className="text-sm text-gray-600 leading-relaxed">
            Completed shots, active resources, and release history prior to this moment remain immutable. You must fork a recovery branch to resolve remaining dependencies.
          </p>

          <div className="space-y-2">
            <label htmlFor="branchName" className="block text-sm font-medium text-gray-700">Recovery Branch Name</label>
            <input
              id="branchName"
              type="text"
              className="w-full border border-gray-300 rounded p-2 text-sm focus:ring focus:ring-blue-200 focus:border-blue-500"
              placeholder={`Recovery: ${disruption.description}`}
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={() => triggerDisruption(null)}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded motion-safe:transition-colors focus:ring"
          >
            Cancel
          </button>
          <button
            onClick={handleBranch}
            className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded shadow-sm motion-safe:transition-colors focus:ring focus:ring-red-300"
          >
            Branch & Repair
          </button>
        </div>
      </div>
    </div>
  );
}
