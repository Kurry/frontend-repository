import { component$, $, useStore, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import type { Signal } from '@builder.io/qwik';
import type { Note, AppState, HistoryState } from './types';
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
  filterByTag,
  filterBySearch,
  filterByDate,
} from './store';

import { Composer } from './components/Composer';
import { TagRail } from './components/TagRail';
import { SearchBar } from './components/SearchBar';
import { CalendarView } from './components/CalendarView';
import { ConfirmDialog } from './components/ConfirmDialog';
import { Toast } from './components/Toast';
import { HistoryPanel } from './components/HistoryPanel';
import { NoteItem } from './components/NoteItem';
import { formatDate } from './utils';

export const Root = component$(() => {
  const historyState = useStore<HistoryState>(createInitialHistory());

  const activeTag = useSignal<string | null>(null);
  const activeDateFilter = useSignal<string | null>(null);
  const searchQuery = useSignal('');
  const showArchived = useSignal(false);
  const showCalendar = useSignal(false);
  const showHistory = useSignal(false);
  const toastMessage = useSignal('');
  const editText = useSignal<{ id: string; text: string } | null>(null);
  const confirmDelete = useSignal(false);
  const deleteTargetId = useSignal<string | null>(null);

  const syncHistory = $((next: HistoryState) => {
    historyState.past = next.past;
    historyState.present = next.present;
    historyState.future = next.future;
    historyState.branchId = next.branchId;
    historyState.branches = next.branches;
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

  const handleSubmit = $((text: string, file?: { name: string; size: number }) => {
    if (editText.value) {
      const ns = editNote(historyState.present, editText.value.id, text);
      applyState(ns, 'Edited note');
      editText.value = null;
      showToast('Note updated');
    } else {
      const ns = addNote(historyState.present, text, file);
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
    if (note) editText.value = { id: note.id, text: note.text };
  });

  const handleDeleteRequest = $((id: string) => {
    deleteTargetId.value = id;
    confirmDelete.value = true;
  });

  const handleDeleteConfirm = $(() => {
    if (deleteTargetId.value) {
      applyState(deleteNote(historyState.present, deleteTargetId.value), 'Deleted note');
      deleteTargetId.value = null;
      showToast('Note deleted');
    }
  });

  const handleDeleteCancel = $(() => {
    deleteTargetId.value = null;
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

  const allNotes = historyState.present.notes;
  const todoTags = historyState.present.todoTags;

  let visibleNotes: Note[];
  if (showArchived.value) {
    visibleNotes = allNotes.filter((n) => n.archived);
  } else {
    visibleNotes = allNotes.filter((n) => !n.archived);
    if (activeTag.value) visibleNotes = filterByTag(visibleNotes, activeTag.value);
    if (activeDateFilter.value) visibleNotes = filterByDate(visibleNotes, activeDateFilter.value);
  }
  if (searchQuery.value.trim()) {
    visibleNotes = filterBySearch(visibleNotes, searchQuery.value);
  }

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

  // WebMCP action surface (contract zto-webmcp-v1). Every tool below routes
  // through the SAME store command a visible control uses, so an agent driving
  // the app via WebMCP and a human clicking the UI share one code path.
  useVisibleTask$(() => {
    const applyBridge = (newState: AppState, label: string) => {
      const next = pushHistoryAndPresent(historyState, newState, label);
      historyState.past = next.past;
      historyState.present = next.present;
      historyState.future = next.future;
      historyState.branchId = next.branchId;
      historyState.branches = next.branches;
    };
    const findNote = (id: string) =>
      historyState.present.notes.find((n) => n.id === id);

    const tools: Record<
      string,
      { description: string; input_schema: unknown; run: (args: any) => unknown }
    > = {
      entity_create_note: {
        description:
          'Create a note by submitting composer text; inline #tags and URLs are parsed exactly as the Send control does. Same command as clicking Send.',
        input_schema: {
          type: 'object',
          properties: { text: { type: 'string', minLength: 1, maxLength: 2000 } },
          required: ['text'],
          additionalProperties: false,
        },
        run: (args) => {
          const text = typeof args?.text === 'string' ? args.text.trim() : '';
          if (!text) throw new Error('Note text is required and cannot be blank.');
          const ns = addNote(historyState.present, text);
          applyBridge(ns, 'Added note');
          showToast('Note added');
          const created = ns.notes[ns.notes.length - 1];
          return { id: created.id, tags: created.tags, count: ns.notes.length };
        },
      },
      entity_select_note: {
        description:
          'Select a note for editing by loading its raw text back into the composer. Same command as the note Edit control.',
        input_schema: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
          additionalProperties: false,
        },
        run: (args) => {
          const note = findNote(String(args?.id));
          if (!note) throw new Error('No note with that id.');
          editText.value = { id: note.id, text: note.text };
          return { id: note.id, text: note.text };
        },
      },
      entity_update_note: {
        description:
          'Update a note\'s text; tags and links are re-derived from the new text. Same command as editing then Save.',
        input_schema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            text: { type: 'string', minLength: 1, maxLength: 2000 },
          },
          required: ['id', 'text'],
          additionalProperties: false,
        },
        run: (args) => {
          const id = String(args?.id);
          if (!findNote(id)) throw new Error('No note with that id.');
          const text = typeof args?.text === 'string' ? args.text.trim() : '';
          if (!text) throw new Error('Note text is required and cannot be blank.');
          const ns = editNote(historyState.present, id, text);
          applyBridge(ns, 'Edited note');
          editText.value = null;
          showToast('Note updated');
          const updated = ns.notes.find((n) => n.id === id)!;
          return { id, tags: updated.tags };
        },
      },
      entity_toggle_note: {
        description:
          'Toggle a note flag. field=pinned mirrors Pin/Unpin, field=archived mirrors Archive/Unarchive, field=done mirrors the TODO checkbox.',
        input_schema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            field: { type: 'string', enum: ['pinned', 'archived', 'done'] },
          },
          required: ['id', 'field'],
          additionalProperties: false,
        },
        run: (args) => {
          const id = String(args?.id);
          const note = findNote(id);
          if (!note) throw new Error('No note with that id.');
          const field = String(args?.field);
          let ns: AppState;
          if (field === 'pinned') {
            ns = togglePin(historyState.present, id);
            applyBridge(ns, note.pinned ? 'Unpinned note' : 'Pinned note');
            showToast(note.pinned ? 'Note unpinned' : 'Note pinned');
          } else if (field === 'archived') {
            ns = toggleArchive(historyState.present, id);
            applyBridge(ns, note.archived ? 'Unarchived note' : 'Archived note');
            showToast(note.archived ? 'Note unarchived' : 'Note archived');
          } else if (field === 'done') {
            ns = toggleDone(historyState.present, id);
            applyBridge(ns, 'Toggled TODO');
          } else {
            throw new Error('field must be one of pinned, archived, done.');
          }
          const t = ns.notes.find((n) => n.id === id)!;
          return { id, pinned: t.pinned, archived: t.archived, done: t.done };
        },
      },
      entity_delete_note: {
        description:
          'Permanently delete a note. Requires confirm=true, mirroring the Delete confirmation dialog.',
        input_schema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            confirm: { type: 'boolean', enum: [true] },
          },
          required: ['id', 'confirm'],
          additionalProperties: false,
        },
        run: (args) => {
          if (args?.confirm !== true)
            throw new Error('Delete requires confirm=true.');
          const id = String(args?.id);
          if (!findNote(id)) throw new Error('No note with that id.');
          const ns = deleteNote(historyState.present, id);
          applyBridge(ns, 'Deleted note');
          showToast('Note deleted');
          return { id, count: ns.notes.length };
        },
      },
      browse_open: {
        description:
          'Open a view. destination=timeline shows the chronological timeline, calendar opens the month grid, archived opens the Archived view. Same commands as the header Calendar/Archived controls.',
        input_schema: {
          type: 'object',
          properties: {
            destination: {
              type: 'string',
              enum: ['timeline', 'calendar', 'archived'],
            },
          },
          required: ['destination'],
          additionalProperties: false,
        },
        run: (args) => {
          const dest = String(args?.destination);
          if (dest === 'timeline') {
            showArchived.value = false;
            showCalendar.value = false;
          } else if (dest === 'calendar') {
            showArchived.value = false;
            showCalendar.value = true;
          } else if (dest === 'archived') {
            showArchived.value = true;
          } else {
            throw new Error('destination must be timeline, calendar, or archived.');
          }
          return { destination: dest };
        },
      },
      browse_search: {
        description:
          'Filter the currently-visible list by keyword across note text and tags. Same command as typing in the search field.',
        input_schema: {
          type: 'object',
          properties: { query: { type: 'string', maxLength: 200 } },
          required: ['query'],
          additionalProperties: false,
        },
        run: (args) => {
          searchQuery.value = String(args?.query ?? '');
          return { query: searchQuery.value };
        },
      },
      browse_apply_filter: {
        description:
          'Filter the timeline to notes carrying a tag. Matching is case-insensitive. Same command as clicking a tag chip in the tag rail.',
        input_schema: {
          type: 'object',
          properties: { tag: { type: 'string', minLength: 1, maxLength: 64 } },
          required: ['tag'],
          additionalProperties: false,
        },
        run: (args) => {
          const tag = String(args?.tag ?? '').replace(/^#/, '').toLowerCase();
          if (!tag) throw new Error('tag is required.');
          activeTag.value = tag;
          return { tag };
        },
      },
      browse_clear_filter: {
        description:
          'Clear the active tag and calendar-day filters, restoring the full timeline. Same command as the Clear filter control.',
        input_schema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
        run: () => {
          activeTag.value = null;
          activeDateFilter.value = null;
          return { cleared: true };
        },
      },
    };

    const listing = Object.entries(tools).map(([name, def]) => ({
      name,
      description: def.description,
      input_schema: def.input_schema,
    }));

    const w = window as unknown as Record<string, unknown>;
    w.webmcp_session_info = () => ({
      contract: 'zto-webmcp-v1',
      app: 'TagNote',
      modules: ['entity-collection-v1', 'browse-query-v1'],
      tool_count: listing.length,
    });
    w.webmcp_list_tools = () => listing;
    w.webmcp_invoke_tool = (name: string, args: unknown) => {
      const def = tools[name];
      if (!def) return { ok: false, error: `Unknown tool: ${name}` };
      try {
        const result = def.run(args ?? {});
        return { ok: true, result };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
      }
    };

    // Optional-additional navigator.modelContext registration.
    const nav = navigator as unknown as {
      modelContext?: { registerTool?: (t: unknown) => void };
    };
    if (nav.modelContext && typeof nav.modelContext.registerTool === 'function') {
      for (const t of listing) {
        try {
          nav.modelContext.registerTool({
            name: t.name,
            description: t.description,
            inputSchema: t.input_schema,
            execute: (args: unknown) =>
              (w.webmcp_invoke_tool as (n: string, a: unknown) => unknown)(t.name, args),
          });
        } catch {
          // registration is best-effort; window.* surface is authoritative
        }
      }
    }
  });

  return (
    <div class="flex min-h-screen flex-col overflow-x-hidden bg-[var(--color-background)]">
      <header class="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div class="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <h1 class="text-[34px] font-bold text-[var(--color-text-primary)]">TagNote</h1>
          <div class="flex flex-wrap items-center justify-end gap-1.5">
            <button
              onClick$={() => {
                showCalendar.value = !showCalendar.value;
              }}
              class={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                showCalendar.value
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'bg-[var(--color-primary)] text-[var(--color-accent)] hover:bg-[#D4E0F0]'
              }`}
            >
              Calendar
            </button>
            <button
              onClick$={() => {
                showArchived.value = !showArchived.value;
              }}
              class={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                showArchived.value
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'bg-[var(--color-primary)] text-[var(--color-accent)] hover:bg-[#D4E0F0]'
              }`}
            >
              Archived
            </button>
            <button
              onClick$={() => {
                showHistory.value = true;
              }}
              class="rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-accent)] transition-colors hover:bg-[#D4E0F0]"
            >
              History
            </button>
            <button
              onClick$={handleApplyScenarioChange}
              class="rounded-full bg-[var(--color-accent)] px-3 py-2 text-sm font-medium text-[#FEFEFE] shadow-none hover:bg-[#0066DD]"
              style={{ borderRadius: '1000px', boxShadow: 'none' }}
            >
              Apply Scenario Change
            </button>
            <button
              onClick$={handleUndo}
              disabled={historyState.past.length === 0}
              class={`rounded-full px-3 py-2 text-sm transition-colors ${
                historyState.past.length > 0
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'cursor-not-allowed bg-gray-100 text-gray-300'
              }`}
              title="Undo"
            >
              ↩
            </button>
            <button
              onClick$={handleRedo}
              disabled={historyState.future.length === 0}
              class={`rounded-full px-3 py-2 text-sm transition-colors ${
                historyState.future.length > 0
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'cursor-not-allowed bg-gray-100 text-gray-300'
              }`}
              title="Redo"
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

        <div class="flex-1 overflow-y-auto px-4 py-4">
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
                  />
                )}
              </div>
            </>
          ) : null}
        </div>

        <div class="sticky bottom-0 z-10">
          <Composer
            onSubmit={handleSubmit}
            editText={editText as Signal<{ id: string; text: string } | null>}
            onCancelEdit={handleCancelEdit}
          />
        </div>
      </main>

      <Toast message={toastMessage} />
      <ConfirmDialog
        message="Are you sure you want to permanently delete this note?"
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
}>(({ notes, todoTags, onToggleDone, onTogglePin, onToggleArchive, onEdit, onDelete, onAttachFile }) => {
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
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});
