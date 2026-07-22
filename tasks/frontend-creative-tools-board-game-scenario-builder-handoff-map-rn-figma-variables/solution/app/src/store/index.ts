import { create } from 'zustand';
import type { ScenarioRecord, ScenarioStatus, HandoffOwner, ArtifactState, DerivedState } from '../types';

export const HANDOFF_OWNERS: HandoffOwner[] = [
  { id: 'owner-1', name: 'Alice', role: 'Designer', avatarColor: '#ec4899' },
  { id: 'owner-2', name: 'Bob', role: 'Developer', avatarColor: '#3b82f6' },
  { id: 'owner-3', name: 'Charlie', role: 'Tester', avatarColor: '#10b981' },
];

export interface AppState {
  records: ScenarioRecord[];
  history: ScenarioRecord[][];
  selectedRecordId: string | null;
  error: string | null;

  // Actions
  seedCollection: () => void;
  selectRecord: (id: string | null) => void;
  updateRecord: (id: string, updates: Partial<ScenarioRecord>) => void;
  addRecord: (record: ScenarioRecord) => void;
  deleteRecord: (id: string) => void;
  connectOwner: (recordId: string, ownerId: string | null) => void;
  undo: () => void;
  clearSession: () => void;
  exportArtifact: () => string;
  importArtifact: (json: string) => void;
  getDerivedState: () => DerivedState;
}

const generateSeedRecords = (): ScenarioRecord[] => {
  const records: ScenarioRecord[] = [];
  const statuses: ScenarioStatus[] = ['empty', 'draft', 'ready', 'changed', 'archived'];
  for (let i = 1; i <= 100; i++) {
    records.push({
      id: `rec-${i}`,
      title: `Scenario ${i}`,
      description: `Description for scenario ${i}`,
      status: statuses[i % 5],
      ownerId: i % 3 === 0 ? HANDOFF_OWNERS[i % 3].id : null,
      difficulty: (i % 5) + 1,
      duration: Math.min(300, 30 + (i * 5) % 270),
    });
  }
  return records;
};

export const useStore = create<AppState>((set, get) => ({
  records: [],
  history: [],
  selectedRecordId: null,
  error: null,

  seedCollection: () => {
    set({ records: generateSeedRecords(), history: [], selectedRecordId: null, error: null });
  },

  selectRecord: (id: string | null) => set({ selectedRecordId: id }),

  updateRecord: (id, updates) => {
    set((state) => {
      // Boundaries checks
      if (updates.difficulty !== undefined && (updates.difficulty < 1 || updates.difficulty > 5)) return state;
      if (updates.duration !== undefined && (updates.duration < 0 || updates.duration > 300)) return state;
      if (updates.title !== undefined && updates.title.trim() === '') return { ...state, error: 'Title cannot be empty. Preserved prior valid state.' };

      const newRecords = state.records.map((r) => (r.id === id ? { ...r, ...updates } : r));
      return {
        records: newRecords,
        history: [...state.history, state.records],
        error: null,
      };
    });
  },

  addRecord: (record) => {
    set((state) => ({
      records: [...state.records, record],
      history: [...state.history, state.records],
    }));
  },

  deleteRecord: (id) => {
    set((state) => ({
      records: state.records.filter((r) => r.id !== id),
      history: [...state.history, state.records],
      selectedRecordId: state.selectedRecordId === id ? null : state.selectedRecordId,
    }));
  },

  connectOwner: (recordId, ownerId) => {
    set((state) => {
      const record = state.records.find((r) => r.id === recordId);
      if (!record) return state;

      if (ownerId && record.ownerId === ownerId) {
        // Conflict / incomplete mutation reject
        return { ...state, error: 'Cannot connect to the same owner.' };
      }

      const status: ScenarioStatus = ownerId ? 'ready' : 'draft';
      const newRecords = state.records.map((r) =>
        r.id === recordId ? { ...r, ownerId, status } : r
      );

      return {
        records: newRecords,
        history: [...state.history, state.records],
        error: null,
      };
    });
  },

  undo: () => {
    set((state) => {
      if (state.history.length === 0) return state;
      const prevRecords = state.history[state.history.length - 1];
      const newHistory = state.history.slice(0, -1);
      // Ensure selectedRecordId is still valid
      const selectedRecordExists = prevRecords.some((r) => r.id === state.selectedRecordId);
      return {
        records: prevRecords,
        history: newHistory,
        selectedRecordId: selectedRecordExists ? state.selectedRecordId : null,
        error: null,
      };
    });
  },

  clearSession: () => {
    set({ records: [], history: [], selectedRecordId: null, error: null });
  },

  getDerivedState: () => {
    const records = get().records;
    let total = 0, assigned = 0, unassigned = 0, ready = 0, draft = 0;
    for (const r of records) {
      total++;
      if (r.ownerId) assigned++; else unassigned++;
      if (r.status === 'ready') ready++;
      if (r.status === 'draft') draft++;
    }
    return { summary: { total, assigned, unassigned, ready, draft } };
  },

  exportArtifact: () => {
    const state = get();
    const artifact: ArtifactState = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: state.getDerivedState(),
      history: [],
    };
    return JSON.stringify(artifact, null, 2);
  },

  importArtifact: (json: string) => {
    try {
      const artifact = JSON.parse(json);
      if (artifact.schemaVersion !== 'v1' || !Array.isArray(artifact.records)) {
        return; // malformed, make no state change
      }

      // Check duplicate IDs
      const ids = new Set<string>();
      let hasDuplicates = false;
      let hasInvalidBounds = false;
      let hasUnknownReferences = false;

      for (const r of artifact.records) {
        if (ids.has(r.id)) {
          hasDuplicates = true;
          break;
        }
        ids.add(r.id);
        if (r.difficulty < 1 || r.difficulty > 5 || r.duration < 0 || r.duration > 300) {
          hasInvalidBounds = true;
          break;
        }
        if (r.ownerId && !HANDOFF_OWNERS.find(o => o.id === r.ownerId)) {
          hasUnknownReferences = true;
          break;
        }
      }

      if (hasDuplicates || hasInvalidBounds || hasUnknownReferences) {
        return; // invalid bounds or references make no state change
      }

      set({ records: artifact.records, history: [], selectedRecordId: null, error: null });
    } catch (e) {
      // silently ignore invalid json
    }
  },
}));
