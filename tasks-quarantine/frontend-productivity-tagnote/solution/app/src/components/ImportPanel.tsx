import { component$, $, useSignal, useStore, useVisibleTask$ } from '@builder.io/qwik';
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
  const dialogRef = useSignal<HTMLDivElement>();

  // The trigger button that opened this panel keeps DOM focus after mount
  // (opening is just conditional rendering, not a focus change), so an
  // Escape keypress bubbles from that button through the header instead of
  // through this panel's backdrop. Move focus into the panel once so the
  // onKeyDown$ handler below actually sees it.
  useVisibleTask$(() => {
    dialogRef.value?.focus();
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
        local.error = 'schemaVersion: Expected "tagnote-session/v1". Set schemaVersion to exactly "tagnote-session/v1".';
        local.fieldError = 'schemaVersion';
        return;
      }
      if (typeof parsed.exportedAt !== 'string' || !parsed.exportedAt.trim() || Number.isNaN(new Date(parsed.exportedAt).getTime())) {
        local.error = 'exportedAt: Must be a non-empty ISO-8601 timestamp. Provide exportedAt as an ISO-8601 string.';
        local.fieldError = 'exportedAt';
        return;
      }
      if (!Array.isArray(parsed.todoTags)) {
        local.error = 'todoTags: Must be an array of lowercase tag strings. Add a todoTags array.';
        local.fieldError = 'todoTags';
        return;
      }
      if (!Array.isArray(parsed.notes)) {
        local.error = 'notes: Must be an array of note objects. Add a notes array.';
        local.fieldError = 'notes';
        return;
      }
      for (const note of parsed.notes) {
        if (typeof note.id !== 'string' || !note.id.trim()) {
            local.error = 'id: Must be a non-empty string. Provide a unique id for each note.';
            local.fieldError = 'id';
            return;
        }
        if (!Array.isArray(note.tags) || note.tags.some((t: unknown) => typeof t !== 'string')) {
            local.error = 'Invalid tags: must be an array of strings';
            local.fieldError = 'tags';
            return;
        }
        if (typeof note.createdAt !== 'string' || Number.isNaN(new Date(note.createdAt).getTime())) {
            local.error = 'Invalid createdAt: must be a valid ISO date string';
            local.fieldError = 'createdAt';
            return;
        }
        if (
          note.attachment !== null &&
          note.attachment !== undefined &&
          (typeof note.attachment !== 'object' ||
            typeof note.attachment.name !== 'string' ||
            !note.attachment.name.trim() ||
            typeof note.attachment.sizeBytes !== 'number' ||
            note.attachment.sizeBytes < 0)
        ) {
            local.error = 'Invalid attachment: must be null or { name: string, sizeBytes: number }';
            local.fieldError = 'attachment';
            return;
        }
        const trimmedText = typeof note.text === 'string' ? note.text.trim() : '';
        if (typeof note.text !== 'string' || !trimmedText) {
            local.error = 'text: Must be a non-empty trimmed string. Provide note text before importing.';
            local.fieldError = 'text';
            return;
        }
        if (trimmedText.length > 2000) {
            local.error = 'text: Must be at most 2000 characters. Shorten the note text and try again.';
            local.fieldError = 'text';
            return;
        }
        if (note.marks !== undefined && !Array.isArray(note.marks)) {
            local.error = 'Invalid marks: must be an array';
            local.fieldError = 'marks';
            return;
        }
        if (Array.isArray(note.marks)) {
           for (const mark of note.marks) {
               if (mark.style !== 'bold' && mark.style !== 'italic') {
                   local.error = 'marks: style must be "bold" or "italic". Use only bold or italic mark styles.';
                   local.fieldError = 'marks';
                   return;
               }
               if (
                 typeof mark.start !== 'number' ||
                 mark.start < 0 ||
                 typeof mark.end !== 'number' ||
                 mark.end <= mark.start ||
                 mark.end > note.text.length
               ) {
                   local.error = 'Invalid mark span: start/end out of range for note text';
                   local.fieldError = 'marks';
                   return;
               }
           }
        }
        if (typeof note.pinned !== 'boolean') {
            local.error = 'pinned: Must be a boolean. Set pinned to true or false.';
            local.fieldError = 'pinned';
            return;
        }
        if (typeof note.archived !== 'boolean') {
            local.error = 'archived: Must be a boolean. Set archived to true or false.';
            local.fieldError = 'archived';
            return;
        }
        if (typeof note.done !== 'boolean') {
            local.error = 'done: Must be a boolean. Set done to true or false.';
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
          marks: Array.isArray(n.marks) ? n.marks : [],
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
      local.error = 'json: Malformed JSON payload. Fix the JSON syntax and try again.';
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
    <div ref={dialogRef} class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity duration-200" onKeyDown$={handleKeyDown} tabIndex={-1}>
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
