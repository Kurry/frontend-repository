import { component$, $, useStore, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import type { Signal } from '@builder.io/qwik';
import type { NoteMark } from '../types';
import { renderFormattedText, toggleMarkRange } from '../marks';

interface ComposerProps {
  onSubmit: (text: string, marks: NoteMark[], file?: { name: string; size: number }) => void;
  editText: Signal<{ id: string; text: string; marks?: NoteMark[] } | null>;
  onCancelEdit: () => void;
}

export const Composer = component$<ComposerProps>(({ onSubmit, editText, onCancelEdit }) => {
  const local = useStore({
    text: '',
    marks: [] as NoteMark[],
    error: '',
    shake: false,
    attachedFile: null as { name: string; size: number } | null,
  });
  const textareaRef = useSignal<HTMLTextAreaElement>();
  const composerHistory = useStore<{ stack: { text: string; marks: NoteMark[] }[] }>({ stack: [] });

  useVisibleTask$(({ track }) => {
    track(() => editText.value);
    if (editText.value) {
      local.text = editText.value.text;
      local.marks = editText.value.marks ?? [];
      local.error = '';
      local.attachedFile = null;
    }
  });

  const handleSubmit = $(() => {
    const trimmed = local.text.trim();
    if (!trimmed) {
      local.error = 'text: Please enter a note before sending.';
      local.shake = true;
      setTimeout(() => {
        local.shake = false;
      }, 300);
      return;
    }
    if (trimmed.length > 2000) {
      local.error = 'text: Note text must be at most 2000 characters. Shorten the note and try again.';
      local.shake = true;
      setTimeout(() => {
        local.shake = false;
      }, 300);
      return;
    }
    onSubmit(trimmed, local.marks, local.attachedFile ?? undefined);
    local.text = '';
    local.marks = [];
    local.error = '';
    local.attachedFile = null;
    composerHistory.stack = [];
    if (editText.value) {
      onCancelEdit();
    }
  });

  const handleKeyDown = $((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault();
      const prev = composerHistory.stack.pop();
      if (prev) {
        local.text = prev.text;
        local.marks = prev.marks;
      }
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  });

  const applyFormat = $((style: 'bold' | 'italic') => {
    const el = textareaRef.value;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    if (start >= end) return;
    composerHistory.stack = [
      ...composerHistory.stack.slice(-20),
      { text: local.text, marks: [...local.marks] },
    ];
    local.marks = toggleMarkRange(local.marks, start, end, style, local.text.length);
  });

  const handleFileChange = $((e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      local.attachedFile = { name: file.name, size: file.size };
    }
    input.value = '';
  });

  return (
    <div class="border-t border-gray-200 bg-white p-4" data-testid="composer-root">
      {editText.value && (
        <div class="mb-2 flex items-center justify-between text-sm text-[var(--color-accent)]">
          <span>Editing Note</span>
          <button
            onClick$={() => {
              onCancelEdit();
              local.text = '';
              local.marks = [];
              local.error = '';
            }}
            class="rounded-full px-3 py-1 text-xs font-medium transition-colors hover:bg-red-100 hover:text-red-600"
          >
            Cancel
          </button>
        </div>
      )}
      {local.attachedFile && (
        <div class="mb-2 flex items-center gap-2 text-sm text-gray-500">
          <span class="truncate">📎 {local.attachedFile.name}</span>
          <button
            onClick$={() => {
              local.attachedFile = null;
            }}
            class="text-xs text-red-400 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      )}
      {local.text && local.marks.length > 0 && (
        <div
          class="composer-surface mb-2 rounded-lg border border-gray-100 bg-gray-50 px-4 py-2 text-[17px] leading-relaxed text-[var(--color-text-primary)]"
          aria-hidden="true"
          dangerouslySetInnerHTML={renderFormattedText(local.text, local.marks)}
        />
      )}
      <div class={`flex items-end gap-2 ${local.shake ? 'shake' : ''}`}>
        <div class="flex shrink-0 gap-2">
          <button
            type="button"
            onClick$={() => applyFormat('bold')}
            class="rounded-full bg-[var(--color-primary)] px-3 py-2 text-xs font-semibold text-[var(--color-accent)] transition-colors hover:bg-[#D4E0F0]"
            aria-label="Bold"
          >
            Bold
          </button>
          <button
            type="button"
            onClick$={() => applyFormat('italic')}
            class="rounded-full bg-[var(--color-primary)] px-3 py-2 text-xs font-medium text-[var(--color-accent)] transition-colors hover:bg-[#D4E0F0]"
            aria-label="Italic"
          >
            Italic
          </button>
          <label
            htmlFor="composer-file-upload"
            class="flex cursor-pointer items-center gap-1 rounded-full bg-[var(--color-primary)] px-3 py-2 text-xs font-medium text-[var(--color-accent)] transition-colors hover:bg-[#D4E0F0]"
          >
            Attach File
          </label>
        </div>
        <input
          id="composer-file-upload"
          type="file"
          class="hidden"
          onChange$={handleFileChange}
        />
        <textarea
          ref={textareaRef}
          value={local.text}
          onInput$={(e: Event) => {
            const target = e.target as HTMLTextAreaElement;
            composerHistory.stack = [
              ...composerHistory.stack.slice(-20),
              { text: local.text, marks: [...local.marks] },
            ];
            local.text = target.value;
            if (local.error) local.error = '';
          }}
          onKeyDown$={handleKeyDown}
          rows={1}
          placeholder={editText.value ? 'Edit your note... #tags' : 'Type a note... #tags'}
          aria-label="Note text"
          data-testid="composer-input"
          class="min-h-[48px] flex-1 resize-none rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-[17px] leading-relaxed text-[var(--color-text-primary)] outline-none placeholder:text-gray-400 focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
        />
        <button
          type="button"
          onClick$={handleSubmit}
          class="btn-primary flex shrink-0 items-center gap-1 px-5 py-3 text-[15px] font-semibold transition-all hover:bg-[#004999] active:scale-95"
        >
          {editText.value ? 'Save' : 'Send'}
        </button>
      </div>
      {local.error && (
        <p class="mt-2 text-sm text-red-500" role="alert" aria-live="polite">
          {local.error}
        </p>
      )}
    </div>
  );
});
