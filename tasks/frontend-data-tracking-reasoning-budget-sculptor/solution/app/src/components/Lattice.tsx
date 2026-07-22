import { useState } from 'react';
import { useStore, useDerivedState } from '../store';
import { FIXTURE } from '../fixture';

export function Lattice() {
  const policy = useStore(state => state.policy);
  const togglePin = useStore(state => state.togglePin);
  const setFallback = useStore(state => state.setFallback);
  const { events } = useDerivedState(policy);

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const stateColors = {
    retained: 'bg-green-100 border-green-300 text-green-800',
    truncated: 'bg-slate-100 border-slate-300 text-slate-400',
    pinned: 'bg-blue-100 border-blue-400 text-blue-800 ring-2 ring-blue-500',
    rescued: 'bg-indigo-100 border-indigo-300 text-indigo-700',
    impossible: 'bg-red-100 border-red-400 text-red-800 bg-[url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PScxMCc+CiAgPHBhdGggZD0nTS0xLDEgbDEsLTEgTTEwLDExIGwxLC0xIE0wLDEwIGwxMCwtMTAnIHN0cm9rZT0nI2Y4NzE3MScgc3Ryb2tlLXdpZHRoPScyJy8+Cjwvc3ZnPg==")]'
  };

  const getDependencies = (eventId: string) => {
    return FIXTURE.dependencies.filter(d => d.to === eventId).map(d => d.from);
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 col-span-2">
      <h2 className="text-lg font-semibold mb-4">Evidence Retention Lattice</h2>
      <div className="grid grid-cols-8 gap-4 mb-6">
        {FIXTURE.phases.map((p) => {
          const phaseEvents = events.filter(e => e.phaseId === p.id);
          return (
            <div key={p.id} className="flex flex-col gap-1">
              <div className="text-xs font-semibold text-slate-500 mb-2">{p.name}</div>
              {phaseEvents.map(e => (
                <button
                  key={e.id}
                  onClick={() => setSelectedEventId(e.id)}
                  className={`
                    w-full h-8 rounded border flex items-center justify-center text-xs font-mono transition-all
                    ${stateColors[e.state]}
                    ${selectedEventId === e.id ? 'ring-2 ring-black ring-offset-2' : 'hover:brightness-95'}
                  `}
                  title={`${e.id} - ${e.weight} tokens - ${e.state}`}
                >
                  {e.isAnchor && <span className="mr-1">★</span>}
                  {e.id}
                </button>
              ))}
            </div>
          );
        })}
      </div>

      {selectedEvent && (
        <div className="p-4 bg-slate-50 rounded border border-slate-200">
          <h3 className="font-semibold mb-2">Event Detail: {selectedEvent.id}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Phase:</strong> {selectedEvent.phaseId}</p>
              <p><strong>Weight:</strong> {selectedEvent.weight} tokens</p>
              <p><strong>State:</strong> <span className={`inline-block px-2 py-0.5 rounded ${stateColors[selectedEvent.state]}`}>{selectedEvent.state}</span></p>
            </div>
            <div>
              <p><strong>Is Anchor:</strong> {selectedEvent.isAnchor ? 'Yes' : 'No'}</p>
              <p><strong>Dependencies:</strong> {getDependencies(selectedEvent.id).join(', ') || 'None'}</p>
            </div>
          </div>

          {selectedEvent.isAnchor && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!policy.pinnedEvents[selectedEvent.id]}
                    onChange={() => togglePin(selectedEvent.id)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="font-medium">Pin Event & Ancestors</span>
                </label>

                {policy.pinnedEvents[selectedEvent.id] && (
                  <select
                    value={policy.fallbacks[selectedEvent.id] || 'raw'}
                    onChange={(e) => setFallback(selectedEvent.id, e.target.value as any)}
                    className="border p-1 rounded text-sm bg-white"
                  >
                    <option value="raw">Raw Event (Full Cost)</option>
                    <option value="summary">Fixture Summary (Reduced Cost)</option>
                    <option value="unacceptable">Mark Unacceptable (Allow Loss)</option>
                  </select>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
