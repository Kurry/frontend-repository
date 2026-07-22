import { create } from 'zustand';

export type BlockStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface QuiltBlock {
  id: string;
  name: string;
  status: BlockStatus;
  fabricCount: number;
  patternType: string;
  auditEvidence?: string;
  auditDiscrepancyResolved?: boolean;
}

export interface SessionState {
  schemaVersion: 'v1';
  exportedAt: string;
  records: QuiltBlock[];
  derived: {
    totalBlocks: number;
    readyBlocks: number;
    discrepanciesResolved: number;
  };
  history: string[];
}

interface AppState {
  session: SessionState;
  selectedBlockId: string | null;
  historyStack: SessionState[];

  // Actions
  addBlock: (block: Omit<QuiltBlock, 'id'>) => void;
  updateBlock: (id: string, updates: Partial<QuiltBlock>) => void;
  archiveBlock: (id: string) => void;
  selectBlock: (id: string | null) => void;

  // Canonical Mutation
  attachEvidenceAndResolve: (id: string, evidence: string) => { success: boolean; error?: string };

  // Undo / State management
  undo: () => void;
  importState: (data: any) => { success: boolean; error?: string };
  exportState: () => SessionState;

  // Selection
  getSelectedBlock: () => QuiltBlock | undefined;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const calculateDerived = (records: QuiltBlock[]) => {
  return {
    totalBlocks: records.length,
    readyBlocks: records.filter(r => r.status === 'ready').length,
    discrepanciesResolved: records.filter(r => r.auditDiscrepancyResolved).length,
  };
};

const initialSession: SessionState = {
  schemaVersion: 'v1',
  exportedAt: new Date().toISOString(),
  records: [
    { id: '1', name: 'Morning Star', status: 'ready', fabricCount: 12, patternType: 'star' },
    { id: '2', name: 'Log Cabin', status: 'draft', fabricCount: 4, patternType: 'geometric' },
    { id: '3', name: 'Flying Geese', status: 'changed', fabricCount: 8, patternType: 'triangle' },
    { id: '4', name: 'Nine Patch', status: 'empty', fabricCount: 0, patternType: 'grid' },
  ],
  derived: {
    totalBlocks: 4,
    readyBlocks: 1,
    discrepanciesResolved: 0
  },
  history: ['Initial session created']
};

export const useStore = create<AppState>((set, get) => ({
  session: initialSession,
  selectedBlockId: null,
  historyStack: [],

  addBlock: (block) => {
    set((state) => {
      const newRecord = { ...block, id: generateId() };
      const newRecords = [...state.session.records, newRecord];
      const newSession = {
        ...state.session,
        records: newRecords,
        derived: calculateDerived(newRecords),
        history: [...state.session.history, `Added block ${block.name}`]
      };
      return {
        session: newSession,
        historyStack: [...state.historyStack, state.session]
      };
    });
  },

  updateBlock: (id, updates) => {
    set((state) => {
      const newRecords = state.session.records.map(r => r.id === id ? { ...r, ...updates } : r);
      const newSession = {
        ...state.session,
        records: newRecords,
        derived: calculateDerived(newRecords),
        history: [...state.session.history, `Updated block ${id}`]
      };
      return {
        session: newSession,
        historyStack: [...state.historyStack, state.session]
      };
    });
  },

  archiveBlock: (id) => {
    set((state) => {
      const newRecords = state.session.records.map(r => r.id === id ? { ...r, status: 'archived' as BlockStatus } : r);
      const newSession = {
        ...state.session,
        records: newRecords,
        derived: calculateDerived(newRecords),
        history: [...state.session.history, `Archived block ${id}`]
      };
      return {
        session: newSession,
        historyStack: [...state.historyStack, state.session]
      };
    });
  },

  selectBlock: (id) => {
    set({ selectedBlockId: id });
  },

  attachEvidenceAndResolve: (id, evidence) => {
    const state = get();
    const block = state.session.records.find(r => r.id === id);
    if (!block) return { success: false, error: 'Block not found' };
    if (!evidence.trim()) return { success: false, error: 'Evidence cannot be empty' };

    set((state) => {
      const newRecords = state.session.records.map(r =>
        r.id === id
          ? { ...r, auditEvidence: evidence, auditDiscrepancyResolved: true, status: 'ready' as BlockStatus }
          : r
      );
      const newSession = {
        ...state.session,
        records: newRecords,
        derived: calculateDerived(newRecords),
        history: [...state.session.history, `Attached evidence and resolved discrepancy for block ${id}`]
      };
      return {
        session: newSession,
        historyStack: [...state.historyStack, state.session],
        selectedBlockId: id // Ensure selection is maintained
      };
    });

    return { success: true };
  },

  undo: () => {
    set((state) => {
      if (state.historyStack.length === 0) return state;
      const prevSession = state.historyStack[state.historyStack.length - 1];

      // Attempt to keep selection if the record still exists
      const newSelectionId = prevSession.records.find(r => r.id === state.selectedBlockId)
        ? state.selectedBlockId
        : null;

      return {
        session: prevSession,
        historyStack: state.historyStack.slice(0, -1),
        selectedBlockId: newSelectionId
      };
    });
  },

  importState: (data) => {
    try {
      // Basic validation
      if (!data || data.schemaVersion !== 'v1') throw new Error('Invalid schema version');
      if (!Array.isArray(data.records)) throw new Error('Invalid records array');

      // Ensure unique IDs
      const ids = new Set(data.records.map((r: any) => r.id));
      if (ids.size !== data.records.length) throw new Error('Duplicate IDs found in import');

      // Check explicit enums for status
      const validStatuses = ['empty', 'draft', 'ready', 'changed', 'archived'];
      for (const r of data.records) {
        if (!validStatuses.includes(r.status)) throw new Error(`Invalid status: ${r.status}`);
        if (typeof r.fabricCount !== 'number' || r.fabricCount < 0) throw new Error('Invalid fabric count bounds');
      }

      set((state) => ({
        session: {
          ...data,
          exportedAt: new Date().toISOString(), // Regenerate on import
          derived: calculateDerived(data.records) // Recalculate derived just to be safe
        },
        historyStack: [...state.historyStack, state.session], // Keep old state in history so we can undo import!
        selectedBlockId: null // Clear selection on import
      }));

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Import failed' };
    }
  },

  exportState: () => {
    const state = get();
    return {
      ...state.session,
      exportedAt: new Date().toISOString()
    };
  },

  getSelectedBlock: () => {
    const state = get();
    return state.session.records.find(r => r.id === state.selectedBlockId);
  }
}));
