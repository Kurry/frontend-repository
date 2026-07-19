import { component$ } from '@builder.io/qwik';
import type { Signal } from '@builder.io/qwik';

interface TagRailProps {
  tags: [string, number][];
  activeTag: Signal<string | null>;
  todoTags: string[];
  onToggleTodoTag: (tag: string) => void;
  onClearFilter: () => void;
}

export const TagRail = component$<TagRailProps>(
  ({ tags, activeTag, todoTags, onToggleTodoTag, onClearFilter }) => {
    if (tags.length === 0) {
      return null;
    }

    return (
      <div class="border-b border-gray-200 bg-white">
        <div class="flex items-center justify-between px-4 py-2">
          <span class="text-xs font-medium uppercase text-gray-400">Tags</span>
          {activeTag.value && (
            <button
              onClick$={onClearFilter}
              class="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
            >
              Clear filter
            </button>
          )}
        </div>
        <div class="scrollbar-hide flex gap-2 overflow-x-auto px-4 pb-3">
          {tags.map(([tag, count]) => {
            const isActive = activeTag.value === tag;
            const isTodo = todoTags.includes(tag);
            return (
              <div key={tag} class="flex flex-shrink-0 items-center gap-1">
                <button
                  onClick$={() => {
                    activeTag.value = isActive ? null : tag;
                  }}
                  class={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] ${
                    isActive
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'bg-[var(--color-primary)] text-[var(--color-accent)] hover:bg-[#D4E0F0]'
                  }`}
                >
                  #{tag}
                  <span
                    class={`rounded-full px-1.5 py-0 text-[10px] ${
                      isActive ? 'bg-white/20 text-white' : 'bg-white/40 text-[var(--color-accent)]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
                <button
                  onClick$={() => onToggleTodoTag(tag)}
                  class={`rounded-full px-3 py-1 text-[10px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] ${
                    isTodo
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'bg-[var(--color-primary)] text-[var(--color-accent)] hover:bg-[#D4E0F0]'
                  }`}
                >
                  {isTodo ? 'Undo TODO' : 'Make TODO'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);
