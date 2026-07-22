import React, { useState, useEffect, useRef } from 'react';
import AuditLens from './AuditLens';
import WebMCP from './WebMCP';

const INIT_STATE = {
  schemaVersion: "v1",
  exportedAt: null,
  records: [
    { id: "r-1", status: "draft", evidence: "", audit_discrepancy: "", value: 45, date: "2026-07-20", location: "Living Room", auditLensState: "idle" },
    { id: "r-2", status: "ready", evidence: "sensor_log.txt", audit_discrepancy: "needs-review", value: 120, date: "2026-07-21", location: "Kitchen", auditLensState: "idle" },
    { id: "r-3", status: "archived", evidence: "", audit_discrepancy: "", value: 15, date: "2026-07-18", location: "Bedroom", auditLensState: "idle" }
  ],
  derived: { summary: "3 readings total" },
  history: []
};

// Seed 100+ records for performance check
const seedLargeCollection = (records) => {
  const newRecords = [...records];
  for (let i = 4; i <= 105; i++) {
    newRecords.push({
      id: `r-${i}`,
      status: i % 2 === 0 ? "ready" : "draft",
      evidence: "",
      audit_discrepancy: "",
      value: Math.floor(Math.random() * 100),
      date: "2026-07-22",
      location: `Zone ${i}`,
      auditLensState: "idle"
    });
  }
  return newRecords;
};

export default function App() {
  const [state, setState] = useState(() => {
    return { ...INIT_STATE, records: seedLargeCollection(INIT_STATE.records) };
  });

  const [filter, setFilter] = useState("all");
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [importText, setImportText] = useState("");

  const updateDerivedState = (records) => {
    const total = records.length;
    const ready = records.filter(r => r.status === 'ready').length;
    const draft = records.filter(r => r.status === 'draft').length;
    return `Total: ${total}, Ready: ${ready}, Draft: ${draft}`;
  };

  const commitState = (newState) => {
    setState(prev => {
      const derived = { summary: updateDerivedState(newState.records) };
      return {
        ...newState,
        derived,
        history: [...prev.history, { action: 'update', timestamp: new Date().toISOString(), previousState: prev }]
      };
    });
  };

  const handleUndo = () => {
    setState(prev => {
      if (prev.history.length === 0) return prev;
      const lastHistoryEntry = prev.history[prev.history.length - 1];
      if (lastHistoryEntry.previousState) {
        return lastHistoryEntry.previousState;
      }
      return prev;
    });
  };

  const handleExport = () => {
    const exportState = { ...state, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(exportState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'air-quality-v1-audit-lens.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(importText);
      if (data.schemaVersion === "v1" && Array.isArray(data.records)) {
        setState({ ...data, exportedAt: new Date().toISOString() });
        setImportText("");
      } else {
        alert("Invalid schema");
      }
    } catch(e) {
      alert("Invalid JSON");
    }
  };

  const handleDelete = (id) => {
     commitState({
       ...state,
       records: state.records.filter(r => r.id !== id)
     });
     if (selectedRecordId === id) setSelectedRecordId(null);
  };

  const handleArchive = (id) => {
    commitState({
      ...state,
      records: state.records.map(r => r.id === id ? { ...r, status: "archived" } : r)
    });
  };

  const handleCreateRecord = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newRecord = {
      id: `r-${Date.now()}`,
      status: "draft",
      evidence: "",
      audit_discrepancy: "",
      value: parseInt(formData.get("value"), 10),
      date: formData.get("date"),
      location: formData.get("location"),
      auditLensState: "idle"
    };
    if (isNaN(newRecord.value) || newRecord.value < 0 || newRecord.value > 500) {
      alert("Value must be a number between 0 and 500");
      return;
    }
    commitState({ ...state, records: [newRecord, ...state.records] });
    setIsCreating(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8">
      <WebMCP state={state} setState={commitState} setSelectedRecordId={setSelectedRecordId} />
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold mb-2 text-slate-800">Home Air Quality Trendbook</h1>
          <p className="text-sm text-slate-500">Manage air readings and resolve discrepancies.</p>
        </div>
        <button onClick={handleUndo} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded text-sm font-medium">
          Undo Last Action
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main List */}
        <div className="col-span-1 bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex flex-col h-[700px]">
           <div className="flex justify-between mb-4">
             <h2 className="font-medium">Readings List</h2>
             <div className="flex gap-2">
               <button onClick={() => setIsCreating(true)} className="text-sm bg-blue-600 text-white hover:bg-blue-700 px-2 py-1 rounded">+ New</button>
               <select
                 value={filter}
                 onChange={(e) => setFilter(e.target.value)}
                 className="text-sm border border-slate-300 rounded px-2 py-1"
               >
                 <option value="all">All</option>
                 <option value="draft">Draft</option>
                 <option value="ready">Ready</option>
                 <option value="archived">Archived</option>
               </select>
             </div>
           </div>

           {isCreating && (
             <form onSubmit={handleCreateRecord} className="mb-4 bg-slate-50 p-3 rounded border border-slate-200 text-sm flex flex-col gap-2">
               <input name="location" placeholder="Location" required className="border p-1 rounded w-full" />
               <input name="value" type="number" placeholder="AQI Value (0-500)" required className="border p-1 rounded w-full" min="0" max="500" />
               <input name="date" type="date" required className="border p-1 rounded w-full" />
               <div className="flex gap-2 justify-end">
                 <button type="button" onClick={() => setIsCreating(false)} className="text-slate-500 hover:text-slate-700">Cancel</button>
                 <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">Save</button>
               </div>
             </form>
           )}

           <div className="overflow-y-auto flex-1 pr-2">
             {state.records.filter(r => filter === 'all' || r.status === filter).map(record => (
               <div
                 key={record.id}
                 onClick={() => setSelectedRecordId(record.id)}
                 className={`p-3 mb-2 border rounded cursor-pointer transition-colors ${selectedRecordId === record.id ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
               >
                 <div className="flex justify-between items-start">
                   <div>
                     <span className="font-medium block">{record.location}</span>
                     <span className="text-sm text-slate-500">Value: {record.value} • {record.date}</span>
                   </div>
                   <div className="flex flex-col items-end gap-1">
                     <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                       record.status === 'ready' ? 'bg-green-100 text-green-700' :
                       record.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                       'bg-slate-100 text-slate-700'
                     }`}>{record.status}</span>
                     {selectedRecordId === record.id && (
                        <div className="flex gap-1 mt-1">
                          <button onClick={(e) => { e.stopPropagation(); handleArchive(record.id); }} className="text-[10px] bg-slate-200 hover:bg-slate-300 px-1.5 py-0.5 rounded">Archive</button>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(record.id); }} className="text-[10px] bg-red-100 text-red-600 hover:bg-red-200 px-1.5 py-0.5 rounded">Delete</button>
                        </div>
                     )}
                   </div>
                 </div>
                 {record.audit_discrepancy && (
                   <div className="text-xs text-red-500 mt-2 bg-red-50 px-2 py-1 rounded inline-block">Discrepancy: {record.audit_discrepancy}</div>
                 )}
               </div>
             ))}
           </div>
        </div>

        {/* Audit Lens & Inspector */}
        <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex-1 h-[400px]">
            <h2 className="font-medium mb-4 border-b border-slate-100 pb-2">Audit Lens</h2>
            {selectedRecordId ? (
              <AuditLens
                record={state.records.find(r => r.id === selectedRecordId)}
                onMutate={(updatedRecord) => {
                  const newRecords = state.records.map(r => r.id === updatedRecord.id ? updatedRecord : r);
                  commitState({ ...state, records: newRecords });
                }}
              />
            ) : (
              <div className="text-slate-400 text-sm py-16 flex flex-col items-center justify-center italic">
                <span className="text-4xl mb-2 block">🔍</span>
                Select a record to inspect and audit.
              </div>
            )}
          </div>

          <div className="bg-slate-800 text-slate-200 rounded-lg shadow-sm p-6 text-sm h-[276px] flex flex-col">
             <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
               <h2 className="font-medium text-white">Derived Summary & Artifact</h2>
               <div className="flex gap-2">
                 <button onClick={handleExport} className="bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-xs font-medium">Export JSON</button>
               </div>
             </div>

             <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
               <div className="flex flex-col">
                 <p className="mb-2 text-green-400 font-mono text-xs">{state.derived.summary}</p>
                 <pre className="font-mono text-[10px] overflow-y-auto p-3 bg-slate-900 rounded border border-slate-700 flex-1">
                   {JSON.stringify(state, null, 2)}
                 </pre>
               </div>

               <div className="flex flex-col gap-2">
                 <label className="text-xs text-slate-400">Import Session JSON:</label>
                 <textarea
                   value={importText}
                   onChange={(e) => setImportText(e.target.value)}
                   className="flex-1 bg-slate-900 border border-slate-700 rounded p-2 text-[10px] font-mono text-slate-300 resize-none"
                   placeholder='{"schemaVersion": "v1", "records": []}'
                 />
                 <button onClick={handleImport} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium mt-1">
                   Import and Replace State
                 </button>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
