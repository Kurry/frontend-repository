import { create } from 'zustand';

export type DomainStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

export interface RecipeIngredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  substitute?: string;
  substituteAmount?: number;
  substituteUnit?: string;
  status: DomainStatus;
  projectedCostChange?: number;
  projectedFlavorImpact?: string;
}

export interface DerivedState {
  totalOriginalIngredients: number;
  totalSubstitutions: number;
  estimatedCostChange: number;
}

export interface AppState {
  records: RecipeIngredient[];
  history: { records: RecipeIngredient[]; selectedId: string | null }[];
  selectedId: string | null;
  exportedAt?: string;

  // Actions
  addRecord: (record: RecipeIngredient) => void;
  updateRecord: (id: string, updates: Partial<RecipeIngredient>) => void;
  deleteRecord: (id: string) => void;
  selectRecord: (id: string | null) => void;
  undo: () => void;
  importSession: (session: any) => void;
  exportSession: () => void;

  // Ribbon
  mutateSelectedOnRibbon: (updates: Partial<RecipeIngredient>) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const seedRecords: RecipeIngredient[] = Array.from({ length: 110 }).map((_, i) => ({
  id: `ingredient-${i}`,
  name: `Ingredient ${i}`,
  amount: (i % 5) + 1,
  unit: ['cup', 'tbsp', 'tsp', 'g', 'oz'][i % 5],
  status: i % 10 === 0 ? 'empty' : (i % 7 === 0 ? 'archived' : 'ready'),
  ...(i % 3 === 0 && i % 10 !== 0 ? {
    substitute: `Substitute ${i}`,
    substituteAmount: (i % 5) + 2,
    substituteUnit: ['cup', 'tbsp', 'tsp', 'g', 'oz'][i % 5],
    status: 'changed'
  } : {})
}));

export const useStore = create<AppState>((set) => ({
  records: seedRecords,
  history: [],
  selectedId: null,

  addRecord: (record) => set((state) => ({
    history: [...state.history, { records: state.records, selectedId: state.selectedId }],
    records: [...state.records, { ...record, id: generateId() }]
  })),

  updateRecord: (id, updates) => set((state) => ({
    history: [...state.history, { records: state.records, selectedId: state.selectedId }],
    records: state.records.map(r => r.id === id ? { ...r, ...updates } : r)
  })),

  deleteRecord: (id) => set((state) => ({
    history: [...state.history, { records: state.records, selectedId: state.selectedId }],
    records: state.records.filter(r => r.id !== id),
    selectedId: state.selectedId === id ? null : state.selectedId
  })),

  selectRecord: (id) => set({ selectedId: id }),

  undo: () => set((state) => {
    if (state.history.length === 0) return state;
    const lastState = state.history[state.history.length - 1];
    return {
      records: lastState.records,
      selectedId: lastState.selectedId,
      history: state.history.slice(0, -1)
    };
  }),

  mutateSelectedOnRibbon: (updates) => set((state) => {
    if (!state.selectedId) return state;
    const selected = state.records.find(r => r.id === state.selectedId);
    if (!selected) return state;

    // Ribbon mutation
    const updated = { ...selected, ...updates };

    // Auto-calculate some projected outcomes for the ribbon simulation
    if (updated.substitute) {
      updated.status = 'changed';
      updated.projectedCostChange = (Math.random() * 10 - 5); // Mock derived impact
      updated.projectedFlavorImpact = updated.projectedCostChange > 0 ? 'Richer' : 'Lighter';
    } else {
      updated.projectedCostChange = 0;
      updated.projectedFlavorImpact = 'Neutral';
    }

    return {
      history: [...state.history, { records: state.records, selectedId: state.selectedId }],
      records: state.records.map(r => r.id === state.selectedId ? updated : r)
    };
  }),

  importSession: (session) => {
    if (!session || session.schemaVersion !== 'v1' || !Array.isArray(session.records)) return;
    // Simple validation
    const validRecords = session.records.filter((r: any) => r.id && r.name && r.status);
    if (validRecords.length === 0 && session.records.length > 0) return; // Invalid payload

    set({
      records: validRecords,
      history: [],
      selectedId: null,
      exportedAt: new Date().toISOString()
    });
  },

  exportSession: () => {
    set({ exportedAt: new Date().toISOString() });
  }
}));

export const getDerivedState = (records: RecipeIngredient[]): DerivedState => {
  return {
    totalOriginalIngredients: records.filter(r => r.status !== 'empty' && r.status !== 'archived').length,
    totalSubstitutions: records.filter(r => r.substitute && r.status === 'changed').length,
    estimatedCostChange: records.reduce((acc, r) => acc + (r.projectedCostChange || 0), 0)
  };
};
