import { useEffect, useRef } from 'react';
import { useStore } from '../store';

export function RepairModal() {
  const { sessionState, repairPreview, nestRequest, cancelSaveRepair, commitSaveRepair } = useStore();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (repairPreview && modalRef.current) {
      modalRef.current.focus();
    }
  }, [repairPreview]);

  if (!repairPreview || !nestRequest) return null;

  const req = nestRequest;
  const dissolvedCap = sessionState.capsules[req.entityId];
  const targetCap = sessionState.capsules[req.requestedParentId];

  if (!dissolvedCap || !targetCap) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 outline-none"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            cancelSaveRepair();
          }
        }}
      >
        <h2 id="modal-title" className="text-2xl font-bold text-gray-800 mb-4">Review one repair</h2>
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg text-sm text-orange-800 mb-6">
          <p className="font-semibold mb-2">The draft hierarchy is invalid (max depth 1).</p>
          <ol className="list-decimal pl-5 space-y-1 mb-4">
            <li>Dissolve <strong>{dissolvedCap.label}</strong></li>
            <li>Splice its children into <strong>{targetCap.label}</strong></li>
            <li>Maintain order and ids</li>
            <li>Recompute schedule</li>
          </ol>

          <div className="text-xs bg-white p-3 rounded border border-orange-100 font-mono">
            <strong>Timing & Transitions</strong><br/>
            {targetCap.label}: {targetCap.durationMinutes}m &rarr; {targetCap.durationMinutes + dissolvedCap.durationMinutes}m<br/>
            {dissolvedCap.label}: {dissolvedCap.status} &rarr; dissolved<br/>
            Transitions: 2 &rarr; 1 (boundary removed)
          </div>
        </div>

        <div className="flex gap-4 justify-end">
          <button
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 font-medium"
            onClick={cancelSaveRepair}
          >
            Cancel Repair
          </button>
          <button
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 font-medium"
            onClick={commitSaveRepair}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
