import { component$ } from '@builder.io/qwik';
import type { Signal } from '@builder.io/qwik';

interface SearchBarProps {
  query: Signal<string>;
  placeholder?: string;
}

export const SearchBar = component$<SearchBarProps>(({ query, placeholder }) => {
  return (
    <div class="relative px-4 py-2">
      <div class="relative">
        <svg
          class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={query.value}
          onInput$={(e: Event) => {
            const target = e.target as HTMLInputElement;
            query.value = target.value;
          }}
          placeholder={placeholder || 'Search notes and tags...'}
          class="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-[15px] text-[var(--color-text-primary)] outline-none placeholder:text-gray-400 focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
        />
        {query.value && (
          <button
            onClick$={() => { query.value = ''; }}
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
});
