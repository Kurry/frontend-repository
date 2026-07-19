import { component$, useSignal } from '@builder.io/qwik';
import type { PortfolioState, HistoryManager, SectionKey, ThemeName, DensityMode } from '../types';
import {
  toggleSectionVisibility,
  moveSectionUp,
  moveSectionDown,
  setTheme,
  setDensity,
  saveDraft,
  loadDraft,
  deleteDraft,
  getChecklist,
  completenessCount,
  undo,
  redo,
  canUndo,
  canRedo,
  jumpToPastSnapshot,
  jumpToFutureSnapshot,
  resetState,
  saveState,
} from '../store';
import { SECTION_LABELS } from '../types';

// ---- Theme Picker ----
interface ThemePickerProps {
  state: PortfolioState;
}

const THEME_SWATCHES: { name: ThemeName; color: string; support: string }[] = [
  { name: 'sunrise', color: '#f97316', support: '#fde68a' },
  { name: 'slate', color: '#475569', support: '#cbd5e1' },
  { name: 'forest', color: '#15803d', support: '#bbf7d0' },
  { name: 'blossom', color: '#db2777', support: '#fbcfe8' },
];

export const ThemePicker = component$<ThemePickerProps>(({ state }) => {
  return (
    <div class="editor-section">
      <h2 class="text-base font-semibold mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
        Theme
      </h2>
      <div class="flex gap-3 items-center">
        {THEME_SWATCHES.map((swatch) => (
          <div key={swatch.name} class="flex flex-col items-center gap-1">
            <div
              class={`theme-swatch ${state.theme === swatch.name ? 'active' : ''}`}
              style={{ background: `linear-gradient(135deg, ${swatch.color} 50%, ${swatch.support} 50%)` }}
              onClick$={() => setTheme(state, swatch.name)}
              title={swatch.name.charAt(0).toUpperCase() + swatch.name.slice(1)}
              role="button"
              aria-label={`${swatch.name} theme`}
            />
            <span class="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {swatch.name.charAt(0).toUpperCase() + swatch.name.slice(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

// ---- Density Toggle ----
interface DensityToggleProps {
  state: PortfolioState;
}

export const DensityToggle = component$<DensityToggleProps>(({ state }) => {
  return (
    <div class="editor-section">
      <h2 class="text-base font-semibold mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
        Density
      </h2>
      <div class="flex gap-2">
        <button
          class={state.density === 'compact' ? 'btn-primary text-sm py-1 px-4' : 'btn-secondary text-sm py-1 px-4'}
          onClick$={() => setDensity(state, 'compact')}
        >
          Compact
        </button>
        <button
          class={state.density === 'spacious' ? 'btn-primary text-sm py-1 px-4' : 'btn-secondary text-sm py-1 px-4'}
          onClick$={() => setDensity(state, 'spacious')}
        >
          Spacious
        </button>
      </div>
    </div>
  );
});

// ---- Section Visibility Toggles ----
interface SectionTogglesProps {
  state: PortfolioState;
}

export const SectionToggles = component$<SectionTogglesProps>(({ state }) => {
  const sections: SectionKey[] = ['header', 'projects', 'skills', 'testimonials', 'contact'];

  return (
    <div class="editor-section">
      <h2 class="text-base font-semibold mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
        Section Visibility
      </h2>
      <div class="space-y-2">
        {sections.map((section) => (
          <div key={section} class="flex items-center justify-between">
            <span class="text-sm">{SECTION_LABELS[section]}</span>
            <div
              class={`toggle-track ${state.sectionVisibility[section] ? 'active' : ''}`}
              onClick$={() => toggleSectionVisibility(state, section)}
              role="switch"
              aria-label={`Toggle ${SECTION_LABELS[section]} visibility`}
              aria-checked={state.sectionVisibility[section]}
              tabIndex={0}
              onKeyDown$={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleSectionVisibility(state, section);
                }
              }}
            >
              <div class="toggle-thumb" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// ---- Section Reorder ----
interface SectionReorderProps {
  state: PortfolioState;
}

export const SectionReorder = component$<SectionReorderProps>(({ state }) => {
  return (
    <div class="editor-section">
      <h2 class="text-base font-semibold mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
        Section Order
      </h2>
      <div class="space-y-2">
        {state.sectionOrder.map((section, index) => {
          const isFirst = index === 0;
          const isLast = index === state.sectionOrder.length - 1;
          return (
            <div key={section} class="flex items-center justify-between">
              <span class="text-sm">{SECTION_LABELS[section]}</span>
              <div class="flex gap-1">
                <button
                  class="btn-small"
                  disabled={isFirst}
                  onClick$={() => moveSectionUp(state, section)}
                >
                  Move Up
                </button>
                <button
                  class="btn-small"
                  disabled={isLast}
                  onClick$={() => moveSectionDown(state, section)}
                >
                  Move Down
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ---- Draft Manager ----
interface DraftManagerProps {
  state: PortfolioState;
  history: HistoryManager;
}

export const DraftManager = component$<DraftManagerProps>(({ state, history }) => {
  const draftName = useSignal('');
  const saveMessage = useSignal('');

  return (
    <div class="editor-section">
      <h2 class="text-base font-semibold mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
        Drafts
      </h2>

      {/* Save Draft */}
      <div class="flex gap-2 mb-3">
        <input
          class="editor-input flex-1"
          placeholder="Draft name"
          value={draftName.value}
          onInput$={(e) => { draftName.value = (e.target as HTMLInputElement).value; }}
        />
        <button
          class="btn-primary"
          onClick$={() => {
            if (draftName.value.trim()) {
              saveDraft(state, draftName.value);
              saveMessage.value = `Draft "${draftName.value.trim()}" saved.`;
              draftName.value = '';
              window.setTimeout(() => { saveMessage.value = ''; }, 3000);
            }
          }}
        >
          Save As Draft
        </button>
      </div>

      {saveMessage.value && (
        <p class="text-sm mb-2" style={{ color: '#15803d' }} role="status">
          {saveMessage.value}
        </p>
      )}

      {/* Draft List */}
      {state.drafts.length === 0 && (
        <p class="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          No saved drafts.
        </p>
      )}
      <div class="space-y-2">
        {state.drafts.map((draft) => (
          <div key={draft.name} class="flex items-center justify-between p-2 rounded-lg" style={{ background: '#f5f5f4' }}>
            <div class="flex-1 min-w-0">
              <span class="text-sm font-medium truncate">{draft.name}</span>
              <span class="text-xs ml-2" style={{ color: 'var(--color-text-muted)' }}>
                {new Date(draft.timestamp).toLocaleDateString()}
              </span>
            </div>
            <div class="flex gap-1 ml-2">
              <button
                class="btn-small"
                onClick$={() => loadDraft(state, history, draft.name)}
              >
                Load
              </button>
              <button
                class="btn-small"
                onClick$={() => deleteDraft(state, draft.name)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// ---- Completeness Checklist ----
interface CompletenessChecklistProps {
  state: PortfolioState;
}

export const CompletenessChecklist = component$<CompletenessChecklistProps>(({ state }) => {
  const count = completenessCount(state);
  const items = getChecklist(state);

  return (
    <div class="editor-section">
      <h2 class="text-base font-semibold mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
        Completeness: {count.done} of {count.total} complete
      </h2>
      <div class="space-y-1">
        {items.map((item, i) => (
          <div key={i} class="flex items-center gap-2">
            <span class="text-sm" style={{ color: item.complete ? '#15803d' : '#dc2626' }}>
              {item.complete ? '✓' : '○'}
            </span>
            <span
              class="text-sm"
              style={{
                color: item.complete ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                textDecoration: item.complete ? 'line-through' : 'none',
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

// ---- Undo / Redo ----
interface UndoRedoProps {
  history: HistoryManager;
  state: PortfolioState;
  onApply: () => void;
}

export const UndoRedo = component$<UndoRedoProps>(({ history, state, onApply }) => {
  return (
    <div class="editor-section">
      <h2 class="text-base font-semibold mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
        Undo / Redo
      </h2>
      <div class="flex flex-wrap gap-2">
        <button
          class="btn-secondary"
          disabled={!canUndo(history)}
          onClick$={() => {
            const snapshot = undo(history);
            if (snapshot) {
              state.content = snapshot.content;
              saveState(state);
            }
          }}
        >
          Undo
        </button>
        <button
          class="btn-secondary"
          disabled={!canRedo(history)}
          onClick$={() => {
            const snapshot = redo(history);
            if (snapshot) {
              state.content = snapshot.content;
              saveState(state);
            }
          }}
        >
          Redo
        </button>
        <button
          class="btn-primary"
          onClick$={() => onApply()}
        >
          Apply Scenario Change
        </button>
        <button
          class="btn-secondary"
          onClick$={() => resetState(state, history)}
        >
          Reset
        </button>
      </div>
      <p class="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
        History: {history.past.length} past, {history.future.length} future
      </p>
    </div>
  );
});

// ---- History Panel ----
interface HistoryPanelProps {
  history: HistoryManager;
  state: PortfolioState;
}

export const HistoryPanel = component$<HistoryPanelProps>(({ history, state }) => {
  return (
    <div class="editor-section">
      <h2 class="text-base font-semibold mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
        History State
      </h2>

      {/* Current snapshot */}
      <div class="mb-3 p-3 rounded-lg text-xs" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
        <span class="font-medium">Current:</span> {history.currentState.label}
        <span class="ml-2" style={{ color: 'var(--color-text-muted)' }}>
          ({new Date(history.currentState.timestamp).toLocaleTimeString()})
        </span>
      </div>

      {/* Past entries */}
      {history.past.length > 0 && (
        <div class="mb-2">
          <span class="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Past states:</span>
          <div class="mt-1 max-h-32 overflow-y-auto space-y-1">
            {history.past.map((snap, i) => (
              <button
                key={`past-${i}-${snap.timestamp}`}
                type="button"
                class="history-entry text-xs p-2 rounded w-full text-left"
                style={{ background: '#f5f5f4', border: '1px solid var(--color-border)' }}
                onClick$={() => jumpToPastSnapshot(history, state, i)}
              >
                {snap.label}
                <span class="ml-1" style={{ color: 'var(--color-text-muted)' }}>
                  ({new Date(snap.timestamp).toLocaleTimeString()})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Future entries */}
      {history.future.length > 0 && (
        <div>
          <span class="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Future states (redo):</span>
          <div class="mt-1 max-h-32 overflow-y-auto space-y-1">
            {history.future.map((snap, i) => (
              <button
                key={`future-${i}-${snap.timestamp}`}
                type="button"
                class="history-entry text-xs p-2 rounded w-full text-left"
                style={{ background: '#fef3c7', border: '1px solid #fde68a' }}
                onClick$={() => jumpToFutureSnapshot(history, state, i)}
              >
                {snap.label}
                <span class="ml-1" style={{ color: 'var(--color-text-muted)' }}>
                  ({new Date(snap.timestamp).toLocaleTimeString()})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {history.past.length === 0 && history.future.length === 0 && (
        <p class="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          No undo/redo history yet.
        </p>
      )}

      {/* Content snapshot summary */}
      <div class="mt-3 pt-3 border-t text-xs" style={{ borderColor: 'var(--color-border)' }}>
        <span class="font-medium">Content summary:</span>
        <span class="ml-1">
          {state.content.projects.length} projects,
          {state.content.skills.length} skills,
          {state.content.testimonials.length} testimonials
        </span>
      </div>
    </div>
  );
});
