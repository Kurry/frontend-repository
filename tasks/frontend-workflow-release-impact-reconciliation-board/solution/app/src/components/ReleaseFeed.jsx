import React from 'react';
import { useStore } from '../store';
import { useDraggable } from '@dnd-kit/core';

function EntryItem({ entry }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: entry.id,
    data: { type: 'entry', entry }
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`p-3 mb-2 bg-white border rounded shadow-sm cursor-grab ${isDragging ? 'opacity-50 border-blue-500' : 'border-gray-200'}`}
      data-testid={`entry-${entry.id}`}
    >
      <div className="flex justify-between items-start mb-1">
        <h4 className="font-medium text-sm text-gray-900">{entry.title}</h4>
        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{entry.changeType}</span>
      </div>
      <div className="text-xs text-gray-500">Status: {entry.status}</div>
    </div>
  );
}

export function ReleaseFeed() {
  const entries = useStore(state => state.entries);
  const unmappedEntries = entries.filter(e => e.status !== 'archived' && e.status !== 'duplicate_candidate' && e.status !== 'merged');

  return (
    <div className="w-80 border-r border-gray-200 bg-gray-50 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold">Release Notes</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {unmappedEntries.map(entry => (
          <EntryItem key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}
