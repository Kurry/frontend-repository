import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Plus, Archive, Trash2, Edit2, Check, X, AlertCircle, Undo2, ArrowRight, Download, Upload, FileJson } from 'lucide-react';

const STATUSES = ['empty', 'draft', 'ready', 'changed', 'archived'];

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

const initialRecords = [
  { id: '1', name: 'Math Station 1', capacity: 5, status: 'ready', type: 'instruction', duration: 15 },
  { id: '2', name: 'Reading Corner', capacity: 10, status: 'draft', type: 'independent', duration: 20 },
  { id: '3', name: 'Science Lab', capacity: 4, status: 'archived', type: 'experiment', duration: 30 },
  { id: '4', name: 'New Station', capacity: 0, status: 'empty', type: 'instruction', duration: 10 },
  { id: '5', name: 'Conflicting Station', capacity: 15, status: 'changed', type: 'independent', duration: 25 },
];

function RecordEditor({ record, onSave, onCancel }) {
  const [formData, setFormData] = useState(record || { name: '', capacity: 0, status: 'draft', type: 'independent', duration: 15 });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let parsedValue = value;
    if (type === 'number') {
      parsedValue = parseInt(value, 10);
      if (isNaN(parsedValue)) parsedValue = 0;
    }
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
  };

  const handleSave = () => {
    if (formData.capacity < 0) return setError("Capacity cannot be negative");
    if (formData.duration <= 0) return setError("Duration must be greater than 0");
    if (formData.name.trim() === "") return setError("Name is required");
    setError(null);
    onSave(formData);
  };

  return (
    <div className="border border-indigo-200 rounded-lg p-4 bg-indigo-50/50 relative shadow-sm">
      <h3 className="font-semibold text-lg mb-3">{record ? 'Edit Station' : 'New Station'}</h3>
      {error && <div className="bg-red-50 text-red-700 p-2 rounded flex items-center gap-2 mb-3 text-sm"><AlertCircle size={16} />{error}</div>}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700">Name</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border rounded p-1.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700">Capacity</label>
            <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} className="w-full border rounded p-1.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none" min="0" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Duration (min)</label>
            <input type="number" name="duration" value={formData.duration} onChange={handleChange} className="w-full border rounded p-1.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none" min="1" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700">Status</label>
            <select name="status" value={formData.status} onChange={handleChange} className="w-full border rounded p-1.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Type</label>
            <select name="type" value={formData.type} onChange={handleChange} className="w-full border rounded p-1.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="instruction">Instruction</option>
              <option value="independent">Independent</option>
              <option value="experiment">Experiment</option>
              <option value="collaboration">Collaboration</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 pt-2 justify-end">
          <button onClick={onCancel} className="px-3 py-1.5 text-sm border rounded bg-white hover:bg-gray-50 flex items-center gap-1 text-gray-700"><X size={14} /> Cancel</button>
          <button onClick={handleSave} className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-1 shadow-sm"><Check size={14} /> Save</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [records, setRecords] = useState(initialRecords);
  const [history, setHistory] = useState([]);

  // States: idle, selected, changed, conflict, resolved
  const [forecastState, setForecastState] = useState('idle');
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [forecastMutation, setForecastMutation] = useState(0); // diff in duration
  const [conflictError, setConflictError] = useState(null);

  const [filterStatus, setFilterStatus] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Keyboard undo (Ctrl/Cmd + Z)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history]);

  const pushHistory = useCallback((newRecords, ribbonStateUpdate = null) => {
    setHistory(prev => [...prev, {
      records,
      forecastState,
      selectedRecordId,
      forecastMutation,
      timestamp: new Date().toISOString()
    }].slice(-50));
    setRecords(newRecords);
    if (ribbonStateUpdate) {
      if (ribbonStateUpdate.forecastState !== undefined) setForecastState(ribbonStateUpdate.forecastState);
      if (ribbonStateUpdate.selectedRecordId !== undefined) setSelectedRecordId(ribbonStateUpdate.selectedRecordId);
      if (ribbonStateUpdate.forecastMutation !== undefined) setForecastMutation(ribbonStateUpdate.forecastMutation);
    }
  }, [records, forecastState, selectedRecordId, forecastMutation]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setRecords(lastState.records);
    setForecastState(lastState.forecastState);
    setSelectedRecordId(lastState.selectedRecordId);
    setForecastMutation(lastState.forecastMutation);
    setHistory(prev => prev.slice(0, -1));
    setConflictError(null);
  }, [history]);

  const handleSaveCreate = useCallback((newRecord) => {
    pushHistory([...records, { ...newRecord, id: generateId() }]);
    setIsCreating(false);
  }, [records, pushHistory]);

  const handleSaveEdit = useCallback((updatedRecord) => {
    pushHistory(records.map((r) => (r.id === updatedRecord.id ? updatedRecord : r)));
    setEditingId(null);
    if (selectedRecordId === updatedRecord.id) {
       setForecastState('idle');
       setForecastMutation(0);
       setSelectedRecordId(null);
    }
  }, [records, pushHistory, selectedRecordId]);

  const handleArchiveRecord = useCallback((id) => {
    pushHistory(records.map((r) => (r.id === id ? { ...r, status: 'archived' } : r)));
    if (selectedRecordId === id) {
       setForecastState('idle');
       setSelectedRecordId(null);
    }
  }, [records, pushHistory, selectedRecordId]);

  const handleDeleteRecord = useCallback((id) => {
    pushHistory(records.filter((r) => r.id !== id));
    if (selectedRecordId === id) {
       setForecastState('idle');
       setSelectedRecordId(null);
    }
  }, [records, pushHistory, selectedRecordId]);

  // --- Forecast Ribbon Signature Interaction ---

  const selectedRecord = useMemo(() =>
    records.find(r => r.id === selectedRecordId),
  [records, selectedRecordId]);

  const derivedSummary = useMemo(() => {
    const active = records.filter(r => r.status !== 'archived');
    const totalDuration = active.reduce((sum, r) => sum + r.duration, 0);
    const totalCapacity = active.reduce((sum, r) => sum + r.capacity, 0);

    // Calculate projected values if we have a valid mutation
    const projectedDuration = (selectedRecordId && forecastState === 'changed')
      ? totalDuration + forecastMutation
      : totalDuration;

    return {
      activeCount: active.length,
      totalDuration,
      totalCapacity,
      projectedDuration
    };
  }, [records, selectedRecordId, forecastState, forecastMutation]);

  const handleSelectForForecast = useCallback((id) => {
    setSelectedRecordId(id);
    setForecastState('selected');
    setForecastMutation(0);
    setConflictError(null);
  }, []);

  const handleAdjustForecast = useCallback((mutationDelta) => {
    if (!selectedRecord) return;
    setForecastState('changed');
    setForecastMutation(mutationDelta);
    setConflictError(null);
  }, [selectedRecord]);

  const handleApplyForecast = useCallback(() => {
    if (!selectedRecord) return;

    // Conflict rules: cannot reduce duration below 5. cannot exceed total projected of 120 (example bounds).
    const newDuration = selectedRecord.duration + forecastMutation;
    if (newDuration < 5) {
      setForecastState('conflict');
      setConflictError("Station duration cannot be less than 5 minutes.");
      return;
    }

    if (derivedSummary.projectedDuration > 120) {
      setForecastState('conflict');
      setConflictError("Total schedule exceeds 120 minutes maximum.");
      return;
    }

    // Apply mutation
    const updatedRecord = {
      ...selectedRecord,
      duration: newDuration,
      status: 'changed'
    };

    pushHistory(
      records.map(r => r.id === selectedRecord.id ? updatedRecord : r),
      { forecastState: 'resolved', forecastMutation: 0 }
    );

  }, [selectedRecord, forecastMutation, derivedSummary, records, pushHistory]);

  const handleCancelForecast = useCallback(() => {
    setForecastState('idle');
    setSelectedRecordId(null);
    setForecastMutation(0);
    setConflictError(null);
  }, []);



  // --- WebMCP Contracts ---
  useEffect(() => {
    const handlers = {
      "entity.create": (args) => {
         const newId = generateId();
         const record = { id: newId, status: 'empty', type: 'instruction', duration: 10, ...args.fields };
         setRecords(prev => [...prev, record]);
         return { ok: true, status: "created", public_ids: [newId] };
      },
      "entity.update": (args) => {
         setRecords(prev => prev.map(r => r.id === args.id ? { ...r, ...args.fields } : r));
         return { ok: true, status: "updated", public_ids: [args.id] };
      },
      "entity.select": (args) => {
         setSelectedRecordId(args.id);
         setForecastState('selected');
         setForecastMutation(0);
         return { ok: true, status: "selected", public_ids: [args.id] };
      },
      "browse.open": (args) => {
         if (args.destination) setFilterStatus(args.destination);
         return { ok: true, status: "opened", navigation_epoch: Date.now() };
      },
      "artifact.export": (args) => {
         const artifact = {
           schemaVersion: "v1",
           exportedAt: new Date().toISOString(),
           records: records,
           derived: derivedSummary,
           history: history
         };
         return { ok: true, status: "exported", artifact: artifact, navigation_epoch: Date.now() };
      },
      "artifact.import": (args) => {
         const data = args.artifact;
         if (!data || data.schemaVersion !== "v1" || !Array.isArray(data.records)) {
             return { ok: false, status: "invalid_format", navigation_epoch: Date.now() };
         }

         const ids = new Set();
         for (const r of data.records) {
            if (!r.id || !r.name || typeof r.capacity !== 'number' || typeof r.duration !== 'number') {
               return { ok: false, status: "invalid_records", navigation_epoch: Date.now() };
            }
            if (ids.has(r.id)) return { ok: false, status: "duplicate_ids", navigation_epoch: Date.now() };
            ids.add(r.id);
         }

         setRecords(data.records);
         setHistory(Array.isArray(data.history) ? data.history : []);
         setForecastState('idle');
         setSelectedRecordId(null);
         setForecastMutation(0);
         setConflictError(null);
         return { ok: true, status: "imported", navigation_epoch: Date.now() };
      }
    };

    window.webmcp_session_info = async () => ({
      contract_version: "zto-webmcp-v1",
      modules: ["entity-collection-v1", "artifact-transfer-v1", "browse-query-v1"],
      tools: Object.keys(handlers)
    });

    window.webmcp_list_tools = async () => Object.keys(handlers).map(name => ({ name }));

    window.webmcp_invoke_tool = async (request, separateArguments = {}) => {
      const name = typeof request === "string" ? request : request?.name;
      const args = typeof request === "string" ? separateArguments : request?.arguments || request?.args || request || {};
      const handler = handlers[name];
      if (!handler) throw new Error(`Tool ${name} not found`);
      return handler(args);
    };

    window.webmcp = {
      sessionInfo: window.webmcp_session_info,
      listTools: window.webmcp_list_tools,
      invokeTool: window.webmcp_invoke_tool
    };
  }, []);

  // --- Portable Work Artifact ---
  const fileInputRef = useRef(null);

  const handleExport = useCallback(() => {
    const artifact = {
      schemaVersion: "v1",
      exportedAt: new Date().toISOString(),
      records: records,
      derived: derivedSummary,
      history: history
    };

    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "classroom-rotations-v1-forecast-ribbon.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [records, derivedSummary, history]);

  const handleImport = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.schemaVersion !== "v1" || !Array.isArray(data.records)) {
          alert("Invalid import format. Missing schemaVersion v1 or records array.");
          return;
        }

        // Basic validation: duplicate IDs, missing required fields
        const ids = new Set();
        let valid = true;
        for (const r of data.records) {
           if (!r.id || !r.name || typeof r.capacity !== 'number' || typeof r.duration !== 'number') {
              valid = false;
              break;
           }
           if (ids.has(r.id)) {
              valid = false;
              break;
           }
           ids.add(r.id);
        }

        if (!valid) {
          alert("Import failed: malformed records or duplicate IDs.");
          return;
        }

        // Apply successful import
        setRecords(data.records);
        setHistory(Array.isArray(data.history) ? data.history : []);
        setForecastState('idle');
        setSelectedRecordId(null);
        setForecastMutation(0);
        setConflictError(null);
      } catch (err) {
        alert("Failed to parse JSON artifact.");
      }

      // Reset input
      if (fileInputRef.current) {
         fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  }, []);

  const filteredRecords = useMemo(() => {
    if (filterStatus === 'all') return records;
    return records.filter((r) => r.status === filterStatus);
  }, [records, filterStatus]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'draft': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'changed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'empty': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row">
      {/* Main Content Area */}
      <div className="flex-1 p-6 flex flex-col space-y-6 overflow-y-auto">

        <header className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">Classroom Stations</h1>
            <p className="text-sm text-slate-500">Manage rotation collections</p>
          </div>


          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 rounded-md p-1 border border-slate-200">
               <button onClick={handleExport} className="px-2 py-1 rounded text-sm text-slate-600 hover:bg-white hover:shadow-sm transition-all flex items-center gap-1" title="Export JSON"><Download size={14}/> Export</button>
               <button onClick={() => fileInputRef.current?.click()} className="px-2 py-1 rounded text-sm text-slate-600 hover:bg-white hover:shadow-sm transition-all flex items-center gap-1" title="Import JSON"><Upload size={14}/> Import</button>
               <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
            </div>

            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className="px-3 py-2 rounded-md shadow-sm text-sm font-medium flex items-center gap-2 border bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={16} /> Undo
            </button>
            <div className="flex items-center gap-2 border-l pl-4 border-slate-200">
              <label className="text-sm font-medium text-slate-600">Filter:</label>
              <select
                className="border-slate-300 rounded-md text-sm py-1.5 pl-3 pr-8 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white border"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <button
              onClick={() => setIsCreating(true)}
              disabled={isCreating}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
            >
              <Plus size={16} /> New Station
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          {isCreating && (
            <RecordEditor
              onSave={handleSaveCreate}
              onCancel={() => setIsCreating(false)}
            />
          )}

          {filteredRecords.map((r) => (
            editingId === r.id ? (
              <RecordEditor
                key={r.id}
                record={r}
                onSave={handleSaveEdit}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div
                key={r.id}
                className={`group rounded-xl p-5 shadow-sm border transition-all flex flex-col h-full cursor-pointer relative
                  ${selectedRecordId === r.id
                    ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-200 ring-offset-1 transform scale-[1.02]'
                    : 'bg-white border-slate-200 hover:shadow-md hover:border-indigo-200'
                  }`}
                onClick={() => handleSelectForForecast(r.id)}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-slate-800 truncate pr-2" title={r.name}>{r.name}</h3>
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full border ${getStatusColor(r.status)}`}>
                    {r.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-y-2 mb-4 text-sm flex-grow">
                  <div className="text-slate-500">Capacity:</div>
                  <div className="font-medium text-slate-700 text-right">{r.capacity}</div>

                  <div className="text-slate-500">Duration:</div>
                  <div className="font-medium text-slate-700 text-right flex items-center justify-end gap-1">
                     {r.duration} min
                     {selectedRecordId === r.id && forecastState === 'changed' && forecastMutation !== 0 && (
                        <span className={`text-xs px-1 rounded font-bold ${forecastMutation > 0 ? 'text-green-600 bg-green-100' : 'text-rose-600 bg-rose-100'}`}>
                           {forecastMutation > 0 ? '+' : ''}{forecastMutation}
                        </span>
                     )}
                  </div>

                  <div className="text-slate-500">Type:</div>
                  <div className="font-medium text-slate-700 text-right capitalize">{r.type}</div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setEditingId(r.id)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  {r.status !== 'archived' && (
                    <button
                      onClick={() => handleArchiveRecord(r.id)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                      title="Archive"
                    >
                      <Archive size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteRecord(r.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )
          ))}
        </div>
      </div>

      {/* Right Sidebar: Linked Derived Summary & Forecast Ribbon */}
      <div className="w-full md:w-80 bg-white border-l border-slate-200 p-6 flex flex-col shrink-0">
        <h2 className="text-lg font-bold text-slate-800 mb-6">Derived Summary</h2>

        <div className="space-y-4 mb-8">
          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-sm font-medium text-slate-600">Active Stations</span>
            <span className="text-lg font-bold text-slate-800">{derivedSummary.activeCount}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-sm font-medium text-slate-600">Total Capacity</span>
            <span className="text-lg font-bold text-slate-800">{derivedSummary.totalCapacity}</span>
          </div>

          <div className={`p-4 rounded-lg border transition-colors ${forecastState === 'changed' ? 'bg-indigo-50 border-indigo-200 shadow-inner' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-slate-600">Total Duration</span>
              <span className="text-xl font-bold text-slate-800">{derivedSummary.totalDuration} <span className="text-sm font-normal text-slate-500">min</span></span>
            </div>

            {forecastState === 'changed' && (
               <div className="flex justify-between items-center mt-2 pt-2 border-t border-indigo-200">
                  <span className="text-sm font-medium text-indigo-700 flex items-center gap-1"><ArrowRight size={14}/> Projected</span>
                  <span className={`text-lg font-bold ${derivedSummary.projectedDuration > 120 ? 'text-rose-600' : 'text-indigo-700'}`}>
                     {derivedSummary.projectedDuration} <span className="text-xs font-normal opacity-80">min</span>
                  </span>
               </div>
            )}
          </div>
        </div>

        {/* Forecast Ribbon Work Surface */}
        <div className="mt-auto">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Forecast Ribbon</h3>

          {forecastState === 'idle' && (
            <div className="p-4 border border-dashed border-slate-300 rounded-lg text-center bg-slate-50 text-slate-500 text-sm">
              Select a station card to forecast adjustments.
            </div>
          )}

          {(forecastState === 'selected' || forecastState === 'changed' || forecastState === 'conflict' || forecastState === 'resolved') && selectedRecord && (
            <div className={`p-4 rounded-lg border shadow-sm transition-all
              ${forecastState === 'conflict' ? 'bg-rose-50 border-rose-300' : 'bg-white border-indigo-200 ring-1 ring-indigo-100'}
            `}>
              <div className="flex justify-between items-start mb-4">
                 <h4 className="font-semibold text-slate-800 truncate">{selectedRecord.name}</h4>
                 <button onClick={handleCancelForecast} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
              </div>

              <div className="flex flex-col gap-3 mb-4">
                <div className="flex items-center justify-between">
                   <span className="text-sm text-slate-600">Current</span>
                   <span className="font-mono text-sm">{selectedRecord.duration}m</span>
                </div>
                <div className="flex items-center justify-between">
                   <span className="text-sm text-slate-600">Adjust</span>
                   <div className="flex items-center gap-1">
                      <button onClick={() => handleAdjustForecast(forecastMutation - 5)} className="w-8 h-8 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold">-5</button>
                      <span className="font-mono w-12 text-center text-sm font-medium">
                        {forecastMutation > 0 ? '+' : ''}{forecastMutation}
                      </span>
                      <button onClick={() => handleAdjustForecast(forecastMutation + 5)} className="w-8 h-8 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold">+5</button>
                   </div>
                </div>
              </div>

              {forecastState === 'conflict' && (
                 <div className="mb-4 p-2 bg-rose-100 text-rose-800 text-xs rounded border border-rose-200 flex items-start gap-1.5">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{conflictError}</span>
                 </div>
              )}

              {forecastState === 'resolved' && (
                 <div className="mb-4 p-2 bg-emerald-100 text-emerald-800 text-xs rounded border border-emerald-200 flex items-center gap-1.5">
                    <Check size={14} />
                    <span>Applied successfully.</span>
                 </div>
              )}

              <button
                onClick={handleApplyForecast}
                disabled={forecastState !== 'changed' && forecastState !== 'conflict'}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium disabled:opacity-50 disabled:bg-slate-300 disabled:text-slate-500 transition-colors"
              >
                Apply Projection
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
