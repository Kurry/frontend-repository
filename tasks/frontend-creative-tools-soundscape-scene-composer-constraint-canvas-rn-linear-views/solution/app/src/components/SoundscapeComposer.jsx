import React, { useState, useEffect, useCallback } from 'react';
import { initializeWebMCP } from '../utils/webmcp';
import { Plus, Download, Upload, Undo2, Archive, Play, Pause, Trash2, Edit2, Filter } from 'lucide-react';

const INITIAL_STATE = {
  schemaVersion: 'v1',
  exportedAt: new Date().toISOString(),
  records: [
    { id: '1', name: 'Background Ambience', status: 'ready', canvasState: 'idle', lane: 'base', duration: 120 },
    { id: '2', name: 'Footsteps', status: 'draft', canvasState: 'selected', lane: 'effects', duration: 15 },
    { id: '3', name: 'Dialogue 1', status: 'changed', canvasState: 'resolved', lane: 'voice', duration: 45 },
  ],
  derived: {
    summary: 'Initial state loaded',
    totalDuration: 180
  },
  history: []
};

const STATUS_COLORS = {
  empty: 'bg-gray-100 text-gray-500',
  draft: 'bg-blue-100 text-blue-700',
  ready: 'bg-green-100 text-green-700',
  changed: 'bg-yellow-100 text-yellow-700',
  archived: 'bg-gray-800 text-gray-200'
};

const CANVAS_COLORS = {
  idle: 'bg-white border-gray-200',
  selected: 'bg-blue-50 border-blue-400 ring-2 ring-blue-200',
  changed: 'bg-yellow-50 border-yellow-400',
  conflict: 'bg-red-50 border-red-500 ring-2 ring-red-200 animate-pulse',
  resolved: 'bg-green-50 border-green-400'
};

export default function SoundscapeComposer() {
  const [appState, setAppState] = useState(INITIAL_STATE);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverLane, setDragOverLane] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [statusFilter, setStatusFilter] = useState('all');

  const getState = useCallback(() => appState, [appState]);
  const setState = useCallback((newState) => {
    setAppState(newState);
    setErrorMsg('');
    setFieldErrors({});
  }, []);

  useEffect(() => {
    initializeWebMCP(getState, setState);
  }, [getState, setState]);

  const handleDragStart = (e, record) => {
    setDraggedItem(record);
    e.dataTransfer.setData('text/plain', record.id);
  };

  const handleDragOver = (e, lane) => {
    e.preventDefault();
    setDragOverLane(lane);
  };

  const handleDrop = (e, targetLane) => {
    e.preventDefault();
    setDragOverLane(null);
    if (!draggedItem) return;

    if (draggedItem.lane === targetLane) return;

    resolveMutation(draggedItem.id, 'resolved', targetLane);
    setDraggedItem(null);
  };

  const handleKeyDown = (e, record) => {
    if (e.key === 'ArrowRight') {
      const lanes = ['base', 'effects', 'voice'];
      const currentIndex = lanes.indexOf(record.lane);
      if (currentIndex < lanes.length - 1) {
        resolveMutation(record.id, 'resolved', lanes[currentIndex + 1]);
      }
    } else if (e.key === 'ArrowLeft') {
       const lanes = ['base', 'effects', 'voice'];
      const currentIndex = lanes.indexOf(record.lane);
      if (currentIndex > 0) {
        resolveMutation(record.id, 'resolved', lanes[currentIndex - 1]);
      }
    }
  };

  const resolveMutation = (recordId, newState, lane) => {
    const record = appState.records.find(r => r.id === recordId);
    if (!record) return;

    const newHistory = [...appState.history, {
      action: 'mutate',
      recordId,
      previousState: appState
    }];

    const updatedRecords = appState.records.map(r =>
      r.id === recordId ? { ...r, canvasState: newState, lane, status: 'changed' } : r
    );

    setAppState({
      ...appState,
      records: updatedRecords,
      history: newHistory,
      derived: {
        ...appState.derived,
        summary: `Moved ${record.name} to ${lane}`
      }
    });
  };

  const handleUndo = () => {
    if (appState.history.length === 0) return;
    const lastState = appState.history[appState.history.length - 1].previousState;
    setAppState(lastState);
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [appState]);

  const handleExport = () => {
    const exportData = {
      ...appState,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'soundscape-scene-v1-constraint-canvas.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.schemaVersion !== 'v1') throw new Error("Invalid schema version");
        if (!data.records) throw new Error("Missing records");

        setAppState({
          ...data,
          exportedAt: new Date().toISOString(),
          history: []
        });
        setErrorMsg('');
      } catch (err) {
        setErrorMsg('Failed to import: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handleArchive = (id) => {
    const newHistory = [...appState.history, { action: 'archive', previousState: appState }];
    setAppState({
      ...appState,
      records: appState.records.map(r => r.id === id ? { ...r, status: 'archived' } : r),
      history: newHistory,
      derived: { ...appState.derived, summary: 'Archived record' }
    });
  };

  const handleDelete = (id) => {
    const newHistory = [...appState.history, { action: 'delete', previousState: appState }];
    setAppState({
      ...appState,
      records: appState.records.filter(r => r.id !== id),
      history: newHistory,
      derived: { ...appState.derived, summary: 'Deleted record' }
    });
  };

  const handleSaveRecord = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const durationStr = formData.get('duration');
    const duration = parseInt(durationStr, 10);

    let errors = {};
    if (!name || name.trim() === '') {
      errors.name = 'Name is required';
    }
    if (!durationStr || isNaN(duration) || duration <= 0) {
      errors.duration = 'Valid positive duration required';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const newHistory = [...appState.history, { action: 'edit', previousState: appState }];

    if (editingRecord.id) {
       setAppState({
        ...appState,
        records: appState.records.map(r => r.id === editingRecord.id ? { ...r, name, duration } : r),
        history: newHistory,
        derived: { ...appState.derived, summary: `Updated ${name}` }
      });
    } else {
       setAppState({
        ...appState,
        records: [...appState.records, {
          id: Date.now().toString(),
          name,
          duration,
          status: 'draft',
          canvasState: 'idle',
          lane: 'base'
        }],
        history: newHistory,
        derived: { ...appState.derived, summary: `Created ${name}` }
      });
    }
    setEditingRecord(null);
    setFieldErrors({});
    setErrorMsg('');
  };

  const lanes = ['base', 'effects', 'voice'];
  const filteredRecords = appState.records.filter(r => statusFilter === 'all' || r.status === statusFilter);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
        <h1 className="text-xl font-semibold text-gray-800">Soundscape Scene Composer</h1>
        <div className="flex items-center gap-4">
          <button onClick={handleUndo} disabled={appState.history.length === 0} className="p-2 text-gray-600 hover:bg-gray-100 rounded-md disabled:opacity-50" title="Undo (Ctrl+Z)">
            <Undo2 className="w-5 h-5" />
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            <Download className="w-4 h-4" /> Export
          </button>
          <label className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 cursor-pointer">
            <Upload className="w-4 h-4" /> Import
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
        </div>
      </header>

      {errorMsg && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 shrink-0">
          <p className="text-red-700">{errorMsg}</p>
        </div>
      )}

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar: Layers Collection */}
        <aside className="w-full md:w-80 bg-gray-50 border-r border-gray-200 flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 flex flex-col gap-3 bg-white sticky top-0 z-10">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-gray-700">Layers</h2>
              <button onClick={() => setEditingRecord({})} className="p-1 hover:bg-gray-100 rounded text-gray-600">
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm bg-gray-50 border border-gray-200 rounded px-2 py-1 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="ready">Ready</option>
                <option value="changed">Changed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="flex-1 p-4 space-y-3">
            {filteredRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                 <div className="px-4 py-2 rounded-full bg-gray-100 text-gray-500 mb-2 font-medium">Empty</div>
                 <p className="text-sm">No layers found.</p>
              </div>
            ) : (
              filteredRecords.map(record => (
                <div key={record.id} className={`bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col gap-2 ${record.status === 'archived' ? 'opacity-60' : ''}`}>
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-sm text-gray-800 break-words">{record.name}</span>
                    <div className="flex gap-1">
                      <button onClick={() => handleArchive(record.id)} className="p-1 text-gray-400 hover:text-orange-600" title="Archive"><Archive className="w-4 h-4" /></button>
                      <button onClick={() => setEditingRecord(record)} className="p-1 text-gray-400 hover:text-blue-600" title="Edit"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(record.id)} className="p-1 text-gray-400 hover:text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-1 rounded-full font-medium ${STATUS_COLORS[record.status] || STATUS_COLORS.empty}`}>{record.status}</span>
                    <span className="text-gray-500">{record.duration}s</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Main Content: Constraint Canvas */}
        <section className="flex-1 bg-gray-100/50 p-6 flex flex-col min-w-0 overflow-y-auto">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Constraint Canvas</h2>
            <p className="text-sm text-gray-500">Drag records across lanes to resolve conflicts or update state.</p>
          </div>

          <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-x-auto pb-4">
            {lanes.map(lane => (
              <div
                key={lane}
                onDragOver={(e) => handleDragOver(e, lane)}
                onDrop={(e) => handleDrop(e, lane)}
                className={`flex-1 min-w-[250px] bg-gray-200/50 rounded-xl p-4 flex flex-col gap-3 border-2 border-dashed transition-colors
                  ${dragOverLane === lane ? 'border-blue-400 bg-blue-50/50' : 'border-gray-300'}`}
              >
                <h3 className="font-medium text-gray-600 capitalize text-center border-b border-gray-300 pb-2">{lane}</h3>
                <div className="flex-1 flex flex-col gap-3 min-h-[100px]">
                  {appState.records.filter(r => r.lane === lane && r.status !== 'archived').map(record => (
                    <div
                      key={record.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, record)}
                      onKeyDown={(e) => handleKeyDown(e, record)}
                      tabIndex={0}
                      className={`p-4 rounded-lg border shadow-sm cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${CANVAS_COLORS[record.canvasState]}`}
                    >
                      <div className="font-medium text-sm mb-1">{record.name}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider">{record.canvasState}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Sidebar: Summary & Inspector */}
        <aside className="w-full md:w-64 bg-white border-l border-gray-200 p-4 shrink-0 overflow-y-auto flex flex-col gap-6">
           <div>
            <h3 className="font-semibold text-gray-700 mb-2">Summary</h3>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-900">
              {appState.derived.summary}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Session Info</h3>
             <div className="text-sm text-gray-600 space-y-2">
              <p>Total Records: {appState.records.length}</p>
              <p className="break-all">Exported: {new Date(appState.exportedAt).toLocaleString()}</p>
              <p>Schema: {appState.schemaVersion}</p>
            </div>
          </div>
        </aside>
      </main>

      {/* Edit Modal */}
      {editingRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">{editingRecord.id ? 'Edit Record' : 'New Record'}</h2>
            <form onSubmit={handleSaveRecord} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input name="name" defaultValue={editingRecord.name} className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.name ? 'border-red-500' : 'border-gray-300'}`} />
                {fieldErrors.name && <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (s)</label>
                <input name="duration" type="number" step="any" defaultValue={editingRecord.duration} className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.duration ? 'border-red-500' : 'border-gray-300'}`} />
                {fieldErrors.duration && <p className="text-red-500 text-xs mt-1">{fieldErrors.duration}</p>}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => { setEditingRecord(null); setFieldErrors({}); }} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
