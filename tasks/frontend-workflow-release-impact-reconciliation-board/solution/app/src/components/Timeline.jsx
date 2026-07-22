import React from 'react';
import { useStore } from '../store';
import { useDroppable } from '@dnd-kit/core';

const STAGES = [
  { id: 'planned', label: 'Planned', color: 'bg-slate-400' },
  { id: 'canary', label: 'Canary', color: 'bg-amber-500' },
  { id: 'paused', label: 'Paused', color: 'bg-red-500' },
  { id: 'shipped', label: 'Shipped', color: 'bg-emerald-500' },
  { id: 'rolled_back', label: 'Rolled Back', color: 'bg-slate-500' }
];

function TimelineLane({ stage }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `timeline-${stage.id}`,
    data: { type: 'timeline', stage: stage.id }
  });

  const rolloutEvents = useStore(state => state.rolloutEvents);
  const entries = useStore(state => state.entries);

  const eventsInStage = rolloutEvents.filter(e => e.stage === stage.id);

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-h-[200px] border-r border-gray-200 p-4 ${isOver ? 'bg-blue-50' : ''}`}
      data-testid={`lane-${stage.id}`}
    >
      <div className="flex items-center gap-2 mb-4 border-b border-gray-200 pb-2">
        <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
        <h3 className="font-semibold text-gray-700">{stage.label}</h3>
      </div>
      <div className="flex flex-col gap-2">
        {eventsInStage.map(event => {
          const entry = entries.find(e => e.id === event.entryId);
          return entry ? (
            <div key={event.id} className="text-xs p-2 bg-white rounded shadow-sm border border-gray-200">
               <div className="font-medium">{entry.title}</div>
               {event.canaryPercent && <div className="text-amber-600 mt-1">{event.canaryPercent}%</div>}
            </div>
          ) : null;
        })}
      </div>
    </div>
  );
}

export function Timeline() {
  return (
    <div className="h-64 border-t border-gray-200 bg-white flex w-full">
      {STAGES.map(s => (
        <TimelineLane key={s.id} stage={s} />
      ))}
    </div>
  );
}
