import { type Component, For } from 'solid-js';
import { state, setState } from './store';

export const LoomUI: Component = () => {
  return (
    <div class="flex-1 border border-slate-700 p-4 overflow-auto">
      <h2 class="text-xl font-bold mb-4">Temporal Loom</h2>
      <div class="flex flex-col gap-2">
        <For each={state.events}>
          {(event) => (
            <div
              class={`p-2 border rounded cursor-pointer ${
                state.selectedRange?.start === event.id || state.selectedRange?.end === event.id
                  ? 'bg-blue-900 border-blue-500'
                  : 'bg-slate-800 border-slate-600'
              }`}
              onClick={() => {
                if (!state.selectedRange) {
                  setState('selectedRange', { start: event.id, end: event.id });
                } else {
                  setState('selectedRange', 'end', event.id);
                }
              }}
            >
              <div class="flex justify-between">
                <span>Phase {event.phase}</span>
                <span>{event.tokens} tokens</span>
              </div>
              <div class="text-sm text-slate-400">{event.text}</div>
            </div>
          )}
        </For>
      </div>
      <div class="mt-4 flex gap-2">
        <button
          class="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded disabled:opacity-50"
          disabled={!state.selectedRange}
          onClick={() => {
            if (state.selectedRange) {
              const newCapsule = {
                id: `capsule-${Date.now()}`,
                title: 'New Summary',
                startId: state.selectedRange.start,
                endId: state.selectedRange.end,
                variant: 'concise' as const,
                includedFacts: [],
                omittedFacts: [],
              };
              setState('capsules', (prev) => [...prev, newCapsule]);
              setState('selectedRange', null);
            }
          }}
        >
          Fold Selected
        </button>
        <button
          class="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded disabled:opacity-50"
          disabled={!state.selectedRange}
          onClick={() => setState('selectedRange', null)}
        >
          Clear Selection
        </button>
      </div>
    </div>
  );
};
