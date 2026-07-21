import { h } from 'preact';
import { useSignal } from '@preact/signals';
import { useRef, useEffect, useState } from 'preact/hooks';
import {
  savedLines, showSavedPanel, selectedLineIds, isLineSelected, toggleLineSelection,
  clearLineSelection, bulkAddTag, bulkRemoveTag, bulkDeleteSelected, bulkConfirmOpen,
  compareOpen,
  deleteSavedLine, updateSavedLine, loadSavedLine, validateTagsNotes, TAG_SET
} from '../store';
import { OPENINGS } from '../openings';
import { Icon } from '../icons';
import { TrapScope, useRestoreFocus } from '../focusTrap';

function TagRow({ tags }) {
  if (!tags || tags.length === 0) return null;
  return (
    <ul class="tag-list" aria-label="Tags">
      {tags.map(t => <li key={t} class="tag-pill">{t}</li>)}
    </ul>
  );
}

function CompareDialog() {
  const open = compareOpen.value;
  const ref = useRef(null);
  useRestoreFocus(open);
  const ids = selectedLineIds.value;
  const lines = savedLines.value.filter(l => ids.includes(l.id)).slice(0, 2);
  useEffect(() => {
    if (open && lines.length < 2) compareOpen.value = false;
  }, [open, lines.length]);
  if (!open || lines.length < 2) return null;
  const [a, b] = lines;
  const codeOf = id => OPENINGS.find(o => o.id === id)?.name || 'Opening';
  const shared = (() => { let n = 0; while (n < a.moves.length && n < b.moves.length && a.moves[n] === b.moves[n]) n++; return n; })();
  const renderMoves = (line) => line.moves.map((m, i) => (
    <span key={i} class={i < shared ? 'cmp-shared' : 'cmp-diff'}>{m} </span>
  ));
  return (
    <div class="modal-backdrop" onClick={() => { compareOpen.value = false; }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label="Compare two saved lines" class="modal modal-enter compare-modal" onClick={e => e.stopPropagation()}>
        <TrapScope active containerRef={ref} onEscape={() => { compareOpen.value = false; }} />
        <div class="modal-head">
          <h2>Compare lines</h2>
          <button type="button" class="icon-btn" aria-label="Close comparison" onClick={() => { compareOpen.value = false; }}><Icon name="close" size={18} /></button>
        </div>
        <p class="text-sm text-neutral-600 mb-3">Shared opening prefix highlighted ({shared} move{shared === 1 ? '' : 's'} in common).</p>
        <div class="compare-grid">
          {[a, b].map((line, idx) => (
            <div key={line.id} class="compare-col">
              <h3>{line.name}</h3>
              <div class="text-sm text-neutral-600">{codeOf(line.openingId)} · ply {line.ply}</div>
              <div class="compare-moves stat-figures">{renderMoves(line)}</div>
              <TagRow tags={line.tags} />
              {line.notes ? <p class="text-sm mt-2">{line.notes}</p> : <p class="text-sm text-neutral-500 mt-2">No notes</p>}
              <div class="text-sm text-neutral-500 mt-1">Column {idx + 1}</div>
            </div>
          ))}
        </div>
        <div class="modal-foot">
          <button type="button" class="btn-primary" onClick={() => { compareOpen.value = false; }}>Close comparison</button>
        </div>
      </div>
    </div>
  );
}

function BulkDeleteConfirm() {
  const open = bulkConfirmOpen.value;
  const ref = useRef(null);
  const count = selectedLineIds.value.length;
  useRestoreFocus(open);
  if (!open) return null;
  return (
    <div class="modal-backdrop" onClick={() => { bulkConfirmOpen.value = false; }}>
      <div ref={ref} role="alertdialog" aria-modal="true" aria-label="Confirm bulk delete" class="modal modal-enter" onClick={e => e.stopPropagation()}>
        <TrapScope active containerRef={ref} onEscape={() => { bulkConfirmOpen.value = false; }} />
        <h2>Delete {count} selected line{count === 1 ? '' : 's'}?</h2>
        <p class="text-base mt-2">This removes {count} saved line{count === 1 ? '' : 's'} from My Saved Lines. You can reverse it with Undo in the header.</p>
        <div class="modal-foot">
          <button type="button" class="btn-secondary" onClick={() => { bulkConfirmOpen.value = false; }}>Cancel</button>
          <button type="button" class="btn-primary btn-danger" onClick={() => { bulkDeleteSelected(); bulkConfirmOpen.value = false; }}>Delete {count} selected lines</button>
        </div>
      </div>
    </div>
  );
}

export function SavedLinesPanel() {
  const open = showSavedPanel.value;
  const lines = savedLines.value;
  const editingId = useSignal(null);
  const editName = useSignal('');
  const editTags = useSignal([]);
  const editNotes = useSignal('');
  const editError = useSignal('');
  const addTag = useSignal('');
  const removeTag = useSignal('');
  const removing = useSignal([]); // ids animating out

  const drawerRef = useRef(null);
  const renameRef = useRef(null);
  const editOpener = useRef(null);
  const pendingDeletes = useRef(new Map());
  useRestoreFocus(open);

  useEffect(() => () => {
    for (const timer of pendingDeletes.current.values()) clearTimeout(timer);
    pendingDeletes.current.clear();
    removing.value = [];
  }, [lines]);

  // Bulk bar slide in/out with a two-stage exit.
  const selCount = selectedLineIds.value.length;
  const [barShow, setBarShow] = useState(false);
  const [barClosing, setBarClosing] = useState(false);
  useEffect(() => {
    if (selCount > 0) { setBarShow(true); setBarClosing(false); }
    else if (barShow) {
      setBarClosing(true);
      const t = setTimeout(() => { setBarShow(false); setBarClosing(false); }, 220);
      return () => clearTimeout(t);
    }
  }, [selCount]);

  const toggleEditTag = (tag) => {
    editTags.value = editTags.value.includes(tag)
      ? editTags.value.filter(t => t !== tag)
      : [...editTags.value, tag];
    if (editError.value) editError.value = '';
  };

  const openRename = (line) => {
    editOpener.current = document.activeElement;
    editingId.value = line.id;
    editName.value = line.name;
    editTags.value = Array.isArray(line.tags) ? line.tags.slice() : [];
    editNotes.value = typeof line.notes === 'string' ? line.notes : '';
    editError.value = '';
  };
  const closeRename = () => {
    editingId.value = null;
    editError.value = '';
    if (editOpener.current && editOpener.current.focus) { try { editOpener.current.focus(); } catch { /* ignore */ } }
  };

  const commitRename = (id) => {
    const name = editName.value.trim();
    if (!name) { editError.value = 'Name is required — type a name for this line, then choose Save.'; return; }
    if (name.length > 80) { editError.value = 'Name is too long — use 80 characters or fewer, then choose Save.'; return; }
    const fieldError = validateTagsNotes(editTags.value, editNotes.value);
    if (fieldError) {
      editError.value = fieldError.startsWith('notes')
        ? 'Notes is too long — use 280 characters or fewer, then choose Save.'
        : 'Tags — choose up to 8 tags from the allowed set, then choose Save.';
      return;
    }
    updateSavedLine(id, { name, tags: editTags.value, notes: editNotes.value });
    closeRename();
  };

  const animateDelete = (id) => {
    if (pendingDeletes.current.has(id)) return;
    removing.value = [...removing.value, id];
    const timer = setTimeout(() => {
      pendingDeletes.current.delete(id);
      deleteSavedLine(id);
      removing.value = removing.value.filter(x => x !== id);
    }, 240);
    pendingDeletes.current.set(id, timer);
  };

  if (!open) return null;

  return (
    <div class="drawer-backdrop" onClick={() => { showSavedPanel.value = false; }}>
      <aside
        ref={drawerRef}
        class="drawer drawer-enter"
        role="dialog"
        aria-modal="true"
        aria-label="My Saved Lines"
        onClick={e => e.stopPropagation()}
      >
        <TrapScope active containerRef={drawerRef} onEscape={() => { showSavedPanel.value = false; }} />
        <div class="drawer-head">
          <h2>My Saved Lines</h2>
          <div class="flex gap-2 items-center">
            <button
              type="button"
              class="btn-secondary btn-compact"
              disabled={selectedLineIds.value.length !== 2}
              onClick={() => { compareOpen.value = true; }}
              title="Select exactly two lines to compare them"
            >
              <Icon name="compare" size={16} /> Compare
            </button>
            <button type="button" class="icon-btn" aria-label="Close My Saved Lines" onClick={() => { showSavedPanel.value = false; }}>
              <Icon name="close" size={18} />
            </button>
          </div>
        </div>

        <div class="drawer-body">
          {barShow && (
            <div class={`bulk-bar ${barClosing ? 'bulk-bar-exit' : 'bulk-bar-enter'}`} role="region" aria-label="Bulk actions for selected lines">
              <div class="bulk-count stat-figures" aria-live="polite">{selCount} selected</div>
              <div class="bulk-controls">
                <label class="sr-only" for="bulk-add-tag">Add tag to selected lines</label>
                <select id="bulk-add-tag" class="theme-select bulk-select" value={addTag.value} onChange={e => { addTag.value = e.target.value; }}>
                  <option value="">Add tag…</option>
                  {TAG_SET.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <button type="button" class="btn-secondary btn-compact" disabled={!addTag.value} onClick={() => { if (addTag.value) { bulkAddTag(addTag.value); addTag.value = ''; } }}>
                  <Icon name="tag" size={16} /> Add tag
                </button>
                <label class="sr-only" for="bulk-remove-tag">Remove tag from selected lines</label>
                <select id="bulk-remove-tag" class="theme-select bulk-select" value={removeTag.value} onChange={e => { removeTag.value = e.target.value; }}>
                  <option value="">Remove tag…</option>
                  {TAG_SET.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <button type="button" class="btn-secondary btn-compact" disabled={!removeTag.value} onClick={() => { if (removeTag.value) { bulkRemoveTag(removeTag.value); removeTag.value = ''; } }}>
                  Remove tag
                </button>
                <button type="button" class="btn-secondary btn-compact btn-danger" onClick={() => { bulkConfirmOpen.value = true; }}>
                  <Icon name="trash" size={16} /> Delete selected
                </button>
                <button type="button" class="btn-secondary btn-compact" onClick={clearLineSelection}>Clear selection</button>
              </div>
            </div>
          )}

          {lines.length === 0 && (
            <div class="empty-state">
              <Icon name="save" size={28} />
              <p class="empty-title">No saved lines yet</p>
              <p class="empty-body">Display a line on the board, then choose <strong>Save this line</strong> in the Move tree to store it here with a name, tags and notes.</p>
            </div>
          )}

          <ul class="saved-list">
            {lines.map(line => {
              const openingName = OPENINGS.find(o => o.id === line.openingId)?.name || 'Opening';
              const isRemoving = removing.value.includes(line.id);
              const editing = editingId.value === line.id;
              return (
                <li key={line.id} class={`saved-item ${isRemoving ? 'saved-item-exit' : 'saved-item-enter'}`}>
                  <div class="saved-item-inner">
                    <label class="saved-check">
                      <input
                        type="checkbox"
                        checked={isLineSelected(line.id)}
                        onChange={() => toggleLineSelection(line.id)}
                        aria-label={`Select ${line.name} for bulk actions`}
                      />
                    </label>
                    <div class="saved-item-main">
                      {editing ? (
                        <form ref={renameRef} onSubmit={e => { e.preventDefault(); commitRename(line.id); }} class="rename-form">
                          <TrapScope active containerRef={renameRef} onEscape={closeRename} />
                          <label class="block text-sm font-medium mb-1" for={`rename-${line.id}`}>Line name</label>
                          <p id={`rename-help-${line.id}`} class="text-sm text-neutral-600 mb-1">Use 1–80 characters</p>
                          <input
                            id={`rename-${line.id}`}
                            type="text"
                            class="text-input w-full"
                            value={editName.value}
                            onInput={e => { editName.value = e.target.value; if (editError.value) editError.value = ''; }}
                            autoFocus
                            ref={el => { if (el) setTimeout(() => el.focus(), 0); }}
                            aria-describedby={editError.value ? `rename-help-${line.id} rename-error-${line.id}` : `rename-help-${line.id}`}
                            aria-invalid={editError.value ? 'true' : undefined}
                          />
                          <fieldset class="mt-2 border-0 p-0 m-0">
                            <legend class="block text-sm font-medium mb-1">Tags (optional, up to 8)</legend>
                            <div class="flex gap-2 flex-wrap">
                              {TAG_SET.map(tag => (
                                <label key={tag} class="tag-chip-label text-sm">
                                  <input type="checkbox" checked={editTags.value.includes(tag)} onChange={() => toggleEditTag(tag)} />
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
                          <p id={`rename-error-${line.id}`} aria-live="polite" class="field-error mt-1">{editError.value}</p>
                          <div class="flex gap-2 mt-2">
                            <button type="submit" class="btn-primary btn-compact">Save</button>
                            <button type="button" class="btn-secondary btn-compact" onClick={closeRename}>Cancel</button>
                          </div>
                        </form>
                      ) : (
                        <div>
                          <div class="saved-name">{line.name}</div>
                          <div class="text-sm text-neutral-600 mt-0.5 stat-figures">{openingName} · ply {line.ply} · {line.moves.length} moves</div>
                          <TagRow tags={line.tags} />
                          <div class="saved-actions">
                            <button type="button" class="btn-secondary btn-compact" onClick={() => loadSavedLine(line)}>Load</button>
                            <button type="button" class="btn-secondary btn-compact" onClick={() => openRename(line)}>Rename</button>
                            <button type="button" class="btn-secondary btn-compact btn-danger" onClick={() => animateDelete(line.id)}>Delete</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
      <BulkDeleteConfirm />
      <CompareDialog />
    </div>
  );
}
