import { component$, $ } from '@builder.io/qwik';
import type { Note } from '../types';
import { renderNoteText, formatFileSize } from '../utils';

interface NoteItemProps {
  note: Note;
  todoTags: string[];
  onToggleDone: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAttachFile: (id: string, file: { name: string; size: number }) => void;
}

export const NoteItem = component$<NoteItemProps>(
  ({
    note,
    todoTags,
    onToggleDone,
    onTogglePin,
    onToggleArchive,
    onEdit,
    onDelete,
    onAttachFile,
  }) => {
    const isTodoNote = note.tags.some((t) => todoTags.includes(t));
    const fileInputId = `file-${note.id}`;

    const handlePin = $(() => onTogglePin(note.id));
    const handleArchive = $(() => onToggleArchive(note.id));
    const handleEdit = $(() => onEdit(note.id));
    const handleDelete = $(() => onDelete(note.id));
    const handleDone = $(() => onToggleDone(note.id));
    const handleFileChange = $((e: Event) => {
      const input = e.target as HTMLInputElement;
      const file = input.files?.[0];
      if (file) {
        onAttachFile(note.id, { name: file.name, size: file.size });
      }
      input.value = '';
    });

    return (
      <div
        class={`group relative rounded-[7px] bg-white p-4 shadow-none transition-shadow hover:shadow-md ${
          note.done ? 'opacity-60' : ''
        }`}
      >
        {note.pinned && (
          <div
            class="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-xs"
            style={{ backgroundColor: '#FFCC00' }}
          >
            📌
          </div>
        )}

        <div class="flex items-start gap-3">
          {isTodoNote && (
            <input
              type="checkbox"
              checked={note.done}
              onChange$={handleDone}
              aria-label="Mark note done"
              class="mt-1 h-5 w-5 cursor-pointer accent-[var(--color-accent)]"
            />
          )}

          <div class="min-w-0 flex-1">
            <div
              class={`text-[17px] leading-relaxed text-[var(--color-text-primary)] ${
                note.done ? 'text-gray-400 line-through' : ''
              }`}
              dangerouslySetInnerHTML={renderNoteText(note.text)}
            />

            {note.file && (
              <div class="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                <span>📎</span>
                <span class="max-w-[200px] truncate">{note.file.name}</span>
                <span class="text-gray-400">({formatFileSize(note.file.size)})</span>
              </div>
            )}

            <div class="mt-2 flex flex-wrap gap-1.5">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  class="inline-flex items-center rounded-full bg-[var(--color-primary)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-accent)] transition-colors hover:bg-[#D4E0F0]"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <div class="mt-3 flex flex-wrap gap-2">
              <button
                onClick$={handlePin}
                class="rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-medium text-[var(--color-accent)] shadow-none transition-colors hover:bg-[#D4E0F0]"
                style={{ borderRadius: '1000px', boxShadow: 'none' }}
              >
                {note.pinned ? 'Unpin' : 'Pin'}
              </button>
              <button
                onClick$={handleArchive}
                class="rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-medium text-[var(--color-accent)] shadow-none transition-colors hover:bg-[#D4E0F0]"
                style={{ borderRadius: '1000px', boxShadow: 'none' }}
              >
                {note.archived ? 'Unarchive' : 'Archive'}
              </button>
              <button
                onClick$={handleEdit}
                class="rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-medium text-[var(--color-accent)] shadow-none transition-colors hover:bg-[#D4E0F0]"
                style={{ borderRadius: '1000px', boxShadow: 'none' }}
              >
                Edit
              </button>
              <label
                htmlFor={fileInputId}
                class="cursor-pointer rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-medium text-[var(--color-accent)] shadow-none transition-colors hover:bg-[#D4E0F0]"
                style={{ borderRadius: '1000px', boxShadow: 'none' }}
              >
                Attach File
              </label>
              <input
                id={fileInputId}
                type="file"
                class="hidden"
                onChange$={handleFileChange}
              />
              <button
                onClick$={handleDelete}
                class="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-100"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
