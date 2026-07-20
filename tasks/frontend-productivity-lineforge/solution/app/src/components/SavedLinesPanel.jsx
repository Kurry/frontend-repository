import { h } from 'preact';
import { useSignal } from '@preact/signals';
import {
  savedLines, showSavedPanel,
  deleteSavedLine, updateSavedLine, loadSavedLine, validateTagsNotes, TAG_SET
} from '../store';
import { OPENINGS } from '../openings';

export function SavedLinesPanel() {
  const lines = savedLines.value;
  const editingId = useSignal(null);
  const editName = useSignal('');
  const editTags = useSignal([]);
  const editNotes = useSignal('');
  const editError = useSignal('');

  const toggleEditTag = (tag) => {
    editTags.value = editTags.value.includes(tag)
      ? editTags.value.filter(t => t !== tag)
      : [...editTags.value, tag];
    if (editError.value) editError.value = '';
  };

  const commitRename = (id) => {
    const name = editName.value.trim();
    if (!name) {
      editError.value = 'Name is required — type a name for this line, then select Save';
      return;
    }
    if (name.length > 80) {
      editError.value = 'Name is too long — use 80 characters or fewer, then select Save';
      return;
    }
    const fieldError = validateTagsNotes(editTags.value, editNotes.value);
    if (fieldError) {
      editError.value = fieldError.startsWith('notes')
        ? 'Notes is too long — use 280 characters or fewer, then select Save'
        : 'Tags — select up to 8 tags from the allowed set, then select Save';
      return;
    }
    updateSavedLine(id, { name, tags: editTags.value, notes: editNotes.value });
    editingId.value = null;
    editError.value = '';
  };

  return (
    <div
      class="fixed inset-0 bg-black/40 z-40 flex justify-end"
      onClick={() => { showSavedPanel.value = false; }}
    >
      <div
        class="w-full max-w-sm bg-[var(--color-surface)] h-full overflow-y-auto shadow-xl"
        role="dialog"
        aria-label="My saved lines"
        onClick={e => e.stopPropagation()}
      >
        <div class="p-4 border-b border-neutral-400 flex items-center justify-between gap-2">
          <h2>My saved lines</h2>
          <button
            type="button"
            class="btn-secondary btn-compact"
            onClick={() => { showSavedPanel.value = false; }}
          >
            Close
          </button>
        </div>
        <div class="p-4">
          {lines.length === 0 && (
            <p class="text-base text-neutral-700">
              No saved lines yet. Display a line on the board, then select Save this line to store it here.
            </p>
          )}
          <ul class="space-y-3 list-none m-0 p-0">
            {lines.map(line => {
              const openingName = OPENINGS.find(o => o.id === line.openingId)?.name || 'Opening';
              return (
                <li key={line.id} class="border border-neutral-400 rounded-[10px] p-3">
                {editingId.value === line.id ? (
                  <form onSubmit={e => { e.preventDefault(); commitRename(line.id); }}>
                    <label class="block text-sm font-medium mb-1" for={`rename-${line.id}`}>Line name</label>
                    <p id={`rename-help-${line.id}`} class="text-sm text-neutral-600 mb-1">Use 1–80 characters</p>
                    <input
                      id={`rename-${line.id}`}
                      type="text"
                      class="text-input w-full"
                      value={editName.value}
                      onInput={e => { editName.value = e.target.value; if (editError.value) editError.value = ''; }}
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Escape') {
                          editingId.value = null;
                          editError.value = '';
                        }
                      }}
                      aria-describedby={editError.value
                        ? `rename-help-${line.id} rename-error-${line.id}`
                        : `rename-help-${line.id}`}
                      aria-invalid={editError.value ? 'true' : undefined}
                    />
                    <fieldset class="mt-2 border-0 p-0 m-0">
                      <legend class="block text-sm font-medium mb-1">Tags (optional, up to 8)</legend>
                      <div class="flex gap-2 flex-wrap">
                        {TAG_SET.map(tag => (
                          <label key={tag} class="tag-chip-label text-sm">
                            <input
                              type="checkbox"
                              checked={editTags.value.includes(tag)}
                              onChange={() => toggleEditTag(tag)}
                            />
                            {' '}{tag}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    <label class="block text-sm font-medium mb-1 mt-2" for={`rename-notes-${line.id}`}>Notes (optional)</label>
                    <p id={`rename-notes-help-${line.id}`} class="text-sm text-neutral-600 mb-1">Use 0–280 characters</p>
                    <textarea
                      id={`rename-notes-${line.id}`}
                      class="text-input w-full"
                      rows="2"
                      value={editNotes.value}
                      onInput={e => { editNotes.value = e.target.value; if (editError.value) editError.value = ''; }}
                      aria-describedby={`rename-notes-help-${line.id}`}
                    />
                    {editError.value && (
                      <p id={`rename-error-${line.id}`} class="mt-1 text-sm font-medium" style="color: var(--color-danger);">
                        {editError.value}
                      </p>
                    )}
                    <div class="flex gap-2 mt-2">
                      <button type="submit" class="btn-primary btn-compact">Save</button>
                      <button
                        type="button"
                        class="btn-secondary btn-compact"
                        onClick={() => { editingId.value = null; editError.value = ''; }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <div class="text-base font-semibold">{line.name}</div>
                    <div class="text-sm text-neutral-600 mt-0.5 stat-figures">
                      {openingName} · {line.moves.length} moves
                    </div>
                    <div class="flex gap-2 mt-2 flex-wrap">
                      <button
                        type="button"
                        class="btn-secondary btn-compact"
                        onClick={() => loadSavedLine(line)}
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        class="btn-secondary btn-compact"
                        onClick={() => {
                          editingId.value = line.id;
                          editName.value = line.name;
                          editTags.value = Array.isArray(line.tags) ? line.tags.slice() : [];
                          editNotes.value = typeof line.notes === 'string' ? line.notes : '';
                          editError.value = '';
                        }}
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        class="btn-secondary btn-compact btn-danger"
                        onClick={() => deleteSavedLine(line.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
