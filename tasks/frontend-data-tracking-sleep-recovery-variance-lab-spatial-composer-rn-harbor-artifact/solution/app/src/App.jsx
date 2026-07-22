import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Download, Upload, Plus, Trash2, Undo2, Map, Layers, Pencil, X } from 'lucide-react';

const INITIAL_STATE = {
  schemaVersion: 'v1',
  exportedAt: null,
  records: [
    { id: 'rec-1', name: 'Baseline Rest', duration: 420, score: 85, status: 'ready', spatialState: { x: 50, y: 50 } },
    { id: 'rec-2', name: 'High Strain', duration: 380, score: 45, status: 'draft', spatialState: null }
  ],
  derived: { capacity: 100 },
  history: [],
  historyIndex: -1,
  selectedId: null
};

function generateId() {
  return 'rec-' + Math.random().toString(36).substr(2, 9);
}

export default function App() {
  const [state, setState] = useState(INITIAL_STATE);
  const [filterStatus, setFilterStatus] = useState('all');
  const [errorMsg, setErrorMsg] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);

  const pushHistory = (newState) => {
    setState(prev => {
      // slice off any future history if we're not at the end
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push({
        records: prev.records,
        derived: prev.derived,
        selectedId: prev.selectedId
      });
      return {
        ...newState,
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    });
  };

  const updateCapacity = (records) => {
    const placed = records.filter(r => r.spatialState);
    return placed.length > 0
      ? Math.round(placed.reduce((acc, r) => acc + ((r.spatialState.x + r.spatialState.y) / 2), 0) / placed.length)
      : 100;
  };

  const undo = () => {
    setState(prev => {
      if (prev.historyIndex < 0) return prev;
      const lastState = prev.history[prev.historyIndex];
      return {
        ...prev,
        records: lastState.records,
        derived: lastState.derived,
        selectedId: lastState.selectedId,
        historyIndex: prev.historyIndex - 1
      };
    });
  };

  const handleKeyDown = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
      e.preventDefault();
      undo();
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const selectedRecord = useMemo(() => state.records.find(r => r.id === state.selectedId), [state.records, state.selectedId]);

  const placeRecordInComposer = (x, y) => {
    if (!state.selectedId) return;
    if (x < 0 || x > 100 || y < 0 || y > 100) {
      setErrorMsg('Coordinates (x,y) must be between 0 and 100. Please click within the grid area.');
      return;
    }

    setErrorMsg(null);
    const updatedRecords = state.records.map(r =>
      r.id === state.selectedId ? { ...r, spatialState: { x, y }, status: 'changed' } : r
    );

    const capacity = updateCapacity(updatedRecords);

    pushHistory({
      ...state,
      records: updatedRecords,
      derived: { capacity }
    });
  };

  const handleComposerKeyDown = (e) => {
    if (!selectedRecord) return;
    let { x, y } = selectedRecord.spatialState || { x: 50, y: 50 }; // default to center if unplaced
    const step = 5;

    let handled = true;
    switch(e.key) {
      case 'ArrowUp': y = Math.min(100, y + step); break;
      case 'ArrowDown': y = Math.max(0, y - step); break;
      case 'ArrowLeft': x = Math.max(0, x - step); break;
      case 'ArrowRight': x = Math.min(100, x + step); break;
      case 'Enter':
      case ' ':
        // Just place at current / center
        break;
      default: handled = false;
    }

    if (handled) {
      e.preventDefault();
      placeRecordInComposer(x, y);
    }
  };

  const validateRecordData = (data) => {
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      return "Field 'Name' is required and cannot be empty. Please enter a valid name.";
    }
    if (typeof data.duration !== 'number' || isNaN(data.duration) || data.duration < 0) {
      return `Field 'Duration' must be a positive number. Received: ${data.duration}.`;
    }
    if (typeof data.score !== 'number' || isNaN(data.score) || data.score < 0 || data.score > 100) {
      return `Field 'Score' must be between 0 and 100. Received: ${data.score}.`;
    }
    const validStatuses = ['draft', 'ready', 'changed', 'archived'];
    if (!validStatuses.includes(data.status)) {
      return `Field 'Status' is invalid. Must be one of: ${validStatuses.join(', ')}.`;
    }
    return null;
  };

  const createRecord = (data) => {
    const error = validateRecordData(data);
    if (error) {
      setErrorMsg(error);
      return;
    }
    const newRecord = {
      id: generateId(),
      name: data.name,
      duration: data.duration,
      score: data.score,
      status: data.status || 'draft',
      spatialState: null
    };
    const updatedRecords = [...state.records, newRecord];
    pushHistory({
      ...state,
      records: updatedRecords,
      derived: { capacity: updateCapacity(updatedRecords) }
    });
    setEditingRecord(null);
  };

  const updateRecord = (id, data) => {
    const existing = state.records.find(r => r.id === id);
    if (!existing) {
       setErrorMsg("Record not found");
       return;
    }
    const merged = { ...existing, ...data };
    const error = validateRecordData(merged);
    if (error) {
      setErrorMsg(error);
      return;
    }
    const updatedRecords = state.records.map(r =>
      r.id === id ? merged : r
    );
    pushHistory({
      ...state,
      records: updatedRecords,
      derived: { capacity: updateCapacity(updatedRecords) }
    });
    setEditingRecord(null);
  };

  const deleteRecord = (id) => {
    const updatedRecords = state.records.filter(r => r.id !== id);
    const newSelectedId = state.selectedId === id ? null : state.selectedId;
    pushHistory({
      ...state,
      records: updatedRecords,
      selectedId: newSelectedId,
      derived: { capacity: updateCapacity(updatedRecords) }
    });
  };

  const exportData = () => {
    const data = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: state.derived,
      selectedId: state.selectedId
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sleep-recovery-v1-spatial-composer.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const doImportData = (data) => {
      if (data.schemaVersion !== 'v1') throw new Error('Invalid schema version. Expected "v1".');
      if (!Array.isArray(data.records)) throw new Error('Invalid format: "records" must be an array.');

      const ids = new Set();
      for (const rec of data.records) {
        if (!rec.id) throw new Error('Invalid record: missing ID.');
        if (ids.has(rec.id)) throw new Error(`Invalid record: duplicate ID detected (${rec.id}).`);
        ids.add(rec.id);

        const err = validateRecordData(rec);
        if (err) throw new Error(`Invalid record (${rec.id}): ${err}`);

        if (rec.spatialState) {
            if (typeof rec.spatialState.x !== 'number' || typeof rec.spatialState.y !== 'number' ||
                rec.spatialState.x < 0 || rec.spatialState.x > 100 ||
                rec.spatialState.y < 0 || rec.spatialState.y > 100) {
                throw new Error(`Invalid spatial state for record ${rec.id}: coordinates must be numbers between 0 and 100.`);
            }
        }
      }

      setState({
        schemaVersion: 'v1',
        exportedAt: data.exportedAt || new Date().toISOString(),
        records: data.records,
        derived: data.derived || { capacity: updateCapacity(data.records) },
        history: [],
        historyIndex: -1,
        selectedId: data.selectedId || null
      });
      setErrorMsg(null);
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        doImportData(data);
      } catch (err) {
        setErrorMsg('Import failed: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset
  };

  const filteredRecords = useMemo(() => {
    if (filterStatus === 'all') return state.records;
    return state.records.filter(r => r.status === filterStatus);
  }, [state.records, filterStatus]);

  // WebMCP Registration
  useEffect(() => {
    window.webmcp_session_info = async () => ({
      task_id: "eval-intelligence/frontend-data-tracking-sleep-recovery-variance-lab-spatial-composer",
      contract_version: "zto-webmcp-v1"
    });
    window.webmcp_list_tools = async () => [
      { name: 'entity_create_record', inputSchema: { type: 'object', properties: { name: { type: 'string' }, duration: { type: 'number' }, score: { type: 'number' }, status: { type: 'string' } }, required: ['name', 'duration', 'score'] } },
      { name: 'entity_update_record', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
      { name: 'entity_delete_record', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
      { name: 'artifact_export_session_json', inputSchema: { type: 'object', properties: {} } },
      { name: 'artifact_import_session_json', inputSchema: { type: 'object', properties: { data: { type: 'object' } }, required: ['data'] } },
      { name: 'artifact_query_session_json', inputSchema: { type: 'object', properties: {} } },
      { name: 'editor_select', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } }
    ];
    window.webmcp_invoke_tool = async (request) => {
      const name = typeof request === 'string' ? request : request?.name;
      const args = request?.arguments || {};

      switch (name) {
        case 'editor_select':
          setState(prev => ({ ...prev, selectedId: args.id }));
          return { success: true };
        case 'entity_create_record':
          createRecord(args);
          return { success: true };
        case 'entity_update_record':
          updateRecord(args.id, args);
          return { success: true };
        case 'entity_delete_record':
          deleteRecord(args.id);
          return { success: true };
        case 'artifact_export_session_json':
          exportData();
          return { success: true };
        case 'artifact_import_session_json':
          try {
             doImportData(args.data || args);
             return { success: true };
          } catch(e) {
             return { success: false, error: e.message };
          }
        case 'artifact_query_session_json':
          return {
             schemaVersion: state.schemaVersion,
             exportedAt: state.exportedAt,
             records: state.records,
             derived: state.derived,
             selectedId: state.selectedId
          };
        default:
          return { success: true };
      }
    };
  }, [state]);

  return (
    <div className="flex flex-col h-screen overflow-hidden text-sm relative bg-zinc-950 text-zinc-100">
      <header className="bg-zinc-900 border-b border-zinc-800 p-4 flex justify-between items-center shrink-0">
        <h1 className="font-semibold flex items-center gap-2"><Layers className="w-4 h-4 text-emerald-500" /> Sleep Recovery Variance Lab</h1>
        <div className="flex gap-2">
          <button onClick={undo} disabled={state.historyIndex < 0} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 rounded flex items-center gap-1 transition-colors">
            <Undo2 className="w-4 h-4" /> Undo
          </button>
          <button onClick={exportData} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded flex items-center gap-1 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          <label className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded flex items-center gap-1 cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-emerald-500" tabIndex="0" onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.querySelector('input').click(); }}>
            <Upload className="w-4 h-4" /> Import
            <input type="file" accept=".json" className="hidden" onChange={importData} tabIndex="-1" />
          </label>
        </div>
      </header>

      {errorMsg && (
        <div className="bg-red-900/50 text-red-200 border-b border-red-900 p-2 flex justify-between items-center text-xs">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} aria-label="Dismiss error"><X className="w-4 h-4" /></button>
        </div>
      )}

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">

        {/* Sidebar Collection */}
        <aside className="w-full md:w-80 flex flex-col border-r border-zinc-800 bg-zinc-950 shrink-0 relative">
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
            <h2 className="font-medium">Sessions</h2>
            <select
              className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 outline-none focus:border-emerald-500 text-xs"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              aria-label="Filter status"
            >
              <option value="all">All</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="changed">Changed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2 pb-16">
            {filteredRecords.length === 0 && (
              <div className="text-center text-zinc-500 py-8">No records found.</div>
            )}
            {filteredRecords.map(rec => (
              <div key={rec.id} className="relative group">
                <button
                  onClick={() => setState(prev => ({ ...prev, selectedId: rec.id }))}
                  className={`w-full text-left p-3 rounded border transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 ${state.selectedId === rec.id ? 'border-emerald-500 bg-emerald-950/20' : 'border-zinc-800 hover:bg-zinc-900'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-zinc-200">{rec.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${rec.status === 'ready' ? 'bg-emerald-900/50 text-emerald-400' : rec.status === 'changed' ? 'bg-amber-900/50 text-amber-400' : 'bg-zinc-800 text-zinc-400'}`}>
                      {rec.status}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 flex justify-between">
                    <span>Score: {rec.score}</span>
                    <span>{rec.duration}m</span>
                  </div>
                </button>
                <div className="absolute top-2 right-2 hidden group-hover:flex group-focus-within:flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); setEditingRecord(rec); }} className="p-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" aria-label="Edit record">
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteRecord(rec.id); }} className="p-1 bg-red-950 hover:bg-red-900 rounded text-red-400 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" aria-label="Delete record">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-zinc-950 to-zinc-950/80 border-t border-zinc-800">
            <button
              onClick={() => setEditingRecord({ isNew: true, name: '', duration: 0, score: 0, status: 'draft' })}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            >
              <Plus className="w-4 h-4" /> New Session
            </button>
          </div>
        </aside>

        {/* Spatial Composer */}
        <div className="flex-1 flex flex-col bg-zinc-900 relative">

          <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
            <h2 className="font-medium flex items-center gap-2">
              <Map className="w-4 h-4 text-zinc-400" /> Spatial Composer
            </h2>
            <div className="flex gap-4 text-xs font-mono">
              <div className="bg-zinc-900 border border-zinc-800 px-3 py-1 rounded flex gap-3">
                <span className="text-zinc-500">CAPACITY</span>
                <span className="text-emerald-400 font-bold">{state.derived.capacity}%</span>
              </div>
            </div>
          </div>

          <div className="flex-1 p-8 relative overflow-hidden flex items-center justify-center">

            {/* The Grid Canvas */}
            <div
              className="w-full max-w-lg aspect-square bg-zinc-950 border border-zinc-800 rounded relative overflow-hidden shadow-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/50"
              tabIndex="0"
              onKeyDown={handleComposerKeyDown}
              aria-label="Spatial Composer Grid. Use arrow keys to move the selected item."
              style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)',
                backgroundSize: '20px 20px'
              }}
              onClick={(e) => {
                if (!state.selectedId) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                const y = Math.round((1 - (e.clientY - rect.top) / rect.height) * 100);
                placeRecordInComposer(x, y);
              }}
            >
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 text-[10px] text-zinc-600 font-mono font-bold tracking-widest uppercase">
                <div className="flex justify-between items-start">
                  <span className="-rotate-90 origin-left mt-8 block whitespace-nowrap">High Quality</span>
                  <span>High Recovery</span>
                </div>
                <div className="flex justify-between items-end">
                  <span>Low Recovery</span>
                  <span className="-rotate-90 origin-right mb-8 block whitespace-nowrap">Low Quality</span>
                </div>
              </div>

              {state.records.filter(r => r.spatialState).map(rec => (
                <div
                  key={rec.id}
                  className={`absolute w-3 h-3 rounded-full -ml-1.5 -mb-1.5 motion-safe:transition-all motion-safe:duration-300 transform cursor-pointer
                    ${state.selectedId === rec.id ? 'bg-emerald-400 scale-150 shadow-[0_0_15px_rgba(52,211,153,0.5)]' : 'bg-zinc-600 hover:bg-zinc-400'}
                  `}
                  style={{
                    left: `${rec.spatialState.x}%`,
                    bottom: `${rec.spatialState.y}%`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setState(prev => ({ ...prev, selectedId: rec.id }));
                  }}
                  title={rec.name}
                  aria-label={rec.name}
                />
              ))}

            </div>

          </div>

          {/* Active Tool Panel */}
          {selectedRecord && (
            <div className="absolute bottom-4 right-4 bg-zinc-950 border border-zinc-800 rounded p-4 shadow-xl max-w-xs w-full animate-in slide-in-from-bottom-4">
              <h3 className="font-medium text-emerald-400 mb-1">Selected Record</h3>
              <div className="text-zinc-200 font-medium mb-3">{selectedRecord.name}</div>

              <div className="text-xs text-zinc-400 space-y-2 mb-4">
                <div className="flex justify-between"><span>Status</span><span className="uppercase text-zinc-300">{selectedRecord.status}</span></div>
                <div className="flex justify-between"><span>Score</span><span className="text-zinc-300">{selectedRecord.score}</span></div>
                <div className="flex justify-between"><span>Composer Pos</span><span className="font-mono text-zinc-300">{selectedRecord.spatialState ? `[${selectedRecord.spatialState.x}, ${selectedRecord.spatialState.y}]` : 'Unplaced'}</span></div>
              </div>

              <div className="text-[10px] text-zinc-500 text-center">
                Click grid to place, or select the grid and use arrow keys.
              </div>
            </div>
          )}

        </div>

      </main>

      {/* Editing Modal */}
      {editingRecord && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-medium mb-4">{editingRecord.isNew ? 'New Session' : 'Edit Session'}</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                name: formData.get('name'),
                duration: parseInt(formData.get('duration'), 10),
                score: parseInt(formData.get('score'), 10),
                status: formData.get('status')
              };
              if (editingRecord.isNew) createRecord(data);
              else updateRecord(editingRecord.id, data);
            }} className="space-y-4">

              <div>
                <label className="block text-xs text-zinc-400 mb-1" htmlFor="name">Name</label>
                <input required id="name" name="name" defaultValue={editingRecord.name} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 outline-none focus:border-emerald-500" />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-zinc-400 mb-1" htmlFor="duration">Duration (m)</label>
                  <input required id="duration" type="number" min="0" name="duration" defaultValue={editingRecord.duration} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 outline-none focus:border-emerald-500" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-zinc-400 mb-1" htmlFor="score">Score (0-100)</label>
                  <input required id="score" type="number" min="0" max="100" name="score" defaultValue={editingRecord.score} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 outline-none focus:border-emerald-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1" htmlFor="status">Status</label>
                <select id="status" name="status" defaultValue={editingRecord.status} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 outline-none focus:border-emerald-500">
                  <option value="draft">Draft</option>
                  <option value="ready">Ready</option>
                  <option value="changed">Changed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setEditingRecord(null)} className="px-4 py-2 hover:bg-zinc-800 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-white">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors focus:outline-none focus:ring-2 focus:ring-white">Save</button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
