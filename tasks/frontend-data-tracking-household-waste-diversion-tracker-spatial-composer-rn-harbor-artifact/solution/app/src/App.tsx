import React, { useState, useEffect, useCallback } from 'react';
import { Download, Upload, Trash2, Edit2, Check, X, RotateCcw, Box, Home } from 'lucide-react';
import './types';

// Types
type EventStatus = 'draft' | 'ready' | 'changed' | 'archived';
type VolumeCategory = 'low' | 'medium' | 'high' | 'critical';

interface SpatialGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
  zone: 'staging' | 'processing' | 'storage' | 'unassigned';
}

interface WasteEvent {
  id: string;
  title: string;
  status: EventStatus;
  weight_kg: number;
  volume: VolumeCategory;
  collection_date: string;
  source: string;
  geometry: SpatialGeometry;
}

interface DerivedState {
  total_weight: number;
  capacity_usage_percent: number;
  zone_distribution: Record<string, number>;
  last_rebalance: string | null;
}

interface SessionState {
  schemaVersion: 'v1';
  exportedAt: string | null;
  records: WasteEvent[];
  derived: DerivedState;
  history: { type: string; timestamp: string; details: any }[];
  selection: string | null; // For restoring selection on undo
}

const MAX_CAPACITY_KG = 10000;

// Initial Empty State
const INITIAL_STATE: SessionState = {
  schemaVersion: 'v1',
  exportedAt: null,
  records: [],
  derived: {
    total_weight: 0,
    capacity_usage_percent: 0,
    zone_distribution: { staging: 0, processing: 0, storage: 0, unassigned: 0 },
    last_rebalance: null
  },
  history: [],
  selection: null
};

// WebMCP Contract Exposer component
function WebMCPContract({ state, commitState, historyStack, setHistoryStack, selectedId, setSelectedId }: { state: SessionState, commitState: any, historyStack: SessionState[], setHistoryStack: any, selectedId: string | null, setSelectedId: any }) {
  useEffect(() => {
    window.webmcp_session_info = async () => ({
      task_id: "eval-intelligence/frontend-data-tracking-household-waste-diversion-tracker-spatial-composer-rn-provenance-artifact",
      status: "active"
    });

    window.webmcp_list_tools = () => [
      {
        name: "entity_create_record",
        description: "Create a new waste event record",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            weight_kg: { type: "number" },
            volume: { type: "string", enum: ["low", "medium", "high", "critical"] },
            collection_date: { type: "string" },
            source: { type: "string" }
          },
          required: ["title", "weight_kg", "volume", "collection_date", "source"]
        }
      },
      {
        name: "entity_update_record",
        description: "Update a waste event record",
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
        name: "entity_rebalance_capacity",
        description: "Place a selected record in a spatial composer and rebalance capacity",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" }
          },
          required: ["id"]
        }
      },
      {
        name: "entity_undo",
        description: "Undo the last mutation",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "artifact_export_session_json",
        description: "Export the current session as JSON",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "artifact_import_session_json",
        description: "Import a session from JSON",
        inputSchema: {
          type: "object",
          properties: {
            artifact: { type: "object" }
          },
          required: ["artifact"]
        }
      }
    ];

    window.webmcp_invoke_tool = async (name: string, args: any) => {
      switch (name) {
        case "entity_create_record": {
          const newRecord: WasteEvent = {
            id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: args.title,
            status: 'draft',
            weight_kg: args.weight_kg,
            volume: args.volume,
            collection_date: args.collection_date,
            source: args.source,
            geometry: { x: 0, y: 0, width: 100, height: 100, zone: 'unassigned' }
          };

          let nextState: SessionState = null as any;
          setHistoryStack((prev: SessionState[]) => {
              const current = prev[prev.length - 1];
              const nextRecords = [...current.records, newRecord];
              const nextDerived = calculateDerived(nextRecords);
              nextState = {
                  ...current,
                  records: nextRecords,
                  derived: nextDerived,
                  history: [...current.history, { type: 'create', timestamp: new Date().toISOString(), details: { id: newRecord.id } }],
                  selection: newRecord.id
              };
              commitState(nextState);
              setSelectedId(newRecord.id);
              return [...prev, nextState];
          });

          return { success: true, record: newRecord };
        }
        case "entity_update_record": {
          const { id, updates } = args;
          let nextState: SessionState = null as any;
          let found = false;

          setHistoryStack((prev: SessionState[]) => {
              const current = prev[prev.length - 1];
              const recordIndex = current.records.findIndex(r => r.id === id);
              if (recordIndex === -1) return prev;

              found = true;
              const nextRecords = [...current.records];
              nextRecords[recordIndex] = { ...nextRecords[recordIndex], ...updates };
              const nextDerived = calculateDerived(nextRecords);

              nextState = {
                  ...current,
                  records: nextRecords,
                  derived: nextDerived,
                  history: [...current.history, { type: 'update', timestamp: new Date().toISOString(), details: { id } }],
                  selection: current.selection
              };
              commitState(nextState);
              return [...prev, nextState];
          });

          if (!found) return { success: false, error: 'Record not found' };
          return { success: true };
        }
        case "entity_rebalance_capacity": {
          const { id } = args;
          let found = false;
          let nextState: SessionState = null as any;

          setHistoryStack((prev: SessionState[]) => {
              const current = prev[prev.length - 1];
              const record = current.records.find(r => r.id === id);
              if (!record || record.status === 'archived') return prev;

              found = true;
              const newZone = record.geometry.zone === 'staging' ? 'processing' :
                              record.geometry.zone === 'processing' ? 'storage' :
                              'staging';

              const nextRecords = current.records.map(r => {
                  if (r.id === id) {
                      return {
                          ...r,
                          status: 'changed' as EventStatus,
                          geometry: {
                              ...r.geometry,
                              zone: newZone,
                              x: Math.random() * 200,
                              y: Math.random() * 200
                          }
                      };
                  }
                  return r;
              });

              const nextDerived = calculateDerived(nextRecords);
              nextState = {
                  ...current,
                  records: nextRecords,
                  derived: nextDerived,
                  history: [...current.history, { type: 'rebalance', timestamp: new Date().toISOString(), details: { id, newZone } }],
                  selection: id
              };
              commitState(nextState);
              setSelectedId(id);
              return [...prev, nextState];
          });

          if (!found) return { success: false, error: 'Record not found or archived' };
          return { success: true };
        }
        case "entity_undo": {
          let undone = false;
          setHistoryStack((prev: SessionState[]) => {
              if (prev.length <= 1) return prev;
              undone = true;
              const newStack = [...prev];
              newStack.pop();
              const prevState = newStack[newStack.length - 1];
              commitState(prevState);
              setSelectedId(prevState.selection);
              return newStack;
          });
          return { success: undone };
        }
        case "artifact_export_session_json": {
           const exportData = {
              ...state,
              exportedAt: new Date().toISOString()
           };
           // Do not export selection as it's UI state, just the model
           delete (exportData as any).selection;
           return { success: true, artifact: exportData };
        }
        case "artifact_import_session_json": {
            if (args.artifact?.schemaVersion !== 'v1' || !Array.isArray(args.artifact?.records)) {
                return { success: false, error: 'Invalid schema' };
            }
            // Add basic validation
            const isValid = args.artifact.records.every((r: any) =>
               r.id && r.title && typeof r.weight_kg === 'number'
            );
            if (!isValid) return { success: false, error: 'Validation failed' };

            const newState = {
                ...args.artifact,
                exportedAt: new Date().toISOString(),
                selection: null
            };

            commitState(newState);
            setHistoryStack([newState]);
            setSelectedId(null);

            return { success: true };
        }
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    };
  }, [state, commitState, historyStack, setHistoryStack, selectedId, setSelectedId]);

  return null;
}

function calculateDerived(records: WasteEvent[]): DerivedState {
    const total_weight = records.reduce((sum, r) => sum + (r.status !== 'archived' ? r.weight_kg : 0), 0);
    const capacity_usage_percent = Math.min(100, (total_weight / MAX_CAPACITY_KG) * 100);

    const zone_distribution = { staging: 0, processing: 0, storage: 0, unassigned: 0 };
    records.forEach(r => {
        if (r.status !== 'archived' && r.geometry?.zone) {
            zone_distribution[r.geometry.zone] = (zone_distribution[r.geometry.zone] || 0) + 1;
        }
    });

    return {
        total_weight,
        capacity_usage_percent,
        zone_distribution,
        last_rebalance: new Date().toISOString()
    };
}


export default function App() {
  const [state, setState] = useState<SessionState>(INITIAL_STATE);
  const [historyStack, setHistoryStack] = useState<SessionState[]>([INITIAL_STATE]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<WasteEvent>>({});
  const [filter, setFilter] = useState<EventStatus | 'all'>('all');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const _commitState = useCallback((newState: SessionState) => {
      setState(newState);
  }, []);

  const handleSelectId = (id: string | null) => {
      setSelectedId(id);
      // We don't push to history on just selection change unless we want to track it that way,
      // but to satisfy "Undo restores ordering, selection", the state itself stores selection.
      if (historyStack.length > 0) {
          const current = historyStack[historyStack.length - 1];
          if (current.selection !== id) {
              const updatedState = { ...current, selection: id };
              setState(updatedState);
              setHistoryStack(prev => {
                  const newStack = [...prev];
                  newStack[newStack.length - 1] = updatedState;
                  return newStack;
              });
          }
      }
  };

  const undo = useCallback(() => {
      if (historyStack.length > 1) {
          setHistoryStack(prev => {
              if (prev.length <= 1) return prev;
              const newStack = [...prev];
              newStack.pop();
              const prevState = newStack[newStack.length - 1];
              setState(prevState);
              setSelectedId(prevState.selection);
              return newStack;
          });
      }
  }, [historyStack]);

  // Keyboard undo support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  const handleCreate = () => {
    const newRecord: WasteEvent = {
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: 'New Event',
        status: 'draft',
        weight_kg: 0,
        volume: 'low',
        collection_date: new Date().toISOString().split('T')[0],
        source: '',
        geometry: { x: 50, y: 50, width: 100, height: 100, zone: 'unassigned' }
    };
    setEditingId(newRecord.id);
    setEditForm(newRecord);
  };

  const handleSave = () => {
      // Validate
      const newErrors: Record<string, string> = {};
      if (!editForm.title?.trim()) newErrors.title = 'Title is required';
      if (editForm.weight_kg === undefined || editForm.weight_kg < 0 || editForm.weight_kg > 100000) {
          newErrors.weight_kg = 'Weight must be between 0 and 100,000 kg';
      }
      if (!editForm.source?.trim()) newErrors.source = 'Source is required';

      if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          return;
      }

      const existingRecord = state.records.find(r => r.id === editForm.id);
      let nextRecords = [...state.records];

      if (existingRecord) {
          nextRecords = nextRecords.map(r => r.id === editForm.id ? { ...r, ...editForm } as WasteEvent : r);
      } else {
          nextRecords.push(editForm as WasteEvent);
      }

      const nextDerived = calculateDerived(nextRecords);
      const nextState: SessionState = {
          ...state,
          records: nextRecords,
          derived: nextDerived,
          history: [...state.history, { type: existingRecord ? 'update' : 'create', timestamp: new Date().toISOString(), details: { id: editForm.id } }],
          selection: editForm.id || null
      };

      setState(nextState);
      setHistoryStack(prev => [...prev, nextState]);
      setSelectedId(editForm.id || null);

      setEditingId(null);
      setEditForm({});
      setErrors({});
  };

  const handleArchive = (id: string) => {
      const nextRecords = state.records.map(r => r.id === id ? { ...r, status: 'archived' as EventStatus } : r);
      const nextDerived = calculateDerived(nextRecords);

      const nextState = {
          ...state,
          records: nextRecords,
          derived: nextDerived,
          history: [...state.history, { type: 'archive', timestamp: new Date().toISOString(), details: { id } }],
          selection: selectedId === id ? null : selectedId
      };

      setState(nextState);
      setHistoryStack(prev => [...prev, nextState]);
      if (selectedId === id) setSelectedId(null);
  };

  const handleExport = () => {
      const exportData = {
          ...state,
          exportedAt: new Date().toISOString()
      };
      delete (exportData as any).selection;

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'waste-diversion-v1-spatial-composer.json';
      a.click();
      URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const data = JSON.parse(e.target?.result as string) as SessionState;
              if (data.schemaVersion !== 'v1') throw new Error('Invalid schema version');
              if (!Array.isArray(data.records)) throw new Error('Invalid records array');

              // Validate all records
              data.records.forEach(r => {
                 if (typeof r.weight_kg !== 'number' || r.weight_kg < 0 || r.weight_kg > 100000) {
                     throw new Error(`Invalid weight for record ${r.id}`);
                 }
                 if (!['low', 'medium', 'high', 'critical'].includes(r.volume)) {
                     throw new Error(`Invalid volume for record ${r.id}`);
                 }
              });

              const newState = {
                  ...data,
                  exportedAt: new Date().toISOString(),
                  selection: null
              };

              setState(newState);
              setHistoryStack([newState]);
              setSelectedId(null);
          } catch (err: any) {
              alert(`Import failed: ${err.message}`);
          }
      };
      reader.readAsText(file);
      e.target.value = ''; // Reset
  };

  // Spatial Composer - Canonical Mutation
  const handleRebalanceCapacity = () => {
      if (!selectedId) return;

      const record = state.records.find(r => r.id === selectedId);
      if (!record || record.status === 'archived') return;

      const newZone = record.geometry.zone === 'staging' ? 'processing' :
                      record.geometry.zone === 'processing' ? 'storage' :
                      'staging';

      const nextRecords = state.records.map(r => {
          if (r.id === selectedId) {
              return {
                  ...r,
                  status: 'changed' as EventStatus,
                  geometry: {
                      ...r.geometry,
                      zone: newZone,
                      x: Math.random() * 200,
                      y: Math.random() * 200
                  }
              };
          }
          return r;
      });

      const nextDerived = calculateDerived(nextRecords);
      const nextState = {
          ...state,
          records: nextRecords,
          derived: nextDerived,
          history: [...state.history, { type: 'rebalance', timestamp: new Date().toISOString(), details: { id: selectedId, newZone } }],
          selection: selectedId
      };

      setState(nextState);
      setHistoryStack(prev => [...prev, nextState]);
  };

  const filteredRecords = state.records.filter(r => filter === 'all' || r.status === filter);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800 font-sans">
      <WebMCPContract state={state} commitState={_commitState} historyStack={historyStack} setHistoryStack={setHistoryStack} selectedId={selectedId} setSelectedId={setSelectedId} />

      {/* Sidebar: Derived Summary & Controls */}
      <aside className="w-full md:w-80 bg-white border-r border-slate-200 p-6 flex flex-col shrink-0">
         <div className="flex items-center gap-2 mb-8 text-emerald-700">
             <Box className="w-6 h-6" />
             <h1 className="text-xl font-bold">Waste Diversion Tracker</h1>
         </div>

         <div className="space-y-6">
             <section className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                 <h2 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Facility Capacity</h2>
                 <div className="flex items-end gap-2 mb-2">
                     <span className="text-3xl font-light text-slate-700">{state.derived.capacity_usage_percent.toFixed(1)}%</span>
                     <span className="text-sm text-slate-400 mb-1">utilized</span>
                 </div>
                 <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                     <div
                        className={`h-full rounded-full transition-all duration-500 ${state.derived.capacity_usage_percent > 90 ? 'bg-red-500' : state.derived.capacity_usage_percent > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(100, state.derived.capacity_usage_percent)}%` }}
                     />
                 </div>
                 <div className="mt-3 text-sm text-slate-600 font-medium">
                     Total Weight: {(state.derived.total_weight / 1000).toFixed(2)}t
                 </div>
             </section>

             <section>
                 <h2 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Zone Distribution</h2>
                 <div className="space-y-2">
                     {Object.entries(state.derived.zone_distribution).map(([zone, count]) => (
                         <div key={zone} className="flex justify-between items-center text-sm">
                             <span className="capitalize text-slate-600">{zone}</span>
                             <span className="font-medium bg-slate-100 px-2 py-0.5 rounded-md text-slate-700">{count}</span>
                         </div>
                     ))}
                 </div>
             </section>

             <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                 <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                     <Download className="w-4 h-4" /> Export
                 </button>
                 <label className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer">
                     <Upload className="w-4 h-4" /> Import
                     <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                 </label>
                 <button
                    onClick={undo}
                    disabled={historyStack.length <= 1}
                    className="w-full flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                 >
                     <RotateCcw className="w-4 h-4" /> Undo (Ctrl+Z)
                 </button>
             </div>
         </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">

          {/* Spatial Composer Canvas */}
          <div className="h-64 md:h-96 bg-slate-100 relative overflow-hidden border-b border-slate-200 shrink-0 shadow-inner">
             {/* Zones */}
             <div className="absolute inset-0 flex">
                 <div className="flex-1 border-r border-slate-200/50 bg-amber-50/30 flex items-center justify-center opacity-50"><span className="text-amber-700 font-medium tracking-widest uppercase">Staging</span></div>
                 <div className="flex-1 border-r border-slate-200/50 bg-blue-50/30 flex items-center justify-center opacity-50"><span className="text-blue-700 font-medium tracking-widest uppercase">Processing</span></div>
                 <div className="flex-1 bg-emerald-50/30 flex items-center justify-center opacity-50"><span className="text-emerald-700 font-medium tracking-widest uppercase">Storage</span></div>
             </div>

             {/* Events on Canvas */}
             {state.records.filter(r => r.status !== 'archived').map(record => {
                 const zoneMap = { staging: 0, processing: 1, storage: 2, unassigned: 0 };
                 const leftOffset = (zoneMap[record.geometry.zone] * 33.33) + (record.geometry.x % 20); // rough positioning
                 const isSelected = selectedId === record.id;

                 return (
                     <div
                        key={record.id}
                        className={`absolute w-12 h-12 md:w-16 md:h-16 rounded-lg shadow-sm border flex items-center justify-center cursor-pointer transition-all duration-500 ${isSelected ? 'ring-2 ring-indigo-500 scale-110 z-10' : 'hover:scale-105 z-0'} ${record.status === 'changed' ? 'bg-indigo-100 border-indigo-300' : 'bg-white border-slate-300'}`}
                        style={{
                            left: `${leftOffset}%`,
                            top: `${20 + (record.geometry.y % 60)}%`
                        }}
                        onClick={() => handleSelectId(record.id)}
                     >
                        <Box className={`w-6 h-6 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                     </div>
                 );
             })}
          </div>

          {/* Action Bar */}
          <div className="bg-white px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                  <select
                     value={filter}
                     onChange={(e) => setFilter(e.target.value as any)}
                     className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                      <option value="all">All Events</option>
                      <option value="draft">Drafts</option>
                      <option value="ready">Ready</option>
                      <option value="changed">Changed</option>
                      <option value="archived">Archived</option>
                  </select>
              </div>

              <div className="flex items-center gap-3">
                  <button
                     onClick={handleRebalanceCapacity}
                     disabled={!selectedId}
                     className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm border border-indigo-100"
                  >
                      Place in Spatial Composer
                  </button>
                  <button
                     onClick={handleCreate}
                     className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                  >
                      Add Event
                  </button>
              </div>
          </div>

          {/* Table / List */}
          <div className="flex-1 overflow-auto bg-white p-6">
              {filteredRecords.length === 0 ? (
                  <div className="text-center py-16 text-slate-500">
                      <Box className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                      <p className="text-lg font-medium">No waste events found.</p>
                      <p className="text-sm mt-1">Create a new event to get started.</p>
                  </div>
              ) : (
                  <div className="space-y-3">
                      {filteredRecords.map(record => (
                          <div
                             key={record.id}
                             className={`bg-white border rounded-xl p-4 transition-all ${selectedId === record.id ? 'border-indigo-400 shadow-md ring-1 ring-indigo-400' : 'border-slate-200 hover:border-slate-300'} ${record.status === 'archived' ? 'opacity-60' : ''}`}
                             onClick={() => handleSelectId(record.id)}
                          >
                              {editingId === record.id ? (
                                  <div className="space-y-4" onClick={e => e.stopPropagation()}>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div>
                                              <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
                                              <input type="text" value={editForm.title || ''} onChange={e => {setEditForm({...editForm, title: e.target.value}); setErrors({...errors, title: ''})}} className={`w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 ${errors.title ? 'border-red-400' : 'border-slate-300'}`} />
                                              {errors.title && <span className="text-xs text-red-500 mt-1">{errors.title}</span>}
                                          </div>
                                          <div>
                                              <label className="block text-xs font-medium text-slate-500 mb-1">Source</label>
                                              <input type="text" value={editForm.source || ''} onChange={e => {setEditForm({...editForm, source: e.target.value}); setErrors({...errors, source: ''})}} className={`w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 ${errors.source ? 'border-red-400' : 'border-slate-300'}`} />
                                              {errors.source && <span className="text-xs text-red-500 mt-1">{errors.source}</span>}
                                          </div>
                                          <div>
                                              <label className="block text-xs font-medium text-slate-500 mb-1">Weight (kg)</label>
                                              <input type="number" min="0" max="100000" value={editForm.weight_kg ?? 0} onChange={e => {setEditForm({...editForm, weight_kg: parseFloat(e.target.value)}); setErrors({...errors, weight_kg: ''})}} className={`w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 ${errors.weight_kg ? 'border-red-400' : 'border-slate-300'}`} />
                                              {errors.weight_kg && <span className="text-xs text-red-500 mt-1">{errors.weight_kg}</span>}
                                          </div>
                                          <div>
                                              <label className="block text-xs font-medium text-slate-500 mb-1">Volume Category</label>
                                              <select value={editForm.volume || 'low'} onChange={e => setEditForm({...editForm, volume: e.target.value as VolumeCategory})} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50">
                                                  <option value="low">Low</option>
                                                  <option value="medium">Medium</option>
                                                  <option value="high">High</option>
                                                  <option value="critical">Critical</option>
                                              </select>
                                          </div>
                                      </div>
                                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                          <button onClick={() => {setEditingId(null); setErrors({});}} className="px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-md font-medium">Cancel</button>
                                          <button onClick={handleSave} className="px-4 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-medium">Save</button>
                                      </div>
                                  </div>
                              ) : (
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                      <div className="flex-1">
                                          <div className="flex items-center gap-3 mb-1">
                                              <h3 className="font-semibold text-slate-800">{record.title}</h3>
                                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${record.status === 'draft' ? 'bg-slate-100 text-slate-600' : record.status === 'ready' ? 'bg-emerald-100 text-emerald-700' : record.status === 'changed' ? 'bg-indigo-100 text-indigo-700' : 'bg-red-100 text-red-700'}`}>
                                                  {record.status}
                                              </span>
                                              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium uppercase tracking-wider">
                                                  {record.geometry.zone}
                                              </span>
                                          </div>
                                          <div className="text-sm text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                                              <span>Source: {record.source}</span>
                                              <span>Weight: {record.weight_kg}kg</span>
                                              <span>Vol: {record.volume}</span>
                                              <span>Date: {record.collection_date}</span>
                                          </div>
                                      </div>

                                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ opacity: selectedId === record.id ? 1 : undefined }}>
                                          <button
                                              onClick={(e) => { e.stopPropagation(); setEditingId(record.id); setEditForm(record); setErrors({}); }}
                                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                              title="Edit"
                                          >
                                              <Edit2 className="w-4 h-4" />
                                          </button>
                                          {record.status !== 'archived' && (
                                              <button
                                                  onClick={(e) => { e.stopPropagation(); handleArchive(record.id); }}
                                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                  title="Archive"
                                              >
                                                  <Trash2 className="w-4 h-4" />
                                              </button>
                                          )}
                                      </div>
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>
              )}
          </div>
      </main>
    </div>
  );
}
