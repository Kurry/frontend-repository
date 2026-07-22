import { Show } from 'solid-js';
import { store, updateBlock } from '../store';

export default function Inspector() {
  const selected = () => store.blocks.find(b => b.id === store.ui.selectedBlock);

  return (
    <div class="p-4 bg-white border-l border-neutral-300 w-64 h-full flex flex-col gap-4">
      <h2 class="font-bold">Inspector</h2>
      <Show when={selected()} fallback={<div class="text-neutral-500 text-sm">Select a block</div>}>
        {(block) => (
          <div class="flex flex-col gap-3">
            <div>
              <label class="block text-xs font-semibold mb-1">Weight (wght)</label>
              <input type="range" min="200" max="900" value={block().baseWght}
                onInput={(e) => updateBlock(block().id, { baseWght: Number(e.target.value) })}
                class="w-full"
              />
              <div class="text-xs text-right">{block().baseWght}</div>
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1">Width (wdth)</label>
              <input type="range" min="75" max="125" value={block().baseWdth}
                onInput={(e) => updateBlock(block().id, { baseWdth: Number(e.target.value) })}
                class="w-full"
              />
              <div class="text-xs text-right">{block().baseWdth}</div>
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1">Content</label>
              <input type="text" value={block().content}
                onInput={(e) => updateBlock(block().id, { content: e.target.value })}
                class="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
          </div>
        )}
      </Show>
    </div>
  );
}
