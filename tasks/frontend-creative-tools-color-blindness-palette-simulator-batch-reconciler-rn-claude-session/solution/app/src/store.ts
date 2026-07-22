import { create } from 'zustand';
import { z } from 'zod';

export type SwatchStatus = 'draft' | 'ready' | 'changed' | 'archived';

export interface Swatch {
  id: string;
  name: string;
  hex: string;
  status: SwatchStatus;
}

export interface Derived {
  totalCount: number;
  averageLuminance: number;
  passesWcagAgainstWhite: number;
}

export interface HistoryEntry {
  action: string;
  previousRecords: Swatch[];
  previousDerived: Derived;
}

export interface Artifact {
  schemaVersion: 'palette-simulation-v1';
  exportedAt: string;
  records: Swatch[];
  derived: Derived;
  history: HistoryEntry[];
}

export interface State extends Artifact {
  selectedIds: string[];
  filterStatus: SwatchStatus | 'all';
  saveHealth: 'saved' | 'unsaved' | 'error';
  recoveryMessage: string | null;

  setFilterStatus: (status: SwatchStatus | 'all') => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;

  createRecord: (record: Swatch) => void;
  updateRecord: (id: string, record: Partial<Swatch>) => void;
  deleteRecord: (id: string) => void;

  batchReconcile: () => void;
  undo: () => void;

  importArtifact: (artifact: Artifact) => void;
  clearRecoveryMessage: () => void;
  setRecoveryMessage: (msg: string) => void;
}

function getLuminance(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b);
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function passesWcag(hex: string) {
  const lum = getLuminance(hex);
  const l1 = 255 / 255;
  const l2 = lum / 255;
  const ratio = (l1 + 0.05) / (l2 + 0.05);
  return ratio >= 4.5;
}

function calculateDerived(records: Swatch[]): Derived {
  let totalLuminance = 0;
  let passesCount = 0;
  for (const r of records) {
    totalLuminance += getLuminance(r.hex);
    if (passesWcag(r.hex)) passesCount++;
  }
  return {
    totalCount: records.length,
    averageLuminance: records.length > 0 ? totalLuminance / records.length : 0,
    passesWcagAgainstWhite: passesCount,
  };
}

const seedRecords: Swatch[] = [
  { id: '1', name: 'Brand Primary', hex: '#0055ff', status: 'ready' },
  { id: '2', name: 'Brand Secondary', hex: '#ff5500', status: 'ready' },
  { id: '3', name: 'Neutral Dark', hex: '#333333', status: 'ready' },
  { id: '4', name: 'Warning Draft (Invalid)', hex: '#xxxxxx', status: 'draft' },
];

const initialDerived = calculateDerived(seedRecords);

export const useStore = create<State>((set) => ({
  schemaVersion: 'palette-simulation-v1',
  exportedAt: new Date().toISOString(),
  records: seedRecords,
  derived: initialDerived,
  history: [],
  selectedIds: [],
  filterStatus: 'all',
  saveHealth: 'saved',
  recoveryMessage: null,

  setFilterStatus: (status) => set({ filterStatus: status }),

  toggleSelection: (id) => set((state) => ({
    selectedIds: state.selectedIds.includes(id)
      ? state.selectedIds.filter(x => x !== id)
      : [...state.selectedIds, id]
  })),

  clearSelection: () => set({ selectedIds: [] }),

  createRecord: (record) => set((state) => {
    const newRecords = [...state.records, record];
    return {
      records: newRecords,
      derived: calculateDerived(newRecords),
      saveHealth: 'unsaved',
      recoveryMessage: null,
    };
  }),

  updateRecord: (id, updates) => set((state) => {
    const newRecords = state.records.map(r => r.id === id ? { ...r, ...updates } : r);
    return {
      records: newRecords,
      derived: calculateDerived(newRecords),
      saveHealth: 'unsaved',
      recoveryMessage: null,
    };
  }),

  deleteRecord: (id) => set((state) => {
    const newRecords = state.records.filter(r => r.id !== id);
    return {
      records: newRecords,
      derived: calculateDerived(newRecords),
      selectedIds: state.selectedIds.filter(x => x !== id),
      saveHealth: 'unsaved',
      recoveryMessage: null,
    };
  }),

  batchReconcile: () => set((state) => {
    if (state.selectedIds.length === 0) {
      return { recoveryMessage: 'No records selected to reconcile.', saveHealth: 'error' };
    }

    const historyEntry: HistoryEntry = {
      action: 'batchReconcile',
      previousRecords: state.records,
      previousDerived: state.derived,
    };

    const newRecords = state.records.map(r => {
      if (state.selectedIds.includes(r.id)) {
        return { ...r, status: 'changed' as SwatchStatus };
      }
      return r;
    });

    return {
      records: newRecords,
      derived: calculateDerived(newRecords),
      history: [...state.history, historyEntry],
      saveHealth: 'unsaved',
      recoveryMessage: 'Batch reconciliation complete.',
      selectedIds: [],
    };
  }),

  undo: () => set((state) => {
    if (state.history.length === 0) return { recoveryMessage: 'Nothing to undo.' };

    const lastHistory = state.history[state.history.length - 1];
    const newHistory = state.history.slice(0, -1);

    return {
      records: lastHistory.previousRecords,
      derived: lastHistory.previousDerived,
      history: newHistory,
      saveHealth: 'unsaved',
      recoveryMessage: 'Undid last mutation.',
    };
  }),

  importArtifact: (artifact) => set({
    schemaVersion: artifact.schemaVersion,
    records: artifact.records,
    derived: artifact.derived,
    history: artifact.history,
    exportedAt: new Date().toISOString(),
    saveHealth: 'saved',
    selectedIds: [],
    recoveryMessage: 'Import successful.',
  }),

  clearRecoveryMessage: () => set({ recoveryMessage: null }),
  setRecoveryMessage: (msg) => set({ recoveryMessage: msg, saveHealth: 'error' }),
}));

export const artifactSchema = z.object({
  schemaVersion: z.literal('palette-simulation-v1'),
  exportedAt: z.string(),
  records: z.array(z.object({
    id: z.string(),
    name: z.string(),
    hex: z.string(),
    status: z.enum(['draft', 'ready', 'changed', 'archived'])
  })),
  derived: z.object({
    totalCount: z.number(),
    averageLuminance: z.number(),
    passesWcagAgainstWhite: z.number()
  }),
  history: z.array(z.object({
    action: z.string(),
    previousRecords: z.any(),
    previousDerived: z.any()
  }))
});
