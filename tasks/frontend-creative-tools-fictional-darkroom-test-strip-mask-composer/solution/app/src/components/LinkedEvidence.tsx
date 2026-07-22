import { useStore } from '../lib/store';

export function LinkedEvidence() {
  const store = useStore();

  return (
    <div className="bg-neutral-800 border-t border-neutral-700 p-4 flex gap-4 overflow-x-auto min-h-[300px]">
      <div className="min-w-[200px] border border-neutral-700 p-2 bg-neutral-900 rounded">
        <h3 className="text-xs font-semibold mb-2">Global Rank</h3>
        <div className="flex flex-col gap-1 text-[10px]">
          {Array.from(store.zoneMetrics.entries()).sort((a,b) => a[1].rank - b[1].rank).map(([zId, m]) => (
            <div
              key={zId}
              className={`p-1 flex justify-between cursor-pointer rounded ${store.selectedZoneId === zId ? 'bg-blue-500/20 text-blue-300' : 'hover:bg-neutral-800'}`}
              onClick={() => store.selectZone(zId)}
            >
              <span>{zId}</span>
              <span>Err: {m.targetError}</span>
              <span>Clip: {m.clippingCount}</span>
            </div>
          ))}
        </div>
        {store.selectedZoneId && (
           <button
             className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white rounded py-1 text-xs"
             onClick={() => store.commitZoneDecision(store.selectedZoneId!, "midtones align while both endpoints remain distinct", ["cal-02", "cal-07"])}
           >
             Make Decision
           </button>
        )}
      </div>

      <div className="min-w-[250px] border border-neutral-700 p-2 bg-neutral-900 rounded">
        <h3 className="text-xs font-semibold mb-2">Intersection Matrix</h3>
        <div className="grid grid-cols-4 gap-1 text-[10px]">
           {store.passes.filter(p => p.status === 'active').map((p) => (
             <div key={p.id} className="bg-neutral-800 p-1 text-center truncate">{p.id}</div>
           ))}
        </div>
      </div>

      <div className="flex-1 border border-neutral-700 p-2 bg-neutral-900 rounded relative">
         <h3 className="text-xs font-semibold mb-2">Density Curve & Histogram</h3>
         <div className="h-24 bg-neutral-800 mt-2 relative border border-neutral-700">
            {/* Mock curve plot */}
            <svg width="100%" height="100%">
               <polyline fill="none" stroke="#4ade80" strokeWidth="2" points="0,90 50,70 100,50 150,20 200,10" />
            </svg>
         </div>
      </div>

      <div className="min-w-[200px] border border-neutral-700 p-2 bg-neutral-900 rounded relative">
         <h3 className="text-xs font-semibold mb-2">Decisions & History</h3>
         <div className="text-[10px] flex flex-col gap-1">
            {store.decisions.map(d => (
              <div key={d.id} className={`p-1 rounded ${d.status === 'fresh' ? 'bg-green-500/10 border border-green-500/50' : 'bg-red-500/10 border border-red-500/50 line-through opacity-75'}`}>
                {d.id} - {d.zoneId} ({d.status}) - {d.rationale}
              </div>
            ))}
         </div>
      </div>
    </div>
  );
}
