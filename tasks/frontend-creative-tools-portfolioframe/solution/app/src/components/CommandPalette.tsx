import { component$, useSignal, useVisibleTask$, useStore, useTask$, type QRL } from '@builder.io/qwik';
import type { PortfolioState, ThemeName } from '../types';
import type { HistoryManager } from '../store';
import { SECTION_LABELS } from '../types';
import { setTheme, loadDraft, applyLayoutPreset, LAYOUT_PRESETS } from '../store';

interface CommandPaletteProps {
  state: PortfolioState;
  history: HistoryManager;
  onOpenExport: QRL<() => void>;
  onDownloadPdf: QRL<() => void>;
}

interface CommandResult {
  id: string;
  label: string;
  kind: string;
  action: () => void;
}

export const CommandPalette = component$<CommandPaletteProps>(({ state, history, onOpenExport, onDownloadPdf }) => {
  const isOpen = useSignal(false);
  const query = useSignal('');
  const selectedIndex = useSignal(0);
  const inputRef = useSignal<HTMLInputElement>();
  const dialogRef = useSignal<HTMLDivElement>();
  const lastFocused = useSignal<Element | null>(null);

  const results = useStore<{ items: CommandResult[] }>({ items: [] });

  /**
   * Pure command builder so Enter resolution at keydown time is deterministic
   * even if the render pass for the last keystroke has not flushed yet.
   */
  const buildCommands = (rawQuery: string): CommandResult[] => {
    const q = rawQuery.toLowerCase().trim();
    const allCommands: CommandResult[] = [];
    const close = () => {
      isOpen.value = false;
    };

    // Actions
    allCommands.push({
      id: 'action-export',
      label: 'Export package',
      kind: 'Action',
      action: () => {
        close();
        onOpenExport();
      },
    });
    allCommands.push({
      id: 'action-pdf',
      label: 'Download PDF',
      kind: 'Action',
      action: () => {
        close();
        onDownloadPdf();
      },
    });

    // Layout presets
    LAYOUT_PRESETS.forEach((preset) => {
      allCommands.push({
        id: `preset-${preset.id}`,
        label: `Preset: ${preset.label}`,
        kind: 'Layout Preset',
        action: () => {
          applyLayoutPreset(state, history, preset.id);
          close();
        },
      });
    });

    // Themes
    const themes: ThemeName[] = ['sunrise', 'slate', 'forest', 'blossom'];
    themes.forEach((t) => {
      allCommands.push({
        id: `theme-${t}`,
        label: `Theme: ${t.charAt(0).toUpperCase() + t.slice(1)}`,
        kind: 'Theme',
        action: () => {
          setTheme(state, history, t);
          close();
        },
      });
    });

    // Drafts
    state.drafts.forEach((d) => {
      allCommands.push({
        id: `draft-${d.name}`,
        label: `Load draft: ${d.name}`,
        kind: 'Draft',
        action: () => {
          loadDraft(state, history, d.name);
          close();
        },
      });
    });

    // Sections (scroll editor into view)
    Object.entries(SECTION_LABELS).forEach(([key, label]) => {
      allCommands.push({
        id: `section-${key}`,
        label: `Go to ${label}`,
        kind: 'Section',
        action: () => {
          close();
          const el = Array.from(document.querySelectorAll('h2, h1')).find(
            (h) => (h.textContent ?? '').trim().toLowerCase() === label.toLowerCase()
          );
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        },
      });
    });

    if (q === '') return allCommands;
    return allCommands.filter(
      (c) => c.label.toLowerCase().includes(q) || c.kind.toLowerCase().includes(q)
    );
  };

  useTask$(({ track }) => {
    track(() => query.value);
    track(() => state.drafts.length);
    track(() => isOpen.value);

    if (!isOpen.value) {
      results.items = [];
      return;
    }
    results.items = buildCommands(query.value);
    selectedIndex.value = 0;
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    track(() => isOpen.value);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        isOpen.value = !isOpen.value;
        if (isOpen.value) {
          query.value = '';
          lastFocused.value = document.activeElement;
          window.setTimeout(() => inputRef.value?.focus(), 30);
        } else if (lastFocused.value instanceof HTMLElement) {
          lastFocused.value.focus();
        }
        return;
      }
      if (!isOpen.value) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        isOpen.value = false;
        if (lastFocused.value instanceof HTMLElement) lastFocused.value.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex.value = Math.min(selectedIndex.value + 1, results.items.length - 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex.value = Math.max(selectedIndex.value - 1, 0);
      } else if (e.key === 'Enter') {
        // Only handle Enter when focus is inside the palette (input or a result)
        const inside = dialogRef.value?.contains(document.activeElement) ?? false;
        if (inside) {
          e.preventDefault();
          // Resolve against a fresh filter so a quick type-then-Enter can't hit
          // a stale results list from the previous keystroke.
          const items = buildCommands(query.value);
          const item = items[selectedIndex.value];
          if (item) item.action();
        }
      } else if (e.key === 'Tab' && dialogRef.value) {
        // Trap focus inside the palette
        const focusables = Array.from(dialogRef.value.querySelectorAll<HTMLElement>('input, button'));
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
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
      onClick$={(e) => {
        if (e.target === e.currentTarget) {
          isOpen.value = false;
          if (lastFocused.value instanceof HTMLElement) lastFocused.value.focus();
        }
      }}
    >
      <div
        ref={dialogRef}
        class="w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
        style={{ borderColor: 'var(--color-border)', borderWidth: '1px' }}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div class="p-3 border-b flex items-center" style={{ borderColor: 'var(--color-border)' }}>
          <span class="mr-2" aria-hidden="true">🔍</span>
          <input
            ref={inputRef}
            type="text"
            class="w-full text-base border-0 focus:ring-0 bg-transparent"
            placeholder="Search sections, presets, drafts, themes, and actions…"
            aria-label="Search commands"
            value={query.value}
            onInput$={(e) => {
              query.value = (e.target as HTMLInputElement).value;
            }}
          />
          <kbd class="text-xs px-1.5 py-0.5 rounded border" style={{ color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}>
            Esc
          </kbd>
        </div>
        <div class="max-h-80 overflow-y-auto p-2">
          {results.items.length > 0 ? (
            <div class="space-y-1" role="listbox" aria-label="Command results">
              {results.items.map((res, idx) => (
                <button
                  key={res.id}
                  type="button"
                  role="option"
                  aria-selected={idx === selectedIndex.value}
                  class={`palette-item w-full text-left flex items-center justify-between p-2 rounded-lg ${
                    idx === selectedIndex.value ? 'bg-violet-50 text-violet-900' : 'hover:bg-gray-50'
                  }`}
                  onClick$={() => res.action()}
                  onMouseEnter$={() => {
                    selectedIndex.value = idx;
                  }}
                >
                  <span class="font-medium text-sm">{res.label}</span>
                  <span class="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {res.kind}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p class="p-4 text-center text-sm text-gray-500" role="status">
              No matches found for &ldquo;{query.value}&rdquo; — try a section, preset, draft, theme, or action name.
            </p>
          )}
        </div>
      </div>
    </div>
  );
});
