import { component$, $, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import type { AppState, Note } from '../types';
import { formatDate } from '../utils';

interface ExportPanelProps {
  state: AppState;
  onClose: () => void;
}

export const ExportPanel = component$<ExportPanelProps>(({ state, onClose }) => {
  const activeTab = useSignal<'session-json' | 'timeline-markdown'>('session-json');
  const showCopied = useSignal(false);
  const jsonOutput = useSignal('');
  const markdownOutput = useSignal('');

  useVisibleTask$(({ track }) => {
    track(() => state);
    track(() => activeTab.value);

    // Generate Session JSON
    const exportObj = {
      schemaVersion: 'tagnote-session/v1',
      exportedAt: new Date().toISOString(),
      todoTags: state.todoTags,
      notes: state.notes.map(n => ({
        id: n.id,
        text: n.text,
        tags: n.tags,
        marks: [], // Adding mock empty marks to fulfill schema
        pinned: n.pinned,
        archived: n.archived,
        done: n.done,
        createdAt: new Date(n.createdAt).toISOString(),
        attachment: n.file ? { name: n.file.name, sizeBytes: n.file.size } : null
      }))
    };
    jsonOutput.value = JSON.stringify(exportObj, null, 2);

    // Generate Timeline Markdown
    let md = '';
    const groups = new Map<string, Note[]>();
    for (const note of state.notes) {
      if (note.archived) continue;
      const label = formatDate(note.createdAt);
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label)!.push(note);
    }

    for (const [label, notes] of groups) {
      md += `## ${label}\n\n`;
      for (const note of notes) {
        let prefix = '';
        if (note.pinned) prefix += '📌 ';
        if (note.tags.some(t => state.todoTags.includes(t))) {
          prefix += note.done ? '[x] ' : '[ ] ';
        }
        md += `- ${prefix}${note.text}\n`;
        const visibleTags = note.tags.filter(t => t !== 'file' && t !== 'link');
        if (visibleTags.length > 0) {
           md += `  ${visibleTags.map(t => `#${t}`).join(' ')}\n`;
        }
      }
      md += '\n';
    }
    markdownOutput.value = md.trim();
  });

  const handleCopy = $(() => {
    const content = activeTab.value === 'session-json' ? jsonOutput.value : markdownOutput.value;
    navigator.clipboard.writeText(content).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    });
    showCopied.value = true;
    setTimeout(() => showCopied.value = false, 2000);
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
    if (e.key === 'Escape') onClose();
  });

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity duration-200" onKeyDown$={handleKeyDown} tabIndex={-1}>
      <div class="w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl transition-transform duration-200 scale-100">
        <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gray-50">
          <h2 class="text-xl font-bold text-gray-800">Export</h2>
          <button onClick$={onClose} class="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] rounded-full p-1" aria-label="Close Export Panel">✕</button>
        </div>

        <div class="border-b border-gray-200 px-6 pt-4 bg-gray-50">
          <div class="flex gap-4">
            <button
              onClick$={() => activeTab.value = 'session-json'}
              class={`border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${activeTab.value === 'session-json' ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
            >
              Session JSON
            </button>
            <button
              onClick$={() => activeTab.value = 'timeline-markdown'}
              class={`border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${activeTab.value === 'timeline-markdown' ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
            >
              Timeline Markdown
            </button>
          </div>
        </div>

        <div class="p-6">
          <div class="mb-4 flex items-center justify-end gap-3">
            <span class={`text-sm text-green-600 transition-opacity ${showCopied.value ? 'opacity-100' : 'opacity-0'}`}>Copied!</span>
            <button onClick$={handleCopy} class="rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-accent)] transition-colors hover:bg-[#D4E0F0]">
              Copy
            </button>
            <button onClick$={handleDownload} class="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0066DD]">
              Download
            </button>
          </div>

          <div class="relative h-[400px] overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
            <pre class="h-full w-full overflow-auto p-4 text-[13px] text-gray-800">
              {activeTab.value === 'session-json' ? jsonOutput.value : markdownOutput.value}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
});
