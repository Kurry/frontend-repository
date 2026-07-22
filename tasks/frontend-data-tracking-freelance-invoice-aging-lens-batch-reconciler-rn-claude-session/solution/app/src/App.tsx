import { useState, useEffect } from 'react';
import { create } from 'zustand';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Download, Upload, Trash2, Edit2, RotateCcw, Check, Archive, RefreshCw, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// -----------------------------------------------------------------------------
// Domain Models
// -----------------------------------------------------------------------------

export type InvoiceStatus = 'draft' | 'ready' | 'changed' | 'archived';

export interface Invoice {
  id: string;
  client: string;
  amount: number;
  dueDate: string;
  status: InvoiceStatus;
}

export interface ReconcileResult {
  batchId: string;
  invoiceIds: string[];
  totalAmount: number;
  notes: string;
  timestamp: string;
}

export interface ArtifactData {
  schemaVersion: 'v1';
  exportedAt: string;
  records: Invoice[];
  derived: {
    summary: {
      totalDraft: number;
      totalReady: number;
      totalChanged: number;
      totalArchived: number;
      grandTotal: number;
    };
    lastReconciliation: ReconcileResult | null;
  };
  history: Array<{ type: string; timestamp: string }>;
}

// -----------------------------------------------------------------------------
// State Store
// -----------------------------------------------------------------------------

interface AppState {
  invoices: Invoice[];
  historyStack: AppStateSnapshot[];
  lastReconciliation: ReconcileResult | null;
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  reconcileBatch: (invoiceIds: string[], notes: string) => void;
  undo: () => void;
  loadFromArtifact: (data: ArtifactData) => void;
  pushHistory: () => void;
  _historyLog: Array<{ type: string; timestamp: string }>;
}

interface AppStateSnapshot {
  invoices: Invoice[];
  lastReconciliation: ReconcileResult | null;
  _historyLog: Array<{ type: string; timestamp: string }>;
}

const initialInvoices: Invoice[] = [
  { id: 'INV-001', client: 'Acme Corp', amount: 1500, dueDate: '2023-11-01', status: 'ready' },
  { id: 'INV-002', client: 'Globex', amount: 250, dueDate: '2023-11-15', status: 'draft' },
  { id: 'INV-003', client: 'Initech', amount: 3000, dueDate: '2023-10-31', status: 'changed' },
];

export const useStore = create<AppState>((set, get) => ({
  invoices: initialInvoices,
  historyStack: [],
  lastReconciliation: null,
  _historyLog: [{ type: 'INIT', timestamp: new Date().toISOString() }],

  pushHistory: () => {
    const { invoices, lastReconciliation, _historyLog, historyStack } = get();
    set({
      historyStack: [...historyStack, { invoices, lastReconciliation, _historyLog }],
    });
  },

  addInvoice: (invoice) => {
    get().pushHistory();
    set((state) => ({
      invoices: [...state.invoices, invoice],
      _historyLog: [...state._historyLog, { type: 'ADD_INVOICE', timestamp: new Date().toISOString() }]
    }));
  },

  updateInvoice: (id, updates) => {
    get().pushHistory();
    set((state) => ({
      invoices: state.invoices.map((inv) => (inv.id === id ? { ...inv, ...updates } : inv)),
      _historyLog: [...state._historyLog, { type: 'UPDATE_INVOICE', timestamp: new Date().toISOString() }]
    }));
  },

  deleteInvoice: (id) => {
    get().pushHistory();
    set((state) => ({
      invoices: state.invoices.filter((inv) => inv.id !== id),
      _historyLog: [...state._historyLog, { type: 'DELETE_INVOICE', timestamp: new Date().toISOString() }]
    }));
  },

  reconcileBatch: (invoiceIds, notes) => {
    if (invoiceIds.length === 0) return;

    get().pushHistory();
    set((state) => {
      const selectedInvoices = state.invoices.filter((inv) => invoiceIds.includes(inv.id));
      const totalAmount = selectedInvoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);

      const newReconciliation: ReconcileResult = {
        batchId: `BATCH-${Date.now()}`,
        invoiceIds,
        totalAmount,
        notes,
        timestamp: new Date().toISOString(),
      };

      // The canonical mutation: update statuses of reconciled items
      const updatedInvoices = state.invoices.map(inv => {
        if (invoiceIds.includes(inv.id)) {
           // Move valid non-archived items to 'changed' to indicate they were processed
           return { ...inv, status: 'changed' as InvoiceStatus };
        }
        return inv;
      });

      return {
        invoices: updatedInvoices,
        lastReconciliation: newReconciliation,
        _historyLog: [...state._historyLog, { type: 'RECONCILE_BATCH', timestamp: new Date().toISOString() }]
      };
    });
  },

  undo: () => {
    set((state) => {
      if (state.historyStack.length === 0) return state;
      const previousState = state.historyStack[state.historyStack.length - 1];
      return {
        ...previousState,
        historyStack: state.historyStack.slice(0, -1),
        _historyLog: [...previousState._historyLog, { type: 'UNDO', timestamp: new Date().toISOString() }]
      };
    });
  },

  loadFromArtifact: (data) => {
    set({
      invoices: data.records,
      lastReconciliation: data.derived.lastReconciliation,
      _historyLog: data.history,
      historyStack: [] // Clear history on load
    });
  }
}));

// -----------------------------------------------------------------------------
// WebMCP Binding
// -----------------------------------------------------------------------------

function setupWebMCP() {
  if (typeof window === 'undefined') return;

  (window as any).webmcp_session_info = () => ({
    status: "active",
    workspace_isolated: true
  });

  (window as any).webmcp_list_tools = () => [
    {
      name: "create_invoice",
      description: "Create a new invoice.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          client: { type: "string" },
          amount: { type: "number" },
          dueDate: { type: "string" },
          status: { type: "string", enum: ["draft", "ready", "changed", "archived"] }
        },
        required: ["id", "client", "amount", "dueDate", "status"]
      }
    },
    {
      name: "update_invoice",
      description: "Update an existing invoice.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          updates: { type: "object" }
        },
        required: ["id", "updates"]
      }
    },
    {
      name: "delete_invoice",
      description: "Delete an invoice.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" }
        },
        required: ["id"]
      }
    },
    {
      name: "reconcile_batch",
      description: "Group selected records into a batch and reconcile aggregate totals.",
      inputSchema: {
        type: "object",
        properties: {
          invoiceIds: { type: "array", items: { type: "string" } },
          reconcileNotes: { type: "string" }
        },
        required: ["invoiceIds"]
      }
    },
    {
      name: "undo_last_mutation",
      description: "Undo the last reconciliation or mutation.",
      inputSchema: {
        type: "object",
        properties: {},
        required: []
      }
    },
    {
      name: "get_state",
      description: "Query current state.",
      inputSchema: {
        type: "object",
        properties: {},
        required: []
      }
    }
  ];

  (window as any).webmcp_invoke_tool = async (name: string, args: any) => {
    const store = useStore.getState();

    switch (name) {
      case 'create_invoice':
        store.addInvoice(args as Invoice);
        return { success: true };
      case 'update_invoice':
        store.updateInvoice(args.id, args.updates);
        return { success: true };
      case 'delete_invoice':
        store.deleteInvoice(args.id);
        return { success: true };
      case 'reconcile_batch':
        store.reconcileBatch(args.invoiceIds, args.reconcileNotes || 'API Reconciliation');
        return { success: true };
      case 'undo_last_mutation':
        store.undo();
        return { success: true };
      case 'get_state':
        return getArtifactData(store);
      default:
        throw new Error(`Tool ${name} not found`);
    }
  };
}

function getArtifactData(state: AppState): ArtifactData {
  const summary = {
    totalDraft: 0,
    totalReady: 0,
    totalChanged: 0,
    totalArchived: 0,
    grandTotal: 0
  };

  state.invoices.forEach(inv => {
    summary.grandTotal += inv.amount;
    if (inv.status === 'draft') summary.totalDraft += inv.amount;
    if (inv.status === 'ready') summary.totalReady += inv.amount;
    if (inv.status === 'changed') summary.totalChanged += inv.amount;
    if (inv.status === 'archived') summary.totalArchived += inv.amount;
  });

  return {
    schemaVersion: 'v1',
    exportedAt: new Date().toISOString(),
    records: state.invoices,
    derived: {
      summary,
      lastReconciliation: state.lastReconciliation
    },
    history: state._historyLog
  };
}

// -----------------------------------------------------------------------------
// UI Components
// -----------------------------------------------------------------------------

function InvoiceForm({ onSubmit, initialData, onCancel }: {
  onSubmit: (data: Omit<Invoice, 'id'> | Invoice) => void;
  initialData?: Invoice;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Partial<Invoice>>(initialData || {
    client: '',
    amount: 0,
    dueDate: '',
    status: 'draft'
  });
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client || !formData.amount || !formData.dueDate || !formData.status) {
      setError('All fields are required');
      return;
    }
    if (formData.amount <= 0) {
      setError('Amount must be positive');
      return;
    }

    // Bounds check
    if (formData.amount > 1000000) {
      setError('Amount exceeds maximum allowed limit (1,000,000)');
      return;
    }

    onSubmit(formData as Invoice);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4">
      <div className="flex justify-between items-center mb-2">
         <h3 className="text-lg font-medium">{initialData ? 'Edit Invoice' : 'New Invoice'}</h3>
         <button type="button" onClick={onCancel} className="p-1 hover:bg-gray-100 rounded-full" aria-label="Cancel edit">
            <X size={18} />
         </button>
      </div>

      {error && <div className="text-red-500 text-sm mb-2" role="alert">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Client</label>
          <input
            type="text"
            value={formData.client}
            onChange={e => setFormData({...formData, client: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            required
            aria-label="Client name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Amount</label>
          <input
            type="number"
            value={formData.amount}
            onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            required
            aria-label="Invoice amount"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Due Date</label>
          <input
            type="date"
            value={formData.dueDate}
            onChange={e => setFormData({...formData, dueDate: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            required
            aria-label="Due date"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            value={formData.status}
            onChange={e => setFormData({...formData, status: e.target.value as InvoiceStatus})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            aria-label="Invoice status"
          >
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          {initialData ? 'Save Changes' : 'Create'}
        </button>
      </div>
    </form>
  );
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const styles = {
    draft: 'bg-gray-100 text-gray-800 border-gray-200',
    ready: 'bg-green-100 text-green-800 border-green-200',
    changed: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    archived: 'bg-purple-100 text-purple-800 border-purple-200'
  };

  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize', styles[status])}>
      {status}
    </span>
  );
}

export default function App() {
  const { invoices, addInvoice, updateInvoice, deleteInvoice, reconcileBatch, undo, loadFromArtifact, lastReconciliation } = useStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<InvoiceStatus | 'all'>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reconcileNote, setReconcileNote] = useState('');

  useEffect(() => {
    setupWebMCP();

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleReconcile = () => {
    if (selectedIds.size === 0) return;
    reconcileBatch(Array.from(selectedIds), reconcileNote || 'Manual UI Reconciliation');
    setSelectedIds(new Set());
    setReconcileNote('');
  };

  const exportArtifact = () => {
    const state = useStore.getState();
    const data = getArtifactData(state);

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoice-aging-v1-batch-reconciler.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content) as ArtifactData;

        // Validation
        if (data.schemaVersion !== 'v1' || !Array.isArray(data.records)) {
          alert('Invalid artifact schema');
          return;
        }

        // Check for duplicate IDs in import
        const ids = new Set();
        for (const record of data.records) {
          if (ids.has(record.id)) {
            alert(`Invalid artifact: Duplicate ID found (${record.id})`);
            return;
          }
          ids.add(record.id);
        }

        // Basic bounds/enum checks
        for (const record of data.records) {
             if (record.amount < 0 || record.amount > 1000000) {
                 alert(`Invalid artifact: Amount out of bounds for ${record.id}`);
                 return;
             }
             if (!['draft', 'ready', 'changed', 'archived'].includes(record.status)) {
                 alert(`Invalid artifact: Unknown status '${record.status}' for ${record.id}`);
                 return;
             }
        }

        loadFromArtifact(data);
      } catch (err) {
        alert('Failed to parse artifact');
      }
    };
    reader.readAsText(file);

    // Reset file input
    if (e.target) e.target.value = '';
  };

  const filteredInvoices = invoices.filter(inv => filter === 'all' || inv.status === filter);

  const artifactData = getArtifactData(useStore.getState());
  const selectedTotal = Array.from(selectedIds).reduce((sum, id) => {
    const inv = invoices.find(i => i.id === id);
    return sum + (inv ? inv.amount : 0);
  }, 0);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 text-gray-900 font-sans">

      {/* Primary Work Surface */}
      <main className="flex-1 p-4 md:p-8 flex flex-col min-w-0">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Invoices</h1>
            <p className="text-sm text-gray-500">Manage and reconcile billing records.</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={undo}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
              aria-label="Undo last action"
              title="Undo (Cmd/Ctrl+Z)"
            >
              <RotateCcw size={20} />
            </button>
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
              aria-label="Create new invoice"
            >
              <Plus size={16} /> New Invoice
            </button>
          </div>
        </header>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'draft', 'ready', 'changed', 'archived'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s as any)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium capitalize whitespace-nowrap transition-colors border",
                filter === s
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              )}
              aria-label={`Filter by ${s}`}
              aria-pressed={filter === s}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Creation Form */}
        {isCreating && (
          <div className="mb-6">
            <InvoiceForm
              onCancel={() => setIsCreating(false)}
              onSubmit={(data) => {
                addInvoice({ ...data, id: `INV-${Date.now()}` } as Invoice);
                setIsCreating(false);
              }}
            />
          </div>
        )}

        {/* Invoice List */}
        <div className="flex-1 overflow-auto bg-white rounded-xl shadow-sm border border-gray-200">
          {filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Archive size={48} className="mb-4 text-gray-300" />
              <p>No invoices found.</p>
              {filter !== 'all' && <button onClick={() => setFilter('all')} className="mt-2 text-blue-600 hover:underline">Clear filter</button>}
            </div>
          ) : (
            <div className="min-w-[600px]">
              <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider sticky top-0 z-10">
                <div className="col-span-1 flex justify-center">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={selectedIds.size === filteredInvoices.length && filteredInvoices.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(new Set(filteredInvoices.map(i => i.id)));
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                  />
                </div>
                <div className="col-span-2">ID</div>
                <div className="col-span-3">Client</div>
                <div className="col-span-2 text-right">Amount</div>
                <div className="col-span-2">Due Date</div>
                <div className="col-span-2">Status</div>
              </div>

              <AnimatePresence initial={false}>
                {filteredInvoices.map((inv) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    key={inv.id}
                  >
                    {editingId === inv.id ? (
                      <div className="p-4 border-b border-gray-100 bg-blue-50/30">
                        <InvoiceForm
                          initialData={inv}
                          onCancel={() => setEditingId(null)}
                          onSubmit={(data) => {
                            updateInvoice(inv.id, data);
                            setEditingId(null);
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "grid grid-cols-12 gap-4 p-4 border-b border-gray-100 items-center transition-colors hover:bg-gray-50 group",
                          selectedIds.has(inv.id) && "bg-blue-50 hover:bg-blue-50/80"
                        )}
                      >
                        <div className="col-span-1 flex justify-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(inv.id)}
                            onChange={() => toggleSelection(inv.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            aria-label={`Select invoice ${inv.id}`}
                          />
                        </div>
                        <div className="col-span-2 font-medium text-sm">{inv.id}</div>
                        <div className="col-span-3 text-sm truncate">{inv.client}</div>
                        <div className="col-span-2 text-sm text-right tabular-nums">${inv.amount.toFixed(2)}</div>
                        <div className="col-span-2 text-sm text-gray-500 tabular-nums">{inv.dueDate}</div>
                        <div className="col-span-2 flex items-center justify-between">
                          <StatusBadge status={inv.status} />

                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                            <button
                              onClick={() => setEditingId(inv.id)}
                              className="p-1 text-gray-400 hover:text-blue-600 rounded"
                              aria-label={`Edit ${inv.id}`}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => deleteInvoice(inv.id)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                              aria-label={`Delete ${inv.id}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* Linked Views / Inspector (Sidebar on desktop, bottom drawer on mobile) */}
      <aside className="w-full md:w-80 lg:w-96 bg-white border-t md:border-t-0 md:border-l border-gray-200 flex flex-col md:h-screen shrink-0 relative z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-none">
        <div className="p-4 md:p-6 flex flex-col gap-6 h-full overflow-y-auto">

          {/* Batch Reconciler Surface */}
          <section className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-gray-900 font-medium pb-2 border-b border-gray-200">
              <RefreshCw size={18} />
              <h2>Batch Reconciler</h2>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <p className="text-sm text-gray-500 mb-1">Selected Records</p>
                <p className="text-2xl font-semibold tabular-nums">{selectedIds.size}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Total Aggregate</p>
                <p className="text-2xl font-semibold text-blue-600 tabular-nums">${selectedTotal.toFixed(2)}</p>
              </div>
            </div>

            <input
               type="text"
               value={reconcileNote}
               onChange={e => setReconcileNote(e.target.value)}
               placeholder="Reconciliation notes..."
               className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 mt-2"
               disabled={selectedIds.size === 0}
               aria-label="Reconciliation notes"
            />

            <button
              onClick={handleReconcile}
              disabled={selectedIds.size === 0}
              className="w-full mt-2 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              aria-label="Group selected records into a batch and reconcile aggregate totals"
            >
              <Check size={16} /> Reconcile Batch
            </button>
          </section>

          {/* Derived Summary View */}
          <section>
             <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Derived Summary</h3>
             <div className="space-y-2">
                <div className="flex justify-between text-sm py-1 border-b border-gray-100">
                   <span className="text-gray-600 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-gray-400"></div> Draft</span>
                   <span className="font-medium tabular-nums">${artifactData.derived.summary.totalDraft.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm py-1 border-b border-gray-100">
                   <span className="text-gray-600 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> Ready</span>
                   <span className="font-medium tabular-nums">${artifactData.derived.summary.totalReady.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm py-1 border-b border-gray-100">
                   <span className="text-gray-600 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> Changed</span>
                   <span className="font-medium tabular-nums">${artifactData.derived.summary.totalChanged.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm py-1 border-b border-gray-100">
                   <span className="text-gray-600 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Archived</span>
                   <span className="font-medium tabular-nums">${artifactData.derived.summary.totalArchived.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold py-2">
                   <span>Grand Total</span>
                   <span className="tabular-nums">${artifactData.derived.summary.grandTotal.toFixed(2)}</span>
                </div>
             </div>
          </section>

          {/* Artifact Management */}
          <section className="mt-auto pt-6 border-t border-gray-200 flex flex-col gap-2">
             <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-1">Session Artifact</h3>

             <div className="flex gap-2">
                <button
                  onClick={exportArtifact}
                  className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-blue-500"
                  aria-label="Export session artifact"
                >
                  <Download size={16} /> Export
                </button>
                <label className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-blue-500">
                  <Upload size={16} /> Import
                  <input type="file" accept=".json" onChange={handleImport} className="sr-only" aria-label="Import session artifact" />
                </label>
             </div>
             {lastReconciliation && (
                <div className="mt-2 text-xs text-gray-500 text-center">
                   Last reconciled: {new Date(lastReconciliation.timestamp).toLocaleTimeString()}
                </div>
             )}
          </section>

        </div>
      </aside>
    </div>
  );
}
