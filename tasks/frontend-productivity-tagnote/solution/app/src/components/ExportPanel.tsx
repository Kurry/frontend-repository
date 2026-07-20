import { component$, $, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import type { AppState } from '../types';
import { buildSessionJson, buildTimelineMarkdown } from '../utils';

interface ExportPanelProps {
  state: AppState;
  onClose: () => void;
}

export const ExportPanel = component$<ExportPanelProps>(({ state, onClose }) => {
  const activeTab = useSignal<'session-json' | 'timeline-markdown'>('session-json');
  const showCopied = useSignal(false);
  const jsonOutput = useSignal('');
  const markdownOutput = useSignal('');
  const dialogRef = useSignal<HTMLDivElement>();
  const closing = useSignal(false);

  useVisibleTask$(({ track }) => {
    track(() => state);
    track(() => activeTab.value);
    jsonOutput.value = buildSessionJson(state);
    markdownOutput.value = buildTimelineMarkdown(state);
  });

  useVisibleTask$(() => {
    dialogRef.value?.focus();
  });

  const requestClose = $(() => {
    closing.value = true;
    setTimeout(() => onClose(), 200);
  });

  const handleCopy = $(async () => {
    const content = activeTab.value === 'session-json' ? jsonOutput.value : markdownOutput.value;
    let copied = false;
    try {
      await navigator.clipboard.writeText(content);
      copied = true;
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      copied = document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    if (copied) {
      showCopied.value = true;
      setTimeout(() => (showCopied.value = false), 2000);
    }
  });

  const handleDownload = $(() => {
    const content = activeTab.value === 'session-json' ? jsonOutput.value : markdownOutput.value;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeTab.value === 'session-json' ? 'tagnote-export.json' : 'tagnote-timeline.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  const handleKeyDown = $((e: KeyboardEvent) => {
    if (e.key === 'Escape') requestClose();
  });

  return (
    <div
      ref={dialogRef}
      class={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 ${closing.value ? 'modal-backdrop-exit' : 'modal-backdrop-enter'}`}
      onKeyDown$={handleKeyDown}
      tabIndex={-1}
      role="dialog"
      aria-label="Export panel"
    >
      <div class={`w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl ${closing.value ? 'modal-panel-exit' : 'modal-panel-enter'}`}>
        <div class="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-4 sm:px-6">
          <h2 class="text-xl font-bold text-gray-800">Export</h2>
          <button
            onClick$={requestClose}
            class="rounded-full p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            aria-label="Close Export Panel"
          >
            ✕
          </button>
        </div>

        <div class="border-b border-gray-200 bg-gray-50 px-4 pt-4 sm:px-6">
          <div class="flex flex-wrap gap-2 sm:gap-4">
            <button
              onClick$={() => (activeTab.value = 'session-json')}
              class={`border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${activeTab.value === 'session-json' ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
            >
              Session JSON
            </button>
            <button
              onClick$={() => (activeTab.value = 'timeline-markdown')}
              class={`border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${activeTab.value === 'timeline-markdown' ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
            >
              Timeline Markdown
            </button>
          </div>
        </div>

        <div class="p-4 sm:p-6">
          <div class="mb-4 flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <span class={`text-sm text-green-600 transition-opacity ${showCopied.value ? 'opacity-100' : 'opacity-0'}`}>
              Copied!
            </span>
            <button
              onClick$={handleCopy}
              class="rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-accent)] transition-colors hover:bg-[#D4E0F0]"
            >
              Copy
            </button>
            <button
              onClick$={handleDownload}
              class="btn-primary px-4 py-2 text-sm font-medium transition-colors hover:bg-[#004999]"
            >
              Download
            </button>
          </div>

          <div class="relative h-[300px] overflow-hidden rounded-lg border border-gray-200 bg-gray-50 sm:h-[400px]">
            <pre class="h-full w-full overflow-auto p-4 text-[13px] text-gray-800" aria-label="Export preview">
              {activeTab.value === 'session-json' ? jsonOutput.value : markdownOutput.value}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
});
