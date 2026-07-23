import React, { useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';

export const ChronologyBrush: React.FC = () => {
  const store = useAppStore();
  const report = store.reports.find(r => r.id === 'RP-07');
  if (!report || !report.contextWindow) return null;

  const { startSequence, endSequence, completenessNumerator, completenessDenominator } = report.contextWindow;

  const [localStart, setLocalStart] = useState(startSequence);
  const [localEnd, setLocalEnd] = useState(endSequence);
  const [isDragging, setIsDragging] = useState<'left' | 'right' | null>(null);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [pendingPromotion, setPendingPromotion] = useState<{ start: number, end: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const totalSequences = 24;

  const handlePointerDown = (e: React.PointerEvent, handle: 'left' | 'right') => {
    setIsDragging(handle);
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const fraction = x / rect.width;
    const seq = Math.max(1, Math.min(totalSequences, Math.round(fraction * totalSequences)));

    if (isDragging === 'left') {
      setLocalStart(Math.min(seq, localEnd));
    } else {
      setLocalEnd(Math.max(seq, localStart));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(null);
    e.target.releasePointerCapture(e.pointerId);

    // If target is missed (MSG-17), return to valid bounds
    if (localStart > 17 || localEnd < 17) {
      setLocalStart(startSequence);
      setLocalEnd(endSequence);
      return;
    }

    // Check for promotion requirement if root (MSG-01) is not in interval
    if (localStart > 1) {
      setPendingPromotion({ start: localStart, end: localEnd });
      setShowPromoteModal(true);
    } else {
      store.updateContextWindow('RP-07', localStart, localEnd, []);
    }
  };

  const confirmPromotion = () => {
    if (pendingPromotion) {
      store.updateContextWindow('RP-07', pendingPromotion.start, pendingPromotion.end, ['MSG-01']);
    }
    setShowPromoteModal(false);
    setPendingPromotion(null);
  };

  const cancelPromotion = () => {
    setLocalStart(startSequence);
    setLocalEnd(endSequence);
    setShowPromoteModal(false);
    setPendingPromotion(null);
  };

  const renderTicks = () => {
    const ticks = [];
    for (let i = 1; i <= totalSequences; i++) {
      ticks.push(
        <div
          key={i}
          className="absolute h-full w-px bg-gray-300"
          style={{ left: `${(i / totalSequences) * 100}%` }}
        />
      );
    }
    return ticks;
  };

  return (
    <div className="mb-6 select-none relative">
      <div className="flex justify-between mb-2 text-sm text-gray-600">
        <span>Completeness: {((completenessNumerator / completenessDenominator) * 100).toFixed(2)}% ({completenessNumerator}/{completenessDenominator})</span>
        <span>Selected: {localStart} - {localEnd}</span>
      </div>

      <div
        ref={containerRef}
        className="relative h-12 bg-gray-100 rounded border border-gray-200 overflow-hidden"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {renderTicks()}

        <div
          className="absolute h-full bg-blue-200 opacity-50"
          style={{
            left: `${(localStart / totalSequences) * 100}%`,
            width: `${((localEnd - localStart) / totalSequences) * 100}%`
          }}
        />

        <div
          className="absolute h-full w-1 bg-red-500 z-10"
          style={{ left: `${(17 / totalSequences) * 100}%` }}
          title="Target Message (MSG-17)"
        />

        <div
          className="absolute h-full w-4 bg-blue-500 cursor-ew-resize z-20 flex items-center justify-center transform -translate-x-1/2"
          style={{ left: `${(localStart / totalSequences) * 100}%` }}
          onPointerDown={(e) => handlePointerDown(e, 'left')}
          tabIndex={0}
        >
          <div className="w-1 h-4 bg-white rounded-full"></div>
        </div>

        <div
          className="absolute h-full w-4 bg-blue-500 cursor-ew-resize z-20 flex items-center justify-center transform -translate-x-1/2"
          style={{ left: `${(localEnd / totalSequences) * 100}%` }}
          onPointerDown={(e) => handlePointerDown(e, 'right')}
          tabIndex={0}
        >
          <div className="w-1 h-4 bg-white rounded-full"></div>
        </div>
      </div>

      {showPromoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Promote Required Ancestry</h3>
            <p className="mb-6">The root message MSG-01 is required for context but lies outside the selected interval. Promote it to include it in the context?</p>
            <div className="flex justify-end space-x-4">
              <button onClick={cancelPromotion} className="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
              <button onClick={confirmPromotion} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Confirm Promotion</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
