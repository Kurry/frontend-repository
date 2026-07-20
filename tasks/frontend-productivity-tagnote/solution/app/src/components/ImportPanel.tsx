import { component$, $, useSignal, useStore } from '@builder.io/qwik';
import type { AppState } from '../types';

interface ImportPanelProps {
  onImport: (state: AppState) => void;
  onClose: () => void;
}

export const ImportPanel = component$<ImportPanelProps>(({ onImport, onClose }) => {
  const local = useStore({
    jsonText: '',
    error: '',
    fieldError: ''
  });

  const handleImport = $(() => {
    try {
      const parsed = JSON.parse(local.jsonText);
      if (!parsed || typeof parsed !== 'object') {
        local.error = 'Invalid JSON';
        local.fieldError = 'root';
        return;
      }
      if (parsed.schemaVersion !== 'tagnote-session/v1') {
        local.error = 'Invalid schemaVersion. Expected "tagnote-session/v1"';
        local.fieldError = 'schemaVersion';
        return;
      }
      if (!Array.isArray(parsed.todoTags)) {
        local.error = 'Missing or invalid todoTags';
        local.fieldError = 'todoTags';
        return;
      }
      if (!Array.isArray(parsed.notes)) {
        local.error = 'Missing or invalid notes';
        local.fieldError = 'notes';
        return;
      }
      for (const note of parsed.notes) {
        if (typeof note.text !== 'string' || note.text.length > 2000) {
            local.error = 'Invalid text: must be string at most 2000 characters';
            local.fieldError = 'text';
            return;
        }
        if (note.marks && Array.isArray(note.marks)) {
           for (const mark of note.marks) {
               if (mark.style !== 'bold' && mark.style !== 'italic') {
                   local.error = 'Invalid mark style: must be "bold" or "italic"';
                   local.fieldError = 'marks';
                   return;
               }
           }
        }
        if (typeof note.pinned !== 'boolean') {
            local.error = 'Invalid pinned: must be boolean';
            local.fieldError = 'pinned';
            return;
        }
        if (typeof note.archived !== 'boolean') {
            local.error = 'Invalid archived: must be boolean';
            local.fieldError = 'archived';
            return;
        }
        if (typeof note.done !== 'boolean') {
            local.error = 'Invalid done: must be boolean';
            local.fieldError = 'done';
            return;
        }
      }

      // Restore createdAt from ISO strings
      const importedState: AppState = {
        todoTags: parsed.todoTags,
        notes: parsed.notes.map((n: any) => ({
          id: n.id,
          text: n.text,
          tags: n.tags || [],
          pinned: n.pinned,
          archived: n.archived,
          done: n.done,
          createdAt: n.createdAt ? new Date(n.createdAt).getTime() : Date.now(),
          file: n.attachment ? { name: n.attachment.name, size: n.attachment.sizeBytes } : undefined
        }))
      };

      onImport(importedState);
      onClose();
    } catch (e) {
      local.error = 'Invalid JSON payload';
      local.fieldError = 'json';
    }
  });

  const handleKeyDown = $((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  });

  const handleFileChange = $((e: Event) => {
     const input = e.target as HTMLInputElement;
     const file = input.files?.[0];
     if (!file) return;
     const reader = new FileReader();
     reader.onload = (e) => {
         if (e.target?.result && typeof e.target.result === 'string') {
             local.jsonText = e.target.result;
         }
     };
     reader.readAsText(file);
     input.value = '';
  });

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity duration-200" onKeyDown$={handleKeyDown} tabIndex={-1}>
      <div class="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl transition-transform duration-200 scale-100">
        <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gray-50">
          <h2 class="text-xl font-bold text-gray-800">Import Session JSON</h2>
          <button onClick$={onClose} class="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] rounded-full p-1" aria-label="Close Import Panel">✕</button>
        </div>

        <div class="p-6">
          <p class="mb-4 text-sm text-gray-600">Paste your TagNote Session JSON here, or upload a file.</p>

          <textarea
            value={local.jsonText}
            onInput$={(e: Event) => { local.jsonText = (e.target as HTMLTextAreaElement).value; local.error = ''; }}
            class="h-[300px] w-full resize-none rounded-lg border border-gray-300 p-4 font-mono text-sm focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
            placeholder="{ schemaVersion: 'tagnote-session/v1', ... }"
            aria-label="Import JSON textarea"
          />

          {local.error && (
            <div class="mt-3 rounded bg-red-50 p-3 text-sm text-red-600" aria-live="polite">
              <strong>Error ({local.fieldError}):</strong> {local.error}
            </div>
          )}

          <div class="mt-6 flex items-center justify-between">
            <label class="cursor-pointer rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-accent)] transition-colors hover:bg-[#D4E0F0]">
              Upload File
              <input type="file" class="hidden" accept=".json,application/json" onChange$={handleFileChange} />
            </label>
            <div class="flex gap-3">
              <button onClick$={onClose} class="rounded-full px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100">
                Cancel
              </button>
              <button onClick$={handleImport} class="rounded-full bg-[var(--color-accent)] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0066DD]">
                Import
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
