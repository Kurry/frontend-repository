import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  FillRecord, IntentRecord, AllocationRecord,
  ExceptionRecord, RuleOverride, LocateInventory, Side
} from '../types';
import { RAW_INTENTS, RAW_FILLS, INITIAL_LOCATES } from '../fixtures/data';
import { checkAllocationRules } from '../utils/rules';

export interface AppState {
  // Import phase
  rawIntents: any[];
  rawFills: any[];
  intents: IntentRecord[];
  fills: FillRecord[];

  // Ledger / State
  allocations: AllocationRecord[];
  exceptions: ExceptionRecord[];
  ruleOverrides: RuleOverride[];
  locates: LocateInventory[];

  // Settings/UI
  currentTime: string | null;

  // Actions
  loadFixtures: () => void;
  repairIntent: (id: string, field: string, value: string) => void;
  repairFill: (id: string, field: string, value: string) => void;
  excludeIntent: (id: string, reason: string) => void;
  excludeFill: (id: string, reason: string) => void;
  commitImports: () => boolean;

  allocate: (fillId: string, intentId: string, quantity: number) => { success: boolean; violations?: string[] };
  splitFill: (fillId: string, ratios: { intentId: string; quantity: number }[]) => void;
  mergeAllocations: (allocationIds: string[]) => void;
  addOverride: (allocationId: string, ruleCode: string, reasonCode: string, note: string) => void;

  scrubToTime: (time: string | null) => void;
  linkCorrection: (correctionId: string, originalFillId: string) => void;

  addException: (rowId: string, rowType: 'fill'|'intent', reason: string) => void;
  bulkClearAllocations: (ids: string[]) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  rawIntents: [],
  rawFills: [],
  intents: [],
  fills: [],
  allocations: [],
  exceptions: [],
  ruleOverrides: [],
  locates: INITIAL_LOCATES,
  currentTime: null,

  loadFixtures: () => {
    set({ rawIntents: [...RAW_INTENTS], rawFills: [...RAW_FILLS] });
  },

  repairIntent: (id, field, value) => {
    set(state => ({
      rawIntents: state.rawIntents.map(i => i.id === id ? { ...i, [field]: value } : i)
    }));
  },

  repairFill: (id, field, value) => {
    set(state => ({
      rawFills: state.rawFills.map(f => f.id === id ? { ...f, [field]: value } : f)
    }));
  },

  excludeIntent: (id, reason) => {
    get().addException(id, 'intent', reason);
    set(state => ({
      rawIntents: state.rawIntents.filter(i => i.id !== id)
    }));
  },

  excludeFill: (id, reason) => {
    get().addException(id, 'fill', reason);
    set(state => ({
      rawFills: state.rawFills.filter(f => f.id !== id)
    }));
  },

  commitImports: () => {
    const state = get();
    // Validate intents
    const intents: IntentRecord[] = [];
    for (const raw of state.rawIntents) {
      const qty = parseInt(raw.quantity, 10);
      if (isNaN(qty)) return false; // Block commit
      intents.push({
        id: raw.id,
        accountId: raw.accountId,
        symbol: raw.symbol,
        side: raw.side as Side,
        quantity: qty
      });
    }

    // Validate fills
    const fills: FillRecord[] = [];
    const seenIds = new Set();
    for (const raw of state.rawFills) {
      if (seenIds.has(raw.id)) return false; // Duplicate
      seenIds.add(raw.id);

      const qty = parseInt(raw.qty, 10);
      const px = parseFloat(raw.px);
      if (isNaN(qty) || isNaN(px)) return false;
      fills.push({
        id: raw.id,
        symbol: raw.sym_alias, // assume mapped
        side: raw.side as Side,
        quantity: qty,
        price: px,
        occurredAt: raw.time
      });
    }

    set({ intents, fills, rawIntents: [], rawFills: [] });
    return true;
  },

  allocate: (fillId, intentId, quantity) => {
    const { fills, intents, allocations, locates } = get();
    const fill = fills.find(f => f.id === fillId);
    const intent = intents.find(i => i.id === intentId);
    if (!fill || !intent) return { success: false };

    const allocatedForAccount = allocations
      .filter(a => a.accountId === intent.accountId)
      .reduce((s, a) => s + a.quantity, 0);

    const check = checkAllocationRules(intent, fill, quantity, allocatedForAccount, locates);
    if (!check.valid) {
      return { success: false, violations: check.violations };
    }

    const newAllocation: AllocationRecord = {
      id: uuidv4(),
      fillId,
      intentId,
      accountId: intent.accountId,
      symbol: fill.symbol,
      side: fill.side,
      quantity,
      price: fill.price,
      occurredAt: fill.occurredAt
    };

    set(state => ({
      allocations: [...state.allocations, newAllocation],
      locates: fill.side === 'SELL' ? state.locates.map(l =>
        (l.accountId === intent.accountId && l.symbol === fill.symbol)
          ? { ...l, availableQuantity: l.availableQuantity - quantity }
          : l
      ) : state.locates
    }));

    return { success: true };
  },

  splitFill: (fillId, ratios) => {
    const { fills } = get();
    const fill = fills.find(f => f.id === fillId);
    if (!fill) return;

    ratios.forEach(r => {
      get().allocate(fillId, r.intentId, r.quantity);
    });
  },

  mergeAllocations: (allocationIds) => {
    // simplified merge
    const { allocations } = get();
    const toMerge = allocations.filter(a => allocationIds.includes(a.id));
    if (toMerge.length < 2) return;

    const first = toMerge[0];
    const canMerge = toMerge.every(a =>
      a.fillId === first.fillId &&
      a.accountId === first.accountId &&
      a.side === first.side &&
      a.symbol === first.symbol
    );
    if (!canMerge) return;

    const totalQty = toMerge.reduce((s, a) => s + a.quantity, 0);
    const newAllocation: AllocationRecord = {
      ...first,
      id: uuidv4(),
      quantity: totalQty
    };

    set(state => ({
      allocations: [...state.allocations.filter(a => !allocationIds.includes(a.id)), newAllocation]
    }));
  },

  addOverride: (allocationId, ruleCode, reasonCode, note) => {
    set(state => ({
      ruleOverrides: [...state.ruleOverrides, { id: uuidv4(), allocationId, ruleCode, reasonCode, approverNote: note }]
    }));
  },

  scrubToTime: (time) => {
    set({ currentTime: time });
  },

  linkCorrection: (correctionId, originalFillId) => {
    // simplified linking
  },

  addException: (rowId, rowType, reason) => {
    set(state => ({
      exceptions: [...state.exceptions, { id: uuidv4(), rowId, rowType, reason }]
    }));
  },

  bulkClearAllocations: (ids) => {
    set(state => {
      const removed = state.allocations.filter(a => ids.includes(a.id));
      let updatedLocates = [...state.locates];
      removed.forEach(r => {
        if (r.side === 'SELL') {
           updatedLocates = updatedLocates.map(l =>
             (l.accountId === r.accountId && l.symbol === r.symbol)
               ? { ...l, availableQuantity: l.availableQuantity + r.quantity }
               : l
           );
        }
      });
      return {
        allocations: state.allocations.filter(a => !ids.includes(a.id)),
        locates: updatedLocates
      };
    });
  }
}));
