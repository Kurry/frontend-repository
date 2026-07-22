import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Download, Upload, Plus, Edit2, Trash2, CheckSquare, Square, Undo2, LayoutList, Layers, X, Settings2 } from 'lucide-react';

// --- Types & Schemas ---
export type RecordStatus = 'draft' | 'ready' | 'changed' | 'archived';

export interface BikeServiceRecord {
  id: string;
  title: string;
  mileage: number;
  status: RecordStatus;
}

export interface DerivedSummary {
  totalMileage: number;
  recordCount: number;
  archivedCount: number;
  batchReconciledAt?: string | null;
}

export interface HistoryEvent {
  id: string;
  type: string;
  timestamp: string;
  description: string;
}

export interface SessionData {
  schemaVersion: 'v1';
  exportedAt: string;
  records: BikeServiceRecord[];
  derived: DerivedSummary;
  history: HistoryEvent[];
}

export interface AppState {
  records: BikeServiceRecord[];
  derived: DerivedSummary;
  history: HistoryEvent[];
  selectedIds: string[];
}

// --- Initial Seed ---
const initialRecords: BikeServiceRecord[] = [
  { id: uuidv4(), title: 'Chain Replacement', mileage: 1200, status: 'ready' },
  { id: uuidv4(), title: 'Brake Bleed', mileage: 2500, status: 'draft' },
  { id: uuidv4(), title: 'Fork Service', mileage: 3000, status: 'changed' },
];

const computeDerived = (records: BikeServiceRecord[], previousDerived?: DerivedSummary): DerivedSummary => ({
  totalMileage: records.reduce((sum, r) => sum + r.mileage, 0),
  recordCount: records.length,
  archivedCount: records.filter(r => r.status === 'archived').length,
  batchReconciledAt: previousDerived?.batchReconciledAt || null,
});

const initialState: AppState = {
  records: initialRecords,
  derived: computeDerived(initialRecords),
  history: [{ id: uuidv4(), type: 'init', timestamp: new Date().toISOString(), description: 'Session initialized' }],
  selectedIds: [],
};

// --- WebMCP Interface Declarations ---
declare global {
  interface Window {
    webmcp_session_info: () => {
      contract_version: string;
      session_id: string;
      tools: string[];
      state: any;
    };
    webmcp_list_tools: () => any[];
    webmcp_invoke_tool: (tool_name: string, args: any) => Promise<any>;
  }
}

export default function App() {
  const [state, setState] = useState<AppState>(initialState);
  const [undoStack, setUndoStack] = useState<AppState[]>([]);

  const [viewMode, setViewMode] = useState<'list' | 'batch'>('list');
  const [filterStatus, setFilterStatus] = useState<RecordStatus | 'all'>('all');

  // Forms
  const [editingRecord, setEditingRecord] = useState<BikeServiceRecord | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // --- State Management with Undo ---
  const pushState = (newState: Partial<AppState>, description: string) => {
    setState(prev => {
      setUndoStack(stack => [...stack, prev]);
      const nextRecords = newState.records || prev.records;
      return {
        ...prev,
        ...newState,
        derived: newState.derived || computeDerived(nextRecords, prev.derived),
        history: [...prev.history, { id: uuidv4(), type: 'action', timestamp: new Date().toISOString(), description }]
      };
    });
  };

  const undo = () => {
    setUndoStack(prev => {
      if (prev.length === 0) return prev;
      const lastState = prev[prev.length - 1];
      setState(lastState);
      return prev.slice(0, prev.length - 1);
    });
  };

  // --- CRUD Operations ---
  const handleSaveRecord = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const mileageStr = formData.get('mileage') as string;
    const status = formData.get('status') as RecordStatus;

    if (!title.trim()) {
      setFormError('Title is required. Please provide a title.');
      return;
    }
    const mileage = parseInt(mileageStr, 10);
    if (isNaN(mileage) || mileage < 0) {
      setFormError('Mileage must be a positive number. Please correct the mileage.');
      return;
    }

    setFormError(null);
    if (editingRecord) {
      const updatedRecords = state.records.map(r => r.id === editingRecord.id ? { id: editingRecord.id, title, mileage, status } : r);
      pushState({ records: updatedRecords }, `Updated record ${title}`);
      setEditingRecord(null);
    } else {
      const newRecord = { id: uuidv4(), title, mileage, status };
      pushState({ records: [...state.records, newRecord] }, `Created record ${title}`);
      setIsCreating(false);
    }
  };

  const handleDelete = (id: string) => {
    const updatedRecords = state.records.filter(r => r.id !== id);
    const updatedSelected = state.selectedIds.filter(sId => sId !== id);
    pushState({ records: updatedRecords, selectedIds: updatedSelected }, `Deleted record ${id}`);
  };

  const toggleSelect = (id: string) => {
    setState(prev => ({
      ...prev,
      selectedIds: prev.selectedIds.includes(id)
        ? prev.selectedIds.filter(sId => sId !== id)
        : [...prev.selectedIds, id]
    }));
  };

  // --- Batch Reconciler Mutation (Signature Interaction) ---
  const handleBatchReconcile = () => {
    if (state.selectedIds.length === 0) return;

    // Check for conflicts: cannot reconcile already archived records
    const hasArchived = state.records.some(r => state.selectedIds.includes(r.id) && r.status === 'archived');
    if (hasArchived) {
      setFormError('Conflict: Cannot reconcile records that are already archived. Please unselect them.');
      return;
    }

    setFormError(null);
    const updatedRecords = state.records.map(r =>
      state.selectedIds.includes(r.id) ? { ...r, status: 'archived' as RecordStatus } : r
    );

    const newDerived = computeDerived(updatedRecords, state.derived);
    newDerived.batchReconciledAt = new Date().toISOString();

    pushState({
      records: updatedRecords,
      selectedIds: [],
      derived: newDerived
    }, `Batch reconciled ${state.selectedIds.length} records`);
  };

  // --- Export / Import ---
  const handleExport = () => {
    const sessionDoc: SessionData = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: state.derived,
      history: state.history
    };

    const blob = new Blob([JSON.stringify(sessionDoc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bike-maintenance-v1.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setUndoStack([]);
    setState({
      records: [],
      derived: computeDerived([]),
      history: [{ id: uuidv4(), type: 'clear', timestamp: new Date().toISOString(), description: 'Session cleared' }],
      selectedIds: []
    });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.schemaVersion !== 'v1') throw new Error('Invalid schema version. Must be v1.');
        if (!Array.isArray(json.records)) throw new Error('Records must be an array.');

        // Field-level validation
        const validStatuses = ['draft', 'ready', 'changed', 'archived'];
        const ids = new Set();
        for (const r of json.records) {
          if (ids.has(r.id)) throw new Error(`Duplicate ID found: ${r.id}`);
          ids.add(r.id);
          if (!r.title || typeof r.title !== 'string') throw new Error(`Invalid title for record ${r.id}`);
          if (typeof r.mileage !== 'number' || r.mileage < 0) throw new Error(`Invalid mileage for record ${r.id}`);
          if (!validStatuses.includes(r.status)) throw new Error(`Invalid status for record ${r.id}: ${r.status}`);
        }

        setState({
          records: json.records,
          derived: json.derived || computeDerived(json.records),
          history: json.history || [],
          selectedIds: []
        });
        setUndoStack([]);
        setImportError(null);
      } catch (err: any) {
        setImportError(err.message || 'Malformed JSON');
      }
    };
    reader.readAsText(file);
    // clear input
    e.target.value = '';
  };


  // --- WebMCP Registration ---
  useEffect(() => {
    const getSessionInfo = () => ({
      contract_version: 'zto-webmcp-v1',
      session_id: 'local-session',
      tools: ['entity_create_record', 'entity_update_record', 'entity_delete_record', 'entity_select_record', 'artifact_export_session', 'artifact_import_session'],
      state: { ...state }
    });

    const listTools = () => [
      {
        id: 'entity_create_record',
        name: 'entity_create_record',
        module: 'entity-collection-v1',
        description: 'Creates a new bike service record'
      },
      {
        id: 'entity_update_record',
        name: 'entity_update_record',
        module: 'entity-collection-v1',
        description: 'Updates an existing bike service record'
      },
      {
        id: 'entity_delete_record',
        name: 'entity_delete_record',
        module: 'entity-collection-v1',
        description: 'Deletes a bike service record'
      },
      {
        id: 'entity_select_record',
        name: 'entity_select_record',
        module: 'entity-collection-v1',
        description: 'Selects a bike service record for batch operations'
      },
      {
        id: 'artifact_export_session',
        name: 'artifact_export_session',
        module: 'artifact-transfer-v1',
        description: 'Exports the current session'
      },
      {
        id: 'artifact_import_session',
        name: 'artifact_import_session',
        module: 'artifact-transfer-v1',
        description: 'Imports a session from JSON'
      }
    ];

    const invokeTool = async (tool_name: string, args: any): Promise<any> => {
      return new Promise((resolve, reject) => {
        try {
          if (tool_name === 'entity_create_record') {
            const { title, mileage, status } = args;
            if (!title) throw new Error("Title required");
            const newRecord = { id: uuidv4(), title, mileage: Number(mileage), status: status || 'draft' };
            setState(prev => {
              const nextRecords = [...prev.records, newRecord];
              return {
                ...prev,
                records: nextRecords,
                derived: computeDerived(nextRecords, prev.derived),
                history: [...prev.history, { id: uuidv4(), type: 'action', timestamp: new Date().toISOString(), description: 'Created via tool' }]
              };
            });
            resolve({ success: true, record: newRecord });
          } else if (tool_name === 'entity_update_record') {
             const { id, title, mileage, status } = args;
             setState(prev => {
               const nextRecords = prev.records.map(r => r.id === id ? { ...r, title: title ?? r.title, mileage: mileage ?? r.mileage, status: status ?? r.status } : r);
               return {
                 ...prev,
                 records: nextRecords,
                 derived: computeDerived(nextRecords, prev.derived),
               };
             });
             resolve({ success: true });
          } else if (tool_name === 'entity_delete_record') {
             const { id } = args;
             setState(prev => {
               const nextRecords = prev.records.filter(r => r.id !== id);
               return {
                 ...prev,
                 records: nextRecords,
                 derived: computeDerived(nextRecords, prev.derived),
               }
             });
             resolve({ success: true });
          } else if (tool_name === 'entity_select_record') {
             const { id } = args;
             setState(prev => ({
               ...prev,
               selectedIds: prev.selectedIds.includes(id) ? prev.selectedIds : [...prev.selectedIds, id]
             }));
             resolve({ success: true });
          } else if (tool_name === 'artifact_export_session') {
             const sessionDoc: SessionData = {
                schemaVersion: 'v1',
                exportedAt: new Date().toISOString(),
                records: state.records,
                derived: state.derived,
                history: state.history
              };
             resolve({ success: true, data: sessionDoc });
          } else if (tool_name === 'artifact_import_session') {
             const json = args.data;
             if (json.schemaVersion !== 'v1') throw new Error('Invalid schema');
             setState({
                records: json.records,
                derived: json.derived,
                history: json.history,
                selectedIds: []
             });
             resolve({ success: true });
          } else {
            reject(new Error(`Unknown tool: ${tool_name}`));
          }
        } catch (e: any) {
          reject(new Error(`Tool failed: ${e.message}`));
        }
      });
    };

    window.webmcp_session_info = getSessionInfo;
    window.webmcp_list_tools = listTools;
    window.webmcp_invoke_tool = invokeTool;
  }, [state]);


  const filteredRecords = state.records.filter(r => filterStatus === 'all' || r.status === filterStatus);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8 flex flex-col items-center">

      <header className="w-full max-w-5xl mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-blue-600" />
            Bike Maintenance Mileage Map
          </h1>
          <p className="text-sm text-slate-500 font-mono mt-1">Session Ledger & Batch Reconciler</p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={undo}
            disabled={undoStack.length === 0}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-md text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Undo last action"
          >
            <Undo2 className="w-4 h-4" /> Undo
          </button>
          <button
            onClick={handleExport}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-md text-sm font-medium hover:bg-slate-50"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <label className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-md text-sm font-medium hover:bg-slate-50 cursor-pointer">
            <Upload className="w-4 h-4" /> Import
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </header>

      {importError && (
        <div className="w-full max-w-5xl mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm" role="alert">
          <strong>Import failed:</strong> {importError}
        </div>
      )}

      <main className="w-full max-w-5xl flex flex-col lg:flex-row gap-6 items-start">

        {/* Left Column: Workbench / List */}
        <section className="flex-1 w-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">

          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 justify-between items-center">
            <div className="flex bg-slate-200/50 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <LayoutList className="w-4 h-4" /> List
              </button>
              <button
                onClick={() => setViewMode('batch')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${viewMode === 'batch' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <Layers className="w-4 h-4" /> Batch Reconciler
              </button>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="text-sm border border-slate-200 rounded-md py-1.5 px-2 bg-white"
                aria-label="Filter records by status"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="ready">Ready</option>
                <option value="changed">Changed</option>
                <option value="archived">Archived</option>
              </select>
              <button
                onClick={() => { setIsCreating(true); setEditingRecord(null); setFormError(null); }}
                className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                aria-label="Create new record"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Create/Edit Form Overlay */}
          {(isCreating || editingRecord) && (
             <div className="p-4 border-b border-slate-200 bg-blue-50/30">
               <div className="flex justify-between items-center mb-3">
                 <h3 className="text-sm font-bold text-slate-800">{editingRecord ? 'Edit Record' : 'Create Record'}</h3>
                 <button onClick={() => { setIsCreating(false); setEditingRecord(null); setFormError(null); }} aria-label="Cancel">
                   <X className="w-4 h-4 text-slate-400 hover:text-slate-700" />
                 </button>
               </div>
               {formError && (
                 <div className="mb-3 p-2 bg-red-100 border border-red-200 text-red-700 rounded text-xs" role="alert">
                   {formError}
                 </div>
               )}
               <form onSubmit={handleSaveRecord} className="flex flex-wrap gap-3 items-end">
                 <div className="flex-1 min-w-[200px]">
                   <label htmlFor="title" className="block text-xs font-medium text-slate-600 mb-1">Title</label>
                   <input
                     id="title"
                     name="title"
                     defaultValue={editingRecord?.title || ''}
                     className="w-full text-sm border border-slate-300 rounded-md px-3 py-2"
                     placeholder="e.g. Brake Service"
                   />
                 </div>
                 <div className="w-32">
                   <label htmlFor="mileage" className="block text-xs font-medium text-slate-600 mb-1">Mileage</label>
                   <input
                     id="mileage"
                     name="mileage"
                     type="number"
                     min="0"
                     defaultValue={editingRecord?.mileage || ''}
                     className="w-full text-sm border border-slate-300 rounded-md px-3 py-2"
                   />
                 </div>
                 <div className="w-32">
                   <label htmlFor="status" className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                   <select
                     id="status"
                     name="status"
                     defaultValue={editingRecord?.status || 'draft'}
                     className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 bg-white"
                   >
                     <option value="draft">Draft</option>
                     <option value="ready">Ready</option>
                     <option value="changed">Changed</option>
                     <option value="archived">Archived</option>
                   </select>
                 </div>
                 <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
                   {editingRecord ? 'Update' : 'Save'}
                 </button>
               </form>
             </div>
          )}

          {/* Batch Actions Toolbar */}
          {viewMode === 'batch' && (
            <div className="p-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
              <span className="text-sm font-medium text-amber-800">
                {state.selectedIds.length} records selected
              </span>
              <button
                onClick={handleBatchReconcile}
                disabled={state.selectedIds.length === 0}
                className="px-4 py-1.5 bg-amber-600 text-white text-sm font-medium rounded hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reconcile & Archive Batch
              </button>
            </div>
          )}

          {/* List Content */}
          <div className="flex-1 overflow-y-auto max-h-[600px] p-4">
            {filteredRecords.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <p className="text-sm mb-2">No records found.</p>
                <button
                  onClick={() => setIsCreating(true)}
                  className="text-sm text-blue-600 font-medium hover:underline"
                >
                  Create a new record
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredRecords.map(r => (
                  <div
                    key={r.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${state.selectedIds.includes(r.id) ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                  >
                    {viewMode === 'batch' && (
                      <button
                        onClick={() => toggleSelect(r.id)}
                        className="text-slate-400 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                        aria-label={`Select ${r.title}`}
                      >
                        {state.selectedIds.includes(r.id) ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 truncate">{r.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          r.status === 'archived' ? 'bg-slate-100 text-slate-600' :
                          r.status === 'ready' ? 'bg-green-100 text-green-700' :
                          r.status === 'changed' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {r.status}
                        </span>
                      </div>
                      <div className="text-sm text-slate-500 font-mono mt-0.5">{r.mileage.toLocaleString()} mi</div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditingRecord(r); setIsCreating(false); setFormError(null); }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded"
                        aria-label={`Edit ${r.title}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                        aria-label={`Delete ${r.title}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Linked Views & Summary */}
        <aside className="w-full lg:w-72 flex flex-col gap-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Derived Summary</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-xs font-medium text-slate-500 mb-1">Total Fleet Mileage</dt>
                <dd className="text-2xl font-light font-mono text-slate-900">{state.derived.totalMileage.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                <dt className="text-sm text-slate-600">Active Records</dt>
                <dd className="font-medium text-slate-900">{state.derived.recordCount - state.derived.archivedCount}</dd>
              </div>
              <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                <dt className="text-sm text-slate-600">Archived Records</dt>
                <dd className="font-medium text-slate-900">{state.derived.archivedCount}</dd>
              </div>
              {state.derived.batchReconciledAt && (
                <div className="border-t border-slate-100 pt-3">
                   <dt className="text-xs font-medium text-slate-500 mb-1">Last Reconciled</dt>
                   <dd className="text-xs font-mono text-slate-600">{new Date(state.derived.batchReconciledAt).toLocaleString()}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-slate-800 text-slate-300 rounded-xl shadow-sm p-4 font-mono text-xs overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-2">
               <h2 className="text-slate-400 font-bold uppercase tracking-widest">Event History</h2>
               <button onClick={handleClear} className="text-red-400 hover:text-red-300 px-2 py-1 bg-slate-700/50 rounded">Clear Session</button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {state.history.slice().reverse().map(ev => (
                <div key={ev.id} className="flex flex-col gap-0.5 border-l-2 border-slate-600 pl-2">
                  <span className="text-[10px] text-slate-500">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                  <span className="text-slate-200">{ev.description}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

      </main>
    </div>
  );
}