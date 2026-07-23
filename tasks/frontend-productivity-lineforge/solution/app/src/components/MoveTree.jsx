import { h } from 'preact';
import {
  currentOpening, selectedNodeId, userLine, practiceActive,
  saveFormOpen, saveName, saveTags, saveNotes, saveError, savingInProgress,
  getNodeMoves, selectNode, addSavedLine, showToast, validateTagsNotes, TAG_SET
} from '../store';
import { Icon } from '../icons';

function moveLabel(index, san) {
  const num = Math.floor(index / 2) + 1;
  return index % 2 === 0 ? `${num}. ${san}` : `${num}... ${san}`;
}

function TreeChip({ nodeId, index, san }) {
  const isSelected = selectedNodeId.value === nodeId;
  return (
    <li class="inline-block">
      <button
        type="button"
        class={`tree-chip ${isSelected ? 'tree-node-selected' : ''}`}
        onClick={() => selectNode(nodeId)}
        aria-pressed={isSelected}
      >
        {moveLabel(index, san)}
      </button>
    </li>
  );
}

export function MoveTree() {
  const opening = currentOpening.value;
  if (!opening) return null;

  const ul = userLine.value;
  const practicing = practiceActive.value;
  const playedCount = practicing ? getNodeMoves().length : 0;
  const nameOk = saveName.value.trim().length >= 1 && saveName.value.trim().length <= 80;
  const fieldError = validateTagsNotes(saveTags.value, saveNotes.value);
  const canSubmit = nameOk && !fieldError && !savingInProgress.value;

  const openSaveForm = () => {
    saveName.value = `${opening.name} line`;
    saveTags.value = [];
    saveNotes.value = '';
    saveError.value = '';
    savingInProgress.value = false;
    saveFormOpen.value = true;
  };

  const toggleSaveTag = (tag) => {
    saveTags.value = saveTags.value.includes(tag)
      ? saveTags.value.filter(t => t !== tag)
      : [...saveTags.value, tag];
    if (saveError.value) saveError.value = '';
  };

  const submitSave = () => {
    if (savingInProgress.value) return;
    const name = saveName.value.trim();
    if (!name) {
      saveError.value = 'Name is required — type a name for this line, then select Save';
      return;
    }
    if (name.length > 80) {
      saveError.value = 'Name is too long — use 80 characters or fewer, then select Save';
      return;
    }
    const notes = saveNotes.value;
    const tagsError = validateTagsNotes(saveTags.value, notes);
    if (tagsError) {
      saveError.value = tagsError.startsWith('notes')
        ? 'Notes is too long — use 280 characters or fewer, then select Save'
        : 'Tags — select up to 8 tags from the allowed set, then select Save';
      return;
    }
    savingInProgress.value = true;
    const path = getNodeMoves();
    const moves = path.length > 0 ? path : [...opening.moves];
    const nid = selectedNodeId.value;
    let snapshot = null;
    if (nid.startsWith('user-') && ul) {
      const idx = parseInt(nid.split('-')[1], 10);
      snapshot = { base: ul.base, moves: ul.moves.slice(0, idx + 1) };
    }
    addSavedLine(name, opening.id, moves, snapshot, { tags: saveTags.value, notes });
    saveFormOpen.value = false;
    saveError.value = '';
    savingInProgress.value = false;
    showToast('Line saved');
  };

  return (
    <section class="card mb-4" aria-labelledby="move-tree-heading">
      <div class="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <h3 id="move-tree-heading">Move tree</h3>
        <button type="button" id="coach-save" class="btn-primary" onClick={openSaveForm}>
          <Icon name="save" size={16} /> Save this line
        </button>
      </div>
      {saveFormOpen.value && (
        <form
          class="mb-3 p-3 rounded-[10px] bg-neutral-50 border border-neutral-400 save-form"
          onSubmit={e => { e.preventDefault(); submitSave(); }}
        >
          <label class="block text-sm font-medium mb-1" for="line-name">Line name</label>
          <p id="line-name-help" class="text-sm text-neutral-600 mb-1">Use 1–80 characters</p>
          <input
            id="line-name"
            type="text"
            class="text-input w-full"
            value={saveName.value}
            onInput={e => { saveName.value = e.target.value; if (saveError.value) saveError.value = ''; }}
            onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); saveFormOpen.value = false; } }}
            aria-describedby={saveError.value ? 'line-name-help line-name-error' : 'line-name-help'}
            aria-invalid={saveError.value ? 'true' : undefined}
            autoFocus
          />
          <fieldset class="mt-2 border-0 p-0 m-0">
            <legend class="block text-sm font-medium mb-1">Tags (optional, up to 8)</legend>
            <div class="flex gap-2 flex-wrap">
              {TAG_SET.map(tag => (
                <label key={tag} class="tag-chip-label text-sm">
                  <input
                    type="checkbox"
                    checked={saveTags.value.includes(tag)}
                    onChange={() => toggleSaveTag(tag)}
                  />
                  {' '}{tag}
                </label>
              ))}
            </div>
          </fieldset>
          <label class="block text-sm font-medium mb-1 mt-2" for="line-notes">Notes (optional)</label>
          <p id="line-notes-help" class="text-sm text-neutral-600 mb-1">Use 0–280 characters</p>
          <textarea
            id="line-notes"
            class="text-input w-full"
            rows="2"
            value={saveNotes.value}
            onInput={e => { saveNotes.value = e.target.value; if (saveError.value) saveError.value = ''; }}
            aria-describedby="line-notes-help"
          />
          <p id="line-name-error" aria-live="polite" class="mt-1 text-sm font-medium field-error" style="min-height: 1.25rem; color: var(--color-danger);">
            {saveError.value || (saveName.value.trim() === '' ? 'Line name field is required — type a name for this line, then choose Save' : !nameOk ? 'Name is required — type a name for this line, then choose Save' : fieldError || '')}
          </p>
          <div class="flex gap-2 mt-2">
            <button type="submit" class="btn-primary" disabled={!canSubmit}>Save</button>
            <button type="button" class="btn-secondary" onClick={() => { saveFormOpen.value = false; }}>Cancel</button>
          </div>
        </form>
      )}
      <div class="space-y-1 overflow-y-auto" style="max-height: 44vh;">
        <ul class="list-none m-0 p-0">
          <li>
            <button
              type="button"
              class={`tree-chip ${selectedNodeId.value === 'root' ? 'tree-node-selected' : ''}`}
              onClick={() => selectNode('root')}
              aria-pressed={selectedNodeId.value === 'root'}
            >
              Go to start
            </button>
          </li>
        </ul>
        <div class="ml-2">
          <div class="text-sm font-semibold text-[var(--color-primary)] mb-1">Main line</div>
          <ul class="list-none m-0 p-0">
            {opening.moves.map((san, i) => (
              practicing && i >= playedCount ? (
                <li key={i} class="inline-block">
                  <span class="mask-chip" title="Hidden during practice">?</span>
                </li>
              ) : (
                <TreeChip key={i} nodeId={`main-${i}`} index={i} san={san} />
              )
            ))}
          </ul>
          {practicing && (
            <p class="text-sm text-neutral-600 mt-1">Upcoming moves stay hidden while you practice</p>
          )}
        </div>
        {!practicing && opening.branches?.map((branch, bIdx) => (
          <div key={bIdx} class="ml-4 mt-2">
            <div class="text-sm font-semibold text-[var(--color-primary)] mb-1">{branch.name}</div>
            <ul class="list-none m-0 p-0">
              {branch.moves.map((san, i) => (
                <TreeChip key={i} nodeId={`branch-${bIdx}-${i}`} index={i} san={san} />
              ))}
            </ul>
          </div>
        ))}
        {!practicing && ul && ul.moves.length > 0 && (
          <div class="ml-4 mt-2 your-line-branch">
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              <span class="your-line-label font-bold text-[var(--color-primary)]">Your Line</span>
              <span class="new-line-badge bg-[var(--color-primary)] text-white text-xs px-2 py-0.5 rounded font-semibold">New Line</span>
              <span class="text-sm text-neutral-600">Session only — not part of the bundled tree</span>
            </div>
            <ul class="list-none m-0 p-0">
              {ul.moves.map((san, i) => (
                <TreeChip key={i} nodeId={`user-${i}`} index={ul.base.length + i} san={san} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
