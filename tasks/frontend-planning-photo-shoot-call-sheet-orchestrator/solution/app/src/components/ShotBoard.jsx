import React from 'react';
import { useStore } from '../store';
import { DndContext, useDraggable } from '@dnd-kit/core';

function ShotCard({ shot }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: shot.id,
    data: { type: 'shot', shot }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const statusColors = {
    required: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    scheduled: 'bg-blue-50 border-blue-200 text-blue-800',
    'captured-simulated': 'bg-green-50 border-green-200 text-green-800',
    alternate: 'bg-purple-50 border-purple-200 text-purple-800',
    'dropped-with-reason': 'bg-gray-100 border-gray-300 text-gray-500',
    verified: 'bg-emerald-100 border-emerald-300 text-emerald-900',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`border rounded p-3 mb-2 shadow-sm cursor-grab active:cursor-grabbing text-sm motion-safe:transition-shadow ${statusColors[shot.status] || 'bg-white'}`}
      role="button"
      tabIndex={0}
      aria-label={`${shot.title}, Status: ${shot.status}`}
    >
      <div className="font-semibold">{shot.title}</div>
      <div className="text-xs opacity-80 flex justify-between mt-1">
        <span>{shot.composition}</span>
        <span>{shot.duration}m</span>
      </div>
      <div className="text-[10px] mt-2 uppercase tracking-wide opacity-60">
        Zone: {shot.locationId}
      </div>
    </div>
  );
}

export default function ShotBoard() {
  const shots = useStore(state => state.shots);
  const moveShot = useStore(state => state.moveShot);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && over.id === 'un-schedule-zone') {
      moveShot(active.id, { scheduledTime: null, status: 'required' });
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-3 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
        <h2 className="font-bold text-gray-800">Shot List & Coverage</h2>
        <div className="text-xs text-gray-500 mt-1 flex gap-2">
          <span>{shots.filter(s => s.status === 'required').length} req</span>
          <span>{shots.filter(s => s.status === 'scheduled').length} sch</span>
          <span>{shots.filter(s => s.status === 'captured-simulated').length} cap</span>
        </div>
      </div>

      <div className="p-3 overflow-y-auto flex-1">
        <DndContext onDragEnd={handleDragEnd}>
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Required</h3>
              {shots.filter(s => s.status === 'required').map(shot => (
                <ShotCard key={shot.id} shot={shot} />
              ))}
              {shots.filter(s => s.status === 'required').length === 0 && (
                <div className="text-xs text-gray-400 italic">None</div>
              )}
            </div>

            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Scheduled</h3>
              {shots.filter(s => s.status === 'scheduled').map(shot => (
                <ShotCard key={shot.id} shot={shot} />
              ))}
              {shots.filter(s => s.status === 'scheduled').length === 0 && (
                <div className="text-xs text-gray-400 italic">None</div>
              )}
            </div>
          </div>
        </DndContext>
      </div>
    </div>
  );
}
