import React, { useState } from 'react';
import { create } from 'zustand';
import { motion, AnimatePresence } from 'framer-motion';
import { Undo2, Plus, Download, Upload, EyeOff, Edit2, Trash2 } from 'lucide-react';
import { z } from 'zod';

type DomainState = 'draft' | 'ready' | 'changed' | 'archived';

interface FlavorComponent {
  id: string;
  name: string;
  intensity: number;
  status: DomainState;
  domain_state: DomainState;
}

interface SpatialComposerRecord {
  id: string;
  position: { x: number; y: number };
  capacity: number;
  status: 'idle' | 'selected' | 'changed' | 'conflict' | 'resolved';
}

const artifactSchema = z.object({
  schemaVersion: z.literal('v1'),
  exportedAt: z.string(),
  records: z.array(z.object({
    id: z.string(),
    name: z.string(),
    intensity: z.number().min(0).max(100),
    status: z.enum(['draft', 'ready', 'changed', 'archived']),
    domain_state: z.enum(['draft', 'ready', 'changed', 'archived'])
  })),
  derived: z.object({
    composerRecords: z.array(z.object({
      id: z.string(),
      position: z.object({ x: z.number(), y: z.number() }),
      capacity: z.number(),
      status: z.enum(['idle', 'selected', 'changed', 'conflict', 'resolved'])
    })),
    summary: z.string()
  }),
  history: z.array(z.any())
});

interface AppState {
  records: FlavorComponent[];
  composerRecords: SpatialComposerRecord[];
  history: { records: FlavorComponent[]; composerRecords: SpatialComposerRecord[] }[];
  addRecord: (record: FlavorComponent) => void;
  updateRecord: (id: string, record: Partial<FlavorComponent>) => void;
  deleteRecord: (id: string) => void;
  placeInComposer: (id: string, position: { x: number; y: number }, capacity: number) => void;
  undo: () => void;
  importArtifact: (artifact: any) => void;
  maxCapacity: number;
}

const useStore = create<AppState>((set) => ({
  records: [
    { id: '1', name: 'Vanilla', intensity: 50, status: 'draft', domain_state: 'draft' },
    { id: '2', name: 'Cinnamon', intensity: 80, status: 'ready', domain_state: 'ready' },
    { id: '3', name: 'Nutmeg', intensity: 30, status: 'changed', domain_state: 'changed' },
    { id: '4', name: 'Clove', intensity: 90, status: 'archived', domain_state: 'archived' }
  ],
  composerRecords: [],
  history: [],
  maxCapacity: 200,

  addRecord: (record) => set((state) => {
    const newState = { records: [...state.records, record] };
    return { ...newState, history: [...state.history, { records: state.records, composerRecords: state.composerRecords }] };
  }),
  updateRecord: (id, updates) => set((state) => {
    const newState = { records: state.records.map(r => r.id === id ? { ...r, ...updates } : r) };
    return { ...newState, history: [...state.history, { records: state.records, composerRecords: state.composerRecords }] };
  }),
  deleteRecord: (id) => set((state) => {
    const newState = {
      records: state.records.filter(r => r.id !== id),
      composerRecords: state.composerRecords.filter(cr => cr.id !== id)
    };
    return { ...newState, history: [...state.history, { records: state.records, composerRecords: state.composerRecords }] };
  }),
  placeInComposer: (id, position, capacity) => set((state) => {
    const currentTotalCapacity = state.composerRecords.reduce((sum, r) => sum + r.capacity, 0);
    const existingRecord = state.composerRecords.find(r => r.id === id);
    const additionalCapacity = existingRecord ? capacity - existingRecord.capacity : capacity;

    if (currentTotalCapacity + additionalCapacity > state.maxCapacity) {
      alert("Capacity Exceeded: Cannot place item without exceeding maximum capacity.");
      return state;
    }

    let newComposerRecords = [...state.composerRecords];
    if (existingRecord) {
      newComposerRecords = newComposerRecords.map(r => r.id === id ? { ...r, position, capacity, status: 'changed' } : r);
    } else {
      newComposerRecords.push({ id, position, capacity, status: 'changed' });
    }

    const newRecords = state.records.map(r => r.id === id ? { ...r, status: 'changed', domain_state: 'changed' } : r) as FlavorComponent[];

    return {
      composerRecords: newComposerRecords,
      records: newRecords,
      history: [...state.history, { records: state.records, composerRecords: state.composerRecords }]
    };
  }),
  undo: () => set((state) => {
    if (state.history.length === 0) return state;
    const previousState = state.history[state.history.length - 1];
    return {
      records: previousState.records,
      composerRecords: previousState.composerRecords,
      history: state.history.slice(0, -1)
    };
  }),
  importArtifact: (artifact) => set((state) => {
    try {
      const parsed = artifactSchema.parse(artifact);
      return {
        records: parsed.records as FlavorComponent[],
        composerRecords: parsed.derived.composerRecords as SpatialComposerRecord[],
        history: parsed.history || []
      };
    } catch (e) {
      alert("Invalid import: Schema validation failed.");
      return state;
    }
  })
}));

if (typeof window !== 'undefined') {
  (window as any).webmcp_session_info = () => ({
    contract_version: "zto-webmcp-v1",
    modules: ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"]
  });

  (window as any).webmcp_list_tools = () => [
    {
      name: "editor_select",
      description: "Select a record in the spatial composer",
      inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] }
    },
    {
      name: "editor_update_property",
      description: "Update property in spatial composer",
      inputSchema: { type: "object", properties: { id: { type: "string" }, position: { type: "object", properties: { x: { type: "number" }, y: { type: "number" } } } }, required: ["id"] }
    },
    {
      name: "editor_undo",
      description: "Undo last mutation",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "entity_create",
      description: "Create a new flavor component",
      inputSchema: { type: "object", properties: { name: { type: "string" }, intensity: { type: "number" } }, required: ["name", "intensity"] }
    },
    {
      name: "entity_update",
      description: "Update a flavor component",
      inputSchema: { type: "object", properties: { id: { type: "string" }, name: { type: "string" }, intensity: { type: "number" }, status: { type: "string" } }, required: ["id"] }
    },
    {
      name: "entity_delete",
      description: "Delete a flavor component",
      inputSchema: { type: "object", properties: { id: { type: "string" }, confirm: { type: "boolean" } }, required: ["id", "confirm"] }
    },
    {
      name: "entity_filter",
      description: "Filter flavor components",
      inputSchema: { type: "object", properties: { status: { type: "string" } }, required: ["status"] }
    },
    {
      name: "artifact_export",
      description: "Export the artifact",
      inputSchema: { type: "object", properties: { format: { type: "string" } } }
    },
    {
      name: "artifact_import",
      description: "Import the artifact",
      inputSchema: { type: "object", properties: { data: { type: "object" } }, required: ["data"] }
    }
  ];

  (window as any).webmcp_invoke_tool = (name: string, args: any) => {
    const store = useStore.getState();
    switch (name) {
      case "editor_undo":
        store.undo();
        return { success: true };
      case "editor_update_property":
        if (args.position) {
           const record = store.records.find(r => r.id === args.id);
           if (record) store.placeInComposer(args.id, args.position, record.intensity);
        }
        return { success: true };
      case "entity_create":
        store.addRecord({
          id: Date.now().toString(),
          name: args.name,
          intensity: args.intensity,
          status: 'draft',
          domain_state: 'draft'
        });
        return { success: true };
      case "entity_update":
        store.updateRecord(args.id, { name: args.name, intensity: args.intensity, status: args.status as DomainState });
        return { success: true };
      case "entity_delete":
        if (args.confirm) {
          store.deleteRecord(args.id);
          return { success: true };
        }
        return { success: false, error: "Must confirm deletion" };
      case "entity_filter":
        // Client side filtering state can be managed locally in a real app, returning success
        return { success: true, filteredRecords: store.records.filter(r => r.status === args.status) };
      case "artifact_import":
        store.importArtifact(args.data);
        return { success: true };
      case "artifact_export":
        return {
          success: true,
          data: {
            schemaVersion: 'v1',
            exportedAt: new Date().toISOString(),
            records: store.records,
            derived: {
              composerRecords: store.composerRecords,
              summary: `Total Capacity: ${store.composerRecords.reduce((sum, r) => sum + r.capacity, 0)}`
            },
            history: store.history
          }
        };
      default:
        return { success: false, error: "Tool not implemented" };
    }
  };
}

const App = () => {
  const { records, composerRecords, addRecord, updateRecord, deleteRecord, placeInComposer, undo, importArtifact, maxCapacity } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<DomainState | 'all'>('all');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', intensity: 50, status: 'draft' as DomainState });
  const [isAdding, setIsAdding] = useState(false);

  const handleExport = () => {
    const artifact = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records,
      derived: {
        composerRecords,
        summary: `Total Capacity: ${composerRecords.reduce((sum, r) => sum + r.capacity, 0)}`
      },
      history: useStore.getState().history
    };

    // Redact internal IDs before export (simulated)
    const redactedArtifact = {
      ...artifact,
      records: artifact.records.map(r => ({ ...r, internal_id: undefined }))
    };

    const blob = new Blob([JSON.stringify(redactedArtifact, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flavor-balance-v1-spatial-composer.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        importArtifact(json);
      } catch (err) {
        alert("Invalid import: Failed to parse JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset
  };

  const handleSaveEdit = () => {
    if (isEditing) {
      if (editForm.intensity < 0 || editForm.intensity > 100) {
        alert("Intensity must be between 0 and 100.");
        return;
      }
      updateRecord(isEditing, { name: editForm.name, intensity: editForm.intensity, status: editForm.status });
      setIsEditing(null);
    }
  };

  const handleSaveAdd = () => {
    if (editForm.intensity < 0 || editForm.intensity > 100) {
        alert("Intensity must be between 0 and 100.");
        return;
    }
    addRecord({
      id: Date.now().toString(),
      name: editForm.name || 'New Component',
      intensity: editForm.intensity,
      status: editForm.status,
      domain_state: editForm.status
    });
    setIsAdding(false);
  };

  const filteredRecords = filterStatus === 'all' ? records : records.filter(r => r.status === filterStatus);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans sm:flex-row md:flex-col lg:flex-row flex-wrap md:flex-nowrap">
      <header className="bg-white border-b border-slate-200 p-4 flex flex-wrap justify-between items-center w-full shadow-sm z-10">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Recipe Flavor Balance Studio</h1>
        <div className="flex gap-2 mt-2 sm:mt-0">
          <button onClick={undo} aria-label="Undo" className="px-3 py-1.5 flex items-center gap-2 bg-slate-100 hover:bg-slate-200 focus:ring-2 focus:ring-blue-500 rounded-md text-sm font-medium transition-colors">
            <Undo2 size={16} /> <span className="hidden sm:inline">Undo</span>
          </button>
          <button onClick={handleExport} className="px-3 py-1.5 flex items-center gap-2 bg-slate-800 hover:bg-slate-700 focus:ring-2 focus:ring-slate-500 text-white rounded-md text-sm font-medium transition-colors">
            <Download size={16} /> <span className="hidden sm:inline">Export</span>
          </button>
          <label className="px-3 py-1.5 flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 focus-within:ring-2 focus-within:ring-blue-500 rounded-md text-sm font-medium cursor-pointer transition-colors">
            <Upload size={16} /> <span className="hidden sm:inline">Import</span>
            <input type="file" className="sr-only" accept=".json" onChange={handleImport} />
          </label>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row p-4 gap-4 overflow-hidden w-full h-[calc(100vh-73px)]">
        {/* Collection Panel */}
        <div className="w-full md:w-80 bg-white border border-slate-200 rounded-lg flex flex-col shadow-sm flex-shrink-0">
          <div className="p-4 border-b border-slate-100 flex flex-col gap-3">
             <div className="flex justify-between items-center">
                 <h2 className="font-semibold text-slate-800">Flavor Components</h2>
                 <button onClick={() => { setIsAdding(true); setEditForm({ name: '', intensity: 50, status: 'draft' }); }} aria-label="Add Component" className="p-1.5 hover:bg-slate-100 rounded text-slate-500 transition-colors"><Plus size={16} /></button>
             </div>
             <select
               value={filterStatus}
               onChange={(e) => setFilterStatus(e.target.value as any)}
               className="text-sm border border-slate-300 rounded p-1.5 focus:ring-2 focus:ring-blue-500"
               aria-label="Filter by status"
             >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="ready">Ready</option>
                <option value="changed">Changed</option>
                <option value="archived">Archived</option>
             </select>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2" role="listbox" aria-label="Flavor Components">
            {isAdding && (
                <div className="p-3 border border-blue-300 bg-blue-50 rounded-md">
                    <input className="w-full text-sm font-semibold mb-2 p-1 border rounded" placeholder="Name" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                    <div className="flex gap-2 text-sm mb-2">
                        <label className="flex items-center gap-1">Intensity: <input type="number" className="w-16 p-1 border rounded" min="0" max="100" value={editForm.intensity} onChange={e => setEditForm({...editForm, intensity: Number(e.target.value)})} /></label>
                        <select className="p-1 border rounded" value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value as DomainState})}>
                            <option value="draft">Draft</option>
                            <option value="ready">Ready</option>
                            <option value="changed">Changed</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                        <button onClick={() => setIsAdding(false)} className="px-2 py-1 text-xs bg-slate-200 rounded">Cancel</button>
                        <button onClick={handleSaveAdd} className="px-2 py-1 text-xs bg-blue-600 text-white rounded">Save</button>
                    </div>
                </div>
            )}
            {filteredRecords.map(record => (
              <div
                key={record.id}
                role="option"
                aria-selected={selectedId === record.id}
                onClick={(e) => {
                  // Prevent selection if clicking edit/delete buttons
                  if ((e.target as HTMLElement).closest('.action-btn')) return;
                  setSelectedId(record.id);
                }}
                className={`w-full text-left p-3 rounded-md border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${selectedId === record.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
              >
                {isEditing === record.id ? (
                  <div className="space-y-2" onClick={e => e.stopPropagation()}>
                    <input className="w-full font-semibold p-1 border rounded" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                    <div className="flex gap-2">
                        <input type="number" className="w-16 p-1 border rounded" min="0" max="100" value={editForm.intensity} onChange={e => setEditForm({...editForm, intensity: Number(e.target.value)})} />
                        <select className="p-1 border rounded text-xs" value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value as DomainState})}>
                            <option value="draft">Draft</option>
                            <option value="ready">Ready</option>
                            <option value="changed">Changed</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                        <button onClick={() => setIsEditing(null)} className="px-2 py-1 text-xs bg-slate-200 rounded">Cancel</button>
                        <button onClick={handleSaveEdit} className="px-2 py-1 text-xs bg-blue-600 text-white rounded">Save</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start">
                        <div className="font-semibold text-slate-800">{record.name}</div>
                        <div className="flex gap-1">
                            <button onClick={(e) => { e.stopPropagation(); setIsEditing(record.id); setEditForm({name: record.name, intensity: record.intensity, status: record.status}); }} className="action-btn p-1 text-slate-400 hover:text-blue-600" aria-label="Edit"><Edit2 size={14}/></button>
                            <button onClick={(e) => { e.stopPropagation(); if(confirm('Delete?')) deleteRecord(record.id); }} className="action-btn p-1 text-slate-400 hover:text-red-600" aria-label="Delete"><Trash2 size={14}/></button>
                        </div>
                    </div>
                    <div className="text-slate-500 flex justify-between mt-2 items-center">
                    <span className="text-xs font-medium bg-slate-100 px-2 py-0.5 rounded-full">Intensity: {record.intensity}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        record.status === 'draft' ? 'bg-slate-100 text-slate-600' :
                        record.status === 'ready' ? 'bg-emerald-100 text-emerald-700' :
                        record.status === 'changed' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-200 text-slate-600'
                    }`}>{record.status.charAt(0).toUpperCase() + record.status.slice(1)}</span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Spatial Composer */}
        <div className="flex-1 bg-white border border-slate-200 rounded-lg p-4 relative overflow-hidden flex flex-col shadow-sm min-h-[400px]">
          <h2 className="font-semibold text-slate-800 mb-4">Spatial Composer</h2>
          <div
            role="application"
            aria-label="Spatial Composer Canvas"
            className="flex-1 border-2 border-dashed border-slate-200 hover:border-slate-300 transition-colors rounded-lg relative bg-slate-50/50"
            onPointerDown={(e) => {
              if (selectedId) {
                const rect = e.currentTarget.getBoundingClientRect();
                placeInComposer(selectedId, { x: e.clientX - rect.left, y: e.clientY - rect.top }, records.find(r => r.id === selectedId)?.intensity || 0);
              }
            }}
            onKeyDown={(e) => {
               if (e.key === 'Enter' && selectedId) {
                  placeInComposer(selectedId, { x: 100, y: 100 }, records.find(r => r.id === selectedId)?.intensity || 0);
               }
            }}
            tabIndex={0}
          >
            <AnimatePresence>
              {composerRecords.map(cr => {
                const record = records.find(r => r.id === cr.id);
                if (!record) return null;
                return (
                  <motion.div
                    key={cr.id}
                    layout
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1, x: cr.position.x - 40, y: cr.position.y - 40 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="absolute w-20 h-20 bg-white border-2 border-blue-500 rounded-full flex flex-col items-center justify-center shadow-md select-none cursor-move z-10 hover:shadow-lg transition-shadow"
                    title={`${record.name} (Capacity: ${cr.capacity})`}
                  >
                    <span className="text-xs font-bold text-slate-800 text-center px-1 leading-tight">{record.name}</span>
                    <span className="text-[10px] text-blue-600 font-medium mt-0.5">{cr.capacity}</span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {!selectedId && composerRecords.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 pointer-events-none">
                    Select a component and click to place
                </div>
            )}
          </div>
          <div className="mt-4 flex justify-between items-center text-sm">
            <span className="text-slate-500">
               {selectedId ? `Ready to place: ${records.find(r=>r.id===selectedId)?.name}` : 'Select a component from the list'}
            </span>
            <div className="flex items-center gap-2">
                <span className="text-slate-600 font-medium">Capacity:</span>
                <div className="w-32 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                        className={`h-2.5 rounded-full ${composerRecords.reduce((sum, r) => sum + r.capacity, 0) > maxCapacity * 0.8 ? 'bg-amber-500' : 'bg-blue-500'}`}
                        style={{ width: `${Math.min(100, (composerRecords.reduce((sum, r) => sum + r.capacity, 0) / maxCapacity) * 100)}%` }}
                    ></div>
                </div>
                <span className="text-slate-700 font-semibold">{composerRecords.reduce((sum, r) => sum + r.capacity, 0)} / {maxCapacity}</span>
            </div>
          </div>
        </div>

        {/* Summary/Inspector Panel */}
        <div className="w-full md:w-64 bg-white border border-slate-200 rounded-lg p-4 flex flex-col shadow-sm flex-shrink-0">
          <h2 className="font-semibold text-slate-800 mb-4">Evidence Artifact</h2>
          <div className="flex-1 overflow-y-auto text-sm space-y-6">
            <div>
              <h3 className="text-slate-700 font-medium mb-2 flex items-center gap-1.5 pb-1 border-b border-slate-100">
                  <EyeOff size={14} className="text-slate-400"/> Source Lineage
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                  Artifact exports include structural redaction. Internal identifiers and transient UI states are scrubbed to preserve a clean interoperable schema.
              </p>
            </div>
            <div>
              <h3 className="text-slate-700 font-medium mb-2 pb-1 border-b border-slate-100">Derived Summary</h3>
              <div className="bg-slate-50 p-3 rounded-md border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-slate-600">Placed Items</span>
                    <span className="font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">{composerRecords.length}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-slate-600">Total Capacity</span>
                    <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{composerRecords.reduce((sum, r) => sum + r.capacity, 0)}</span>
                </div>
              </div>
            </div>
            {composerRecords.length > 0 && (
                <div>
                     <h3 className="text-slate-700 font-medium mb-2 pb-1 border-b border-slate-100">Placed Components</h3>
                     <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                         {composerRecords.map(cr => (
                             <div key={cr.id} className="flex justify-between text-xs py-1 text-slate-600">
                                 <span>{records.find(r=>r.id===cr.id)?.name}</span>
                                 <span className="text-slate-400">[{Math.round(cr.position.x)}, {Math.round(cr.position.y)}]</span>
                             </div>
                         ))}
                     </div>
                </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
