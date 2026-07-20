import { component$, useSignal, useVisibleTask$, $, useStore, useTask$ } from '@builder.io/qwik';
import type { PortfolioState, HistoryManager, ThemeName, DensityMode } from '../types';
import { SECTION_LABELS } from '../types';
import { setTheme, setDensity, loadDraft } from '../store';

interface CommandPaletteProps {
  state: PortfolioState;
  history: HistoryManager;
  onOpenExport: () => void;
}

interface CommandResult {
  id: string;
  label: string;
  kind: string;
  action: () => void;
}

export const CommandPalette = component$<CommandPaletteProps>(({ state, history, onOpenExport }) => {
  const isOpen = useSignal(false);
  const query = useSignal('');
  const selectedIndex = useSignal(0);
  const inputRef = useSignal<HTMLInputElement>();

  const results = useStore<{ items: CommandResult[] }>({ items: [] });

  useTask$(({ track }) => {
    track(() => query.value);
    track(() => state.drafts.length);
    track(() => isOpen.value);

    if (!isOpen.value) {
      results.items = [];
      return;
    }

    const q = query.value.toLowerCase().trim();
    const allCommands: CommandResult[] = [];

    // Actions
    allCommands.push({
      id: 'action-export',
      label: 'Export package',
      kind: 'Action',
      action: () => { isOpen.value = false; onOpenExport(); }
    });

    // Layout Presets
    allCommands.push({
      id: 'preset-compact',
      label: 'Compact Stack',
      kind: 'Layout Preset',
      action: () => {
        setDensity(state, 'compact');
        isOpen.value = false;
      }
    });
    
    // Themes
    const themes: ThemeName[] = ['sunrise', 'slate', 'forest', 'blossom'];
    themes.forEach(t => {
      allCommands.push({
        id: `theme-${t}`,
        label: `Theme: ${t}`,
        kind: 'Theme',
        action: () => {
          setTheme(state, t);
          isOpen.value = false;
        }
      });
    });

    // Drafts
    state.drafts.forEach(d => {
      allCommands.push({
        id: `draft-${d.name}`,
        label: `Load Draft: ${d.name}`,
        kind: 'Draft',
        action: () => {
          loadDraft(state, history, d.name);
          isOpen.value = false;
        }
      });
    });
    
    // Sections (Scroll to)
    Object.entries(SECTION_LABELS).forEach(([key, label]) => {
      allCommands.push({
        id: `section-${key}`,
        label: `Go to ${label}`,
        kind: 'Section',
        action: () => {
          isOpen.value = false;
          const el = Array.from(document.querySelectorAll('h2, h1')).find(
            (h) => (h.textContent ?? '').trim().toLowerCase() === label.toLowerCase()
          );
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    if (q === '') {
      results.items = allCommands;
    } else {
      results.items = allCommands.filter(c => 
        c.label.toLowerCase().includes(q) || c.kind.toLowerCase().includes(q)
      );
    }
    selectedIndex.value = 0;
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        isOpen.value = !isOpen.value;
        if (isOpen.value) {
            query.value = '';
            setTimeout(() => inputRef.value?.focus(), 50);
        }
      } else if (isOpen.value) {
        if (e.key === 'Escape') {
          isOpen.value = false;
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          selectedIndex.value = Math.min(selectedIndex.value + 1, results.items.length - 1);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          selectedIndex.value = Math.max(selectedIndex.value - 1, 0);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (results.items.length > 0 && results.items[selectedIndex.value]) {
            results.items[selectedIndex.value].action();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    cleanup(() => window.removeEventListener('keydown', handleKeyDown));
  });

  if (!isOpen.value) return null;

  return (
    <div
      class="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
    >
      <div
        class="w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
        style={{ borderColor: 'var(--color-border)', borderWidth: '1px' }}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <div class="p-3 border-b flex items-center" style={{ borderColor: 'var(--color-border)' }}>
          <span class="text-gray-400 mr-2">🔍</span>
          <input
            ref={inputRef}
            type="text"
            class="w-full text-base border-0 focus:ring-0 bg-transparent"
            placeholder="Search commands, presets, drafts..."
            value={query.value}
            onInput$={(e) => { query.value = (e.target as HTMLInputElement).value; }}
            autoFocus
          />
        </div>
        <div class="max-h-80 overflow-y-auto p-2">
          {results.items.length > 0 ? (
            <div class="space-y-1">
              {results.items.map((res, idx) => (
                <button
                  key={res.id}
                  class={`w-full text-left flex items-center justify-between p-2 rounded-lg ${
                    idx === selectedIndex.value ? 'bg-violet-50 text-violet-900' : 'hover:bg-gray-50'
                  }`}
                  onClick$={() => res.action()}
                  onMouseEnter$={() => { selectedIndex.value = idx; }}
                >
                  <span class="font-medium text-sm">{res.label}</span>
                  <span class="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {res.kind}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div class="p-4 text-center text-sm text-gray-500">
              No matches found for "{query.value}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
});