import React, { useState, useEffect } from 'react';
import { useStore } from './store';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Upload, Trash, Undo2, Map, Users, CheckCircle, Clock } from 'lucide-react';

function App() {
  const store = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'draft' | 'ready' | 'changed' | 'archived'>('all');
  const [ownerInput, setOwnerInput] = useState('');
  const [readinessInput, setReadinessInput] = useState('0');
  const [errorMsg, setErrorMsg] = useState('');

  // Make store available for WebMCP handlers
  useEffect(() => {
    (window as any).__store = store;
  }, [store]);

  const selectedRecord = store.records.find(r => r.id === selectedId);

  useEffect(() => {
    if (selectedRecord) {
      setOwnerInput(selectedRecord.owner || '');
      setReadinessInput(selectedRecord.readiness.toString());
      setErrorMsg('');
    }
  }, [selectedRecord]);

  const handleConnect = () => {
    if (!selectedId) return;
    const readiness = parseInt(readinessInput, 10);
    if (isNaN(readiness) || readiness < 0 || readiness > 100) {
      setErrorMsg('Readiness must be between 0 and 100');
      return;
    }
    if (!ownerInput.trim()) {
      setErrorMsg('Owner is required');
      return;
    }
    const success = store.connectOwner(selectedId, ownerInput.trim(), readiness);
    if (!success) {
      setErrorMsg('Invalid data provided. Please check boundaries.');
    } else {
      setErrorMsg('');
    }
  };

  const handleExport = () => {
    const session = store.getSession();
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'speaker-greenroom-v1-handoff-map.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        const success = store.importSession(data);
        if (!success) alert('Invalid schema');
      } catch (err) {
        alert('Invalid JSON');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredRecords = store.records.filter(r => filter === 'all' || r.status === filter);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        store.undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 text-slate-900">
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Map className="w-6 h-6 text-indigo-600" />
          Conference Speaker Greenroom
        </h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-500">
            {store.derived.summary.total} Total | {store.derived.summary.ready} Ready
          </div>
          <button
            onClick={store.undo}
            disabled={!store.canUndo}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded disabled:opacity-50"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-5 h-5" />
          </button>
          <button
            onClick={store.clearSession}
            className="p-2 text-red-600 hover:bg-red-50 rounded"
            title="Clear Session"
          >
            <Trash className="w-5 h-5" />
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50 cursor-pointer">
            <Upload className="w-4 h-4" /> Import
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Collection Panel */}
        <section className="w-full md:w-1/3 border-r border-slate-200 bg-white flex flex-col h-[50vh] md:h-auto">

          <div className="p-4 border-b border-slate-200">
            <button
              onClick={() => {
                const id = 'rec-' + Date.now();
                store.createRecord({
                  id,
                  name: 'New Speaker',
                  topic: 'New Topic',
                  status: 'draft',
                  owner: null,
                  readiness: 0
                });
                setSelectedId(id);
              }}
              className="w-full py-2 bg-slate-100 text-slate-700 font-medium rounded border border-slate-300 hover:bg-slate-200 mb-2"
            >
              + Create Speaker Slot
            </button>
            <select
              value={filter}
              onChange={e => setFilter(e.target.value as any)}
              className="w-full p-2 border border-slate-300 rounded"
            >
              <option value="all">All Speakers</option>
              <option value="draft">Drafts</option>
              <option value="ready">Ready</option>
              <option value="changed">Changed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <AnimatePresence>
              {filteredRecords.map(record => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={record.id}
                  onClick={() => setSelectedId(record.id)}
                  onKeyDown={e => e.key === 'Enter' && setSelectedId(record.id)}
                  tabIndex={0}
                  className={`p-4 rounded border cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${selectedId === record.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{record.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      record.status === 'ready' ? 'bg-green-100 text-green-700' :
                      record.status === 'archived' ? 'bg-slate-100 text-slate-600' :
                      record.status === 'changed' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {record.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2 truncate">{record.topic}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {record.owner || 'Unassigned'}
                    </span>
                    <span className="flex items-center gap-1">
                      {record.readiness === 100 ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Clock className="w-3 h-3" />}
                      {record.readiness}%
                    </span>
                  </div>
                </motion.div>
              ))}
              {filteredRecords.length === 0 && (
                <div className="text-center text-slate-500 p-8">No records match the filter.</div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Handoff Map Surface */}
        <section className="flex-1 bg-slate-50 p-4 md:p-8 flex justify-center items-center relative min-h-[50vh] md:min-h-auto">
          <div className="absolute top-8 left-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Handoff Map</h2>
            <p className="text-slate-500">Connect a selected record to a handoff owner and update readiness.</p>
          </div>

          <AnimatePresence mode="wait">
            {selectedRecord ? (
              <motion.div
                key={selectedRecord.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden"
              >

                <div className="p-6 border-b border-slate-100 bg-slate-50 space-y-2">
                  <input
                    type="text"
                    value={selectedRecord.name}
                    onChange={e => store.updateRecord(selectedRecord.id, { name: e.target.value })}
                    className="text-lg font-semibold w-full bg-transparent border-none outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1"
                    placeholder="Speaker Name"
                  />
                  <input
                    type="text"
                    value={selectedRecord.topic}
                    onChange={e => store.updateRecord(selectedRecord.id, { topic: e.target.value })}
                    className="text-sm text-slate-500 w-full bg-transparent border-none outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1"
                    placeholder="Topic"
                  />
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Handoff Owner</label>
                    <input
                      type="text"
                      value={ownerInput}
                      onChange={e => setOwnerInput(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      placeholder="e.g. Alice Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Readiness: {readinessInput}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={readinessInput}
                      onChange={e => setReadinessInput(e.target.value)}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                  {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
                  <button
                    onClick={handleConnect}
                    className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 outline-none transition-colors"
                  >
                    Apply Changes
                  </button>
                  <div className="flex justify-between pt-4 mt-4 border-t border-slate-100">
                    <button
                      onClick={() => store.archiveRecord(selectedRecord.id)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Archive Record
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-slate-400 text-lg"
              >
                Select a record from the collection to edit.
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}

export default App;
