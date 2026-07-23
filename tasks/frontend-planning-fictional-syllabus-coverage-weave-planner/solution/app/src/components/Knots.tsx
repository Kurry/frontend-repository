import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '../store';

const Knot = ({ knot }: { knot: any }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: knot.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-2 mb-2 bg-blue-100 border border-blue-300 rounded text-xs shadow-sm cursor-grab ${isDragging ? 'z-50' : ''}`}
    >
      <div className="font-semibold text-blue-800">{knot.id}</div>
      <div className="text-blue-600">{knot.objectiveId} ({knot.minutes}m)</div>
    </div>
  );
};

const Knots = ({ sessionId }: { sessionId: string }) => {
  const { workspace, scenarios } = useStore();
  const activeScenario = scenarios.find(s => s.id === workspace.activeScenarioId);
  const knots = activeScenario?.allocations.filter(a => a.sessionId === sessionId).sort((a, b) => a.order - b.order) || [];

  return (
    <div className="flex flex-col">
      {knots.map(knot => (
        <Knot key={knot.id} knot={knot} />
      ))}
    </div>
  );
};

export default Knots;
