import React from 'react';
import { useStore } from '../store';

export const DepthRail: React.FC = () => {
  const { cutouts, selectedCutoutId, stagedDepthMove, previewDepthMove, commitDepthMove, cancelDepthMove } = useStore();
  const selectedCutout = selectedCutoutId ? cutouts[selectedCutoutId] : null;

  if (!selectedCutout) {
    return <div className="p-4 text-sm text-gray-500">Select a cutout to edit depth</div>;
  }

  const minSlot = selectedCutout.allowedSlotMin;
  const maxSlot = selectedCutout.allowedSlotMax;
  const currentSlot = stagedDepthMove ? stagedDepthMove.newSlot : selectedCutout.depthSlot;

  return (
    <div className="p-4 border-t border-gray-200 bg-white">
      <h3 className="text-sm font-semibold mb-2">Depth Rail: {selectedCutout.id}</h3>
      <div className="flex gap-2">
        {Array.from({ length: 7 }).map((_, i) => {
          const isAllowed = i >= minSlot && i <= maxSlot;
          const isSelected = i === currentSlot;
          const isOriginal = i === selectedCutout.depthSlot;
          return (
            <button
              key={i}
              disabled={!isAllowed}
              className={`w-10 h-10 border flex flex-col items-center justify-center font-mono text-xs
                ${isSelected ? 'bg-blue-500 text-white border-blue-600' : 'bg-gray-50'}
                ${!isAllowed ? 'opacity-30 cursor-not-allowed' : 'hover:bg-blue-100 cursor-pointer'}
              `}
              onClick={() => previewDepthMove(selectedCutout.id, i)}
            >
              <span className="font-bold">{i}</span>
              {isOriginal && <span className="text-[9px] uppercase tracking-tighter opacity-80">Orig</span>}
            </button>
          );
        })}
      </div>

      {stagedDepthMove && stagedDepthMove.newSlot !== selectedCutout.depthSlot && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-sm">
          <p className="text-xs text-yellow-800 mb-2 font-mono">
            <strong>Revision Guard:</strong> Move {selectedCutout.id} from slot {selectedCutout.depthSlot} to {stagedDepthMove.newSlot}?
            This will alter projection bounding boxes, recalculate deterministic half-open overlap intersections, and mutate assembly steps and spacer counts.
          </p>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-gray-200 text-sm hover:bg-gray-300 font-semibold" onClick={cancelDepthMove}>Cancel</button>
            <button className="px-4 py-2 bg-blue-600 text-white text-sm hover:bg-blue-700 font-semibold shadow-sm" onClick={commitDepthMove}>Confirm Move</button>
          </div>
        </div>
      )}
    </div>
  );
};
