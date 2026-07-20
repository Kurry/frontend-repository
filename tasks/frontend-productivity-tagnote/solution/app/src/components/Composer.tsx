import { component$, $, useStore, useVisibleTask$ } from '@builder.io/qwik';
import type { Signal } from '@builder.io/qwik';

interface ComposerProps {
  onSubmit: (text: string, file?: { name: string; size: number }) => void;
  editText: Signal<{ id: string; text: string } | null>;
  onCancelEdit: () => void;
}

export const Composer = component$<ComposerProps>(({ onSubmit, editText, onCancelEdit }) => {
  const local = useStore({
    text: '',
    error: '',
    shake: false,
    attachedFile: null as { name: string; size: number } | null,
  });

  useVisibleTask$(({ track }) => {
    track(() => editText.value);
    if (editText.value) {
      local.text = editText.value.text;
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
      local.error = 'text: Note text must be at most 2000 characters.';
      local.shake = true;
      setTimeout(() => {
        local.shake = false;
      }, 300);
      return;
    }
    onSubmit(trimmed, local.attachedFile ?? undefined);
    local.text = '';
    local.error = '';
    local.attachedFile = null;
    if (editText.value) {
      onCancelEdit();
    }
  });

  const handleKeyDown = $((e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
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
    <div class="border-t border-gray-200 bg-white p-4">
      {editText.value && (
        <div class="mb-2 flex items-center justify-between text-sm text-[var(--color-accent)]">
          <span>Editing note</span>
          <button
            onClick$={() => {
              onCancelEdit();
              local.text = '';
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
      <div class={`flex items-end gap-3 ${local.shake ? 'shake' : ''}`}>
        <label
          htmlFor="composer-file-upload"
          class="flex cursor-pointer items-center gap-1 rounded-full bg-[var(--color-primary)] px-3 py-2 text-xs font-medium text-[var(--color-accent)] transition-colors hover:bg-[#D4E0F0]"
        >
          Attach File
        </label>
        <input
          id="composer-file-upload"
          type="file"
          class="hidden"
          onChange$={handleFileChange}
        />
        <input
          type="text"
          value={local.text}
          onInput$={(e: Event) => {
            const target = e.target as HTMLInputElement;
            local.text = target.value;
            if (local.error) local.error = '';
          }}
          onKeyDown$={handleKeyDown}
          placeholder={editText.value ? 'Edit your note...' : 'Type a note... #tags'}
          aria-label="Note composer"
          class="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-[17px] text-[var(--color-text-primary)] outline-none placeholder:text-gray-400 focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
        />
        <button
          onClick$={handleSubmit}
          class="flex items-center gap-1 rounded-full bg-[var(--color-accent)] px-5 py-3 text-[15px] font-semibold text-[#FEFEFE] shadow-none transition-all hover:bg-[#0066DD] active:scale-95"
          style={{ borderRadius: '1000px', boxShadow: 'none' }}
        >
          {editText.value ? 'Save' : 'Send'}
        </button>
      </div>
      {local.error && (
        <p class="mt-2 text-sm text-red-500" role="alert">
          {local.error}
        </p>
      )}
    </div>
  );
});
