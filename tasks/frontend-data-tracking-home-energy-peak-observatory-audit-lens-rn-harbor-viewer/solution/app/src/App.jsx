import React, { useState, useEffect, useRef } from 'react';
import { Download, Upload, Trash2, Plus, RefreshCw, X, FileJson, Activity, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const generateId = () => Math.random().toString(36).substring(2, 9);

const INITIAL_RECORDS = [
  { id: 'rec-1', date: '2025-01-10T08:00:00Z', reading: 450, status: 'ready', notes: 'Morning baseline' },
  { id: 'rec-2', date: '2025-01-10T14:00:00Z', reading: 850, status: 'draft', notes: 'Peak sun' },
  { id: 'rec-3', date: '2025-01-10T20:00:00Z', reading: 320, status: 'conflict', notes: 'Unexpected drop, needs review' },
  { id: 'rec-4', date: '2025-01-09T08:00:00Z', reading: 440, status: 'archived', notes: 'Yesterday morning' },
];

export default function App() {
  const [records, setRecords] = useState(INITIAL_RECORDS);
  const [filter, setFilter] = useState('all'); // all, draft, ready, conflict, archived
  const [selectedRecordId, setSelectedRecordId] = useState(null);

  // Audit Lens state
  const [lensState, setLensState] = useState({ active: false, recordId: null });
  const [evidenceText, setEvidenceText] = useState('');

  // History for undo
  const [history, setHistory] = useState([]);

  // Error state for forms
  const [errors, setErrors] = useState({});
  const [importError, setImportError] = useState(null);

  // New record form state
  const [isAdding, setIsAdding] = useState(false);
  const [newRecord, setNewRecord] = useState({ date: '', reading: '', notes: '' });

  const fileInputRef = useRef(null);

  // --- Shared Logic Functions ---
  const doSaveHistory = (currentRecords, currentSelectedId, currentLensState) => {
    setHistory(prev => [...prev, { records: [...currentRecords], selectedRecordId: currentSelectedId, lensState: { ...currentLensState } }]);
  };

  const doCreateRecord = (date, reading, notes) => {
    const readingNum = Number(reading);
    if (!date) throw new Error('Date is required');
    if (isNaN(readingNum) || readingNum < 0 || readingNum > 10000) throw new Error('Reading must be between 0 and 10000');

    const newRec = {
      id: 'rec-' + generateId(),
      date: date,
      reading: readingNum,
      status: 'draft',
      notes: notes || ''
    };
    doSaveHistory(records, selectedRecordId, lensState);
    setRecords(prev => [...prev, newRec]);
    return newRec;
  };

  const doSelectRecord = (id) => {
    setSelectedRecordId(id);
    const r = records.find(rec => rec.id === id);
    if (r && r.status === 'conflict') {
      setLensState({ active: true, recordId: id });
    } else {
      setLensState({ active: false, recordId: null });
    }
    return r;
  };

  const doDeleteRecord = (id) => {
    doSaveHistory(records, selectedRecordId, lensState);
    setRecords(prev => prev.filter(r => r.id !== id));
    if (selectedRecordId === id) setSelectedRecordId(null);
    if (lensState.recordId === id) setLensState({ active: false, recordId: null });
  };

  const doResolveAudit = (id, evidence) => {
      if (!evidence || !evidence.trim()) throw new Error("Evidence is required to resolve conflict.");
      doSaveHistory(records, selectedRecordId, lensState);
      setRecords(prev => prev.map(r => {
        if (r.id === id) {
          return {
            ...r,
            status: 'resolved',
            notes: `${r.notes}\n[Audit Evidence]: ${evidence}`
          };
        }
        return r;
      }));
      setLensState({ active: false, recordId: null });
  };

  const doEditRecord = (id, field, value) => {
      doSaveHistory(records, selectedRecordId, lensState);
      setRecords(prev => prev.map(r => {
          if (r.id === id) {
              const updated = { ...r, [field]: field === 'reading' ? Number(value) : value };
              // Only mark as changed if we are editing an actual form field, not just changing status directly
              if (field !== 'status') {
                  updated.status = 'changed';
              }
              return updated;
          }
          return r;
      }));
  };

  const doGenerateArtifact = () => {
    return {
      schemaVersion: 'energy-peak-v1',
      exportedAt: new Date().toISOString(),
      records: records,
      derived: derivedSummary,
      history: history
    };
  };

  const doImportData = (data) => {
      if (data.schemaVersion !== 'energy-peak-v1') throw new Error("Invalid schema version");
      if (!Array.isArray(data.records)) throw new Error("Missing records array");

      const validRecords = [];
      const ids = new Set();
      for (let r of data.records) {
          if (!r.id || !r.date || r.reading === undefined || !r.status) throw new Error(`Invalid record format: ${JSON.stringify(r)}`);
          if (ids.has(r.id)) throw new Error(`Duplicate ID: ${r.id}`);
          if (r.reading < 0 || r.reading > 10000) throw new Error(`Reading out of bounds: ${r.reading}`);
          ids.add(r.id);
          validRecords.push(r);
      }

      doSaveHistory(records, selectedRecordId, lensState);
      setHistory(data.history && Array.isArray(data.history) ? data.history : []);
      setRecords(validRecords);
      setSelectedRecordId(null);
      setLensState({ active: false, recordId: null });
  };


  // --- WebMCP Tools ---
  useEffect(() => {
    window.webmcp_session_info = () => ({
      status: "active",
      schemaVersion: "zto-webmcp-v1",
      supported_modules: ["entity-collection-v1", "artifact-transfer-v1"]
    });

    window.webmcp_list_tools = () => [
      {
        name: "entity_create",
        module: "entity-collection-v1",
        description: "Create a new record",
        parameters: { date: "string", reading: "number", notes: "string" }
      },
      {
        name: "entity_select",
        module: "entity-collection-v1",
        description: "Select a record",
        parameters: { id: "string" }
      },
      {
        name: "entity_update",
        module: "entity-collection-v1",
        description: "Update a record or resolve audit",
        parameters: { id: "string", status: "string", evidence: "string", field: "string", value: "string" }
      },
      {
        name: "entity_delete",
        module: "entity-collection-v1",
        description: "Delete a record",
        parameters: { id: "string", confirm: "boolean" }
      },
      {
        name: "artifact_export",
        module: "artifact-transfer-v1",
        description: "Export current state to JSON",
        parameters: { format: "string" }
      },
      {
        name: "artifact_copy",
        module: "artifact-transfer-v1",
        description: "Copy current state to JSON",
        parameters: { format: "string" }
      },
      {
        name: "artifact_import",
        module: "artifact-transfer-v1",
        description: "Import state from JSON",
        parameters: { payload: "object" }
      }
    ];

    window.webmcp_invoke_tool = (toolName, args) => {
      console.log(`Invoking tool: ${toolName}`, args);
      try {
        switch (toolName) {
          case 'entity_create': {
            const nr = doCreateRecord(args.date, args.reading, args.notes);
            return { success: true, id: nr.id };
          }
          case 'entity_select': {
            const r = doSelectRecord(args.id);
            if (!r) throw new Error("Record not found");
            return { success: true, record: r };
          }
          case 'entity_update': {
            if (args.status === 'resolved' && args.evidence) {
                doResolveAudit(args.id, args.evidence);
            } else if (args.field && args.value !== undefined) {
                doEditRecord(args.id, args.field, args.value);
            } else if (args.status) {
                doEditRecord(args.id, 'status', args.status);
            }
            return { success: true };
          }
          case 'entity_delete': {
             if (!args.confirm) throw new Error("Must confirm deletion");
             doDeleteRecord(args.id);
             return { success: true };
          }
          case 'artifact_export':
          case 'artifact_copy': {
             return { success: true, data: doGenerateArtifact() };
          }
          case 'artifact_import': {
             doImportData(args.payload);
             return { success: true };
          }
          default:
            throw new Error(`Unknown tool: ${toolName}`);
        }
      } catch (e) {
        console.error("Tool execution failed", e);
        return { success: false, error: e.message };
      }
    };
  }, [records, selectedRecordId, lensState, history]);

  // Keyboard undo support
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

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setRecords(lastState.records);
    setSelectedRecordId(lastState.selectedRecordId);
    setLensState(lastState.lensState);
    setHistory(prev => prev.slice(0, -1));
  };

  // --- Derived State ---
  const derivedSummary = {
    total: records.length,
    drafts: records.filter(r => r.status === 'draft').length,
    conflicts: records.filter(r => r.status === 'conflict').length,
    ready: records.filter(r => r.status === 'ready').length,
    average: records.length ? Math.round(records.reduce((acc, r) => acc + Number(r.reading), 0) / records.length) : 0,
  };

  const filteredRecords = records.filter(r => filter === 'all' ? true : r.status === filter);
  const selectedRecord = records.find(r => r.id === selectedRecordId);

  // --- UI Event Handlers ---
  const handleUI_CreateRecord = (e) => {
    e.preventDefault();
    try {
        doCreateRecord(newRecord.date, newRecord.reading, newRecord.notes);
        setIsAdding(false);
        setNewRecord({ date: '', reading: '', notes: '' });
        setErrors({});
    } catch (err) {
        if (err.message.includes('Date')) setErrors({ date: err.message });
        else setErrors({ reading: err.message });
    }
  };

  const handleUI_ResolveAudit = () => {
    try {
        doResolveAudit(lensState.recordId, evidenceText);
        setEvidenceText('');
        setErrors({});
    } catch (err) {
        setErrors({ evidence: err.message });
    }
  };

  const handleExport = () => {
    const data = doGenerateArtifact();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'energy-peak-v1-audit-lens.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        doImportData(data);
      } catch (err) {
        setImportError(err.message || "Invalid JSON file");
      }
    };
    reader.readAsText(file);
    e.target.value = null; // reset
  };

  const handleClear = () => {
      doSaveHistory(records, selectedRecordId, lensState);
      setRecords([]);
      setSelectedRecordId(null);
      setLensState({ active: false, recordId: null });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ready': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'draft': return <Clock className="w-4 h-4 text-gray-400" />;
      case 'conflict': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'changed': return <RefreshCw className="w-4 h-4 text-orange-400" />;
      case 'archived': return <Trash2 className="w-4 h-4 text-slate-400" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-800">

      {/* Sidebar: Derived Summary & Controls */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-4 flex flex-col shrink-0">
        <div className="flex items-center gap-2 font-bold text-lg mb-6 text-slate-900">
            <Activity className="text-emerald-600" />
            <span>Peak Observatory</span>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-6">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Derived Summary</h3>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-slate-600">Total Records</span>
                    <span className="font-medium" data-testid="summary-total">{derivedSummary.total}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-600">Average Reading</span>
                    <span className="font-medium" data-testid="summary-average">{derivedSummary.average} kW</span>
                </div>
                <div className="flex justify-between text-red-600">
                    <span>Conflicts</span>
                    <span className="font-medium" data-testid="summary-conflicts">{derivedSummary.conflicts}</span>
                </div>
                 <div className="flex justify-between text-emerald-600">
                    <span>Ready</span>
                    <span className="font-medium">{derivedSummary.ready}</span>
                </div>
            </div>
        </div>

        <div className="space-y-2 mb-6">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Filters</h3>
            {['all', 'draft', 'ready', 'conflict', 'resolved', 'changed', 'archived'].map(f => (
                <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`block w-full text-left px-3 py-2 rounded text-sm transition-colors ${filter === f ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
            ))}
        </div>

        <div className="mt-auto space-y-2">
             {importError && (
                 <div className="text-xs text-red-600 p-2 bg-red-50 rounded border border-red-100 mb-2">
                     {importError}
                 </div>
             )}
             <input type="file" ref={fileInputRef} onChange={handleImportFile} accept=".json" className="hidden" />
             <button onClick={() => fileInputRef.current.click()} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded text-sm font-medium transition-colors">
                <Upload className="w-4 h-4" /> Import Artifact
             </button>
             <button onClick={handleExport} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded text-sm font-medium transition-colors">
                <Download className="w-4 h-4" /> Export Artifact
             </button>
             <button onClick={handleClear} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded text-sm font-medium transition-colors mt-2">
                 Clear Data
             </button>
        </div>
      </aside>

      {/* Main Canvas: Collection */}
      <main className="flex-1 p-6 flex flex-col min-h-0 overflow-y-auto">
         <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-slate-900">Energy Readings</h1>
            <div className="flex gap-2">
                <button
                    onClick={handleUndo}
                    disabled={history.length === 0}
                    title="Undo (Ctrl+Z)"
                    className="p-2 border border-slate-200 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <RefreshCw className="w-5 h-5" />
                </button>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" /> Add Record
                </button>
            </div>
         </div>

         {isAdding && (
             <div className="bg-white p-4 rounded-lg shadow-sm border border-emerald-100 mb-6 motion-safe:animate-fade-in">
                 <div className="flex justify-between items-center mb-4">
                     <h2 className="font-semibold text-emerald-800">New Reading</h2>
                     <button onClick={() => setIsAdding(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600"/></button>
                 </div>
                 <form onSubmit={handleUI_CreateRecord} className="flex flex-wrap gap-4 items-end">
                     <div className="flex-1 min-w-[200px]">
                         <label className="block text-xs font-medium text-slate-600 mb-1">Date (ISO)</label>
                         <input
                             type="datetime-local"
                             value={newRecord.date}
                             onChange={e => setNewRecord({...newRecord, date: e.target.value})}
                             className={`w-full p-2 border rounded text-sm focus:ring-2 focus:outline-none ${errors.date ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-emerald-200'}`}
                         />
                         {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
                     </div>
                     <div className="w-32">
                         <label className="block text-xs font-medium text-slate-600 mb-1">Reading (kW)</label>
                         <input
                             type="number"
                             value={newRecord.reading}
                             onChange={e => setNewRecord({...newRecord, reading: e.target.value})}
                             className={`w-full p-2 border rounded text-sm focus:ring-2 focus:outline-none ${errors.reading ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-emerald-200'}`}
                         />
                         {errors.reading && <p className="text-xs text-red-500 mt-1">{errors.reading}</p>}
                     </div>
                     <div className="flex-2 min-w-[200px]">
                         <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                         <input
                             type="text"
                             value={newRecord.notes}
                             onChange={e => setNewRecord({...newRecord, notes: e.target.value})}
                             className="w-full p-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                         />
                     </div>
                     <button type="submit" className="px-6 py-2 bg-emerald-600 text-white font-medium rounded hover:bg-emerald-700 transition-colors">
                         Save
                     </button>
                 </form>
             </div>
         )}

         {filteredRecords.length === 0 ? (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                 <FileJson className="w-12 h-12 mb-2 opacity-20" />
                 <p>No records found for this filter.</p>
             </div>
         ) : (
             <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                 <table className="w-full text-left text-sm">
                     <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                         <tr>
                             <th className="p-4 w-12 text-center">Status</th>
                             <th className="p-4">Date</th>
                             <th className="p-4 text-right">Reading</th>
                             <th className="p-4 w-1/3">Notes</th>
                             <th className="p-4 text-right">Actions</th>
                         </tr>
                     </thead>
                     <tbody>
                         {filteredRecords.map(record => (
                             <tr
                                 key={record.id}
                                 data-record-id={record.id}
                                 className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors ${selectedRecordId === record.id ? 'bg-blue-50/50' : ''} ${record.status === 'conflict' ? 'bg-red-50/30' : ''}`}
                                 onClick={() => doSelectRecord(record.id)}
                             >
                                 <td className="p-4 text-center">
                                     <div className="flex justify-center" title={record.status}>
                                         {getStatusIcon(record.status)}
                                     </div>
                                 </td>
                                 <td className="p-4 text-slate-700">
                                     <input
                                         type="datetime-local"
                                         value={record.date.slice(0, 16)}
                                         onChange={(e) => doEditRecord(record.id, 'date', new Date(e.target.value).toISOString())}
                                         className="w-full bg-transparent border-b border-transparent focus:border-emerald-500 focus:outline-none"
                                         onClick={e => e.stopPropagation()}
                                     />
                                 </td>
                                 <td className="p-4 text-right font-medium font-mono">
                                     <input
                                         type="number"
                                         value={record.reading}
                                         onChange={(e) => doEditRecord(record.id, 'reading', e.target.value)}
                                         className="w-full text-right bg-transparent border-b border-transparent focus:border-emerald-500 focus:outline-none"
                                         onClick={e => e.stopPropagation()}
                                     />
                                 </td>
                                 <td className="p-4 text-slate-500 truncate max-w-xs">
                                     <input
                                         type="text"
                                         value={record.notes}
                                         onChange={(e) => doEditRecord(record.id, 'notes', e.target.value)}
                                         className="w-full bg-transparent border-b border-transparent focus:border-emerald-500 focus:outline-none"
                                         onClick={e => e.stopPropagation()}
                                     />
                                 </td>
                                 <td className="p-4 text-right">
                                     {record.status !== 'archived' && (
                                         <button
                                            onClick={(e) => { e.stopPropagation(); doEditRecord(record.id, 'status', 'archived'); }}
                                            className="text-xs text-slate-500 hover:text-slate-800 underline"
                                         >
                                             Archive
                                         </button>
                                     )}
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
         )}
      </main>

      {/* Detail / Audit Lens Drawer */}
      {(selectedRecord || lensState.active) && (
        <aside className="w-full md:w-80 bg-white border-l border-slate-200 p-6 flex flex-col shrink-0 shadow-xl md:shadow-none transition-transform motion-safe:duration-300 motion-safe:ease-in-out fixed inset-y-0 right-0 z-20 md:static md:translate-x-0">
             <div className="flex justify-between items-start mb-6">
                 <h2 className="text-lg font-semibold flex items-center gap-2">
                     {lensState.active ? (
                         <><AlertCircle className="text-red-500 w-5 h-5"/> Audit Lens</>
                     ) : 'Record Details'}
                 </h2>
                 <button onClick={() => {setSelectedRecordId(null); setLensState({active: false, recordId: null});}} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                     <X className="w-5 h-5" />
                 </button>
             </div>

             {selectedRecord && (
                 <div className="space-y-4 mb-8">
                     <div>
                         <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">ID</label>
                         <div className="font-mono text-sm text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">{selectedRecord.id}</div>
                     </div>
                     <div>
                         <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Date</label>
                         <div className="text-sm text-slate-800">{new Date(selectedRecord.date).toLocaleString()}</div>
                     </div>
                     <div>
                         <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Reading</label>
                         <div className="text-2xl font-bold text-slate-900 font-mono">{selectedRecord.reading} <span className="text-sm font-normal text-slate-500">kW</span></div>
                     </div>
                     <div>
                         <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Status</label>
                         <div className="flex items-center gap-2 text-sm font-medium capitalize">
                             {getStatusIcon(selectedRecord.status)} <span className={`${selectedRecord.status === 'conflict' ? 'text-red-600' : 'text-slate-700'}`}>{selectedRecord.status}</span>
                         </div>
                     </div>
                     {selectedRecord.notes && (
                         <div>
                             <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Notes</label>
                             <div className="text-sm text-slate-600 whitespace-pre-wrap">{selectedRecord.notes}</div>
                         </div>
                     )}
                 </div>
             )}

             {lensState.active && selectedRecord && selectedRecord.status === 'conflict' && (
                 <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-auto">
                     <h3 className="text-red-800 font-medium mb-2 flex items-center gap-2 text-sm">
                         Resolve Discrepancy
                     </h3>
                     <p className="text-xs text-red-600 mb-4">
                         This reading conflicts with expected baselines. Attach evidence to resolve the audit flag.
                     </p>

                     <div className="mb-3">
                         <textarea
                            className={`w-full p-2 border rounded text-sm focus:ring-2 focus:outline-none resize-none ${errors.evidence ? 'border-red-400 focus:ring-red-200' : 'border-red-200 focus:ring-red-200'}`}
                            rows="3"
                            placeholder="Enter justification or evidence link..."
                            value={evidenceText}
                            onChange={(e) => setEvidenceText(e.target.value)}
                         ></textarea>
                         {errors.evidence && <p className="text-xs text-red-500 mt-1">{errors.evidence}</p>}
                     </div>
                     <button
                        onClick={handleUI_ResolveAudit}
                        className="w-full bg-red-600 text-white font-medium py-2 px-4 rounded hover:bg-red-700 transition-colors shadow-sm"
                     >
                         Attach Evidence & Resolve
                     </button>
                 </div>
             )}

             {!lensState.active && selectedRecord && (
                 <div className="mt-auto pt-6 border-t border-slate-100 flex gap-2">
                     <button
                        onClick={() => doDeleteRecord(selectedRecord.id)}
                        className="flex-1 flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 py-2 rounded text-sm font-medium transition-colors"
                     >
                         <Trash2 className="w-4 h-4"/> Delete
                     </button>
                 </div>
             )}
        </aside>
      )}
    </div>
  );
}
