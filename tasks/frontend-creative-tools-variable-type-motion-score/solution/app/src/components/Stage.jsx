import { For } from 'solid-js';
import { store, updateBlock, setStore } from '../store';

export default function Stage() {
  return (
    <div class="relative w-full h-[600px] bg-neutral-100 overflow-hidden border border-neutral-300">
      <For each={store.blocks}>
        {(block) => (
          <div
            class={`absolute cursor-move px-2 py-1 ${store.ui.selectedBlock === block.id ? 'ring-2 ring-blue-500' : ''}`}
            style={{
              left: `${block.x / 10000}%`,
              top: `${block.y / 10000}%`,
              transform: 'translate(-50%, -50%)',
              'font-family': '"Northstar VF", sans-serif',
              'font-weight': block.baseWght,
              'font-stretch': `${block.baseWdth}%`,
            }}
            onClick={() => setStore('ui', 'selectedBlock', block.id)}
          >
            {block.content}
          </div>
        )}
      </For>
    </div>
  );
}
