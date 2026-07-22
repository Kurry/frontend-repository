import React, { useState } from 'react';
import { useStore } from '../store.js';
import { selectConflicts, selectCohortStats } from '../selectors.js';
import { useDraggable } from '@dnd-kit/core';

const UnplacedSession = ({ session }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `unplaced-${session.id}`,
    data: { session }
  });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="p-2 border rounded bg-white shadow-sm cursor-move mb-2 text-sm z-50">
      <div className="font-semibold">{session.title}</div>
      <div className="text-xs text-gray-500">Cap: {session.capacity} | {session.duration}m</div>
    </div>
  );
};

export const Inspector = () => {
  const [tab, setTab] = useState('unplaced');
  const state = useStore();
  const { sessions, placements } = state;
  const conflicts = selectConflicts(state);
  const cohortStats = selectCohortStats(state);

  const unplaced = sessions.filter(s => !placements.some(p => p.sessionId === s.id));

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b bg-white">
        <button className={`flex-1 p-2 text-sm ${tab === 'unplaced' ? 'border-b-2 border-blue-600 font-bold' : ''}`} onClick={() => setTab('unplaced')}>Unplaced ({unplaced.length})</button>
        <button className={`flex-1 p-2 text-sm ${tab === 'issues' ? 'border-b-2 border-red-600 font-bold text-red-600' : ''}`} onClick={() => setTab('issues')}>Issues ({conflicts.length})</button>
        <button className={`flex-1 p-2 text-sm ${tab === 'cohorts' ? 'border-b-2 border-blue-600 font-bold' : ''}`} onClick={() => setTab('cohorts')}>Cohorts</button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {tab === 'unplaced' && (
          <div>
            <h3 className="font-bold mb-2 text-sm text-gray-700">Drag to schedule</h3>
            {unplaced.map(s => <UnplacedSession key={s.id} session={s} />)}
          </div>
        )}

        {tab === 'issues' && (
          <div className="space-y-3">
            {conflicts.length === 0 ? (
              <div className="text-sm text-green-600">No conflicts!</div>
            ) : (
              conflicts.map((c, i) => (
                <div key={i} className="p-2 border border-red-300 bg-red-50 rounded text-sm text-red-900">
                  <div className="font-semibold capitalize">{c.type.replace('_', ' ')} Error</div>
                  <div>{c.message}</div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'cohorts' && (
          <div className="space-y-4">
            {cohortStats.map(c => (
              <div key={c.id} className="border p-2 rounded bg-white text-sm">
                <div className="font-bold">{c.name} (Total: {c.size})</div>
                <div className="text-green-700">Served: {c.served}</div>
                {c.unserved > 0 && <div className="text-red-600 font-bold">Unserved Overflow: {c.unserved}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
