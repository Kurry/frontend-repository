import React, { useState, useEffect, useMemo } from 'react';
import { Download, Upload, Trash2, Plus, RotateCcw, AlertTriangle, Layers, Filter } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type RecordStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

interface PracticeRecord {
  id: string;
  title: string;
  durationMinutes: number;
  status: RecordStatus;
  bpm: number;
}

interface DerivedSummary {
  totalDuration: number;
  averageBpm: number;
  readyCount: number;
  batchCount: number;
}

interface ExportFormat {
  schemaVersion: "v1";
  exportedAt: string;
  records: PracticeRecord[];
  derived: DerivedSummary;
  history: PracticeRecord[][];
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const INITIAL_RECORDS: PracticeRecord[] = [
  { id: '1', title: 'Scale Warmup', durationMinutes: 10, status: 'ready', bpm: 80 },
  { id: '2', title: 'Arpeggios', durationMinutes: 15, status: 'draft', bpm: 100 },
  { id: '3', title: 'New Piece Section A', durationMinutes: 30, status: 'empty', bpm: 60 },
];

const calculateDerived = (records: PracticeRecord[], selectedIds: Set<string>): DerivedSummary => {
  const selectedRecords = records.filter(r => selectedIds.has(r.id));
  const totalDuration = selectedRecords.reduce((sum, r) => sum + r.durationMinutes, 0);
  const avgBpm = selectedRecords.length > 0
    ? Math.round(selectedRecords.reduce((sum, r) => sum + r.bpm, 0) / selectedRecords.length)
    : 0;

  return {
    totalDuration,
    averageBpm: avgBpm,
    readyCount: records.filter(r => r.status === 'ready').length,
    batchCount: selectedRecords.length
  };
};

export default function App() {
  const [records, setRecords] = useState<PracticeRecord[]>(INITIAL_RECORDS);
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<PracticeRecord[][]>([]);
  const [filterStatus, setFilterStatus] = useState<RecordStatus | 'all'>('all');
  const [error, setError] = useState<string | null>(null);

  const derived = useMemo(() => calculateDerived(records, selection), [records, selection]);

  const saveToHistory = (newRecords: PracticeRecord[]) => {
    setHistory(prev => [...prev, records]);
    setRecords(newRecords);
  };

  const handleCreate = () => {
    const newRecord: PracticeRecord = {
      id: generateId(),
      title: 'New Segment',
      durationMinutes: 5,
      status: 'empty',
      bpm: 120
    };
    saveToHistory([...records, newRecord]);
  };

  const handleUpdate = (id: string, updates: Partial<PracticeRecord>) => {
    const record = records.find(r => r.id === id);
    if (!record) return;

    // Validation
    if (updates.durationMinutes !== undefined && (updates.durationMinutes < 1 || updates.durationMinutes > 300)) {
      setError(`Invalid duration for ${record.title}. Must be between 1 and 300 minutes.`);
      return;
    }
    if (updates.bpm !== undefined && (updates.bpm < 20 || updates.bpm > 300)) {
      setError(`Invalid BPM for ${record.title}. Must be between 20 and 300.`);
      return;
    }

    setError(null);
    const newRecords = records.map(r => r.id === id ? { ...r, ...updates } : r);
    saveToHistory(newRecords);
  };

  const handleDelete = (id: string) => {
    const newRecords = records.filter(r => r.id !== id);
    setSelection(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    saveToHistory(newRecords);
  };

  const handleToggleSelect = (id: string) => {
    setSelection(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBatchReconcile = () => {
    if (selection.size === 0) {
      setError("Select records to batch reconcile.");
      return;
    }

    const selectedRecords = records.filter(r => selection.has(r.id));
    const hasConflict = selectedRecords.some(r => r.status === 'archived');
    if (hasConflict) {
      setError("Cannot reconcile archived records.");
      return;
    }

    const newRecords = records.map(r => {
      if (selection.has(r.id)) {
        return { ...r, status: 'ready' as RecordStatus };
      }
      return r;
    });

    saveToHistory(newRecords);
    setError(null);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const newHistory = [...history];
    const prevRecords = newHistory.pop()!;
    setHistory(newHistory);
    setRecords(prevRecords);

    // Cleanup selection if records were deleted in the undone future
    const prevIds = new Set(prevRecords.map(r => r.id));
    setSelection(prev => {
      const next = new Set<string>();
      prev.forEach(id => {
        if (prevIds.has(id)) next.add(id);
      });
      return next;
    });
    setError(null);
  };

  const handleExport = () => {
    const data: ExportFormat = {
      schemaVersion: "v1",
      exportedAt: new Date().toISOString(),
      records,
      derived,
      history
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'practice-loop-v1-batch-reconciler.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as ExportFormat;
        if (data.schemaVersion !== "v1") {
          throw new Error("Invalid schema version");
        }
        if (!Array.isArray(data.records)) {
          throw new Error("Invalid records format");
        }

        // Basic validation
        for (const r of data.records) {
          if (!r.id || !r.title || typeof r.durationMinutes !== 'number' || typeof r.bpm !== 'number' || !['empty', 'draft', 'ready', 'changed', 'archived'].includes(r.status)) {
             throw new Error("Malformed record in import");
          }
        }

        setRecords(data.records);
        setHistory(data.history || []);
        setSelection(new Set());
        setError(null);
      } catch (err) {
        setError(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (e.target) {
        e.target.value = '';
    }
  };

  const handleClear = () => {
      saveToHistory([]);
      setSelection(new Set());
      setError(null);
  };

  // WebMCP Integration
  useEffect(() => {
    (window as any).webmcp_session_info = {
        name: "Music Practice Loop Composer",
        version: "1.0.0"
    };

    (window as any).webmcp_list_tools = () => [
        { name: "get_state", description: "Get current application state" },
        { name: "set_records", description: "Set records directly", parameters: { records: "array of records" } },
        { name: "set_selection", description: "Set selection", parameters: { selection: "array of ids" } },
        { name: "batch_reconcile", description: "Trigger batch reconcile" },
        { name: "undo", description: "Undo last action" }
    ];

    (window as any).webmcp_invoke_tool = (name: string, args: any) => {
        switch (name) {
            case 'get_state':
                return { records, selection: Array.from(selection), derived, history };
            case 'set_records':
                setRecords(args.records);
                return { success: true };
            case 'set_selection':
                setSelection(new Set(args.selection));
                return { success: true };
            case 'batch_reconcile':
                handleBatchReconcile();
                return { success: true };
            case 'undo':
                handleUndo();
                return { success: true };
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    };
  }, [records, selection, derived, history]);

  const filteredRecords = records.filter(r => filterStatus === 'all' || r.status === filterStatus);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans p-4 md:p-8 flex flex-col md:flex-row gap-6">

      {/* Primary Workspace */}
      <div className="flex-1 flex flex-col gap-4">
        <header className="flex justify-between items-center pb-4 border-b border-neutral-200">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Practice Segments</h1>
            <p className="text-sm text-neutral-500">Manage your practice loop and reconcile batches.</p>
          </div>
          <div className="flex gap-2">
             <button onClick={handleUndo} disabled={history.length === 0} className="p-2 text-neutral-600 hover:bg-neutral-200 rounded-md disabled:opacity-50 transition-colors" aria-label="Undo">
                <RotateCcw size={20} />
             </button>
             <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-md hover:bg-neutral-800 transition-colors">
                <Plus size={16} /> New Segment
             </button>
          </div>
        </header>

        {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md flex items-center gap-2 border border-red-200">
                <AlertTriangle size={18} />
                <span className="text-sm">{error}</span>
            </div>
        )}

        <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-neutral-200 shadow-sm">
           <div className="flex items-center gap-2">
               <Filter size={16} className="text-neutral-400 ml-2" />
               <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="bg-transparent text-sm border-none focus:ring-0 outline-none py-1"
               >
                   <option value="all">All Statuses</option>
                   <option value="empty">Empty</option>
                   <option value="draft">Draft</option>
                   <option value="ready">Ready</option>
                   <option value="changed">Changed</option>
                   <option value="archived">Archived</option>
               </select>
           </div>

        </div>

        <div className="flex flex-col gap-3">
          {filteredRecords.length === 0 ? (
              <div className="text-center p-12 bg-white border border-neutral-200 border-dashed rounded-xl text-neutral-500">
                  No segments found.
              </div>
          ) : (
            filteredRecords.map(record => (
              <div
                key={record.id}
                className={cn(
                    "group relative bg-white border p-4 rounded-xl shadow-sm flex items-center gap-4 transition-all duration-300",
                    selection.has(record.id) ? "border-blue-500 ring-1 ring-blue-500" : "border-neutral-200 hover:border-neutral-300",
                    "motion-reduce:transition-none"
                )}
              >
                 <input
                    type="checkbox"
                    checked={selection.has(record.id)}
                    onChange={() => handleToggleSelect(record.id)}
                    className="w-5 h-5 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    aria-label={`Select ${record.title}`}
                 />

                 <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                    <div className="sm:col-span-5 flex flex-col">
                        <input
                            value={record.title}
                            onChange={(e) => handleUpdate(record.id, { title: e.target.value, status: 'changed' })}
                            className="font-medium text-neutral-900 bg-transparent border-none focus:ring-0 p-0 outline-none"
                            placeholder="Segment Title"
                        />
                        <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full w-max mt-1",
                            record.status === 'ready' && "bg-green-100 text-green-700",
                            record.status === 'draft' && "bg-amber-100 text-amber-700",
                            record.status === 'changed' && "bg-blue-100 text-blue-700",
                            record.status === 'empty' && "bg-neutral-100 text-neutral-600",
                            record.status === 'archived' && "bg-neutral-200 text-neutral-500"
                        )}>
                            {record.status}
                        </span>
                    </div>

                    <div className="sm:col-span-3 flex items-center gap-2">
                        <input
                            type="number"
                            value={record.durationMinutes}
                            onChange={(e) => handleUpdate(record.id, { durationMinutes: parseInt(e.target.value) || 0, status: 'changed' })}
                            className="w-16 p-1 text-sm border border-neutral-200 rounded text-right focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                        <span className="text-xs text-neutral-500">min</span>
                    </div>

                    <div className="sm:col-span-3 flex items-center gap-2">
                        <input
                            type="number"
                            value={record.bpm}
                            onChange={(e) => handleUpdate(record.id, { bpm: parseInt(e.target.value) || 0, status: 'changed' })}
                            className="w-16 p-1 text-sm border border-neutral-200 rounded text-right focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                        <span className="text-xs text-neutral-500">bpm</span>
                    </div>

                    <div className="sm:col-span-1 flex justify-end">
                        <button
                            onClick={() => handleDelete(record.id)}
                            className="text-neutral-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            aria-label={`Delete ${record.title}`}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                 </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Secondary / Sidebar */}
      <div className="w-full md:w-80 flex flex-col gap-6">

          {/* Batch Reconciler Panel */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
             <div className="flex items-center gap-2 mb-4">
                 <Layers size={20} className="text-blue-600" />
                 <h2 className="font-semibold text-lg">Batch Reconciler</h2>
             </div>

             <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Selected</span>
                    <span className="font-medium">{derived.batchCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Batch Duration</span>
                    <span className="font-medium">{derived.totalDuration} min</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Avg BPM</span>
                    <span className="font-medium">{derived.averageBpm}</span>
                </div>
             </div>

             <button
                onClick={handleBatchReconcile}
                disabled={selection.size === 0}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-neutral-200 disabled:text-neutral-400 transition-colors"
             >
                 Reconcile Batch to Ready
             </button>
             {selection.size === 0 && (
                 <p className="text-xs text-center text-neutral-500 mt-2">Select records to batch reconcile</p>
             )}
          </div>

          {/* Artifact Management */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
             <h2 className="font-semibold text-lg mb-4">Session Artifact</h2>

             <div className="space-y-3">
                 <div className="flex justify-between text-sm pb-2 border-b border-neutral-100">
                    <span className="text-neutral-500">Total Ready</span>
                    <span className="font-medium text-green-600">{derived.readyCount} / {records.length}</span>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                    <button
                        onClick={handleExport}
                        className="flex items-center justify-center gap-2 w-full py-2 border border-neutral-300 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors"
                    >
                        <Download size={16} /> Export Artifact
                    </button>

                    <label className="flex items-center justify-center gap-2 w-full py-2 border border-neutral-300 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors cursor-pointer">
                        <Upload size={16} /> Import Artifact
                        <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                    </label>

                    <button
                        onClick={handleClear}
                        className="flex items-center justify-center gap-2 w-full py-2 mt-2 text-red-600 text-sm font-medium hover:bg-red-50 rounded-lg transition-colors"
                    >
                        Clear Session
                    </button>
                </div>
             </div>
          </div>

      </div>

    </div>
  );
}
