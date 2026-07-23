import { create } from 'zustand';

export type Event = { id: string; actor: string; timestamp: string; operation: string; payload: any; branch: string; isInverse: boolean; };
export type AppState = {
  slot4Source: 'TAKE-A' | 'TAKE-B';
  repaired: boolean;
  selectedTake: string | null;
  selectedWordSpan: string[];
  history: Event[];
  reviewerNote: string | null;
  approvalStatus: boolean;
  previewState: 'none' | 'confirm_repair';
  repairEnum: 'reject' | 'pad-start' | 'pad-end' | 'pad-symmetric';
  selectWordSpan: (takeId: string, wordIds: string[]) => void;
  dropPhrase: () => void;
  setRepairEnum: (mode: 'reject' | 'pad-start' | 'pad-end' | 'pad-symmetric') => void;
  confirmRepair: () => void;
  cancelRepair: () => void;
  addReviewerNote: (note: string) => void;
  undoReplacement: () => void;
  replayReplacement: () => void;
  approve: () => void;
};

export const useStore = create<AppState>((set) => ({
  slot4Source: 'TAKE-A', repaired: false, selectedTake: null, selectedWordSpan: [], history: [], reviewerNote: null, approvalStatus: false, previewState: 'none', repairEnum: 'reject',
  selectWordSpan: (takeId, wordIds) => set({ selectedTake: takeId, selectedWordSpan: wordIds }),
  dropPhrase: () => set({ previewState: 'confirm_repair', repairEnum: 'reject' }),
  setRepairEnum: (mode) => set({ repairEnum: mode }),
  confirmRepair: () => set((state) => {
    if (state.repairEnum === 'pad-symmetric') {
      const ev: Event = { id: '1', actor: 'user', timestamp: new Date().toISOString(), operation: 'commit', payload: {}, branch: 'main', isInverse: false };
      return { slot4Source: 'TAKE-B', repaired: true, previewState: 'none', history: [...state.history, ev] };
    }
    return state;
  }),
  cancelRepair: () => set({ previewState: 'none' }),
  addReviewerNote: (note) => set({ reviewerNote: note }),
  undoReplacement: () => set(() => ({ slot4Source: 'TAKE-A', repaired: false })),
  replayReplacement: () => set(() => ({ slot4Source: 'TAKE-B', repaired: true })),
  approve: () => set({ approvalStatus: true })
}));
