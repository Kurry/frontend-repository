import { component$, useSignal, $, useVisibleTask$, type Signal, type QRL } from '@builder.io/qwik';
import type { PortfolioState } from '../types';
import type { HistoryManager } from '../store';
import { generatePortfolioJSON, generateMarkdownResume, importPortfolioJSON } from '../store';
import { copyToClipboard } from '../clipboard';

type ExportTab = 'json' | 'markdown';

interface ExportPanelProps {
  state: PortfolioState;
  history: HistoryManager;
  isOpen: boolean;
  activeTab: Signal<ExportTab>;
  isImporting: Signal<boolean>;
  onClose: QRL<() => void>;
  onImported: QRL<() => void>;
}

const TAB_LABELS: Record<ExportTab, string> = {
  json: 'Portfolio JSON',
  markdown: 'Markdown resume',
};

export const ExportPanel = component$<ExportPanelProps>(({ state, history, isOpen, activeTab, isImporting, onClose, onImported }) => {
  const copyMessage = useSignal('');
  const importError = useSignal('');
  const importText = useSignal('');
  const dialogRef = useSignal<HTMLDivElement>();
  const lastFocused = useSignal<Element | null>(null);

  const visibleText = () =>
    activeTab.value === 'json' ? generatePortfolioJSON(state) : generateMarkdownResume(state);

  // Escape closes; Tab is trapped inside the dialog; focus returns to the opener.
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    track(() => isOpen);
    if (!isOpen) return;
    lastFocused.value = document.activeElement;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Tab' && dialogRef.value) {
        const focusables = Array.from(
          dialogRef.value.querySelectorAll<HTMLElement>(
            'button, input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => !el.hasAttribute('disabled'));
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
    const t = window.setTimeout(() => {
      dialogRef.value?.querySelector<HTMLElement>('button, input, textarea')?.focus();
    }, 30);
    cleanup(() => {
      window.removeEventListener('keydown', handleKeyDown);
      window.clearTimeout(t);
      const back = lastFocused.value;
      if (back instanceof HTMLElement) back.focus();
    });
  });

  const handleClose = $(() => {
    importError.value = '';
    onClose();
  });

  const handleCopy = $(async () => {
    const ok = await copyToClipboard(visibleText());
    copyMessage.value = ok
      ? `Copied ${TAB_LABELS[activeTab.value]} to clipboard.`
      : 'Copy is blocked by the browser — select the preview text and copy manually.';
    window.setTimeout(() => {
      copyMessage.value = '';
    }, 2200);
  });

  const handleDownload = $(() => {
    const text = visibleText();
    const filename = activeTab.value === 'json' ? 'portfolio.json' : 'resume.md';
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  });

  const runImport = $(() => {
    const res = importPortfolioJSON(state, history, importText.value);
    if (res.success) {
      importText.value = '';
      importError.value = '';
      isImporting.value = false;
      onClose();
      onImported();
    } else {
      importError.value = res.error || 'Import rejected: the package does not match the Portfolio JSON field contract.';
    }
  });

  const handleFileChosen = $((file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      importText.value = String(reader.result ?? '');
      importError.value = '';
    };
    reader.readAsText(file);
  });

  if (!isOpen) return null;

  return (
    <div
      class="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick$={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        ref={dialogRef}
        class="w-full max-w-3xl flex flex-col rounded-2xl shadow-xl overflow-hidden"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          borderWidth: '1px',
          maxHeight: '90vh',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
      >
        <div class="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
          <h2 id="export-title" class="text-xl font-semibold">
            Export package
          </h2>
          <button type="button" class="btn-small" onClick$={handleClose} aria-label="Close Export package">
            ×
          </button>
        </div>

        <div class="p-4 flex flex-wrap gap-2 border-b" style={{ borderColor: 'var(--color-border)', background: '#fafaf9' }} role="tablist" aria-label="Export package views">
          {(['json', 'markdown'] as ExportTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={!isImporting.value && activeTab.value === tab}
              class={`tab-button px-4 py-2 rounded-lg text-sm font-medium ${!isImporting.value && activeTab.value === tab ? '' : ''}`}
              onClick$={() => {
                activeTab.value = tab;
                isImporting.value = false;
                importError.value = '';
              }}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
          <button
            type="button"
            class={`tab-button px-4 py-2 rounded-lg text-sm font-medium ${isImporting.value ? 'bg-white shadow-sm' : ''}`}
            aria-pressed={isImporting.value}
            onClick$={() => {
              isImporting.value = !isImporting.value;
              importError.value = '';
            }}
          >
            Import package
          </button>
        </div>

        <div class="p-4 flex-1 overflow-auto bg-white min-h-[300px]">
          {isImporting.value ? (
            <div class="h-full flex flex-col">
              <label class="editor-label mb-2" for="import-textarea">
                Paste Portfolio JSON here, or choose an exported portfolio.json file
              </label>
              <textarea
                id="import-textarea"
                class="flex-1 w-full p-3 border rounded-lg text-sm"
                style={{ borderColor: 'var(--color-border)', resize: 'none', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
                value={importText.value}
                onInput$={(e) => {
                  importText.value = (e.target as HTMLTextAreaElement).value;
                  importError.value = '';
                }}
                placeholder='{"schemaVersion": "portfolioframe-v1", …}'
              />
              <div class="mt-3 flex items-center gap-3">
                <label class="btn-secondary text-sm cursor-pointer" for="import-file">
                  Choose JSON file
                </label>
                <input
                  id="import-file"
                  type="file"
                  accept=".json,application/json"
                  class="sr-only"
                  onChange$={(e) => {
                    const input = e.target as HTMLInputElement;
                    handleFileChosen(input.files?.[0] ?? null);
                  }}
                />
                <span class="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  schemaVersion must be portfolioframe-v1
                </span>
              </div>
              {importError.value && (
                <p class="text-sm mt-2 font-medium" style={{ color: '#dc2626' }} role="alert">
                  {importError.value}
                </p>
              )}
              <div class="mt-4 flex justify-end">
                <button type="button" class="btn-primary" onClick$={runImport}>
                  Import package
                </button>
              </div>
            </div>
          ) : (
            <textarea
              class="w-full h-full p-4 text-sm border-0 focus:ring-0 resize-none bg-transparent"
              style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
              readOnly
              aria-label={`${TAB_LABELS[activeTab.value]} preview (live-compiled)`}
              value={visibleText()}
            />
          )}
        </div>

        {!isImporting.value && (
          <div class="p-4 border-t flex items-center justify-between gap-3" style={{ borderColor: 'var(--color-border)', background: '#fafaf9' }}>
            <span class="text-sm font-medium" style={{ color: '#15803d' }} role="status" aria-live="polite">
              {copyMessage.value}
            </span>
            <div class="flex gap-2">
              <button type="button" class="btn-secondary" onClick$={handleCopy}>
                Copy export
              </button>
              <button type="button" class="btn-primary" onClick$={handleDownload}>
                Download export
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
