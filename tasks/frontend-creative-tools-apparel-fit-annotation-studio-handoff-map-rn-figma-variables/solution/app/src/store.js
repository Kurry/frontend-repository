import { create } from 'zustand'

export const useStore = create((set) => ({
  records: [],
  derived: { summary: "idle" },
  history: [],
  handoffOwner: null,
  addRecord: (record) => set((state) => ({ records: [...state.records, record] })),
  deleteRecord: (id) => set((state) => ({ records: state.records.filter(r => r.id !== id) })),
  connectRecord: (id, owner) => set((state) => {
    const updated = state.records.map(r => r.id === id ? { ...r, owner, status: 'ready' } : r);
    return { records: updated, history: [...state.history, { action: 'connect', id, owner }], derived: { summary: 'changed' } };
  }),
  undo: () => set((state) => {
    const last = state.history[state.history.length - 1];
    if (!last) return state;
    if (last.action === 'connect') {
      const reverted = state.records.map(r => r.id === last.id ? { ...r, owner: null, status: 'draft' } : r);
      return { records: reverted, history: state.history.slice(0, -1), derived: { summary: 'idle' } };
    }
    return state;
  }),
  exportSession: () => {
    let state;
    set(s => { state = s; return s; });
    const data = {
      schemaVersion: 'fit-annotations-v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: state.derived,
      history: state.history,
    };
    return JSON.stringify(data, null, 2);
  },
  importSession: (data) => set(() => {
    return {
      records: data.records || [],
      derived: data.derived || { summary: 'idle' },
      history: data.history || []
    }
  }),
  clear: () => set({ records: [], derived: { summary: 'idle' }, history: [] })
}));
