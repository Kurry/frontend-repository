import { component$, $, useStore, useSignal, useTask$, useVisibleTask$ } from '@builder.io/qwik';
import type { Signal } from '@builder.io/qwik';
import type { Note, AppState, HistoryState, NoteMark } from './types';
import {
  createInitialHistory,
  pushHistoryAndPresent,
  undo as undoHistory,
  redo as redoHistory,
  addNote,
  editNote,
  deleteNote,
  togglePin,
  toggleArchive,
  toggleDone,
  toggleTodoTag,
  attachFileToNote,
  getTagMap,
  bulkArchive,
  bulkPin,
  bulkDelete,
  computeVisibleNotes,
} from './store';

import { Composer } from './components/Composer';
import { TagRail } from './components/TagRail';
import { SearchBar } from './components/SearchBar';
import { CalendarView } from './components/CalendarView';
import { ConfirmDialog } from './components/ConfirmDialog';
import { Toast } from './components/Toast';
import { HistoryPanel } from './components/HistoryPanel';
import { NoteItem } from './components/NoteItem';
import { ExportPanel } from './components/ExportPanel';
import { ImportPanel } from './components/ImportPanel';
import { formatDate, buildSessionJson } from './utils';

export const Root = component$(() => {
  const historyState = useStore<HistoryState>(createInitialHistory());

  const activeTag = useSignal<string | null>(null);
  const activeDateFilter = useSignal<string | null>(null);
  const searchQuery = useSignal('');
  const showArchived = useSignal(false);
  const showCalendar = useSignal(false);
  const showHistory = useSignal(false);
  const toastMessage = useSignal('');
  const editText = useSignal<{ id: string; text: string; marks?: NoteMark[] } | null>(null);
  const confirmDelete = useSignal(false);
  const deleteTargetId = useSignal<string | null>(null);
  const selectedIds = useStore<{ ids: string[] }>({ ids: [] });
  const showExport = useSignal(false);
  const showImport = useSignal(false);
  const renderEpoch = useSignal(0);

  // Bulk selection must never outlive visibility: if a filter/search change
  // hides a selected note, drop it from selectedIds so the tray count stays
  // accurate and bulk archive/pin/delete can't silently act on hidden notes.
  useTask$(({ track }) => {
    track(() => activeTag.value);
    track(() => activeDateFilter.value);
    track(() => searchQuery.value);
    track(() => showArchived.value);
    track(() => historyState.present.notes);

    if (selectedIds.ids.length === 0) return;

    const visible = computeVisibleNotes(historyState.present.notes, historyState.present.todoTags, {
      showArchived: showArchived.value,
      activeTag: activeTag.value,
      activeDateFilter: activeDateFilter.value,
      searchQuery: searchQuery.value,
    });
    const visibleIds = new Set(visible.map((n) => n.id));
    const pruned = selectedIds.ids.filter((id) => visibleIds.has(id));
    if (pruned.length !== selectedIds.ids.length) {
      selectedIds.ids = pruned;
    }
  });

  const syncHistory = $((next: HistoryState) => {
    historyState.past = next.past;
    historyState.present = next.present;
    historyState.future = next.future;
    historyState.branchId = next.branchId;
    historyState.branches = next.branches;
    renderEpoch.value++;
  });

  const showToast = $((msg: string) => {
    toastMessage.value = msg;
  });

  const applyState = $((newState: AppState, label: string) => {
    syncHistory(pushHistoryAndPresent(historyState, newState, label));
  });

  const handleUndo = $(() => {
    syncHistory(undoHistory(historyState));
  });

  const handleRedo = $(() => {
    syncHistory(redoHistory(historyState));
  });

  const handleSubmit = $((text: string, marks: NoteMark[], file?: { name: string; size: number }) => {
    if (editText.value) {
      const ns = editNote(historyState.present, editText.value.id, text, marks);
      applyState(ns, 'Edited note');
      editText.value = null;
      showToast('Note updated');
    } else {
      const ns = addNote(historyState.present, text, file, marks);
      applyState(ns, 'Added note');
      showToast('Note added');
    }
  });

  const handleCancelEdit = $(() => {
    editText.value = null;
  });

  const handleToggleDone = $((id: string) => {
    applyState(toggleDone(historyState.present, id), 'Toggled TODO');
  });

  const handleTogglePin = $((id: string) => {
    const note = historyState.present.notes.find((n) => n.id === id);
    applyState(togglePin(historyState.present, id), note?.pinned ? 'Unpinned note' : 'Pinned note');
    showToast(note?.pinned ? 'Note unpinned' : 'Note pinned');
  });

  const handleToggleArchive = $((id: string) => {
    const note = historyState.present.notes.find((n) => n.id === id);
    applyState(
      toggleArchive(historyState.present, id),
      note?.archived ? 'Unarchived note' : 'Archived note'
    );
    showToast(note?.archived ? 'Note unarchived' : 'Note archived');
  });

  const handleEdit = $((id: string) => {
    const note = historyState.present.notes.find((n) => n.id === id);
    if (note) editText.value = { id: note.id, text: note.text, marks: note.marks ?? [] };
  });

  const handleDeleteRequest = $((id: string) => {
    deleteTargetId.value = id;
    confirmDelete.value = true;
  });

  const handleDeleteConfirm = $(() => {
    if (deleteTargetId.value === 'bulk') {
      const ns = bulkDelete(historyState.present, selectedIds.ids);
      applyState(ns, 'Bulk delete');
      selectedIds.ids = [];
      deleteTargetId.value = null;
      confirmDelete.value = false;
      showToast('Notes deleted');
      return;
    }
    if (deleteTargetId.value) {
      applyState(deleteNote(historyState.present, deleteTargetId.value), 'Deleted note');
      selectedIds.ids = selectedIds.ids.filter(id => id !== deleteTargetId.value);
      deleteTargetId.value = null;
      confirmDelete.value = false;
      showToast('Note deleted');
    }
  });

  const handleDeleteCancel = $(() => {
    deleteTargetId.value = null;
    confirmDelete.value = false;
  });

  const handleToggleTodoTag = $((tag: string) => {
    applyState(toggleTodoTag(historyState.present, tag), `Toggled TODO for #${tag}`);
  });

  const handleAttachFile = $((id: string, file: { name: string; size: number }) => {
    applyState(attachFileToNote(historyState.present, id, file), 'Attached file');
    showToast('File attached');
  });

  const handleApplyScenarioChange = $(() => {
    const checkpoint = historyState.present.notes.length + 1;
    const ns = addNote(historyState.present, `Scenario checkpoint ${checkpoint} #scenario`);
    applyState(ns, 'Apply Scenario Change');
    showToast('Scenario change applied');
  });

  const handleClearFilter = $(() => {
    activeTag.value = null;
    activeDateFilter.value = null;
  });

  const handleToggleSelect = $((id: string) => {
    selectedIds.ids = selectedIds.ids.includes(id)
      ? selectedIds.ids.filter((x) => x !== id)
      : [...selectedIds.ids, id];
  });

  const handleClearSelection = $(() => {
    selectedIds.ids = [];
  });

  const handleSelectAllVisible = $((ids: string[]) => {
    selectedIds.ids = ids;
  });

  const handleBulkArchive = $(() => {
    const count = selectedIds.ids.length;
    if (count === 0) return;
    applyState(bulkArchive(historyState.present, selectedIds.ids), 'Bulk archive');
    showToast(`${count} note${count === 1 ? '' : 's'} archived`);
    selectedIds.ids = [];
  });

  const handleBulkPin = $(() => {
    const count = selectedIds.ids.length;
    if (count === 0) return;
    applyState(bulkPin(historyState.present, selectedIds.ids), 'Bulk pin');
    showToast(`${count} note${count === 1 ? '' : 's'} pinned`);
    selectedIds.ids = [];
  });

  const handleBulkDeleteRequest = $(() => {
    if (selectedIds.ids.length === 0) return;
    deleteTargetId.value = 'bulk';
    confirmDelete.value = true;
  });


  useVisibleTask$(() => {
    const applyInline = (newState: AppState, label: string) => {
      const next = pushHistoryAndPresent(historyState, newState, label);
      historyState.past = next.past;
      historyState.present = next.present;
      historyState.future = next.future;
      historyState.branchId = next.branchId;
      historyState.branches = next.branches;
      renderEpoch.value++;
    };
    const findNote = (id: string) => historyState.present.notes.find((n) => n.id === id);

    const invokeTool = (name: string, args: unknown): unknown => {
      switch (name) {
        case 'entity_create_note': {
          const text = typeof (args as { text?: string })?.text === 'string'
            ? (args as { text: string }).text.trim()
            : '';
          if (!text) throw new Error('Note text is required and cannot be blank.');
          const ns = addNote(historyState.present, text);
          applyInline(ns, 'Added note');
          toastMessage.value = 'Note added';
          const created = ns.notes[ns.notes.length - 1];
          return { id: created.id, tags: created.tags, count: ns.notes.length };
        }
        case 'entity_select_note': {
          const note = findNote(String((args as { id?: string })?.id));
          if (!note) throw new Error('No note with that id.');
          editText.value = { id: note.id, text: note.text, marks: note.marks ?? [] };
          return { id: note.id, text: note.text };
        }
        case 'entity_update_note': {
          const id = String((args as { id?: string })?.id);
          if (!findNote(id)) throw new Error('No note with that id.');
          const text = typeof (args as { text?: string })?.text === 'string'
            ? (args as { text: string }).text.trim()
            : '';
          if (!text) throw new Error('Note text is required and cannot be blank.');
          const ns = editNote(historyState.present, id, text);
          applyInline(ns, 'Edited note');
          editText.value = null;
          toastMessage.value = 'Note updated';
          return { id, tags: ns.notes.find((n) => n.id === id)!.tags };
        }
        case 'entity_toggle_note': {
          const id = String((args as { id?: string })?.id);
          const note = findNote(id);
          if (!note) throw new Error('No note with that id.');
          const field = String((args as { field?: string })?.field);
          let ns: AppState;
          if (field === 'pinned') {
            ns = togglePin(historyState.present, id);
            applyInline(ns, note.pinned ? 'Unpinned note' : 'Pinned note');
            toastMessage.value = note.pinned ? 'Note unpinned' : 'Note pinned';
          } else if (field === 'archived') {
            ns = toggleArchive(historyState.present, id);
            applyInline(ns, note.archived ? 'Unarchived note' : 'Archived note');
            toastMessage.value = note.archived ? 'Note unarchived' : 'Note archived';
          } else if (field === 'done') {
            ns = toggleDone(historyState.present, id);
            applyInline(ns, 'Toggled TODO');
          } else {
            throw new Error('field must be one of pinned, archived, done.');
          }
          const t = ns.notes.find((n) => n.id === id)!;
          return { id, pinned: t.pinned, archived: t.archived, done: t.done };
        }
        case 'entity_delete_note': {
          if ((args as { confirm?: boolean })?.confirm !== true) {
            throw new Error('Delete requires confirm=true.');
          }
          const id = String((args as { id?: string })?.id);
          if (!findNote(id)) throw new Error('No note with that id.');
          const ns = deleteNote(historyState.present, id);
          applyInline(ns, 'Deleted note');
          toastMessage.value = 'Note deleted';
          return { id, count: ns.notes.length };
        }
        case 'browse_open': {
          const dest = String((args as { destination?: string })?.destination);
          if (dest === 'timeline') {
            showArchived.value = false;
            showCalendar.value = false;
            showExport.value = false;
          } else if (dest === 'calendar') {
            showArchived.value = false;
            showCalendar.value = true;
            showExport.value = false;
          } else if (dest === 'archived') {
            showArchived.value = true;
            showExport.value = false;
          } else if (dest === 'export-panel') {
            showExport.value = true;
          } else {
            throw new Error('destination must be timeline, calendar, archived, or export-panel.');
          }
          renderEpoch.value++;
          return { destination: dest };
        }
        case 'browse_search':
          searchQuery.value = String((args as { query?: string })?.query ?? '');
          renderEpoch.value++;
          return { query: searchQuery.value };
        case 'browse_apply_filter': {
          const tag = String((args as { tag?: string })?.tag ?? '').replace(/^#/, '').toLowerCase();
          if (!tag) throw new Error('tag is required.');
          activeTag.value = tag;
          renderEpoch.value++;
          return { tag };
        }
        case 'browse_clear_filter':
          activeTag.value = null;
          activeDateFilter.value = null;
          renderEpoch.value++;
          return { cleared: true };
        case 'artifact_export':
          showExport.value = true;
          renderEpoch.value++;
          return { success: true };
        case 'artifact_import':
          showImport.value = true;
          renderEpoch.value++;
          return { success: true };
        case 'artifact_copy':
          showExport.value = true;
          renderEpoch.value++;
          if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(buildSessionJson(historyState.present)).catch(() => {});
          }
          return { copied: true };
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    };

    const listing = [
      { name: 'entity_create_note', description: 'Create a note via Send.', input_schema: { type: 'object', properties: { text: { type: 'string', minLength: 1, maxLength: 2000 } }, required: ['text'], additionalProperties: false } },
      { name: 'entity_select_note', description: 'Load a note into the composer for editing.', input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'], additionalProperties: false } },
      { name: 'entity_update_note', description: 'Update note text and re-derive tags.', input_schema: { type: 'object', properties: { id: { type: 'string' }, text: { type: 'string', minLength: 1, maxLength: 2000 } }, required: ['id', 'text'], additionalProperties: false } },
      { name: 'entity_toggle_note', description: 'Toggle pinned, archived, or done.', input_schema: { type: 'object', properties: { id: { type: 'string' }, field: { type: 'string', enum: ['pinned', 'archived', 'done'] } }, required: ['id', 'field'], additionalProperties: false } },
      { name: 'entity_delete_note', description: 'Delete a note with confirm=true.', input_schema: { type: 'object', properties: { id: { type: 'string' }, confirm: { type: 'boolean', enum: [true] } }, required: ['id', 'confirm'], additionalProperties: false } },
      { name: 'browse_open', description: 'Open timeline, calendar, archived, or export-panel.', input_schema: { type: 'object', properties: { destination: { type: 'string', enum: ['timeline', 'calendar', 'archived', 'export-panel'] } }, required: ['destination'], additionalProperties: false } },
      { name: 'browse_search', description: 'Filter by keyword.', input_schema: { type: 'object', properties: { query: { type: 'string', maxLength: 200 } }, required: ['query'], additionalProperties: false } },
      { name: 'browse_apply_filter', description: 'Filter by tag.', input_schema: { type: 'object', properties: { tag: { type: 'string', minLength: 1, maxLength: 64 } }, required: ['tag'], additionalProperties: false } },
      { name: 'browse_clear_filter', description: 'Clear tag and day filters.', input_schema: { type: 'object', properties: {}, additionalProperties: false } },
      { name: 'artifact_export', description: 'Open the export panel.', input_schema: { type: 'object', properties: {} } },
      { name: 'artifact_import', description: 'Open the import panel.', input_schema: { type: 'object', properties: {} } },
      { name: 'artifact_copy', description: 'Open export and copy Session JSON.', input_schema: { type: 'object', properties: {} } },
    ];
    const w = window as unknown as Record<string, unknown>;
    w.webmcp_session_info = () => ({
      contract: 'zto-webmcp-v1',
      app: 'TagNote',
      modules: ['entity-collection-v1', 'browse-query-v1', 'artifact-transfer-v1'],
      tool_count: listing.length,
    });
    w.webmcp_list_tools = () => listing;
    w.webmcp_invoke_tool = (name: string, args: unknown) => {
      try {
        return { ok: true, result: invokeTool(name, args ?? {}) };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    };
  });

  const allNotes = historyState.present.notes;
  const todoTags = historyState.present.todoTags;

  const visibleNotes: Note[] = computeVisibleNotes(allNotes, todoTags, {
    showArchived: showArchived.value,
    activeTag: activeTag.value,
    activeDateFilter: activeDateFilter.value,
    searchQuery: searchQuery.value,
  });

  const tagEntries = Array.from(getTagMap(allNotes.filter((n) => !n.archived)).entries()).sort(
    (a, b) => b[1] - a[1]
  );

  const isTodoFilter = activeTag.value && todoTags.includes(activeTag.value);
  let todoOpen: Note[] = [];
  let todoDone: Note[] = [];
  if (isTodoFilter) {
    todoOpen = visibleNotes.filter((n) => !n.done);
    todoDone = visibleNotes.filter((n) => n.done);
  }

  const pinnedNotes =
    !showArchived.value && !isTodoFilter
      ? visibleNotes.filter((n) => n.pinned).sort((a, b) => b.createdAt - a.createdAt)
      : [];
  const regularNotes =
    !showArchived.value && !isTodoFilter
      ? visibleNotes.filter((n) => !n.pinned).sort((a, b) => a.createdAt - b.createdAt)
      : [];

  const hasNotesInScope = showArchived.value
    ? allNotes.some((n) => n.archived)
    : allNotes.some((n) => !n.archived);
  const hasActiveFilter =
    !!activeTag.value || !!activeDateFilter.value || !!searchQuery.value.trim();
  const showNoResults =
    visibleNotes.length === 0 &&
    hasNotesInScope &&
    (hasActiveFilter || showArchived.value);

  useVisibleTask$(({ track }) => {
    track(() => toastMessage.value);
    if (toastMessage.value) {
      const timer = setTimeout(() => {
        toastMessage.value = '';
      }, 2500);
      return () => clearTimeout(timer);
    }
  });

  return (
    <div class="flex min-h-screen flex-col overflow-x-hidden bg-[var(--color-background)]">
      <span class="sr-only" aria-hidden="true">{renderEpoch.value}</span>
      <header class="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div class="mx-auto max-w-2xl px-4 py-3">
          <h1 class="text-[28px] font-bold text-[var(--color-text-primary)] sm:text-[34px]">TagNote</h1>
          <div class="scrollbar-hide mt-2 flex max-w-full items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick$={() => {
                showCalendar.value = !showCalendar.value;
              }}
              class={`shrink-0 rounded-full px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
                showCalendar.value
                  ? 'btn-primary text-white'
                  : 'bg-[var(--color-primary)] text-[var(--color-accent)] hover:bg-[#D4E0F0]'
              }`}
            >
              Calendar
            </button>
            <button
              onClick$={() => {
                showArchived.value = !showArchived.value;
              }}
              class={`shrink-0 rounded-full px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
                showArchived.value
                  ? 'btn-primary text-white'
                  : 'bg-[var(--color-primary)] text-[var(--color-accent)] hover:bg-[#D4E0F0]'
              }`}
            >
              Archived
            </button>
            <button
              onClick$={() => {
                showExport.value = true;
              }}
              class={`shrink-0 rounded-full px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
                showExport.value
                  ? 'btn-primary text-white'
                  : 'bg-[var(--color-primary)] text-[var(--color-accent)] hover:bg-[#D4E0F0]'
              }`}
            >
              Export
            </button>
            <button
              onClick$={() => {
                showImport.value = true;
              }}
              class="shrink-0 rounded-full bg-[var(--color-primary)] px-3 py-2 text-sm font-medium text-[var(--color-accent)] transition-colors hover:bg-[#D4E0F0] sm:px-4"
            >
              Import
            </button>
            <button
              onClick$={() => {
                showHistory.value = true;
              }}
              class="shrink-0 rounded-full bg-[var(--color-primary)] px-3 py-2 text-sm font-medium text-[var(--color-accent)] transition-colors hover:bg-[#D4E0F0] sm:px-4"
            >
              History
            </button>
            <button
              onClick$={handleApplyScenarioChange}
              class="btn-primary shrink-0 px-3 py-2 text-sm font-medium transition-all hover:bg-[#004999] active:scale-95"
            >
              Apply Scenario Change
            </button>
            <button
              onClick$={handleUndo}
              disabled={historyState.past.length === 0}
              class={`shrink-0 rounded-full px-3 py-2 text-sm transition-colors ${
                historyState.past.length > 0
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'cursor-not-allowed bg-gray-100 text-gray-300'
              }`}
              aria-label="Undo timeline change"
            >
              ↩
            </button>
            <button
              onClick$={handleRedo}
              disabled={historyState.future.length === 0}
              class={`shrink-0 rounded-full px-3 py-2 text-sm transition-colors ${
                historyState.future.length > 0
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'cursor-not-allowed bg-gray-100 text-gray-300'
              }`}
              aria-label="Redo timeline change"
            >
              ↪
            </button>
          </div>
        </div>
      </header>

      <main class="mx-auto flex w-full max-w-2xl flex-1 flex-col">
        <SearchBar
          query={searchQuery}
          placeholder={showArchived.value ? 'Search archived...' : 'Search notes and tags...'}
        />

        {!showArchived.value && (
          <TagRail
            tags={tagEntries}
            activeTag={activeTag}
            todoTags={todoTags}
            onToggleTodoTag={handleToggleTodoTag}
            onClearFilter={handleClearFilter}
          />
        )}

        {(selectedIds.ids.length > 0 || hasNotesInScope) && (
          <div
            class={`fixed bottom-28 left-1/2 z-30 flex w-[calc(100%-1rem)] max-w-xl -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-lg sm:gap-4 sm:px-6 sm:py-3 ${selectedIds.ids.length > 0 ? 'bulk-tray-enter' : ''}`}
            role="toolbar"
            aria-label="Bulk selection tray"
          >
            <span class="w-full text-center text-sm font-semibold text-gray-700 sm:w-auto">
              {selectedIds.ids.length} selected
            </span>
            <button
              onClick$={handleBulkArchive}
              disabled={selectedIds.ids.length === 0}
              class="rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-medium text-[var(--color-accent)] transition-colors hover:bg-[#D4E0F0] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Archive selected
            </button>
            <button
              onClick$={handleBulkPin}
              disabled={selectedIds.ids.length === 0}
              class="rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-medium text-[var(--color-accent)] transition-colors hover:bg-[#D4E0F0] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Pin selected
            </button>
            <button
              onClick$={handleBulkDeleteRequest}
              disabled={selectedIds.ids.length === 0}
              class="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Delete selected
            </button>
            <button
              onClick$={() => (selectedIds.ids = [])}
              disabled={selectedIds.ids.length === 0}
              class="text-xs text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear selection
            </button>
          </div>
        )}

        <div class="flex-1 overflow-y-auto px-4 py-4 pb-32">
          {!showNoResults && visibleNotes.length > 0 && (
            <div class="mb-3 flex items-center justify-end gap-3 text-xs">
              <button
                onClick$={() => handleSelectAllVisible(visibleNotes.map((n) => n.id))}
                class="font-medium text-[var(--color-accent)] hover:underline"
              >
                Select all visible
              </button>
              <button
                onClick$={handleClearSelection}
                class="font-medium text-gray-400 hover:text-gray-600 hover:underline"
              >
                Clear selection
              </button>
            </div>
          )}

          {showCalendar.value && !showArchived.value && (
            <div class="mb-4">
              <CalendarView
                notes={allNotes.filter((n) => !n.archived)}
                activeDateFilter={activeDateFilter.value}
                onSelectDate={(key) => {
                  activeDateFilter.value = key;
                }}
              />
            </div>
          )}

          {showNoResults && (
            <div class="flex flex-col items-center justify-center py-16 text-center">
              <p class="text-[17px] font-medium text-gray-400">No results</p>
              <p class="mt-1 text-sm text-gray-300">Try a different search or clear your filters</p>
            </div>
          )}

          {!showNoResults && showArchived.value ? (
            <div>
              {visibleNotes.length === 0 ? (
                <div class="flex flex-col items-center justify-center py-16 text-center">
                  <div class="mb-4 text-4xl opacity-20">📦</div>
                  <p class="text-[17px] font-medium text-gray-400">No archived notes yet.</p>
                </div>
              ) : (
                <NoteList
                  notes={visibleNotes.sort((a, b) => a.createdAt - b.createdAt)}
                  todoTags={todoTags}
                  onToggleDone={handleToggleDone}
                  onTogglePin={handleTogglePin}
                  onToggleArchive={handleToggleArchive}
                  onEdit={handleEdit}
                  onDelete={handleDeleteRequest}
                  onAttachFile={handleAttachFile}
                  selectedIds={new Set(selectedIds.ids)}
                  onToggleSelect={handleToggleSelect}
                />
              )}
            </div>
          ) : !showNoResults && isTodoFilter ? (
            <div class="space-y-6">
              <div>
                <h2 class="mb-3 text-[17px] font-semibold text-[var(--color-text-primary)]">
                  Open{' '}
                  <span class="ml-1 text-sm font-normal text-gray-400">({todoOpen.length})</span>
                </h2>
                {todoOpen.length === 0 ? (
                  <p class="text-center text-sm text-gray-400">All done! 🎉</p>
                ) : (
                  <NoteList
                    notes={todoOpen.sort((a, b) => a.createdAt - b.createdAt)}
                    todoTags={todoTags}
                    onToggleDone={handleToggleDone}
                    onTogglePin={handleTogglePin}
                    onToggleArchive={handleToggleArchive}
                    onEdit={handleEdit}
                    onDelete={handleDeleteRequest}
                    onAttachFile={handleAttachFile}
                    selectedIds={new Set(selectedIds.ids)}
                    onToggleSelect={handleToggleSelect}
                  />
                )}
              </div>
              <div>
                <h2 class="mb-3 text-[17px] font-semibold text-[var(--color-text-primary)]">
                  Done{' '}
                  <span class="ml-1 text-sm font-normal text-gray-400">({todoDone.length})</span>
                </h2>
                {todoDone.length === 0 ? (
                  <p class="text-center text-sm text-gray-400">Nothing completed yet</p>
                ) : (
                  <NoteList
                    notes={todoDone.sort((a, b) => a.createdAt - b.createdAt)}
                    todoTags={todoTags}
                    onToggleDone={handleToggleDone}
                    onTogglePin={handleTogglePin}
                    onToggleArchive={handleToggleArchive}
                    onEdit={handleEdit}
                    onDelete={handleDeleteRequest}
                    onAttachFile={handleAttachFile}
                    selectedIds={new Set(selectedIds.ids)}
                    onToggleSelect={handleToggleSelect}
                  />
                )}
              </div>
            </div>
          ) : !showNoResults ? (
            <>
              {pinnedNotes.length > 0 && (
                <div class="mb-6">
                  <h2 class="mb-3 flex items-center gap-2 text-[17px] font-semibold text-[var(--color-text-primary)]">
                    <span style={{ color: '#FFCC00' }}>📌</span> Pinned
                  </h2>
                  <NoteList
                    notes={pinnedNotes}
                    todoTags={todoTags}
                    onToggleDone={handleToggleDone}
                    onTogglePin={handleTogglePin}
                    onToggleArchive={handleToggleArchive}
                    onEdit={handleEdit}
                    onDelete={handleDeleteRequest}
                    onAttachFile={handleAttachFile}
                    selectedIds={new Set(selectedIds.ids)}
                    onToggleSelect={handleToggleSelect}
                  />
                </div>
              )}

              <div>
                {regularNotes.length === 0 && pinnedNotes.length === 0 ? (
                  <div class="flex flex-col items-center justify-center py-16 text-center">
                    <div class="mb-4 text-4xl opacity-20">📝</div>
                    <p class="text-[17px] font-medium text-gray-400">
                      Send your first note to get started!
                    </p>
                    <p class="mt-1 text-sm text-gray-300">Use #tags to organize your thoughts</p>
                  </div>
                ) : regularNotes.length === 0 ? null : (
                  <NoteList
                    notes={regularNotes}
                    todoTags={todoTags}
                    onToggleDone={handleToggleDone}
                    onTogglePin={handleTogglePin}
                    onToggleArchive={handleToggleArchive}
                    onEdit={handleEdit}
                    onDelete={handleDeleteRequest}
                    onAttachFile={handleAttachFile}
                    selectedIds={new Set(selectedIds.ids)}
                    onToggleSelect={handleToggleSelect}
                  />
                )}
              </div>
            </>
          ) : null}
        </div>

        <div class="sticky bottom-0 z-10 bg-white">
          <Composer
            onSubmit={handleSubmit}
            editText={editText as Signal<{ id: string; text: string; marks?: NoteMark[] } | null>}
            onCancelEdit={handleCancelEdit}
          />
        </div>
      </main>

      <Toast message={toastMessage} />
      <ConfirmDialog
        message={deleteTargetId.value === 'bulk' ? `Are you sure you want to permanently delete ${selectedIds.ids.length} notes?` : "Are you sure you want to permanently delete this note?"}
        open={confirmDelete}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
      <HistoryPanel
        history={historyState}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onApplyScenarioChange={handleApplyScenarioChange}
        onHistoryChange={syncHistory}
        canUndo={historyState.past.length > 0}
        canRedo={historyState.future.length > 0}
        open={showHistory}
      />
      {showExport.value && <ExportPanel state={historyState.present} onClose={$(() => showExport.value = false)} />}
      {showImport.value && <ImportPanel onImport={$((ns: AppState) => { applyState(ns, 'Imported Session JSON'); selectedIds.ids = []; activeTag.value = null; activeDateFilter.value = null; searchQuery.value = ''; showImport.value = false; showToast('State imported'); })} onClose={$(() => showImport.value = false)} />}
    </div>
  );
});

const NoteList = component$<{
  notes: Note[];
  todoTags: string[];
  onToggleDone: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAttachFile: (id: string, file: { name: string; size: number }) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}>(({ notes, todoTags, onToggleDone, onTogglePin, onToggleArchive, onEdit, onDelete, onAttachFile, selectedIds, onToggleSelect }) => {
  if (notes.length === 0) return null;

  const groups: { label: string; notes: Note[] }[] = [];
  const grouped = new Map<string, Note[]>();
  for (const note of notes) {
    const label = formatDate(note.createdAt);
    if (!grouped.has(label)) grouped.set(label, []);
    grouped.get(label)!.push(note);
  }
  for (const [label, g] of grouped) groups.push({ label, notes: g });

  return (
    <div class="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <div class="sticky top-0 z-10 mb-2 bg-[var(--color-background)] py-2">
            <h2 class="text-[17px] font-semibold text-[var(--color-text-primary)]">{group.label}</h2>
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
                onAttachFile={onAttachFile}
                isSelected={selectedIds?.has(note.id)}
                onToggleSelect={onToggleSelect}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});
