import { component$, useSignal, $, useVisibleTask$, useStore } from '@builder.io/qwik';
import type { PortfolioState, HistoryManager } from '../types';
import { generatePortfolioJSON, generateMarkdownResume, importPortfolioJSON } from '../store';

interface ExportPanelProps {
  state: PortfolioState;
  history: HistoryManager;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportPanel = component$<ExportPanelProps>(({ state, history, isOpen, onClose }) => {
  const activeTab = useSignal<'json' | 'markdown'>('json');
  const copyMessage = useSignal('');
  const importError = useSignal('');
  const importText = useSignal('');
  const isImporting = useSignal(false);

  // Close on Escape
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    cleanup(() => window.removeEventListener('keydown', handleKeyDown));
  });

  const handleCopy = $(async () => {
    const text = activeTab.value === 'json' ? generatePortfolioJSON(state) : generateMarkdownResume(state);
    try {
      await navigator.clipboard.writeText(text);
      copyMessage.value = 'Copied to clipboard!';
      setTimeout(() => { copyMessage.value = ''; }, 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  });

  const handleDownload = $(() => {
    const text = activeTab.value === 'json' ? generatePortfolioJSON(state) : generateMarkdownResume(state);
    const filename = activeTab.value === 'json' ? 'portfolio.json' : 'resume.md';
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  const handleImport = $(() => {
    const res = importPortfolioJSON(state, history, importText.value);
    if (res.success) {
      importText.value = '';
      isImporting.value = false;
      onClose();
    } else {
      importError.value = res.error || 'Import failed';
    }
  });

  if (!isOpen) return null;

  return (
    <div
      class="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
    >
      <div
        class="w-full max-w-3xl flex flex-col rounded-2xl shadow-xl overflow-hidden"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          borderWidth: '1px',
          maxHeight: '90vh'
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
        tabIndex={-1}
      >
        <div class="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
          <h2 id="export-title" class="text-xl font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Export package
          </h2>
          <button class="btn-small" onClick$={onClose} aria-label="Close Export package">
            ×
          </button>
        </div>

        <div class="p-4 flex gap-4 border-b" style={{ borderColor: 'var(--color-border)', background: '#fafaf9' }}>
          <button
            class={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab.value === 'json' ? 'bg-white shadow-sm' : ''}`}
            onClick$={() => { activeTab.value = 'json'; isImporting.value = false; }}
          >
            Portfolio JSON
          </button>
          <button
            class={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab.value === 'markdown' ? 'bg-white shadow-sm' : ''}`}
            onClick$={() => { activeTab.value = 'markdown'; isImporting.value = false; }}
          >
            Markdown resume
          </button>
          <button
            class={`px-4 py-2 rounded-lg text-sm font-medium ${isImporting.value ? 'bg-white shadow-sm' : ''}`}
            onClick$={() => { isImporting.value = true; importError.value = ''; }}
          >
            Import JSON
          </button>
        </div>

        <div class="p-4 flex-1 overflow-auto bg-white min-h-[300px]">
          {isImporting.value ? (
            <div class="h-full flex flex-col">
              <label class="editor-label mb-2" for="import-textarea">Paste Portfolio JSON here</label>
              <textarea
                id="import-textarea"
                class="flex-1 w-full p-3 border rounded-lg font-mono text-sm"
                style={{ borderColor: 'var(--color-border)', resize: 'none' }}
                value={importText.value}
                onInput$={(e) => {
                  importText.value = (e.target as HTMLTextAreaElement).value;
                  importError.value = '';
                }}
                placeholder="{...}"
              />
              {importError.value && (
                <p class="text-sm mt-2 font-medium" style={{ color: '#dc2626' }}>
                  {importError.value}
                </p>
              )}
              <div class="mt-4 flex justify-end">
                <button class="btn-primary" onClick$={handleImport}>
                  Import
                </button>
              </div>
            </div>
          ) : (
            <textarea
              class="w-full h-full p-4 font-mono text-sm border-0 focus:ring-0 resize-none bg-transparent"
              readOnly
              value={activeTab.value === 'json' ? generatePortfolioJSON(state) : generateMarkdownResume(state)}
            />
          )}
        </div>

        {!isImporting.value && (
          <div class="p-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--color-border)', background: '#fafaf9' }}>
            <span class="text-sm font-medium" style={{ color: '#15803d' }} role="status">
              {copyMessage.value}
            </span>
            <div class="flex gap-2">
              <button class="btn-secondary" onClick$={handleCopy}>
                Copy
              </button>
              <button class="btn-primary" onClick$={handleDownload}>
                Download
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});