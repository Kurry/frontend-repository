import { type Component, Show, For } from 'solid-js';
import { state, setState } from './store';

export const CapsuleEditor: Component = () => {
  const selectedCapsule = () =>
    state.capsules.find((c) => c.id === state.selectedCapsuleId);

  return (
    <div class="flex-1 border border-slate-700 p-4 overflow-auto">
      <h2 class="text-xl font-bold mb-4">Capsule Editor</h2>
      <Show
        when={selectedCapsule()}
        fallback={<div class="text-slate-400">Select a capsule to edit</div>}
      >
        {(capsule) => (
          <div class="flex flex-col gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                class="w-full bg-slate-800 border border-slate-600 rounded p-2"
                value={capsule().title}
                onInput={(e) =>
                  setState(
                    'capsules',
                    (c) => c.id === capsule().id,
                    'title',
                    e.currentTarget.value
                  )
                }
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Variant</label>
              <select
                class="w-full bg-slate-800 border border-slate-600 rounded p-2"
                value={capsule().variant}
                onChange={(e) =>
                  setState(
                    'capsules',
                    (c) => c.id === capsule().id,
                    'variant',
                    e.currentTarget.value as 'concise' | 'diagnostic'
                  )
                }
              >
                <option value="concise">Concise</option>
                <option value="diagnostic">Diagnostic</option>
              </select>
            </div>
            <div>
              <h3 class="font-medium mb-2">Included Facts</h3>
              <div class="flex flex-wrap gap-2">
                <For each={capsule().includedFacts}>
                  {(fact) => (
                    <span class="bg-blue-900 text-blue-200 px-2 py-1 rounded text-sm cursor-pointer hover:bg-blue-800"
                      onClick={() => {
                        setState('capsules', (c) => c.id === capsule().id, 'includedFacts', (facts) => facts.filter(f => f !== fact));
                        setState('capsules', (c) => c.id === capsule().id, 'omittedFacts', (facts) => [...facts, fact]);
                      }}
                    >
                      {fact}
                    </span>
                  )}
                </For>
              </div>
            </div>
             <div>
              <h3 class="font-medium mb-2">Omitted Facts</h3>
              <div class="flex flex-wrap gap-2">
                <For each={capsule().omittedFacts}>
                  {(fact) => (
                    <span class="bg-slate-700 text-slate-300 px-2 py-1 rounded text-sm cursor-pointer hover:bg-slate-600"
                       onClick={() => {
                        setState('capsules', (c) => c.id === capsule().id, 'omittedFacts', (facts) => facts.filter(f => f !== fact));
                        setState('capsules', (c) => c.id === capsule().id, 'includedFacts', (facts) => [...facts, fact]);
                      }}
                    >
                      {fact}
                    </span>
                  )}
                </For>
              </div>
            </div>
          </div>
        )}
      </Show>
    </div>
  );
};
