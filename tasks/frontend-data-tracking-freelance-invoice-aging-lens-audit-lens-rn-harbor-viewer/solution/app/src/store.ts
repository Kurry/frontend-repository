import { create } from 'zustand';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

export const INVOICE_STATUS = ['draft', 'ready', 'changed', 'archived'] as const;
export type InvoiceStatus = typeof INVOICE_STATUS[number];

export const AUDIT_STATUS = ['idle', 'selected', 'changed', 'conflict', 'resolved'] as const;
export type AuditStatus = typeof AUDIT_STATUS[number];

export const InvoiceSchema = z.object({
  id: z.string().uuid(),
  clientName: z.string().min(1, 'Client name is required'),
  amount: z.number().min(0, 'Amount must be non-negative'),
  dueDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid date string' }),
  status: z.enum(INVOICE_STATUS),
  auditLensState: z.enum(AUDIT_STATUS),
  evidence: z.string().optional(),
});

export type Invoice = z.infer<typeof InvoiceSchema>;

export const SessionSchema = z.object({
  schemaVersion: z.literal('v1'),
  exportedAt: z.string(),
  records: z.array(InvoiceSchema),
  derived: z.object({
    summary: z.object({
      totalInvoices: z.number(),
      totalAmount: z.number(),
      resolvedCount: z.number(),
      conflictCount: z.number(),
    })
  }),
  history: z.array(z.object({
    action: z.string(),
    timestamp: z.string(),
    recordId: z.string().optional(),
  }))
});

export type SessionState = z.infer<typeof SessionSchema>;

interface StoreState {
  records: Invoice[];
  history: {
    action: string;
    timestamp: string;
    recordId?: string;
  }[];
  pastStates: Invoice[][]; // For undo
  selectedInvoiceId: string | null;

  // Actions
  addInvoice: (invoice: Omit<Invoice, 'id' | 'status' | 'auditLensState'>) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;

  // Audit Lens specific
  selectInvoice: (id: string | null) => void;
  attachEvidenceAndResolve: (id: string, evidence: string) => void;
  markConflict: (id: string) => void;

  // Global
  undo: () => void;
  importSession: (jsonString: string) => { success: boolean, error?: string };
  exportSession: () => string;
  clearSession: () => void;
}

const getDerivedSummary = (records: Invoice[]) => {
  return {
    totalInvoices: records.length,
    totalAmount: records.reduce((sum, r) => sum + r.amount, 0),
    resolvedCount: records.filter(r => r.auditLensState === 'resolved').length,
    conflictCount: records.filter(r => r.auditLensState === 'conflict').length,
  };
};

export const useStore = create<StoreState>((set, get) => ({
  records: [],
  history: [],
  pastStates: [],
  selectedInvoiceId: null,

  addInvoice: (invoiceData) => set((state) => {
    const newInvoice: Invoice = {
      ...invoiceData,
      id: uuidv4(),
      status: 'draft',
      auditLensState: 'idle',
    };
    const newRecords = [...state.records, newInvoice];
    return {
      records: newRecords,
      pastStates: [...state.pastStates, state.records],
      history: [...state.history, { action: 'create', timestamp: new Date().toISOString(), recordId: newInvoice.id }]
    };
  }),

  updateInvoice: (id, updates) => set((state) => {
    const recordIndex = state.records.findIndex(r => r.id === id);
    if (recordIndex === -1) return state;

    const updatedRecord = { ...state.records[recordIndex], ...updates };

    // Explicitly validate if possible, but for simple partial updates just merge.
    // Ensure bounds are not violated by simple update
    if (updates.amount !== undefined && updates.amount < 0) return state; // invalid
    if (updates.clientName !== undefined && updates.clientName.trim() === '') return state; // invalid

    const newRecords = [...state.records];
    newRecords[recordIndex] = updatedRecord;

    return {
      records: newRecords,
      pastStates: [...state.pastStates, state.records],
      history: [...state.history, { action: 'update', timestamp: new Date().toISOString(), recordId: id }]
    };
  }),

  deleteInvoice: (id) => set((state) => {
    const newRecords = state.records.filter(r => r.id !== id);
    return {
      records: newRecords,
      pastStates: [...state.pastStates, state.records],
      history: [...state.history, { action: 'delete', timestamp: new Date().toISOString(), recordId: id }],
      selectedInvoiceId: state.selectedInvoiceId === id ? null : state.selectedInvoiceId,
    };
  }),

  selectInvoice: (id) => set((state) => {
    if (id === state.selectedInvoiceId) return state;

    let newRecords = state.records;
    if (id) {
        newRecords = state.records.map(r => r.id === id ? { ...r, auditLensState: r.auditLensState === 'idle' ? 'selected' : r.auditLensState } : r);
    }

    return {
        selectedInvoiceId: id,
        records: newRecords,
        pastStates: [...state.pastStates, state.records],
        history: [...state.history, { action: 'select', timestamp: new Date().toISOString(), recordId: id || undefined }]
    };
  }),

  attachEvidenceAndResolve: (id, evidence) => set((state) => {
    const recordIndex = state.records.findIndex(r => r.id === id);
    if (recordIndex === -1) return state;
    if (!evidence.trim()) return state; // Cannot attach empty evidence

    const newRecords = [...state.records];
    newRecords[recordIndex] = {
      ...newRecords[recordIndex],
      evidence,
      auditLensState: 'resolved',
      status: 'ready' // Resolving audit discrepancy transitions status to ready
    };

    return {
      records: newRecords,
      pastStates: [...state.pastStates, state.records],
      history: [...state.history, { action: 'attach_evidence_resolve', timestamp: new Date().toISOString(), recordId: id }]
    };
  }),

  markConflict: (id) => set((state) => {
    const recordIndex = state.records.findIndex(r => r.id === id);
    if (recordIndex === -1) return state;

    const newRecords = [...state.records];
    newRecords[recordIndex] = {
      ...newRecords[recordIndex],
      auditLensState: 'conflict',
    };

    return {
      records: newRecords,
      pastStates: [...state.pastStates, state.records],
      history: [...state.history, { action: 'mark_conflict', timestamp: new Date().toISOString(), recordId: id }]
    };
  }),

  undo: () => set((state) => {
    if (state.pastStates.length === 0) return state;
    const previousRecords = state.pastStates[state.pastStates.length - 1];
    return {
      records: previousRecords,
      pastStates: state.pastStates.slice(0, -1),
      history: [...state.history, { action: 'undo', timestamp: new Date().toISOString() }],
      // If selected invoice is no longer in records, deselect
      selectedInvoiceId: previousRecords.some(r => r.id === state.selectedInvoiceId) ? state.selectedInvoiceId : null,
    };
  }),

  importSession: (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      const result = SessionSchema.safeParse(parsed);

      if (!result.success) {
        return { success: false, error: 'Invalid schema' };
      }

      // Check unique IDs
      const ids = new Set(result.data.records.map(r => r.id));
      if (ids.size !== result.data.records.length) {
         return { success: false, error: 'Duplicate IDs found' };
      }

      set({
        records: result.data.records,
        history: result.data.history,
        pastStates: [],
        selectedInvoiceId: null,
      });

      return { success: true };
    } catch {
      return { success: false, error: 'Failed to parse JSON' };
    }
  },

  exportSession: () => {
    const state = get();
    const sessionData: SessionState = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: {
        summary: getDerivedSummary(state.records)
      },
      history: state.history,
    };
    return JSON.stringify(sessionData, null, 2);
  },

  clearSession: () => set({
    records: [],
    history: [],
    pastStates: [],
    selectedInvoiceId: null,
  })
}));

export { getDerivedSummary };
