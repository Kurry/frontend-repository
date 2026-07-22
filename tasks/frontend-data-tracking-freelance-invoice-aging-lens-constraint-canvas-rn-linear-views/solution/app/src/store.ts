import { create } from 'zustand';
import type { Invoice, InvoiceStatus } from './types';
import { ArtifactSchema } from './types';
import { generateId } from './utils';

// Pre-seeded records for testing large collection and conflicts
export const seedInvoices: Invoice[] = [
  { id: "inv-1", clientName: "Acme Corp", amount: 1500, status: "draft", dueDate: "2024-08-15" },
  { id: "inv-2", clientName: "Globex Inc", amount: 3200, status: "ready", dueDate: "2024-08-20" },
  { id: "inv-3", clientName: "Soylent Corp", amount: 800, status: "sent", dueDate: "2024-08-10" },
  { id: "inv-4", clientName: "Initech", amount: 4500, status: "paid", dueDate: "2024-07-25" },
  { id: "inv-5", clientName: "Umbrella Corp", amount: 12000, status: "conflict", dueDate: "2024-08-01" },
  ...Array.from({ length: 95 }).map((_, i) => ({
    id: `inv-${i + 6}`,
    clientName: `Test Client ${i + 6}`,
    amount: 100 + (i * 10),
    status: ["draft", "ready", "sent", "paid", "archived"][i % 5] as InvoiceStatus,
    dueDate: "2024-09-01"
  }))
];

interface AppState {
  invoices: Invoice[];
  history: Invoice[][]; // For Undo
  selectedInvoiceId: string | null;
  filterStatus: InvoiceStatus | "all";

  // Actions
  createInvoice: (data: Omit<Invoice, "id">) => void;
  updateInvoice: (id: string, updates: Partial<Omit<Invoice, "id">>) => void;
  deleteInvoice: (id: string) => void;
  setFilterStatus: (status: InvoiceStatus | "all") => void;
  selectInvoice: (id: string | null) => void;
  moveInvoice: (id: string, newStatus: InvoiceStatus) => void;
  undo: () => void;
  exportArtifact: () => string;
  importArtifact: (artifact: any) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  invoices: seedInvoices,
  history: [],
  selectedInvoiceId: null,
  filterStatus: "all",

  createInvoice: (data) => set((state) => {
    const newInvoice = { ...data, id: generateId() };
    return {
      invoices: [...state.invoices, newInvoice],
      history: [...state.history, state.invoices],
    };
  }),

  updateInvoice: (id, updates) => set((state) => {
    const newInvoices = state.invoices.map(inv =>
      inv.id === id ? { ...inv, ...updates } : inv
    );
    return {
      invoices: newInvoices,
      history: [...state.history, state.invoices],
    };
  }),

  deleteInvoice: (id) => set((state) => ({
    invoices: state.invoices.filter(inv => inv.id !== id),
    history: [...state.history, state.invoices],
    selectedInvoiceId: state.selectedInvoiceId === id ? null : state.selectedInvoiceId
  })),

  setFilterStatus: (status) => set({ filterStatus: status }),

  selectInvoice: (id) => set({ selectedInvoiceId: id }),

  moveInvoice: (id, newStatus) => set((state) => {
    const newInvoices = state.invoices.map(inv =>
      inv.id === id ? { ...inv, status: newStatus } : inv
    );
    return {
      invoices: newInvoices,
      history: [...state.history, state.invoices],
    };
  }),

  undo: () => set((state) => {
    if (state.history.length === 0) return state;
    const previousInvoices = state.history[state.history.length - 1];
    return {
      invoices: previousInvoices,
      history: state.history.slice(0, -1),
    };
  }),

  exportArtifact: () => {
    const state = get();
    const artifact = {
      schemaVersion: "v1",
      exportedAt: new Date().toISOString(),
      records: state.invoices
    };
    return JSON.stringify(artifact, null, 2);
  },

  importArtifact: (artifactRaw) => set((state) => {
    try {
      const parsed = ArtifactSchema.parse(artifactRaw);
      return {
        invoices: parsed.records,
        history: [...state.history, state.invoices],
        selectedInvoiceId: null,
      };
    } catch (e) {
      console.error("Invalid artifact", e);
      return state; // No state change on invalid import
    }
  }),
}));
