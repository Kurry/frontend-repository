import { type Component, For } from 'solid-js';
import { state } from './store';

export const LossLens: Component = () => {
  return (
    <div class="border border-slate-700 p-4 flex-1 overflow-auto">
      <h2 class="text-xl font-bold mb-4">Loss Lens</h2>
      <div class="flex flex-col gap-2">
        <For each={state.capsules}>
          {(capsule) => (
            <For each={capsule.omittedFacts}>
              {(fact) => (
                <div class="text-sm p-2 bg-slate-800 border border-slate-700 rounded text-slate-300">
                  <span class="font-bold text-red-400">Omitted:</span> {fact}
                </div>
              )}
            </For>
          )}
        </For>
      </div>
    </div>
  );
};
