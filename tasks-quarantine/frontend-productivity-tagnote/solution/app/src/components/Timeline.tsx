import { component$ } from '@builder.io/qwik';
import type { Note } from '../types';
import { formatDate } from '../utils';
import { NoteItem } from './NoteItem';

interface TimelineProps {
  notes: Note[];
  todoTags: string[];
  emptyMessage?: string;
  onToggleDone: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

export const Timeline = component$<TimelineProps>(
  ({ notes, todoTags, emptyMessage, onToggleDone, onTogglePin, onToggleArchive, onEdit, onDelete, selectedIds, onToggleSelect }) => {
    if (notes.length === 0) {
      return (
        <div class="flex flex-col items-center justify-center py-16 text-center">
          <div class="mb-4 text-4xl opacity-20">📝</div>
          <p class="text-[17px] font-medium text-gray-400">
            {emptyMessage || 'Send your first note to get started!'}
          </p>
          <p class="mt-1 text-sm text-gray-300">
            Use #tags to organize your thoughts
          </p>
        </div>
      );
    }

    // Group by date
    const groups: { label: string; notes: Note[] }[] = [];
    const grouped = new Map<string, Note[]>();

    for (const note of notes) {
      const label = formatDate(note.createdAt);
      if (!grouped.has(label)) {
        grouped.set(label, []);
      }
      grouped.get(label)!.push(note);
    }

    for (const [label, groupNotes] of grouped) {
      groups.push({ label, notes: groupNotes });
    }

    return (
      <div class="space-y-6">
        {groups.map((group) => (
          <div key={group.label}>
            <div class="sticky top-0 z-10 mb-2 bg-[var(--color-background)] py-2">
              <h2 class="text-[13px] font-semibold uppercase text-gray-400">{group.label}</h2>
            </div>
            <div class="space-y-3">
              {group.notes.map((note) => (
                <NoteItem
                  key={note.id}
                  note={note}
                  todoTags={todoTags}
                  onToggleDone={onToggleDone}
                  onTogglePin={onTogglePin}
                  onToggleArchive={onToggleArchive}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isSelected={selectedIds?.has(note.id)}
                  onToggleSelect={onToggleSelect}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
);
