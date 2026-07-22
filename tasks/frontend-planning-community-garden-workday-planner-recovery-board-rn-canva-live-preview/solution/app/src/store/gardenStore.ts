import { create } from 'zustand';
import { calculateDerived, taskInputSchema, validateArtifact } from './schema';
import type { ArtifactFilters, CommunityGardenWorkdayPlannerSession, Diagnostic, DomainStatus, HistoryEvent, WorkTaskRecord } from './types';

type Snapshot = Pick<GardenState, 'records' | 'history' | 'selectionId' | 'filters'>;

interface GardenState {
  records: WorkTaskRecord[];
  history: HistoryEvent[];
  selectionId: string | null;
  filters: ArtifactFilters;
  announcement: string;
  diagnostics: Diagnostic[];
  snapshots: Snapshot[];
  createRecord: (input: unknown) => { ok: boolean; errors?: Record<string, string> };
  updateRecord: (id: string, input: unknown) => { ok: boolean; errors?: Record<string, string> };
  deleteRecord: (id: string) => boolean;
  toggleArchive: (id: string) => boolean;
  reorderRecord: (id: string, direction: -1 | 1) => boolean;
  reorderTo: (id: string, target: number) => boolean;
  selectRecord: (id: string | null) => void;
  setStatusFilter: (status: DomainStatus | 'all') => void;
  setQuery: (query: string) => void;
  moveToRecovery: (id: string) => boolean;
  resolveRecovery: (id: string, repairNote: string) => { ok: boolean; message?: string };
  undo: () => boolean;
  clearSession: () => void;
  importSession: (raw: unknown) => { ok: boolean; diagnostics: Diagnostic[] };
  clearDiagnostics: () => void;
}

const titles = ['Turn compost', 'Weed herb spiral', 'Repair drip line', 'Mulch berry row', 'Label seedlings', 'Check tool inventory', 'Prepare pollinator bed', 'Clean water barrels'];
const plots = ['North Beds', 'South Beds', 'Orchard', 'Greenhouse'] as const;

function seededRecords(): WorkTaskRecord[] {
  return Array.from({ length: 104 }, (_, index) => {
    const number = index + 1;
    const failed = index === 3;
    const status: DomainStatus = failed ? 'failed' : index % 5 === 0 ? 'draft' : index % 3 === 0 ? 'changed' : 'ready';
    const plot = plots[index % plots.length];
    return {
      id: `garden-task-${String(number).padStart(3, '0')}`,
      title: failed ? 'Compost delivery failed' : `${titles[index % titles.length]} ${number}`,
      description: failed ? 'Supplier cancelled the delivery; beds are waiting for amended compost.' : `Workday preparation item ${number} for ${plot}.`,
      status,
      date: `2026-${String((index % 9) + 3).padStart(2, '0')}-${String((index % 27) + 1).padStart(2, '0')}`,
      plot,
      volunteers: plot === 'Greenhouse' ? (index % 8) + 1 : (index % 20) + 1,
      durationMinutes: ((index % 16) + 1) * 15,
      order: index,
      recoveryBoardState: { lane: 'queue', position: index, repairNote: '' },
    };
  });
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function fieldsFromZod(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  return Object.fromEntries(error.issues.map((issue) => [String(issue.path[0] ?? 'form'), issue.message]));
}

let eventSequence = 0;
let recordSequence = 0;

function event(eventName: HistoryEvent['event'], recordId?: string, from?: string, to?: string): HistoryEvent {
  eventSequence += 1;
  return { id: `event-${eventSequence}`, event: eventName, recordId, at: new Date().toISOString(), from, to };
}

function snapshot(state: GardenState): Snapshot {
  return clone({ records: state.records, history: state.history, selectionId: state.selectionId, filters: state.filters });
}

function commit(state: GardenState, records: WorkTaskRecord[], historyEvent: HistoryEvent, announcement: string, selectionId = state.selectionId) {
  return {
    records,
    history: [...state.history, historyEvent],
    selectionId,
    announcement,
    snapshots: [...state.snapshots, snapshot(state)].slice(-30),
    diagnostics: [],
  };
}

const initialRecords = seededRecords();

export const useGardenStore = create<GardenState>((set, get) => ({
  records: initialRecords,
  history: [],
  selectionId: null,
  filters: { status: 'all', query: '' },
  announcement: 'Recovery board ready. No recovery milestone has been completed.',
  diagnostics: [],
  snapshots: [],

  createRecord(input) {
    const parsed = taskInputSchema.safeParse(input);
    if (!parsed.success) return { ok: false, errors: fieldsFromZod(parsed.error) };
    if (parsed.data.status === 'recovery' || parsed.data.status === 'resolved') return { ok: false, errors: { status: 'New tasks cannot begin in Recovery or Resolved; use the recovery board after a real failure.' } };
    const state = get();
    recordSequence += 1;
    const id = `authored-task-${String(recordSequence).padStart(3, '0')}`;
    const record: WorkTaskRecord = {
      ...parsed.data,
      id,
      order: state.records.length,
      recoveryBoardState: { lane: 'queue', position: state.records.length, repairNote: '' },
    };
    set(commit(state, [...state.records, record], event('create', id), `Created ${record.title}. Task count increased by one.`, id));
    return { ok: true };
  },

  updateRecord(id, input) {
    const parsed = taskInputSchema.safeParse(input);
    if (!parsed.success) return { ok: false, errors: fieldsFromZod(parsed.error) };
    const state = get();
    const current = state.records.find((record) => record.id === id);
    if (!current) return { ok: false, errors: { form: `Record ${id} no longer exists.` } };
    if ((parsed.data.status === 'recovery' || parsed.data.status === 'resolved') && parsed.data.status !== current.status) return { ok: false, errors: { status: 'Recovery and Resolved states require the canonical recovery-board action.' } };
    const next = state.records.map((record) => record.id === id ? { ...record, ...parsed.data, recoveryBoardState: parsed.data.status === 'recovery' || parsed.data.status === 'resolved' ? record.recoveryBoardState : { lane: 'queue' as const, position: record.order, repairNote: '' } } : record);
    set(commit(state, next, event('update', id, current.status, parsed.data.status), `Updated ${parsed.data.title} across the list, preview, and artifact.`, id));
    return { ok: true };
  },

  deleteRecord(id) {
    const state = get();
    const record = state.records.find((item) => item.id === id);
    if (!record) return false;
    set(commit(state, state.records.filter((item) => item.id !== id).map((item, order) => ({ ...item, order })), event('delete', id), `Deleted ${record.title}. Task count decreased by one.`, state.selectionId === id ? null : state.selectionId));
    return true;
  },

  toggleArchive(id) {
    const state = get();
    const record = state.records.find((item) => item.id === id);
    if (!record) return false;
    const nextStatus: DomainStatus = record.status === 'archived' ? 'draft' : 'archived';
    const next = state.records.map((item) => item.id === id ? { ...item, status: nextStatus, recoveryBoardState: { ...item.recoveryBoardState, lane: 'queue' as const, repairNote: '' } } : item);
    set(commit(state, next, event('archive', id, record.status, nextStatus), `${nextStatus === 'archived' ? 'Archived' : 'Restored'} ${record.title}.`, id));
    return true;
  },

  reorderRecord(id, direction) {
    const state = get();
    const sorted = [...state.records].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((record) => record.id === id);
    return get().reorderTo(id, index + direction);
  },
  reorderTo(id, requestedTarget) {
    const state = get();
    const sorted = [...state.records].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((record) => record.id === id);
    const target = Math.max(0, Math.min(sorted.length - 1, Math.trunc(requestedTarget)));
    if (index < 0 || target < 0 || target >= sorted.length) return false;
    if (index === target) return false;
    const [moved] = sorted.splice(index, 1);
    sorted.splice(target, 0, moved);
    const next = sorted.map((record, order) => ({ ...record, order }));
    set(commit(state, next, event('reorder', id, String(index), String(target)), `Moved ${moved.title} to position ${target + 1}.`, id));
    return true;
  },

  selectRecord(id) {
    if (id && !get().records.some((record) => record.id === id)) return;
    set({ selectionId: id, announcement: id ? `Selected ${get().records.find((record) => record.id === id)?.title}.` : 'Selection cleared.' });
  },
  setStatusFilter(status) { set((state) => ({ filters: { ...state.filters, status }, announcement: `Showing ${status} tasks.` })); },
  setQuery(query) { set((state) => ({ filters: { ...state.filters, query: query.slice(0, 80) } })); },

  moveToRecovery(id) {
    const state = get();
    const record = state.records.find((item) => item.id === id);
    if (!record || record.status !== 'failed') return false;
    const next = state.records.map((item) => item.id === id ? { ...item, status: 'recovery' as const, recoveryBoardState: { lane: 'recovery' as const, position: state.records.filter((candidate) => candidate.status === 'recovery').length, repairNote: '' } } : item);
    set(commit(state, next, event('move_to_recovery', id, 'failed', 'recovery'), `Moved ${record.title} into recovery. Linked preview now shows one more recovery task.`, id));
    return true;
  },

  resolveRecovery(id, repairNote) {
    const state = get();
    const record = state.records.find((item) => item.id === id);
    if (!record || record.status !== 'recovery') return { ok: false, message: 'Only a task in the Recovery lane can be resolved.' };
    if (repairNote.trim().length < 10 || repairNote.trim().length > 180) return { ok: false, message: 'Repair note must contain 10 to 180 characters; describe the downstream repair.' };
    const next = state.records.map((item) => item.id === id ? { ...item, status: 'resolved' as const, recoveryBoardState: { lane: 'resolved' as const, position: state.records.filter((candidate) => candidate.status === 'resolved').length, repairNote: repairNote.trim() } } : item);
    set(commit(state, next, event('resolve_recovery', id, 'recovery', 'resolved'), `Resolved ${record.title}; its repair note now appears in the preview and artifact.`, id));
    return { ok: true };
  },

  undo() {
    const state = get();
    const previous = state.snapshots.at(-1);
    if (!previous) return false;
    const undone = state.history.at(-1);
    set({ ...clone(previous), history: [...previous.history, event('undo', undone?.recordId, undone?.event, 'restored')], snapshots: state.snapshots.slice(0, -1), announcement: `Undid ${undone?.event?.replaceAll('_', ' ') ?? 'the last mutation'} and restored ordering, selection, filters, and derived values.`, diagnostics: [] });
    return true;
  },

  clearSession() {
    set({ records: [], history: [], selectionId: null, filters: { status: 'all', query: '' }, announcement: 'Session cleared. Import an artifact or create a task to continue.', diagnostics: [], snapshots: [] });
  },

  importSession(raw) {
    const result = validateArtifact(raw);
    if ('diagnostics' in result) {
      set({ diagnostics: result.diagnostics, announcement: `Import rejected with ${result.diagnostics.length} diagnostics. No state changed.` });
      return { ok: false, diagnostics: result.diagnostics };
    }
    const session = result.session;
    set({ records: clone(session.records).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id)), history: clone(session.history), selectionId: session.selectionId, filters: clone(session.filters), announcement: `Imported ${session.records.length} tasks atomically. ExportedAt will regenerate on the next export.`, diagnostics: [], snapshots: [] });
    return { ok: true, diagnostics: [] };
  },
  clearDiagnostics() { set({ diagnostics: [] }); },
}));

export function currentArtifact(): CommunityGardenWorkdayPlannerSession {
  const state = useGardenStore.getState();
  const records = clone(state.records).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  return {
    schemaVersion: 'garden-workday-v1',
    exportedAt: new Date().toISOString(),
    records,
    derived: calculateDerived(records),
    history: clone(state.history),
    selectionId: state.selectionId,
    filters: clone(state.filters),
  };
}
