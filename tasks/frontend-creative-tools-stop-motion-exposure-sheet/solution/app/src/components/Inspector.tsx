import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Camera, AlertCircle } from 'lucide-react';

export const Inspector: React.FC = () => {
  const {
    currentFrame, selectedRangeIds, ranges,
    continuityFacts, activeTakeId, takes,
    recordEvent, forkTake, approveCut, approvals,
    logicalClock, splitRange, mergeTake
  } = useStore();

  const [mergeSource, setMergeSource] = useState('');

  const selectedRanges = ranges.filter(r => selectedRangeIds.includes(r.id));
  const activeApproval = approvals[approvals.length - 1];

  const relevantFacts = continuityFacts.filter(f => currentFrame >= f.startFrame && currentFrame <= f.endFrame);

  return (
    <div className="bg-white border border-gray-200 rounded shadow-sm flex flex-col h-full overflow-y-auto">
      <div className="p-2 bg-gray-100 border-b border-gray-200 text-sm font-semibold sticky top-0">Inspector</div>

      <div className="p-3 space-y-4">
        {/* Takes & Approval */}
        <div className="border border-gray-200 rounded p-2 text-sm">
          <h3 className="font-semibold mb-2">Cut & Branching</h3>
          <div className="flex items-center gap-2 mb-2 text-xs">
            Status:
            <span className={`px-2 py-0.5 rounded text-white ${activeApproval?.status === 'approved' ? 'bg-green-500' : 'bg-red-500'}`}>
              {activeApproval?.status || 'None'}
            </span>
            <span>Rev: {activeApproval?.cutRevision || 0}</span>
          </div>
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded p-1 mb-2 text-xs"
            onClick={approveCut}
          >
            Approve Cut
          </button>

          <div className="flex justify-between items-center mt-2 pt-2 border-t text-xs">
            <span className="text-gray-500">Take: {takes.find(t => t.id === activeTakeId)?.name}</span>
            <button
              className="bg-gray-100 border rounded px-2 hover:bg-gray-200"
              onClick={() => forkTake(activeTakeId, `Take Fork ${Date.now()}`)}
            >
              Fork
            </button>
          </div>

          <div className="mt-2 pt-2 border-t text-xs flex gap-1 flex-col">
             <label className="text-gray-600">Merge Take into Current:</label>
             <div className="flex gap-1">
               <select
                 className="border rounded px-1 flex-1 bg-white"
                 value={mergeSource}
                 onChange={e => setMergeSource(e.target.value)}
               >
                 <option value="">Select source...</option>
                 {takes.filter(t => t.id !== activeTakeId).map(t => (
                   <option key={t.id} value={t.id}>{t.name}</option>
                 ))}
               </select>
               <button
                 className="bg-gray-100 border rounded px-2 hover:bg-gray-200 disabled:opacity-50"
                 disabled={!mergeSource}
                 onClick={() => mergeTake(activeTakeId, mergeSource, 0, 503)}
               >
                 Merge
               </button>
             </div>
          </div>
        </div>

        {/* Action / Capture */}
        <div className="border border-gray-200 rounded p-2 text-sm">
          <h3 className="font-semibold mb-2">Capture Event</h3>
          <p className="text-xs text-gray-500 mb-2">Logical Clock: {logicalClock}</p>
          <div className="grid grid-cols-2 gap-2">
            <button className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded p-1 text-xs border border-emerald-300 flex items-center justify-center gap-1"
              onClick={() => recordEvent('capture', currentFrame, activeTakeId)}>
              <Camera size={14} /> Capture
            </button>
            <button className="bg-orange-100 hover:bg-orange-200 text-orange-800 rounded p-1 text-xs border border-orange-300"
              onClick={() => recordEvent('retake', currentFrame, activeTakeId)}>
              Retake
            </button>
            <button className="bg-red-100 hover:bg-red-200 text-red-800 rounded p-1 text-xs border border-red-300"
              onClick={() => recordEvent('mark-missing', currentFrame, activeTakeId)}>
              Mark Missing
            </button>
            <button className="bg-gray-100 hover:bg-gray-200 text-gray-800 rounded p-1 text-xs border border-gray-300"
              onClick={() => recordEvent('restore', currentFrame, activeTakeId)}>
              Restore
            </button>
          </div>
        </div>

        {/* Selection */}
        {selectedRanges.length > 0 && (
          <div className="border border-gray-200 rounded p-2 text-sm">
            <h3 className="font-semibold mb-2 flex justify-between items-center">
              Selection
              <button
                className="bg-blue-100 text-blue-800 border border-blue-300 rounded px-2 hover:bg-blue-200 text-xs"
                onClick={() => selectedRanges.forEach(r => splitRange(r.id, currentFrame))}
              >
                Split at {currentFrame}
              </button>
            </h3>
            <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
              {selectedRanges.map(r => (
                <li key={r.id} className="bg-gray-50 p-1 rounded border">
                  <div>ID: {r.id}</div>
                  <div>Frames: {r.startFrame} - {r.endFrame}</div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Continuity */}
        <div className="border border-gray-200 rounded p-2 text-sm">
          <h3 className="font-semibold mb-2 flex items-center gap-1"><AlertCircle size={14}/> Continuity</h3>
          {relevantFacts.length > 0 ? (
            <ul className="text-xs space-y-2">
              {relevantFacts.map(f => (
                <li key={f.id} className="bg-yellow-50 p-1.5 rounded border border-yellow-200">
                  <div className="font-semibold">{f.objectId}</div>
                  <div>Owner: {f.ownerId}</div>
                  <div>Pos: {f.positionClass} | Ori: {f.orientation}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-500">No active continuity constraints.</p>
          )}
        </div>
      </div>
    </div>
  );
};
