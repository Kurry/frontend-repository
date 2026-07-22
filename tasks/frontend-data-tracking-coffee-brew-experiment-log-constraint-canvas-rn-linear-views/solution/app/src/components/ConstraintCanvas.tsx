import React, { useState } from 'react';
import type { Experiment, ConstraintLane } from '../types';

interface Props {
  experiments: Experiment[];
  selectedExperimentId: string | null;
  onMoveExperiment: (id: string, newLane: ConstraintLane) => void;
  onSelectExperiment: (id: string) => void;
  onResolveConflict: (id: string) => void;
}

export const ConstraintCanvas: React.FC<Props> = ({
  experiments,
  selectedExperimentId,
  onMoveExperiment,
  onSelectExperiment,
  onResolveConflict,
}) => {
  const lanes: { id: ConstraintLane; label: string }[] = [
    { id: 'temperature', label: 'Temperature' },
    { id: 'grindSize', label: 'Grind Size' },
    { id: 'brewTime', label: 'Brew Time' },
  ];

  const handleDrop = (e: React.DragEvent, lane: ConstraintLane) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) {
      onMoveExperiment(id, lane);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string, currentLane: ConstraintLane) => {
    if (!selectedExperimentId || selectedExperimentId !== id) return;

    const currentIndex = lanes.findIndex(l => l.id === currentLane);

    if (e.key === 'ArrowRight' && currentIndex < lanes.length - 1) {
      e.preventDefault();
      onMoveExperiment(id, lanes[currentIndex + 1].id);
    } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
      e.preventDefault();
      onMoveExperiment(id, lanes[currentIndex - 1].id);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const exp = experiments.find(ex => ex.id === id);
      if (exp?.status === 'conflict') {
        onResolveConflict(id);
      }
    }
  };

  // Touch handlers
  const [touchState, setTouchState] = useState<{ id: string, initialLane: ConstraintLane } | null>(null);

  const handleTouchStart = (id: string, lane: ConstraintLane) => {
    setTouchState({ id, initialLane: lane });
    onSelectExperiment(id);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchState) return;
    const touch = e.changedTouches[0];
    const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
    const laneTarget = dropTarget?.closest('[data-lane-id]');

    if (laneTarget) {
      const newLane = laneTarget.getAttribute('data-lane-id') as ConstraintLane;
      if (newLane && newLane !== touchState.initialLane) {
        onMoveExperiment(touchState.id, newLane);
      }
    }
    setTouchState(null);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 h-full min-h-[400px]">
      {lanes.map((lane) => (
        <div
          key={lane.id}
          className="flex-1 bg-white rounded-lg shadow-sm p-4 border border-gray-200 flex flex-col transition-colors min-w-[250px]"
          onDrop={(e) => handleDrop(e, lane.id)}
          onDragOver={handleDragOver}
          data-testid={`lane-${lane.id}`}
          data-lane-id={lane.id}
        >
          <h3 className="font-semibold text-gray-700 mb-4 pb-2 border-b">{lane.label}</h3>
          <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
            {experiments
              .filter((e) => e.lane === lane.id && e.status !== 'archived')
              .map((exp) => (
                <div
                  key={exp.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', exp.id);
                    onSelectExperiment(exp.id);
                  }}
                  onTouchStart={() => handleTouchStart(exp.id, lane.id)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={(e) => e.preventDefault()} // prevent scrolling while dragging
                  onKeyDown={(e) => handleKeyDown(e, exp.id, lane.id)}
                  onClick={() => onSelectExperiment(exp.id)}
                  tabIndex={0}
                  className={`
                    p-3 rounded-md cursor-grab active:cursor-grabbing border-2 outline-none
                    transition-all motion-reduce:transition-none duration-300 ease-in-out transform
                    ${selectedExperimentId === exp.id ? 'border-blue-500 shadow-md ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}
                    ${exp.status === 'conflict' ? 'bg-red-50 border-red-300' : 'bg-gray-50'}
                    ${exp.status === 'resolved' ? 'bg-green-50 border-green-300' : ''}
                    focus:ring-2 focus:ring-blue-400
                  `}
                  data-testid={`experiment-card-${exp.id}`}
                >
                  <div className="font-medium">{exp.name}</div>
                  <div className="text-sm text-gray-500 mt-1 capitalize">{exp.status}</div>
                  {exp.status === 'conflict' && (
                     <button
                       onClick={(e) => {
                         e.stopPropagation();
                         onResolveConflict(exp.id);
                       }}
                       onTouchEnd={(e) => {
                         e.stopPropagation();
                         onResolveConflict(exp.id);
                       }}
                       className="mt-2 w-full text-xs bg-red-100 text-red-700 py-1 px-2 rounded hover:bg-red-200 transition-colors"
                     >
                       Resolve Conflict
                     </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};
