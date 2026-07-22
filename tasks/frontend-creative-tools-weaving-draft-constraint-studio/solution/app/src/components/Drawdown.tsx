import { useWeavingStore } from '../store';

export function Drawdown({ store }: { store: ReturnType<typeof useWeavingStore> }) {
  const { state, drawdown } = store;

  return (
    <div className="flex flex-col">
       <h3 className="text-sm font-semibold mb-2">Drawdown</h3>
       <div className="grid border border-gray-300 w-fit" style={{ gridTemplateColumns: `repeat(${state.dimensions.ends}, minmax(0, 1fr))` }}>
         {drawdown.map((row, r) => row.map((cell, c) => (
            <div
               key={`dd-${r}-${c}`}
               className="w-6 h-6 border-r border-b border-gray-200 relative"
               style={{ backgroundColor: cell }}
            >
               {state.simulation && state.simulation.currentPick === r && (
                  <div className="absolute inset-0 border-2 border-red-500 pointer-events-none opacity-50"></div>
               )}
            </div>
         )))}
       </div>
    </div>
  );
}
