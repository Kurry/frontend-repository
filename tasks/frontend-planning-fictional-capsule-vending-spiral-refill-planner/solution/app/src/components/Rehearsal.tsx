import { useStore } from '../store';

export const Rehearsal = () => {
  const store = useStore();
  const r = store.rehearsal;

  return (
    <div className="p-4 bg-slate-50 border rounded flex flex-col gap-2">
      <h3 className="font-bold flex justify-between">
        <span>Rehearsal</span>
        <span className="text-xs bg-gray-200 px-2 rounded-full flex items-center">{r.status}</span>
      </h3>
      <div className="flex gap-2">
        <button onClick={() => store.startRehearsal()} className="px-2 py-1 bg-blue-500 text-white rounded text-sm">Start</button>
        <button onClick={() => store.stepRehearsal()} disabled={r.status === 'not-run' || r.playhead >= store.demands.length} className="px-2 py-1 bg-green-500 text-white rounded text-sm disabled:opacity-50">Step</button>
        <button onClick={() => store.markRehearsal()} disabled={r.status === 'not-run'} className="px-2 py-1 bg-purple-500 text-white rounded text-sm disabled:opacity-50">Verify</button>
        <button onClick={() => store.resetRehearsal()} disabled={r.status === 'not-run'} className="px-2 py-1 bg-gray-500 text-white rounded text-sm disabled:opacity-50">Reset</button>
      </div>
      {r.mark && <div className="text-green-600 font-bold text-sm mt-2">✓ Verified</div>}
      <div className="mt-2 text-xs h-32 overflow-y-auto bg-white border p-2">
        {r.events.map((e, i) => (
          <div key={i} className="mb-1">Step {e.vendOffset}: Expected {e.expectedVariant}, Got {e.actualVariant}</div>
        ))}
        {r.events.length === 0 && <span className="text-gray-400">No events...</span>}
      </div>
    </div>
  );
};
