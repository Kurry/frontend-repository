import React, { useState, useEffect, useCallback } from 'react';
import EventsList from './components/EventsList';
import RecoveryBoard from './components/RecoveryBoard';
import { Upload, Download, Trash2, Save, X } from 'lucide-react';

const INITIAL_EVENTS = [
  { id: 'evt-1', title: 'Annual Checkup', petName: 'Buddy', date: '2023-10-15', status: 'archived', description: 'Routine checkup, all good.' },
  { id: 'evt-2', title: 'Rabies Vaccination', petName: 'Luna', date: '2024-05-20', status: 'ready', description: 'Scheduled vaccination.' },
  { id: 'evt-3', title: 'Dental Cleaning', petName: 'Max', date: '2024-06-10', status: 'draft', description: 'Needs to be scheduled with Dr. Smith.' },
  { id: 'evt-4', title: 'Surgery Prep', petName: 'Bella', date: '2024-05-01', status: 'failed', description: 'Bloodwork pending.', errorReason: 'Missing pre-op bloodwork results. Cannot proceed.' },
];

export default function App() {
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [history, setHistory] = useState([]);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [editingEventId, setEditingEventId] = useState(null);
  const [recoveringEventId, setRecoveringEventId] = useState(null);
  const [importError, setImportError] = useState('');

  // Edit form state
  const [editForm, setEditForm] = useState({ title: '', petName: '', date: '', status: 'draft', description: '' });
  const [editError, setEditError] = useState('');

  // Expose WebMCP session info
  useEffect(() => {
    window.webmcp_session_info = async () => ({
      task_id: "eval-intelligence/frontend-data-tracking-pet-care-wellness-log-recovery-board-rn-canva-live-preview",
      features: ["entity-collection-v1", "artifact-transfer-v1"]
    });
  }, []);

  // Update window state for WebMCP tool calls
  useEffect(() => {
    window.__APP_STATE__ = {
      events,
      history,
      setEvents,
      setHistory,
    };
  }, [events, history]);

  // Handle global undo keyboard shortcut
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

  const pushHistory = useCallback((newEvents) => {
    setHistory((prev) => [...prev, events]);
    setEvents(newEvents);
  }, [events]);

  const handleUndo = () => {
    if (history.length > 0) {
      const previousState = history[history.length - 1];
      setEvents(previousState);
      setHistory((prev) => prev.slice(0, -1));
    }
  };

  const handleEdit = (id) => {
    if (id) {
      const event = events.find((e) => e.id === id);
      setEditForm({ ...event });
    } else {
      setEditForm({ title: '', petName: '', date: '', status: 'draft', description: '' });
    }
    setEditingEventId(id === null ? 'new' : id);
    setRecoveringEventId(null);
    setEditError('');
  };

  const handleArchive = (id) => {
    const newEvents = events.map((e) => (e.id === id ? { ...e, status: 'archived' } : e));
    pushHistory(newEvents);
  };

  const handleRecover = (id) => {
    setRecoveringEventId(id);
    setEditingEventId(null);
  };

  const handleSaveEdit = () => {
    // Validate
    if (!editForm.title.trim()) {
      setEditError('Title is required');
      return;
    }
    if (!editForm.date) {
      setEditError('Date is required');
      return;
    }

    setEditError('');

    if (editingEventId === 'new') {
      const newEvent = { ...editForm, id: `evt-${Date.now()}` };
      pushHistory([...events, newEvent]);
    } else {
      const newEvents = events.map((e) => (e.id === editingEventId ? { ...editForm, id: editingEventId } : e));
      pushHistory(newEvents);
    }
    setEditingEventId(null);
  };

  const handleResolveRecovery = (resolvedEvent) => {
    const newEvents = events.map((e) => (e.id === resolvedEvent.id ? resolvedEvent : e));
    pushHistory(newEvents);
    setRecoveringEventId(null);
  };

  const handleExport = () => {
    const derived = {
      totalEvents: events.length,
      failedEvents: events.filter(e => e.status === 'failed').length,
      recoveredEvents: events.filter(e => e.resolutionNote).length
    };

    const artifact = {
      schemaVersion: "v1",
      exportedAt: new Date().toISOString(),
      records: events,
      derived,
      history: history.map((state, i) => ({ step: i, state: 'snapshot' })) // Simplified history for artifact
    };

    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pet-wellness-v1-recovery-board.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    pushHistory([]);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.schemaVersion !== 'v1' || !Array.isArray(data.records)) {
          setImportError('Invalid artifact schema. Expected v1.');
          return;
        }

        // Simple validation check for bounds/structure on first record if exists
        if (data.records.length > 0 && !data.records[0].id) {
          setImportError('Malformed records detected.');
          return;
        }

        setImportError('');
        pushHistory(data.records);
      } catch (err) {
        setImportError('Failed to parse JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = null; // Reset input
  };

  const recoveringEvent = events.find((e) => e.id === recoveringEventId);
  const derivedStats = {
    total: events.length,
    failed: events.filter(e => e.status === 'failed').length,
    recovered: events.filter(e => e.resolutionNote).length,
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex flex-col font-sans">
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pet Care Wellness Log</h1>
          <p className="text-sm text-gray-500">Manage events and recover failed records.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
            <Upload size={16} />
            <span>Import</span>
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Download size={16} />
            <span>Export</span>
          </button>
          <button onClick={handleClear} className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm font-medium hover:bg-red-100">
            <Trash2 size={16} />
            <span>Clear</span>
          </button>
        </div>
      </header>

      {importError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-md text-sm">
          {importError}
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Collection View */}
        <div className="lg:col-span-2 flex flex-col h-[70vh]">
          <EventsList
            events={events}
            onEdit={handleEdit}
            onArchive={handleArchive}
            onRecover={handleRecover}
            currentFilter={currentFilter}
            onFilterChange={setCurrentFilter}
          />
        </div>

        {/* Sidebar / Inspector */}
        <div className="flex flex-col gap-6 h-[70vh]">
          {/* Summary */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
             <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Derived Summary</h3>
             <div className="grid grid-cols-3 gap-2 text-center">
               <div className="p-2 bg-gray-50 rounded">
                 <div className="text-2xl font-bold text-gray-900">{derivedStats.total}</div>
                 <div className="text-xs text-gray-500">Total</div>
               </div>
               <div className="p-2 bg-red-50 rounded">
                 <div className="text-2xl font-bold text-red-600">{derivedStats.failed}</div>
                 <div className="text-xs text-red-700">Failed</div>
               </div>
               <div className="p-2 bg-green-50 rounded">
                 <div className="text-2xl font-bold text-green-600">{derivedStats.recovered}</div>
                 <div className="text-xs text-green-700">Recovered</div>
               </div>
             </div>
          </div>

          {/* Contextual Area: Edit Form or Recovery Board */}
          <div className="flex-1 overflow-hidden">
            {recoveringEventId ? (
              <RecoveryBoard
                event={recoveringEvent}
                onResolve={handleResolveRecovery}
                onCancel={() => setRecoveringEventId(null)}
                onUndo={handleUndo}
                canUndo={history.length > 0}
              />
            ) : editingEventId !== null ? (
              <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">{editingEventId === 'new' ? 'New Event' : 'Edit Event'}</h2>
                  <button onClick={() => setEditingEventId(null)} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-4 flex-1 overflow-y-auto space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <input type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Pet Name</label>
                    <input type="text" value={editForm.petName} onChange={e => setEditForm({...editForm, petName: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input type="date" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                      <option value="empty">Empty</option>
                      <option value="draft">Draft</option>
                      <option value="ready">Ready</option>
                      <option value="changed">Changed</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} rows={3} className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                  </div>
                  {editForm.status === 'failed' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Error Reason</label>
                      <input type="text" value={editForm.errorReason || ''} onChange={e => setEditForm({...editForm, errorReason: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm bg-red-50" />
                    </div>
                  )}
                  {editError && <p className="text-sm text-red-600">{editError}</p>}
                </div>
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                   <button onClick={handleSaveEdit} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                     <Save size={16} /> Save Event
                   </button>
                </div>
              </div>
            ) : (
              <div className="h-full bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center text-gray-400 p-8 text-center">
                <p>Select a record to edit, or recover a failed record.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
