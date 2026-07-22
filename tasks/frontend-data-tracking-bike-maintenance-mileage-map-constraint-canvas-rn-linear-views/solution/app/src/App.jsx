import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Download, Upload, Plus, Undo2, GripVertical, AlertTriangle, Search, Filter, ArrowRight, ArrowLeft } from 'lucide-react';
import { setupWebMCP } from './webmcp.js';

const SCHEMA_VERSION = 'bike-maintenance-v1';
const STATUSES = ['draft', 'ready', 'changed', 'conflict', 'archived'];

// Helper to generate a short ID
const generateId = () => Math.random().toString(36).substring(2, 9);

function App() {
  const [records, setRecords] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fileInputRef = useRef(null);

  // Expose WebMCP
  useEffect(() => {
    setupWebMCP(
      () => ({
        records,
        constraintCanvasState: { selectedId, searchQuery, statusFilter },
        derivedSummary,
        history
      }),
      (updater) => {
        if (typeof updater === 'function') {
          const newState = updater({ records, history, selectedId, searchQuery, statusFilter });
          if (newState.records) setRecords(newState.records);
          if (newState.history) setHistory(newState.history);
        }
      }
    );
  }, [records, history, selectedId, searchQuery, statusFilter]);

  // Derived state
  const derivedSummary = useMemo(() => {
    const total = records.length;
    const byStatus = records.reduce((acc, r) => {
      acc[r.state] = (acc[r.state] || 0) + 1;
      return acc;
    }, {});
    const totalCost = records.reduce((sum, r) => sum + (parseFloat(r.details?.cost) || 0), 0);
    return { total, byStatus, totalCost };
  }, [records]);

  // Push to history
  const pushHistory = (newRecords) => {
    setHistory(prev => [...prev, { records: newRecords, timestamp: Date.now() }]);
  };

  const handleCreate = () => {
    const newRecord = {
      id: generateId(),
      state: 'draft',
      details: { title: 'New Service', mileage: 0, cost: 0, description: '' }
    };
    const newRecords = [...records, newRecord];
    setRecords(newRecords);
    pushHistory(newRecords);
    setSelectedId(newRecord.id);
  };

  const handleUpdate = (id, updates) => {
    const newRecords = records.map(r => r.id === id ? { ...r, details: { ...r.details, ...updates } } : r);
    setRecords(newRecords);
    pushHistory(newRecords);
  };

  const handleDelete = (id) => {
    const newRecords = records.filter(r => r.id !== id);
    setRecords(newRecords);
    pushHistory(newRecords);
    if (selectedId === id) setSelectedId(null);
  };

  const handleUndo = () => {
    if (history.length > 1) {
      const prev = history[history.length - 2];
      setRecords(prev.records);
      setHistory(history.slice(0, history.length - 1));
    } else if (history.length === 1) {
      setRecords([]);
      setHistory([]);
    }
  };

  const validateTransition = (record, toState) => {
    // Cannot move to ready if mileage or cost <= 0
    if (toState === 'ready' && (record.details.mileage <= 0 || record.details.cost <= 0)) {
      return false;
    }
    // Conflict state validation - can't move straight to archive from conflict
    if (record.state === 'conflict' && toState === 'archived') {
      return false;
    }
    return true;
  };

  const attemptMove = (id, toState) => {
    const record = records.find(r => r.id === id);
    if (!record) return;

    if (record.state === toState) return;

    if (!validateTransition(record, toState)) {
      // Create a conflict
      if (toState !== 'conflict') {
        const newRecords = records.map(r => r.id === id ? { ...r, state: 'conflict', conflictReason: `Cannot move to ${toState} with current data.` } : r);
        setRecords(newRecords);
        pushHistory(newRecords);
      }
      return;
    }

    const newRecords = records.map(r => r.id === id ? { ...r, state: toState, conflictReason: null } : r);
    setRecords(newRecords);
    pushHistory(newRecords);
  };

  // Keyboard accessibility helper for moving between columns
  const handleKeyDownMove = (e, id) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const record = records.find(r => r.id === id);
      if (!record) return;
      const currentIndex = STATUSES.indexOf(record.state);
      let newIndex = currentIndex;
      if (e.key === 'ArrowRight' && currentIndex < STATUSES.length - 1) newIndex++;
      if (e.key === 'ArrowLeft' && currentIndex > 0) newIndex--;

      if (newIndex !== currentIndex) {
        attemptMove(id, STATUSES[newIndex]);
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelectedId(id);
    }
  };

  // Drag and Drop
  const onDragStart = (e, id) => {
    e.dataTransfer.setData('text/plain', id);
    setSelectedId(id);
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = (e, toState) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) {
      attemptMove(id, toState);
    }
  };

  // Keyboard shortcut for undo
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

  // Export/Import
  const handleExport = () => {
    const data = {
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      records,
      derived: derivedSummary,
      history
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bike-maintenance-${new Date().toISOString().slice(0, 10)}.json`;
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
        if (data.schemaVersion === SCHEMA_VERSION && Array.isArray(data.records)) {
          setRecords(data.records);
          setHistory(data.history || [{ records: data.records, timestamp: Date.now() }]);
          setSelectedId(null);
        } else {
          alert('Invalid file format or schema version.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
      e.target.value = ''; // Reset input
    };
    reader.readAsText(file);
  };

  const filteredRecords = records.filter(r =>
    (statusFilter === 'all' || r.state === statusFilter) &&
    r.details.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans text-sm md:text-base">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
        <h1 className="text-xl font-bold text-gray-800">Bike Maintenance</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
            aria-label="Undo"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={20} />
          </button>
          <button
            onClick={handleExport}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded flex items-center gap-1"
            aria-label="Export JSON"
          >
            <Download size={20} /> Export
          </button>
          <label className="p-2 text-gray-600 hover:bg-gray-100 rounded flex items-center gap-1 cursor-pointer">
            <Upload size={20} /> Import
            <input
              type="file"
              accept=".json"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImport}
            />
          </label>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1 font-medium focus:ring-2 focus:ring-blue-500"
          >
            <Plus size={20} /> New Record
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">

        {/* Sidebar / Inspector */}
        <aside className="w-full md:w-80 bg-white border-r border-gray-200 overflow-y-auto flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-700 mb-2">Summary</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-50 p-2 rounded border border-gray-100">
                <span className="block text-gray-500">Total Records</span>
                <span className="font-medium">{derivedSummary.total}</span>
              </div>
              <div className="bg-gray-50 p-2 rounded border border-gray-100">
                <span className="block text-gray-500">Total Cost</span>
                <span className="font-medium">${derivedSummary.totalCost.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="p-4 flex-1">
            <h2 className="font-semibold text-gray-700 mb-4">Inspector</h2>
            {selectedId && records.find(r => r.id === selectedId) ? (
              <div className="space-y-4">
                {(() => {
                  const r = records.find(r => r.id === selectedId);
                  return (
                    <>
                      {r.state === 'conflict' && r.conflictReason && (
                        <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded text-sm flex gap-2 items-start">
                          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                          <span>{r.conflictReason}</span>
                        </div>
                      )}
                      <div>
                        <label className="block text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">Title</label>
                        <input
                          type="text"
                          value={r.details.title}
                          onChange={(e) => handleUpdate(r.id, { title: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">Mileage</label>
                          <input
                            type="number"
                            min="0"
                            value={r.details.mileage}
                            onChange={(e) => handleUpdate(r.id, { mileage: parseFloat(e.target.value) || 0 })}
                            className="w-full p-2 border border-gray-300 rounded outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">Cost ($)</label>
                          <input
                            type="number"
                            min="0" step="0.01"
                            value={r.details.cost}
                            onChange={(e) => handleUpdate(r.id, { cost: parseFloat(e.target.value) || 0 })}
                            className="w-full p-2 border border-gray-300 rounded outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">Description</label>
                        <textarea
                          value={r.details.description}
                          onChange={(e) => handleUpdate(r.id, { description: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded h-24 resize-none outline-none"
                        />
                      </div>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium focus:ring-2 focus:ring-red-500 rounded p-1"
                      >
                        Delete Record
                      </button>
                    </>
                  );
                })()}
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">Select a record to view details.</p>
            )}
          </div>
        </aside>

        {/* Constraint Canvas (Board) */}
        <main className="flex-1 flex flex-col overflow-hidden bg-gray-100">
          <div className="p-4 flex items-center gap-4 bg-white border-b border-gray-200 shrink-0 shadow-sm z-10">
            <div className="relative flex-1 max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search records..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="py-2 pl-2 pr-8 bg-gray-50 border border-gray-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 flex items-start gap-4 h-full snap-x snap-mandatory hide-scrollbar">
            {STATUSES.map((status, index) => (
              <div
                key={status}
                className={`w-80 flex-shrink-0 flex flex-col bg-gray-200 rounded-lg max-h-full snap-center ${status === 'conflict' ? 'border-2 border-red-300 bg-red-50' : ''}`}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, status)}
              >
                <div className="p-3 flex justify-between items-center border-b border-gray-300">
                  <h3 className="font-semibold text-gray-700 uppercase tracking-wide text-xs">
                    {status}
                    <span className="ml-2 bg-white px-2 py-0.5 rounded-full text-gray-500 font-normal">
                      {filteredRecords.filter(r => r.state === status).length}
                    </span>
                  </h3>
                </div>
                <div className="p-2 flex-1 overflow-y-auto space-y-2">
                  {filteredRecords.filter(r => r.state === status).map(record => (
                    <div
                      key={record.id}
                      draggable
                      tabIndex={0}
                      onDragStart={(e) => onDragStart(e, record.id)}
                      onClick={() => setSelectedId(record.id)}
                      onKeyDown={(e) => handleKeyDownMove(e, record.id)}
                      className={`p-3 bg-white border rounded shadow-sm cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${selectedId === record.id ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200 hover:border-gray-300'} ${record.state === 'conflict' ? 'border-red-400 bg-red-50 text-red-900' : ''}`}
                      aria-label={`${record.details.title}, ${record.details.mileage} miles, $${record.details.cost}. Use arrow keys to move between columns.`}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical size={16} className="text-gray-400 mt-0.5 flex-shrink-0 cursor-grab" aria-hidden="true" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate" title={record.details.title}>{record.details.title}</p>
                          <div className="flex justify-between mt-2 text-xs text-gray-500">
                            <span>{record.details.mileage} mi</span>
                            <span>${Number(record.details.cost).toFixed(2)}</span>
                          </div>

                          {/* Keyboard Accessible Buttons (Touch-equivalent) */}
                          <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between">
                            <button
                              onClick={(e) => { e.stopPropagation(); if(index > 0) attemptMove(record.id, STATUSES[index-1]); }}
                              disabled={index === 0}
                              className="p-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-30 focus:ring-1 focus:ring-blue-400"
                              aria-label="Move Left"
                            >
                              <ArrowLeft size={14} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); if(index < STATUSES.length - 1) attemptMove(record.id, STATUSES[index+1]); }}
                              disabled={index === STATUSES.length - 1}
                              className="p-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-30 focus:ring-1 focus:ring-blue-400"
                              aria-label="Move Right"
                            >
                              <ArrowRight size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredRecords.filter(r => r.state === status).length === 0 && (
                    <div className="text-center p-4 text-gray-400 text-sm border-2 border-dashed border-gray-300 rounded">
                      Drop here
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
