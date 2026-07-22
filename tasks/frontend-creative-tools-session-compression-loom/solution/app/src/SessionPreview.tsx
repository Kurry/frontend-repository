import { type Component, For } from 'solid-js';
import { state, setState } from './store';

export const SessionPreview: Component = () => {
  return (
    <div class="flex-1 border border-slate-700 p-4 overflow-auto">
      <h2 class="text-xl font-bold mb-4">Session Preview</h2>
      <div class="prose prose-invert max-w-none">
        {/* Mock interleaving logic */}
        <For each={state.capsules}>
            {(capsule) => (
                <div class="mb-4 p-4 border border-blue-800 bg-blue-900/30 rounded cursor-pointer hover:bg-blue-900/50"
                  onClick={() => setState('selectedCapsuleId', capsule.id)}
                >
                    <h3 class="font-bold text-blue-300">{capsule.title}</h3>
                    <p class="text-slate-300">
                        {capsule.variant === 'concise' ? 'Concise summary text goes here.' : 'Detailed diagnostic text goes here.'}
                    </p>
                </div>
            )}
        </For>
        <For each={state.events}>
          {(event) => (
             <div class="mb-2 text-slate-300 border-l-2 border-slate-600 pl-4">
                 <span class="text-slate-500 mr-2">[{event.phase}]</span>
                 {event.text}
             </div>
          )}
        </For>
      </div>
    </div>
  );
};
