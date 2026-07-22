import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { CoffeeBrewExperimentLogSession, BrewExperiment, BrewStatus, TimelineCheckpoint } from './types';
import { Plus, Download, Upload, Trash2, Edit2, Play, RotateCcw, Save, X, Archive, Filter } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { setupWebMCP } from './webmcp';

const INITIAL_RECORDS: BrewExperiment[] = Array.from({ length: 100 }, (_, i) => ({
  id: uuidv4(),
  name: `Experiment ${i + 1}`,
  bean: `Bean ${i % 5}`,
  roastDate: '2024-01-01',
  status: i % 10 === 0 ? 'empty' : i % 5 === 0 ? 'ready' : 'draft',
  timelineState: [
    {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      notes: 'Initial test',
      rating: 3,
      waterTemperature: 92,
      grindSize: 5,
      brewTime: 120,
    }
  ],
}));

export default function App() {
  const [records, setRecords] = useState<BrewExperiment[]>(INITIAL_RECORDS);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<BrewStatus | 'all'>('all');
  const [history, setHistory] = useState<BrewExperiment[][]>([INITIAL_RECORDS]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Edit/Create form state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<BrewExperiment>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Timeline scrub state
  const [activeTimelineIndex, setActiveTimelineIndex] = useState<number>(0);

  useEffect(() => {
    setupWebMCP();
  }, []);

  useEffect(() => {
    window._appState = {
      records,
      setRecords,
      pushHistory,
      setSelectedRecordId,
      setActiveTimelineIndex,
      selectedRecordId,
      history,
      historyIndex
    };
  }, [records, history, historyIndex, selectedRecordId]);

  const selectedRecord = useMemo(() => records.find(r => r.id === selectedRecordId) || null, [records, selectedRecordId]);

  const filteredRecords = useMemo(() => {
    if (filterStatus === 'all') return records;
    return records.filter(r => r.status === filterStatus);
  }, [records, filterStatus]);

  const derivedSummary = useMemo(() => {
    const ready = records.filter(r => r.status === 'ready').length;
    const archived = records.filter(r => r.status === 'archived').length;
    const allRatings = records.flatMap(r => r.timelineState.map(t => t.rating));
    const avgRating = allRatings.length ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length : 0;

    return {
      total: records.length,
      ready,
      archived,
      avgRating: Number(avgRating.toFixed(2))
    };
  }, [records]);

  const pushHistory = (newRecords: BrewExperiment[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newRecords);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const updateRecord = (id: string, updates: Partial<BrewExperiment>) => {
    const newRecords = records.map(r => r.id === id ? { ...r, ...updates, status: updates.status || 'changed' } : r);
    setRecords(newRecords);
    pushHistory(newRecords);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setRecords(history[historyIndex - 1]);
    }
  };

  const handleExport = () => {
    const session: CoffeeBrewExperimentLogSession = {
      schemaVersion: 'brew-experiment-v1',
      exportedAt: new Date().toISOString(),
      records,
      derived: { summary: derivedSummary },
      history: [] // Simplified history for export
    };

    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'brew-experiment-v1-replay-timeline.json';
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
        const data = JSON.parse(event.target?.result as string) as CoffeeBrewExperimentLogSession;
        if (data.schemaVersion !== 'brew-experiment-v1') {
          alert('Invalid schema version');
          return;
        }
        // Basic validation
        if (!Array.isArray(data.records)) {
          alert('Invalid format: records must be an array');
          return;
        }

        setRecords(data.records);
        setHistory([data.records]);
        setHistoryIndex(0);
        setSelectedRecordId(null);
        alert('Import successful');
      } catch (err) {
        alert('Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!editForm.name?.trim()) errors.name = 'Name is required';
    if (!editForm.bean?.trim()) errors.bean = 'Bean is required';
    if (!editForm.roastDate) errors.roastDate = 'Roast Date is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveEdit = () => {
    if (!validateForm()) return;

    if (selectedRecordId) {
      updateRecord(selectedRecordId, editForm as BrewExperiment);
    } else {
      const newRecord: BrewExperiment = {
        id: uuidv4(),
        name: editForm.name || '',
        bean: editForm.bean || '',
        roastDate: editForm.roastDate || '',
        status: 'draft',
        timelineState: []
      };
      const newRecords = [...records, newRecord];
      setRecords(newRecords);
      pushHistory(newRecords);
      setSelectedRecordId(newRecord.id);
    }
    setIsEditing(false);
  };

  const handleTimelineScrub = (index: number) => {
    setActiveTimelineIndex(index);
    // In a full implementation, scrubbing might update the derived state or UI
    // Here we just update the active index to show the checkpoint details
  };

  const addTimelineCheckpoint = () => {
    if (!selectedRecord) return;

    const newCheckpoint: TimelineCheckpoint = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      notes: 'New checkpoint',
      rating: 3,
      waterTemperature: 90,
      grindSize: 5,
      brewTime: 120
    };

    updateRecord(selectedRecord.id, {
      timelineState: [...selectedRecord.timelineState, newCheckpoint]
    });
    setActiveTimelineIndex(selectedRecord.timelineState.length);
  };

  const restoreCheckpoint = (checkpoint: TimelineCheckpoint) => {
    if (!selectedRecord) return;
    const index = selectedRecord.timelineState.findIndex(c => c.id === checkpoint.id);
    if (index !== -1) {
       updateRecord(selectedRecord.id, {
         timelineState: selectedRecord.timelineState.slice(0, index + 1)
       });
       setActiveTimelineIndex(index);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col md:flex-row text-neutral-900 font-sans">
      {/* Sidebar: Collection & Summary */}
      <div className="w-full md:w-80 bg-white border-r border-neutral-200 flex flex-col h-screen overflow-hidden shrink-0">
        <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <h1 className="font-bold text-lg">Brew Logs</h1>
          <div className="flex gap-2">
            <button onClick={handleUndo} disabled={historyIndex === 0} className="p-1 hover:bg-neutral-200 rounded disabled:opacity-50" title="Undo">
              <RotateCcw size={18} />
            </button>
            <button onClick={() => { setIsEditing(true); setEditForm({}); setSelectedRecordId(null); }} className="p-1 hover:bg-neutral-200 rounded" title="New Experiment">
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Derived Summary */}
        <div className="p-4 border-b border-neutral-200 text-sm bg-neutral-50 grid grid-cols-2 gap-2">
          <div><span className="text-neutral-500">Total:</span> {derivedSummary.total}</div>
          <div><span className="text-neutral-500">Ready:</span> {derivedSummary.ready}</div>
          <div><span className="text-neutral-500">Archived:</span> {derivedSummary.archived}</div>
          <div><span className="text-neutral-500">Avg Rating:</span> {derivedSummary.avgRating}</div>
        </div>

        {/* Filters */}
        <div className="p-2 border-b border-neutral-200 flex gap-2 overflow-x-auto text-sm">
          <Filter size={16} className="mt-1 text-neutral-500" />
          {['all', 'empty', 'draft', 'ready', 'changed', 'archived'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              className={`px-2 py-1 rounded capitalize whitespace-nowrap ${filterStatus === status ? 'bg-blue-100 text-blue-700' : 'hover:bg-neutral-100'}`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filteredRecords.map(record => (
            <div
              key={record.id}
              onClick={() => { setSelectedRecordId(record.id); setIsEditing(false); setActiveTimelineIndex(record.timelineState.length > 0 ? record.timelineState.length - 1 : 0); }}
              className={`p-3 border-b border-neutral-100 cursor-pointer hover:bg-neutral-50 ${selectedRecordId === record.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
            >
              <div className="font-medium truncate">{record.name}</div>
              <div className="text-xs text-neutral-500 flex justify-between mt-1">
                <span className="truncate w-3/4">{record.bean}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                  record.status === 'ready' ? 'bg-green-100 text-green-700' :
                  record.status === 'archived' ? 'bg-neutral-200 text-neutral-600' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {record.status}
                </span>
              </div>
            </div>
          ))}
          {filteredRecords.length === 0 && (
            <div className="p-8 text-center text-neutral-400 text-sm">No records match the filter.</div>
          )}
        </div>

        {/* Artifact Transfer */}
        <div className="p-4 border-t border-neutral-200 flex gap-2 text-sm bg-neutral-50">
          <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-1 bg-white border border-neutral-300 rounded py-1 hover:bg-neutral-50">
            <Download size={14} /> Export
          </button>
          <label className="flex-1 flex items-center justify-center gap-1 bg-white border border-neutral-300 rounded py-1 hover:bg-neutral-50 cursor-pointer">
            <Upload size={14} /> Import
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
        {isEditing ? (
          <div className="p-8 max-w-2xl mx-auto w-full overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">{selectedRecordId ? 'Edit Experiment' : 'New Experiment'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none ${formErrors.name ? 'border-red-500' : 'border-neutral-300'}`}
                />
                {formErrors.name && <div className="text-red-500 text-xs mt-1">{formErrors.name}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Bean</label>
                <input
                  type="text"
                  value={editForm.bean || ''}
                  onChange={e => setEditForm({ ...editForm, bean: e.target.value })}
                  className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none ${formErrors.bean ? 'border-red-500' : 'border-neutral-300'}`}
                />
                {formErrors.bean && <div className="text-red-500 text-xs mt-1">{formErrors.bean}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Roast Date</label>
                <input
                  type="date"
                  value={editForm.roastDate || ''}
                  onChange={e => setEditForm({ ...editForm, roastDate: e.target.value })}
                  className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none ${formErrors.roastDate ? 'border-red-500' : 'border-neutral-300'}`}
                />
                {formErrors.roastDate && <div className="text-red-500 text-xs mt-1">{formErrors.roastDate}</div>}
              </div>

              <div className="flex gap-2 mt-8">
                <button onClick={handleSaveEdit} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2">
                  <Save size={16} /> Save
                </button>
                <button onClick={() => setIsEditing(false)} className="bg-neutral-200 text-neutral-800 px-4 py-2 rounded hover:bg-neutral-300 flex items-center gap-2">
                  <X size={16} /> Cancel
                </button>
              </div>
            </div>
          </div>
        ) : selectedRecord ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-neutral-200 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div>
                <h2 className="text-2xl font-bold">{selectedRecord.name}</h2>
                <div className="text-neutral-500 mt-1 flex flex-wrap items-center gap-3">
                  <span>{selectedRecord.bean}</span>
                  <span>&bull;</span>
                  <span>Roasted: {selectedRecord.roastDate}</span>
                  <span className={`px-2 py-0.5 rounded text-xs uppercase font-bold ${
                    selectedRecord.status === 'ready' ? 'bg-green-100 text-green-700' :
                    selectedRecord.status === 'archived' ? 'bg-neutral-200 text-neutral-600' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {selectedRecord.status}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditForm(selectedRecord); setIsEditing(true); }}
                  className="p-2 border border-neutral-300 rounded hover:bg-neutral-50 text-neutral-600" title="Edit"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => updateRecord(selectedRecord.id, { status: 'archived' })}
                  className="p-2 border border-neutral-300 rounded hover:bg-neutral-50 text-neutral-600" title="Archive"
                >
                  <Archive size={16} />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Delete this experiment?')) {
                      setRecords(records.filter(r => r.id !== selectedRecord.id));
                      setSelectedRecordId(null);
                    }
                  }}
                  className="p-2 border border-red-300 rounded hover:bg-red-50 text-red-600" title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Timeline Surface */}
            <div className="p-6 flex-1 overflow-y-auto bg-neutral-50">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Replay Timeline</h3>
                <button onClick={addTimelineCheckpoint} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 flex items-center gap-1">
                  <Plus size={14} /> Add Checkpoint
                </button>
              </div>

              {/* Timeline scrubber visual */}
              {selectedRecord.timelineState.length > 0 ? (
                <div className="relative pt-4 pb-12 mb-8 border-b border-neutral-200">
                  <div className="absolute top-6 left-4 right-4 h-1 bg-neutral-300 rounded" />
                  <div className="flex justify-between relative z-10 px-4">
                    {selectedRecord.timelineState.map((cp, idx) => (
                      <div
                        key={cp.id}
                        className="flex flex-col items-center cursor-pointer group"
                        onClick={() => handleTimelineScrub(idx)}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 ${idx <= activeTimelineIndex ? 'bg-blue-500 border-blue-500' : 'bg-white border-neutral-400'} transition-colors duration-300`} />
                        <div className={`absolute top-10 text-xs whitespace-nowrap ${idx === activeTimelineIndex ? 'font-bold text-blue-600' : 'text-neutral-500'}`}>
                          {format(parseISO(cp.timestamp), 'HH:mm')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-500">No checkpoints recorded yet.</div>
              )}

              {/* Active Checkpoint Details */}
              {selectedRecord.timelineState[activeTimelineIndex] && (
                <div className="bg-white p-6 rounded shadow-sm border border-neutral-200 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-semibold text-lg">Checkpoint Detail</h4>
                    <button
                      onClick={() => restoreCheckpoint(selectedRecord.timelineState[activeTimelineIndex])}
                      className="text-xs border border-neutral-300 px-2 py-1 rounded hover:bg-neutral-50 text-neutral-600 flex items-center gap-1"
                    >
                      <RotateCcw size={12} /> Restore to Here
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-neutral-50 p-3 rounded">
                      <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Water Temp</div>
                      <div className="font-medium text-lg">{selectedRecord.timelineState[activeTimelineIndex].waterTemperature}°C</div>
                    </div>
                    <div className="bg-neutral-50 p-3 rounded">
                      <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Grind Size</div>
                      <div className="font-medium text-lg">{selectedRecord.timelineState[activeTimelineIndex].grindSize}</div>
                    </div>
                    <div className="bg-neutral-50 p-3 rounded">
                      <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Brew Time</div>
                      <div className="font-medium text-lg">{selectedRecord.timelineState[activeTimelineIndex].brewTime}s</div>
                    </div>
                    <div className="bg-neutral-50 p-3 rounded">
                      <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Rating</div>
                      <div className="font-medium text-lg text-yellow-500">
                        {'★'.repeat(selectedRecord.timelineState[activeTimelineIndex].rating)}{'☆'.repeat(5 - selectedRecord.timelineState[activeTimelineIndex].rating)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Notes</div>
                    <div className="p-3 border border-neutral-200 rounded text-sm bg-neutral-50 min-h-[60px]">
                      {selectedRecord.timelineState[activeTimelineIndex].notes}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 p-8 text-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4 text-neutral-300">
              <Play size={24} />
            </div>
            <p className="text-lg mb-2">Select an experiment or create a new one.</p>
            <p className="text-sm">Manage your coffee brew variants and scrub timelines to compare checkpoints.</p>
          </div>
        )}
      </div>
    </div>
  );
}
