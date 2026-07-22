import { For } from 'solid-js';
import { state, movePhase } from './store.js';

export default function Timeline() {
  const slots = Array.from({ length: 24 }, (_, i) => i + 1);

  const handleDragStart = (e, txId, phaseId) => {
    e.dataTransfer.setData('txId', txId);
    e.dataTransfer.setData('phaseId', phaseId);
  };

  const handleDrop = (e, slot) => {
    e.preventDefault();
    const txId = e.dataTransfer.getData('txId');
    const phaseId = e.dataTransfer.getData('phaseId');
    if (txId && phaseId) {
      movePhase(txId, phaseId, slot);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div class="overflow-x-auto border p-4 bg-gray-50 rounded-lg">
      <h2 class="text-xl font-bold mb-4">Timeline (Lanes & Slots)</h2>
      <div class="flex" style={{ width: 'max-content' }}>
        <div class="w-24 shrink-0 flex flex-col justify-end">
          <For each={state.transactions}>
            {(tx) => (
              <div class="h-16 flex items-center border-b font-semibold text-gray-700">
                {tx.id}
              </div>
            )}
          </For>
        </div>
        <div class="flex">
          <For each={slots}>
            {(slot) => (
              <div
                class="w-16 border-r border-gray-300 relative"
                onDrop={(e) => handleDrop(e, slot)}
                onDragOver={handleDragOver}
              >
                <div class="text-center text-xs text-gray-400 mb-2 border-b h-6">{slot}</div>
                <div class="flex flex-col">
                  <For each={state.transactions}>
                    {(tx) => {
                      const p = tx.phases.find(ph => ph.slot === slot);
                      return (
                        <div class="h-16 border-b relative">
                          {p ? (
                            <div
                              draggable
                              onDragStart={(e) => handleDragStart(e, tx.id, p.id)}
                              class="absolute inset-1 bg-blue-500 text-white text-[10px] flex items-center justify-center rounded cursor-move shadow hover:bg-blue-600 transition-colors"
                            >
                              {p.type}
                            </div>
                          ) : null}
                        </div>
                      );
                    }}
                  </For>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Unscheduled phases palette */}
      <div class="mt-8 border-t pt-4">
        <h3 class="text-sm font-semibold mb-2 text-gray-600">Unscheduled Phases</h3>
        <div class="flex flex-wrap gap-4">
          <For each={state.transactions}>
            {(tx) => (
              <div class="flex flex-col gap-1 border p-2 rounded bg-white">
                <span class="text-xs font-bold text-gray-500">{tx.id}</span>
                <div class="flex gap-1">
                  <For each={tx.phases.filter(p => p.slot === null)}>
                    {(p) => (
                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, tx.id, p.id)}
                        class="bg-gray-200 px-2 py-1 text-xs rounded cursor-move hover:bg-gray-300 transition-colors"
                      >
                        {p.type}
                      </div>
                    )}
                  </For>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  );
}
