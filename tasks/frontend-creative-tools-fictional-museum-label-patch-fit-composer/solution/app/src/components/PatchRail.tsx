import React from 'react';
import { useStore } from '../store/index';
import { Patch } from '../store/data';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useDrag } from './DragDropContext';

const PatchCard: React.FC<{ patch: Patch }> = ({ patch }) => {
  const { setActivePatchId, setConfirming } = useDrag();

  return (
    <div
      className="bg-white p-4 rounded border border-gray-200 shadow-sm mb-3 cursor-pointer hover:border-blue-300 transition-colors"
      onClick={() => {
        if (patch.status === 'pending' || patch.status === 'stale') {
           setActivePatchId(patch.id);
           setConfirming(true);
        }
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">{patch.id}</div>
        <div>
          {patch.status === 'pending' && <Clock className="w-4 h-4 text-yellow-500" />}
          {patch.status === 'accepted' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
          {patch.status === 'rejected' && <XCircle className="w-4 h-4 text-red-500" />}
          {patch.status === 'stale' && <span className="text-xs text-orange-500 font-semibold border border-orange-500 rounded px-1">STALE</span>}
        </div>
      </div>
      <div className="text-sm mb-2">
        <span className="line-through text-red-700 bg-red-50">{patch.originalText}</span>
        <br />
        <span className="text-green-800 bg-green-50">{patch.replacementText}</span>
      </div>
      <div className="text-xs text-gray-500 flex justify-between">
        <span>By {patch.editorId}</span>
        <span>{patch.rationale}</span>
      </div>
      <div className="mt-2 text-xs text-blue-600 font-semibold opacity-0 hover:opacity-100 transition-opacity">
        Click to apply
      </div>
    </div>
  );
};

export const PatchRail: React.FC = () => {
  const patches = useStore((state) => Object.values(state.patches));

  return (
    <div className="w-80 bg-gray-50 p-4 border-l border-gray-200 flex flex-col h-full overflow-y-auto">
      <h3 className="font-semibold text-gray-700 mb-4 uppercase tracking-wider text-sm">Patches</h3>
      {patches.length === 0 ? (
        <div className="text-sm text-gray-500 italic text-center mt-10">No patches available.</div>
      ) : (
        patches.map(p => <PatchCard key={p.id} patch={p} />)
      )}
    </div>
  );
};
