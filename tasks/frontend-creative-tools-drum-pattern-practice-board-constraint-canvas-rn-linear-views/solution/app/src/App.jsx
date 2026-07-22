import React, { useState, useEffect } from 'react';
import { useStore } from './store.js';
import { Download, Upload, Trash2, Edit2, CheckCircle2, AlertTriangle, Undo, Plus, X } from 'lucide-react';

const STATUS_COLORS = {
  empty: 'bg-gray-100 text-gray-800 border-gray-200',
  draft: 'bg-blue-100 text-blue-800 border-blue-200',
  ready: 'bg-green-100 text-green-800 border-green-200',
  changed: 'bg-amber-100 text-amber-800 border-amber-200',
  archived: 'bg-slate-100 text-slate-800 border-slate-200'
};

const LANES = ['Unconstrained', 'Timing', 'Velocity', 'Polyphony'];

export default function App() {
  const { state, derived, dispatch, exportSession, importSession } = useStore();
  const [importError, setImportError] = useState('');
  const [newRecordName, setNewRecordName] = useState('');
  const [nameError, setNameError] = useState('');

  // Undo keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch]);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newRecordName.trim()) {
      setNameError('Name is required');
      return;
    }
    if (newRecordName.length > 50) {
      setNameError('Name must be 50 characters or less');
      return;
    }
    dispatch({ type: 'CREATE_RECORD', payload: { name: newRecordName.trim(), status: 'empty' } });
    setNewRecordName('');
    setNameError('');
  };

  const handleExport = () => {
    const data = exportSession();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'drum-pattern-v1-constraint-canvas.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        const success = importSession(data);
        if (!success) {
          setImportError('Invalid import: Malformed schema, duplicate IDs, or invalid bounds');
        } else {
          setImportError('');
        }
      } catch (err) {
        setImportError('Invalid JSON format');
      }
    };
    reader.readAsText(file);
    e.target.value = null; // reset input
  };

  // Group records by status for the Linear-style view
  const groupedRecords = ['draft', 'ready', 'changed', 'empty', 'archived'].reduce((acc, status) => {
      acc[status] = state.records.filter(r => r.status === status);
      return acc;
  }, {});

  return (
    <div className="min-h-screen flex flex-col md:flex-row p-4 gap-6">
      {/* Left Column: Filtered View & Form */}
      <div className="flex-1 max-w-sm flex flex-col gap-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Drum Patterns</h2>

          <form onSubmit={handleCreate} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={newRecordName}
                onChange={(e) => setNewRecordName(e.target.value)}
                placeholder="New pattern name..."
                className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${nameError ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`}
              />
              <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center">
                <Plus size={18} />
              </button>
            </div>
            {nameError && <p className="text-red-500 text-sm mt-1">{nameError}</p>}
          </form>

          <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-250px)] scrollbar-hide pr-2">
            {Object.entries(groupedRecords).map(([status, records]) => (
                records.length > 0 && (
                  <div key={status} className="space-y-2">
                    <div className="flex items-center gap-2 sticky top-0 bg-white py-1 z-10">
                        <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[status].split(' ')[0]}`}></span>
                        <h3 className="text-sm font-medium text-gray-500 capitalize tracking-wide">{status} <span className="ml-1 text-gray-400 font-normal">{records.length}</span></h3>
                    </div>
                    {records.map(record => (
                      <div
                        key={record.id}
                        className={`p-3 rounded-md border text-sm flex items-center justify-between group
                          ${state.selectedRecordId === record.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 hover:border-gray-300'}
                          ${record.conflict ? 'bg-amber-50 border-amber-300' : 'bg-white'}
                        `}
                        onClick={() => dispatch({ type: 'SELECT_RECORD', payload: record.id })}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                dispatch({ type: 'SELECT_RECORD', payload: record.id });
                            }
                        }}
                      >
                        <div className="flex flex-col gap-1 truncate">
                            <span className="font-medium truncate">{record.name}</span>
                            <span className="text-xs text-gray-500">Lane: {record.lane}</span>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                            <select
                                value={record.status}
                                onChange={(e) => dispatch({ type: 'UPDATE_RECORD', payload: { id: record.id, updates: { status: e.target.value } } })}
                                className="text-xs border rounded px-1 py-0.5 focus:outline-none"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {['empty', 'draft', 'ready', 'changed', 'archived'].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <button
                                onClick={(e) => { e.stopPropagation(); dispatch({ type: 'DELETE_RECORD', payload: record.id }); }}
                                className="text-gray-400 hover:text-red-600 p-1 rounded"
                                aria-label="Delete"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
            ))}
            {state.records.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                    No patterns yet. Create one above.
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Area: Canvas & Header */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Header / Actions */}
        <div className="flex flex-wrap items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200 gap-4">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => dispatch({ type: 'UNDO' })}
                    disabled={state.undoStack.length === 0}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Undo size={16} /> Undo
                </button>
                <button
                    onClick={() => dispatch({ type: 'CLEAR' })}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                    <X size={16} /> Clear Board
                </button>
            </div>
            <div className="flex items-center gap-3">
                <div className="relative">
                    <input
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        title="Import Session"
                    />
                    <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                        <Upload size={16} /> Import
                    </button>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                >
                    <Download size={16} /> Export
                </button>
            </div>
        </div>

        {importError && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md border border-red-200 text-sm flex items-center justify-between">
                <span>{importError}</span>
                <button onClick={() => setImportError('')}><X size={16} /></button>
            </div>
        )}

        {/* Derived Summary */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-6" aria-live="polite">
            <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Lane Distribution</span>
                <div className="flex gap-4">
                    {LANES.map(lane => (
                        <div key={lane} className="flex flex-col items-center">
                            <span className="text-sm text-gray-600">{lane}</span>
                            <span className="font-medium text-lg">{derived.lanes[lane]}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="hidden md:block w-px bg-gray-200 my-1"></div>
            <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Status Count</span>
                <div className="flex gap-4">
                    {['draft', 'ready', 'changed'].map(status => (
                        <div key={status} className="flex flex-col items-center">
                            <span className="text-sm text-gray-600 capitalize">{status}</span>
                            <span className="font-medium text-lg">{derived.statuses[status]}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Constraint Canvas */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold">Constraint Canvas</h2>
                <p className="text-sm text-gray-500 mt-1">Select a record on the left, then move it across lanes. Resolve any conflicts.</p>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-x-auto min-h-[400px]">
                {LANES.map(lane => (
                    <div
                        key={lane}
                        className="flex-1 min-w-[200px] border-r last:border-r-0 border-gray-200 p-4 flex flex-col bg-gray-50/50"
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.add('bg-blue-50');
                        }}
                        onDragLeave={(e) => {
                            e.currentTarget.classList.remove('bg-blue-50');
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('bg-blue-50');
                            const recordId = e.dataTransfer.getData('text/plain');
                            if (recordId) {
                                const record = state.records.find(r => r.id === recordId);
                                if (record && record.lane !== lane) {
                                    dispatch({ type: 'MOVE_RECORD', payload: { id: recordId, lane, requiresResolution: true } });
                                }
                            }
                        }}
                    >
                        <h3 className="text-sm font-semibold text-gray-600 mb-4 sticky top-0">{lane}</h3>

                        {/* Keyboard navigation helper for the lane */}
                        <div className="sr-only">Lane {lane}. Press Enter to move selected record here.</div>
                        <button
                            className="absolute opacity-0 pointer-events-none focus:pointer-events-auto focus:opacity-100 focus:relative focus:mb-4 bg-blue-100 text-blue-700 px-2 py-1 text-xs rounded w-full"
                            onClick={() => {
                                if (state.selectedRecordId) {
                                    const record = state.records.find(r => r.id === state.selectedRecordId);
                                    if (record && record.lane !== lane) {
                                        dispatch({ type: 'MOVE_RECORD', payload: { id: state.selectedRecordId, lane, requiresResolution: true } });
                                    }
                                }
                            }}
                        >
                            Move Selected Here
                        </button>

                        <div className="flex-1 space-y-3">
                            {state.records.filter(r => r.lane === lane).map(record => (
                                <div
                                    key={record.id}
                                    draggable
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData('text/plain', record.id);
                                        dispatch({ type: 'SELECT_RECORD', payload: record.id });
                                    }}
                                    className={`
                                        p-3 bg-white rounded shadow-sm border transition-all cursor-grab active:cursor-grabbing
                                        ${state.selectedRecordId === record.id ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'}
                                        ${record.conflict ? 'border-amber-400 ring-2 ring-amber-400 bg-amber-50' : ''}
                                    `}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="truncate">
                                            <div className="font-medium text-sm truncate" title={record.name}>{record.name}</div>
                                            <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                <span className={`inline-block w-2 h-2 rounded-full ${STATUS_COLORS[record.status].split(' ')[0]}`}></span>
                                                {record.status}
                                            </div>
                                        </div>
                                    </div>

                                    {record.conflict && (
                                        <div className="mt-3 pt-3 border-t border-amber-200 flex items-center justify-between">
                                            <div className="flex items-center gap-1 text-amber-700 text-xs font-medium">
                                                <AlertTriangle size={14} />
                                                <span>Conflict</span>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    dispatch({ type: 'RESOLVE_CONFLICT', payload: record.id });
                                                }}
                                                className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-2 py-1 rounded shadow-sm transition-colors flex items-center gap-1"
                                            >
                                                <CheckCircle2 size={12} /> Resolve
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
}
