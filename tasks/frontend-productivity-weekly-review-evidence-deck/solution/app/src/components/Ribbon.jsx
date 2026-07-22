import React from 'react';
import { useAppState, useAppDispatch } from '../store';

export default function Ribbon() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  const { commitments, events, allocations } = state;

  return (
    <div className="border p-4 mb-4 rounded bg-white" data-testid="ribbon">
      <h2 className="text-xl font-bold mb-2">Planned-versus-observed Ribbon</h2>
      <div className="space-y-4">
        {commitments.slice(0, 5).map(c => {
          const cAllocations = allocations.filter(a => a.commitmentId === c.id);
          const allocatedMinutes = cAllocations.reduce((acc, a) => {
            const event = events.find(e => e.id === a.eventId);
            return acc + (event ? event.observedMinutes * (a.percentage / 100) : 0);
          }, 0);

          return (
            <div key={c.id} className="border p-2">
              <div className="font-semibold">{c.title}</div>
              <div className="text-sm">Planned: {c.plannedMinutes} mins</div>
              <div className="text-sm">Observed/Allocated: {allocatedMinutes} mins</div>
              <div className="mt-2 flex space-x-2">
                <button
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                  onClick={() => dispatch({
                    type: 'LINK_EVIDENCE',
                    payload: { commitmentId: c.id, eventId: events[0].id, percentage: 100 }
                  })}
                >
                  Link Evidence
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
