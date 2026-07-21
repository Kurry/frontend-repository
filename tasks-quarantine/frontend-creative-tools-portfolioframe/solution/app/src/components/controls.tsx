import { component$, $, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import autoAnimate from '@formkit/auto-animate';
import type { PortfolioState, ThemeName, DensityMode, SectionKey } from '../types';
import type { HistoryManager } from '../store';
import {
  toggleSectionVisibility,
  moveSectionUp,
  moveSectionDown,
  setTheme,
  setDensity,
  saveDraft,
  loadDraft,
  deleteDraft,
  validateDraftName,
  getChecklist,
  completenessCount,
  undo,
  redo,
  canUndo,
  canRedo,
  jumpToPastSnapshot,
  jumpToFutureSnapshot,
  selectBranch,
  resetState,
  pushHistory,
  saveState,
  applyLayoutPreset,
  LAYOUT_PRESETS,
} from '../store';
import { SECTION_LABELS } from '../types';

// ---- Theme Picker ----
interface ThemePickerProps {
  state: PortfolioState;
  history: HistoryManager;
}

const THEME_SWATCHES: { name: ThemeName; color: string; support: string }[] = [
  { name: 'sunrise', color: '#f97316', support: '#fde68a' },
  { name: 'slate', color: '#475569', support: '#cbd5e1' },
  { name: 'forest', color: '#15803d', support: '#bbf7d0' },
  { name: 'blossom', color: '#db2777', support: '#fbcfe8' },
];

export const ThemePicker = component$<ThemePickerProps>(({ state, history }) => {
  return (
    <div class="editor-section">
      <h2 class="text-base font-semibold mb-3">Theme</h2>
      <div class="flex gap-3 items-center">
        {THEME_SWATCHES.map((swatch) => {
          const active = state.theme === swatch.name;
          const label = swatch.name.charAt(0).toUpperCase() + swatch.name.slice(1);
          return (
            <div key={swatch.name} class="flex flex-col items-center gap-1">
              <button
                type="button"
                class={`theme-swatch ${active ? 'active' : ''}`}
                style={{ background: `linear-gradient(135deg, ${swatch.color} 50%, ${swatch.support} 50%)` }}
                onClick$={() => setTheme(state, history, swatch.name)}
                aria-label={`${label} theme`}
                aria-pressed={active}
                title={`${label} theme`}
              />
              <span class="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ---- Density Toggle ----
interface DensityToggleProps {
  state: PortfolioState;
  history: HistoryManager;
}

export const DensityToggle = component$<DensityToggleProps>(({ state, history }) => {
  return (
    <div class="editor-section">
      <h2 class="text-base font-semibold mb-3">Density</h2>
      <div class="flex gap-2" role="group" aria-label="Preview density">
        <button
          type="button"
          class={state.density === 'compact' ? 'btn-primary text-sm py-1 px-4' : 'btn-secondary text-sm py-1 px-4'}
          aria-pressed={state.density === 'compact'}
          onClick$={() => setDensity(state, history, 'compact')}
        >
          Compact
        </button>
        <button
          type="button"
          class={state.density === 'spacious' ? 'btn-primary text-sm py-1 px-4' : 'btn-secondary text-sm py-1 px-4'}
          aria-pressed={state.density === 'spacious'}
          onClick$={() => setDensity(state, history, 'spacious')}
        >
          Spacious
        </button>
      </div>
    </div>
  );
});

// ---- Layout Presets ----
interface LayoutPresetsProps {
  state: PortfolioState;
  history: HistoryManager;
}

export const LayoutPresets = component$<LayoutPresetsProps>(({ state, history }) => {
  const isApplied = (id: string): boolean => {
    const preset = LAYOUT_PRESETS.find((p) => p.id === id);
    if (!preset) return false;
    return (
      state.theme === preset.theme &&
      state.density === preset.density &&
      JSON.stringify(state.sectionOrder) === JSON.stringify(preset.sectionOrder) &&
      JSON.stringify(state.sectionVisibility) === JSON.stringify(preset.sectionVisibility)
    );
  };

  return (
    <div class="editor-section">
      <h2 class="text-base font-semibold mb-3">Layout Presets</h2>
      <div class="space-y-2">
        {LAYOUT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            class="preset-card"
            aria-pressed={isApplied(preset.id)}
            onClick$={() => applyLayoutPreset(state, history, preset.id)}
          >
            <span class="block text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {preset.label}
            </span>
            <span class="block text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {preset.description}
            </span>
          </button>
        ))}
      </div>
      <p class="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
        A preset applies section order, visibility, theme, and density together. Undo restores the prior layout exactly.
      </p>
    </div>
  );
});

// ---- Section Visibility Toggles ----
interface SectionTogglesProps {
  state: PortfolioState;
  history: HistoryManager;
}

export const SectionToggles = component$<SectionTogglesProps>(({ state, history }) => {
  const sections: SectionKey[] = ['header', 'projects', 'skills', 'testimonials', 'contact'];

  return (
    <div class="editor-section">
      <h2 class="text-base font-semibold mb-3">Section Visibility</h2>
      <div class="space-y-2">
        {sections.map((section) => {
          const visible = state.sectionVisibility[section];
          return (
            <div key={section} class="flex items-center justify-between">
              <span class="text-sm">{SECTION_LABELS[section]}</span>
              <button
                type="button"
                role="switch"
                class={`toggle-track ${visible ? 'active' : ''}`}
                aria-checked={visible}
                aria-label={`Toggle ${SECTION_LABELS[section]} visibility`}
                onClick$={() => toggleSectionVisibility(state, history, section)}
              >
                <span class="toggle-thumb" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ---- Section Reorder ----
interface SectionReorderProps {
  state: PortfolioState;
  history: HistoryManager;
}

export const SectionReorder = component$<SectionReorderProps>(({ state, history }) => {
  return (
    <div class="editor-section">
      <h2 class="text-base font-semibold mb-3">Section Order</h2>
      <div class="space-y-2">
        {state.sectionOrder.map((section, index) => {
          const isFirst = index === 0;
          const isLast = index === state.sectionOrder.length - 1;
          return (
            <div key={section} class="flex items-center justify-between gap-2">
              <span class="text-sm">{SECTION_LABELS[section]}</span>
              <div class="flex gap-1">
                <button
                  type="button"
                  class="btn-small"
                  disabled={isFirst}
                  aria-label={`Move ${SECTION_LABELS[section]} up`}
                  onClick$={() => moveSectionUp(state, history, section)}
                >
                  Move Up
                </button>
                <button
                  type="button"
                  class="btn-small"
                  disabled={isLast}
                  aria-label={`Move ${SECTION_LABELS[section]} down`}
                  onClick$={() => moveSectionDown(state, history, section)}
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
  const nameError = useSignal('');
  const saveMessage = useSignal('');
  const listRef = useSignal<HTMLDivElement>();

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {
    if (listRef.value) {
      const controller = autoAnimate(listRef.value, { duration: 220, respectPrefersReducedMotion: true });
      cleanup(() => controller());
    }
  });

  const handleSave = $(() => {
    const error = validateDraftName(draftName.value, state.drafts);
    if (error) {
      nameError.value = error;
      return;
    }
    const saved = saveDraft(state, draftName.value);
    nameError.value = '';
    saveMessage.value = `Draft "${saved.name}" saved — it appears in the list below and survives reload.`;
    draftName.value = '';
    window.setTimeout(() => {
      saveMessage.value = '';
    }, 3200);
  });

  return (
    <div class="editor-section">
      <h2 class="text-base font-semibold mb-3">Drafts</h2>

      {/* Save draft */}
      <form
        class="flex gap-2 mb-2"
        preventdefault:submit
        onSubmit$={handleSave}
      >
        <div class="flex-1">
          <label class="editor-label" for="draft-name-input">Draft name</label>
          <input
            id="draft-name-input"
            class="editor-input"
            placeholder="e.g. v2 before client review"
            aria-invalid={nameError.value ? 'true' : undefined}
            aria-describedby={nameError.value ? 'draft-name-error' : undefined}
            value={draftName.value}
            onInput$={(e) => {
              draftName.value = (e.target as HTMLInputElement).value;
              nameError.value = '';
            }}
          />
        </div>
        <button type="submit" class="btn-primary self-end">
          Save As Draft
        </button>
      </form>
      {nameError.value && (
        <p id="draft-name-error" class="field-error" role="alert">
          {nameError.value}
        </p>
      )}

      {saveMessage.value && (
        <p class="text-sm mb-2" style={{ color: '#15803d' }} role="status">
          {saveMessage.value}
        </p>
      )}

      {/* Draft list */}
      <div ref={listRef} class="space-y-2 mt-2">
        {state.drafts.length === 0 && (
          <p class="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            No saved drafts. Type a name and choose Save As Draft to snapshot the whole portfolio.
          </p>
        )}
        {state.drafts.map((draft) => (
          <div
            key={draft.name}
            class="draft-row flex items-center justify-between p-2 rounded-lg"
            style={{ background: '#f5f5f4' }}
          >
            <div class="flex-1 min-w-0">
              <span class="text-sm font-medium truncate">{draft.name}</span>
              <span class="text-xs ml-2" style={{ color: 'var(--color-text-muted)' }}>
                {new Date(draft.timestamp).toLocaleString()}
              </span>
            </div>
            <div class="flex gap-1 ml-2">
              <button type="button" class="btn-small" aria-label={`Load draft ${draft.name}`} onClick$={() => loadDraft(state, history, draft.name)}>
                Load
              </button>
              <button type="button" class="btn-small" aria-label={`Delete draft ${draft.name}`} onClick$={() => deleteDraft(state, draft.name)}>
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
  const radius = 17;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - (count.total === 0 ? 0 : count.done / count.total));

  return (
    <div class="editor-section">
      <div class="flex items-center gap-3 mb-3">
        <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
          <circle class="completeness-ring-track" cx="22" cy="22" r={radius} fill="none" stroke-width="5" />
          <circle
            class="completeness-ring-bar"
            cx="22"
            cy="22"
            r={radius}
            fill="none"
            stroke-width="5"
            stroke-linecap="round"
            stroke-dasharray={circumference}
            stroke-dashoffset={offset}
            transform="rotate(-90 22 22)"
          />
          <text x="22" y="26" text-anchor="middle" font-size="11" font-weight="600" fill="var(--color-text-primary)">
            {count.done}/{count.total}
          </text>
        </svg>
        <h2 class="text-base font-semibold">
          Completeness: {count.done} of {count.total} complete
        </h2>
      </div>
      <div class="space-y-1">
        {items.map((item, i) => (
          <div key={i} class="flex items-center gap-2">
            <span class="text-sm" aria-hidden="true" style={{ color: item.complete ? '#15803d' : '#a8a29e' }}>
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
              {item.complete && <span class="sr-only"> (complete)</span>}
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
}

export const UndoRedo = component$<UndoRedoProps>(({ history, state }) => {
  return (
    <div class="editor-section">
      <h2 class="text-base font-semibold mb-3">Undo / Redo</h2>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="btn-secondary"
          disabled={!canUndo(history)}
          onClick$={() => undo(history, state)}
        >
          Undo
        </button>
        <button
          type="button"
          class="btn-secondary"
          disabled={!canRedo(history)}
          onClick$={() => redo(history, state)}
        >
          Redo
        </button>
        <button type="button" class="btn-secondary" onClick$={() => resetState(state, history)}>
          Reset
        </button>
      </div>
      <p class="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
        History: {history.past.length} past, {history.future.length} future
        {history.branches.length > 0 ? `, ${history.branches.length} branch${history.branches.length === 1 ? '' : 'es'}` : ''}
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
  const applyScenario = $(() => {
    // Record the current visible content as a new explicit transition.
    pushHistory(history, state, 'Apply Scenario Change');
    saveState(state);
  });

  return (
    <div class="editor-section">
      <h2 class="text-base font-semibold mb-3">History State</h2>

      {/* Current snapshot */}
      <div class="mb-3 p-3 rounded-lg text-xs" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
        <span class="font-medium">Current:</span> {history.currentState.label}
        <span class="ml-2" style={{ color: 'var(--color-text-muted)' }}>
          ({new Date(history.currentState.timestamp).toLocaleTimeString()})
        </span>
      </div>

      <button type="button" class="btn-primary w-full mb-3" onClick$={applyScenario}>
        Apply Scenario Change
      </button>

      {/* Past entries */}
      {history.past.length > 0 && (
        <div class="mb-2">
          <span class="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
            Past states (select to restore):
          </span>
          <div class="mt-1 max-h-32 overflow-y-auto space-y-1">
            {history.past.map((snap, i) => (
              <button
                key={`past-${i}-${snap.timestamp}`}
                type="button"
                class="history-entry text-xs p-2 rounded"
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
        <div class="mb-2">
          <span class="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
            Future states (redo path):
          </span>
          <div class="mt-1 max-h-32 overflow-y-auto space-y-1">
            {history.future.map((snap, i) => (
              <button
                key={`future-${i}-${snap.timestamp}`}
                type="button"
                class="history-entry text-xs p-2 rounded"
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

      {/* Abandoned branches preserved after Undo + new change */}
      {history.branches.length > 0 && (
        <div class="mb-2">
          <span class="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
            Alternate branches (abandoned timelines):
          </span>
          <div class="mt-1 max-h-36 overflow-y-auto">
            <div class="branch-node space-y-1">
              {history.branches.map((branch) => (
                <button
                  key={branch.id}
                  type="button"
                  class="history-entry text-xs p-2 rounded"
                  style={{ background: '#f5f3ff', border: '1px solid #ddd6fe' }}
                  aria-label={`Restore ${branch.label} (${branch.chain.length} snapshot${branch.chain.length === 1 ? '' : 's'})`}
                  onClick$={() => selectBranch(history, state, branch.id)}
                >
                  <span class="font-medium" style={{ color: '#6d28d9' }}>⎇ {branch.label}</span>
                  <span class="ml-1" style={{ color: 'var(--color-text-muted)' }}>
                    · {branch.chain.length} snapshot{branch.chain.length === 1 ? '' : 's'} · select to restore
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {history.past.length === 0 && history.future.length === 0 && history.branches.length === 0 && (
        <p class="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          No history yet — content edits, presets, and Import are recorded here as selectable transitions.
        </p>
      )}

      {/* Content snapshot summary */}
      <div class="mt-3 pt-3 border-t text-xs" style={{ borderColor: 'var(--color-border)' }}>
        <span class="font-medium">Content summary:</span>
        <span class="ml-1">
          {state.content.projects.length} projects, {state.content.skills.length} skills,{' '}
          {state.content.testimonials.length} testimonials
        </span>
      </div>
    </div>
  );
});
