import React from 'react';
import { useStore } from '../store';
import { useDroppable, useDraggable } from '@dnd-kit/core';

function MappedEntry({ entry, surfaceId }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `mapped-${entry.id}-${surfaceId}`,
        data: { type: 'mapped-entry', entry, surfaceId }
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`text-xs bg-gray-100 p-2 rounded border border-gray-200 cursor-grab ${isDragging ? 'opacity-50' : ''}`}
            data-testid={`mapped-entry-${entry.id}-${surfaceId}`}
        >
            {entry.title}
        </div>
    );
}

function SurfaceNode({ surface }) {
  const { setNodeRef, isOver } = useDroppable({
    id: surface.id,
    data: { type: 'surface', surface }
  });

  const entries = useStore(state => state.entries);
  const impactLinks = useStore(state => state.impactLinks);
  const linksToThis = impactLinks.filter(l => l.surfaceId === surface.id);
  const linkedEntries = linksToThis.map(l => entries.find(e => e.id === l.entryId)).filter(Boolean);

  return (
    <div
      ref={setNodeRef}
      className={`p-4 m-4 border-2 rounded-lg min-w-[200px] text-center ${isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}`}
      data-testid={`surface-${surface.id}`}
    >
      <h3 className="font-semibold text-gray-800 mb-2">{surface.name}</h3>
      <div className="flex flex-col gap-2 min-h-[50px]">
        {linkedEntries.map(entry => (
           <MappedEntry key={`${entry.id}-${surface.id}`} entry={entry} surfaceId={surface.id} />
        ))}
      </div>
    </div>
  );
}

export function ImpactGraph() {
  const surfaces = useStore(state => state.surfaces);

  return (
    <div className="flex-1 overflow-auto bg-slate-50 p-8 flex flex-wrap content-start">
       {surfaces.map(s => (
         <SurfaceNode key={s.id} surface={s} />
       ))}
    </div>
  );
}
