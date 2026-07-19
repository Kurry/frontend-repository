import { component$, $ } from '@builder.io/qwik';
import type { Signal } from '@builder.io/qwik';
import type { HistoryState } from '../types';
import {
  jumpToPastSnapshot,
  jumpToFutureSnapshot,
  applyBranch,
} from '../store';

interface HistoryPanelProps {
  history: HistoryState;
  onUndo: () => void;
  onRedo: () => void;
  onApplyScenarioChange: () => void;
  onHistoryChange: (next: HistoryState) => void;
  canUndo: boolean;
  canRedo: boolean;
  open: Signal<boolean>;
}

export const HistoryPanel = component$<HistoryPanelProps>(
  ({
    history,
    onUndo,
    onRedo,
    onApplyScenarioChange,
    onHistoryChange,
    canUndo,
    canRedo,
    open,
  }) => {
    if (!open.value) return null;

    const applyPast = $((index: number) => {
      onHistoryChange(jumpToPastSnapshot(history, index));
    });

    const applyFuture = $((index: number) => {
      onHistoryChange(jumpToFutureSnapshot(history, index));
    });

    const selectBranch = $((branchId: string) => {
      const branch = history.branches.find((b) => b.id === branchId);
      if (branch) {
        onHistoryChange(applyBranch(history, branch));
      }
    });

    return (
      <div class="fixed inset-0 z-50 flex items-end justify-center bg-black/20 sm:items-center">
        <div class="w-full max-w-md rounded-t-[7px] bg-white p-5 shadow-xl sm:rounded-[7px]">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-[17px] font-semibold text-[var(--color-text-primary)]">History</h2>
            <button
              onClick$={() => {
                open.value = false;
              }}
              class="rounded-full p-1 text-gray-400 hover:bg-gray-100"
              aria-label="Close history panel"
            >
              ✕
            </button>
          </div>

          <div class="mb-4 flex flex-wrap gap-2">
            <button
              onClick$={onUndo}
              disabled={!canUndo}
              class={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                canUndo
                  ? 'bg-[var(--color-primary)] text-[var(--color-accent)] hover:bg-[#D4E0F0]'
                  : 'cursor-not-allowed bg-gray-100 text-gray-300'
              }`}
            >
              ← Undo
            </button>
            <button
              onClick$={onRedo}
              disabled={!canRedo}
              class={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                canRedo
                  ? 'bg-[var(--color-primary)] text-[var(--color-accent)] hover:bg-[#D4E0F0]'
                  : 'cursor-not-allowed bg-gray-100 text-gray-300'
              }`}
            >
              Redo →
            </button>
            <button
              onClick$={onApplyScenarioChange}
              class="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[#FEFEFE] shadow-none hover:bg-[#0066DD]"
              style={{ borderRadius: '1000px', boxShadow: 'none' }}
            >
              Apply Scenario Change
            </button>
          </div>

          <div class="mb-3 rounded-[7px] bg-gray-50 p-3" aria-label="History state">
            <span class="text-xs font-medium uppercase text-gray-400">History state</span>
            <p class="mt-1 text-sm text-gray-600">
              {history.past.length} past · {history.future.length} future ·{' '}
              {history.present.notes.length} notes · Branch {history.branchId.slice(0, 6)}
            </p>
          </div>

          <div class="max-h-60 space-y-3 overflow-y-auto">
            {history.past.length > 0 && (
              <div>
                <p class="mb-1 text-xs font-medium uppercase text-gray-400">Past states</p>
                <div class="space-y-1">
                  {history.past.map((entry, i) => (
                    <button
                      key={`past-${entry.timestamp}-${i}`}
                      onClick$={() => applyPast(i)}
                      class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                    >
                      <span class="text-xs text-gray-400">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                      <span class="flex-1 text-[var(--color-text-primary)]">{entry.label}</span>
                      <span class="text-xs text-gray-400">{entry.state.notes.length} notes</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {history.future.length > 0 && (
              <div>
                <p class="mb-1 text-xs font-medium uppercase text-gray-400">Future states</p>
                <div class="space-y-1">
                  {history.future.map((entry, i) => (
                    <button
                      key={`future-${entry.timestamp}-${i}`}
                      onClick$={() => applyFuture(i)}
                      class="flex w-full items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-left text-sm hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                    >
                      <span class="text-xs text-gray-400">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                      <span class="flex-1 text-[var(--color-text-primary)]">{entry.label}</span>
                      <span class="text-xs text-gray-400">{entry.state.notes.length} notes</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {history.branches.length > 0 && (
              <div>
                <p class="mb-1 text-xs font-medium uppercase text-gray-400">Alternate branches</p>
                <div class="space-y-1">
                  {history.branches.map((branch) => (
                    <button
                      key={branch.id}
                      onClick$={() => selectBranch(branch.id)}
                      class="flex w-full items-center gap-2 rounded-md bg-blue-50 px-3 py-2 text-left text-sm hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                    >
                      <span class="flex-1 text-[var(--color-text-primary)]">{branch.label}</span>
                      <span class="text-xs text-gray-400">{branch.state.notes.length} notes</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {history.past.length === 0 &&
              history.future.length === 0 &&
              history.branches.length === 0 && (
                <p class="text-center text-sm text-gray-400">No history yet</p>
              )}
          </div>
        </div>
      </div>
    );
  }
);
