import { useStore, getInventoryStats } from '../store';

export const DemandProfile = () => {
  const store = useStore();
  const stats = getInventoryStats(store.capsules);

  // Recompute simple coverage based on Track A matches
  const trackACapsules = store.capsules.filter(c => c.trackId === 'TRACK-A').sort((a, b) => (a.bayIndex || 0) - (b.bayIndex || 0));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="font-bold">Demand Profile (8 vends)</h3>
        <div className="flex mt-2">
          {store.demands.map(d => {
            const actualCap = trackACapsules.find(c => c.bayIndex === d.vendOffset - 1);
            const isMatch = actualCap && actualCap.variant === d.variant;
            return (
              <div key={d.vendOffset} className="flex flex-col items-center flex-1">
                <div className={`w-full h-8 flex items-center justify-center text-xs text-white ${isMatch ? 'opacity-100' : 'opacity-30'}`}
                     style={{ backgroundColor: d.variant }}>
                  Tgt
                </div>
                {actualCap && (
                  <div className={`w-full h-4 mt-1 border border-t-0`} style={{ backgroundColor: actualCap.variant }} />
                )}
                {!isMatch && <div className="text-red-500 text-xs mt-1">!</div>}
              </div>
            );
          })}
        </div>
      </div>

      <div>
         <h3 className="font-bold">Inventory</h3>
         <div className="grid grid-cols-2 gap-2 text-sm mt-2">
           {(['coral', 'indigo', 'mint', 'amber'] as const).map(v => (
             <div key={v} className="flex justify-between border-b p-1">
               <span className="capitalize">{v}</span>
               <span>{stats[v].planned} pl / {stats[v].tray} tr</span>
             </div>
           ))}
         </div>
      </div>

      <div>
         <h3 className="font-bold">Issues</h3>
         {store.issues.map(iss => (
           <div key={iss.issueId} className={`text-sm p-2 rounded ${iss.resolved ? 'bg-green-100 text-green-800 line-through' : 'bg-red-100 text-red-800'}`}>
             {iss.issueId}: {iss.description}
           </div>
         ))}
      </div>
    </div>
  );
};
