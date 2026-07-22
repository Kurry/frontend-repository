import { For, createMemo } from 'solid-js';
import { state } from './store.js';
import { simulateSteps } from './simulator.js';

export default function GraphView() {
  const maxSlot = Math.max(...state.transactions.flatMap(tx => tx.phases.map(p => p.slot || 0)));
  const simResult = createMemo(() => simulateSteps(state.transactions, state.accounts, state.strategy, maxSlot));

  return (
    <div class="border p-4 rounded-lg bg-white h-full flex flex-col">
      <h2 class="text-xl font-bold mb-4">Conflict & Wait-for Graphs</h2>

      <div class="flex-1 overflow-auto bg-gray-50 rounded border p-4 mb-4">
        <h3 class="text-sm font-semibold mb-2 text-gray-600">Serialization Graph (Conflicts)</h3>
        {simResult().conflicts.edges.length === 0 ? (
          <div class="text-gray-400 text-sm italic">No conflicts detected.</div>
        ) : (
          <ul class="text-sm space-y-1 font-mono">
            <For each={simResult().conflicts.edges}>
              {(edge) => (
                <li class="flex items-center gap-2">
                   <span class="text-gray-500">{edge.sourceId}</span>
                   <span class={`font-bold ${edge.type === 'WW' ? 'text-red-500' : 'text-orange-500'}`}>
                     --{edge.type}({edge.account})--&gt;
                   </span>
                   <span class="text-gray-500">{edge.targetId}</span>
                </li>
              )}
            </For>
          </ul>
        )}
      </div>

      <div class="p-3 rounded mb-4 text-sm font-bold border flex items-center justify-between">
         <span>Graph Status:</span>
         {simResult().serializability.acyclic ? (
           <span class="text-green-600 bg-green-50 px-2 py-1 rounded">Acyclic (Serializable)</span>
         ) : (
           <span class="text-red-600 bg-red-50 px-2 py-1 rounded">Cycle Detected!</span>
         )}
      </div>

      {state.strategy === 'pessimistic-lock' && (
        <div class="flex-1 overflow-auto bg-gray-50 rounded border p-4">
          <h3 class="text-sm font-semibold mb-2 text-gray-600">Wait-for Graph (Locks)</h3>
          {/* Render waits if computed in engine... */}
          <div class="text-gray-400 text-sm italic">Not fully simulated here, see edges.</div>
        </div>
      )}
    </div>
  );
}
