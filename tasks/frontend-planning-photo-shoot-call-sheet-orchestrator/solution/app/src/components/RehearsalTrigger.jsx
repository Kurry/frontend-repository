import React from 'react';
import { useStore } from '../store';

export default function RehearsalTrigger() {
  const triggerDisruption = useStore(state => state.triggerDisruption);
  const disruptions = useStore(state => state.disruptions);

  return (
    <div className="absolute bottom-4 left-4 z-40 bg-white shadow-lg rounded-lg border border-gray-200 p-3 max-w-xs" aria-label="Disruption Rehearsal Tool">
      <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">Logical Rehearsal</h3>
      <div className="flex flex-col gap-2">
        {disruptions.map(d => (
          <button
            key={d.id}
            onClick={() => triggerDisruption(d.id)}
            className="text-left text-sm bg-gray-100 hover:bg-gray-200 py-1.5 px-3 rounded motion-safe:transition-colors focus:ring"
          >
            Inject: {d.description}
          </button>
        ))}
      </div>
    </div>
  );
}
