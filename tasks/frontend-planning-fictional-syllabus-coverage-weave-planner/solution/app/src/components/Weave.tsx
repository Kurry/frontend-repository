import React, { useState } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import ObjectiveRails from './ObjectiveRails';
import SessionRunway from './SessionRunway';
import { useStore } from '../store';

const Weave = () => {
  const store = useStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingMove, setPendingMove] = useState<any>(null);

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    setActiveId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setPendingMove({ knotId: active.id, toSessionId: over.id, toOrder: 0, toOffsetMinutes: 0, minutes: 30 });
      setShowConfirm(true);
    }
  };

  const commitMove = () => {
    if (pendingMove) {
      store.moveAllocation(pendingMove.knotId, pendingMove.toSessionId, pendingMove.toOrder, pendingMove.toOffsetMinutes, pendingMove.minutes, new Date().toISOString());
    }
    setShowConfirm(false);
    setPendingMove(null);
  };

  const cancelMove = () => {
    setShowConfirm(false);
    setPendingMove(null);
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
      <div className="flex h-full w-full overflow-auto relative">
        <ObjectiveRails />
        <SessionRunway />
      </div>

      {showConfirm && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">Confirm Allocation Move</h3>
            <p className="mb-6">Move allocation to {pendingMove?.toSessionId}?</p>
            <div className="flex justify-end space-x-2">
              <button className="px-4 py-2 border rounded" onClick={cancelMove}>Cancel</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={commitMove}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </DndContext>
  );
};

export default Weave;
