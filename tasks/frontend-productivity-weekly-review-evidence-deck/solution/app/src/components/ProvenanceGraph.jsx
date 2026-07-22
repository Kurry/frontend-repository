import React from 'react';
import { useAppState } from '../store';

export default function ProvenanceGraph() {
  const state = useAppState();
  const { events, commitments, allocations } = state;

  return (
    <div className="border p-4 mb-4 rounded bg-white" data-testid="provenance-graph">
      <h2 className="text-xl font-bold mb-2">Provenance Graph</h2>
      <div className="text-sm text-gray-600 mb-2">
        Showing top events and their links to commitments.
      </div>
      <div className="space-y-2">
        {events.slice(0, 5).map(e => {
          const links = allocations.filter(a => a.eventId === e.id);
          const totalAllocation = links.reduce((acc, a) => acc + a.percentage, 0);

          return (
            <div key={e.id} className="border p-2">
              <div className="font-semibold">{e.title} ({e.observedMinutes} mins)</div>
              <div className="text-sm">Total Allocated: {totalAllocation}%</div>
              {links.length > 0 && (
                <ul className="list-disc pl-4 text-sm mt-1">
                  {links.map((link, i) => {
                    const commit = commitments.find(c => c.id === link.commitmentId);
                    return <li key={i}>{commit?.title} - {link.percentage}%</li>;
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
