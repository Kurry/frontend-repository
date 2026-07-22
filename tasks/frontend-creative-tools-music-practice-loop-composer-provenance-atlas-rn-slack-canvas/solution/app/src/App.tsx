import React, { useEffect, useState } from 'react';
import { useStore, computeDerived, SegmentStatus, AtlasState } from './useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Upload, Trash2, Undo2, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

const App = () => {
  const store = useStore();
  const derived = computeDerived(store.records);

  useEffect(() => {
    // Seed data on initial load if empty
    if (store.records.length === 0 && store.history.length === 0) {
      store.seedData();
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        store.undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store]);

  const handleExport = () => {
    const exportData = {
      schemaVersion: store.schemaVersion,
      exportedAt: new Date().toISOString(),
      records: store.records,
      derived: computeDerived(store.records),
      history: store.history
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'practice-loop-v1-provenance-atlas.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!store.importSession(content)) {
        alert('Invalid import file. State not changed.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold">Music Practice Loop Composer</h1>
          <p className="text-sm text-slate-500">Provenance Atlas</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={store.undo} className="p-2 hover:bg-slate-100 rounded-md flex items-center gap-2" title="Undo (Cmd/Ctrl+Z)">
            <Undo2 size={18} />
            <span className="hidden sm:inline text-sm">Undo</span>
          </button>
          <div className="h-6 w-px bg-slate-200 mx-2" />
          <button onClick={handleExport} className="p-2 hover:bg-slate-100 rounded-md flex items-center gap-2">
            <Download size={18} />
            <span className="hidden sm:inline text-sm">Export</span>
          </button>
          <label className="p-2 hover:bg-slate-100 rounded-md flex items-center gap-2 cursor-pointer">
            <Upload size={18} />
            <span className="hidden sm:inline text-sm">Import</span>
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
          <button onClick={store.clearSession} className="p-2 text-red-600 hover:bg-red-50 rounded-md flex items-center gap-2">
            <Trash2 size={18} />
            <span className="hidden sm:inline text-sm">Clear</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Sidebar - Derived Summary */}
        <aside className="w-full lg:w-64 bg-white border-r border-slate-200 p-6 flex-shrink-0 flex flex-col gap-6 order-2 lg:order-1 border-t lg:border-t-0">
          <div>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Session Summary</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-2xl font-bold text-slate-700">{derived.totalSegments}</div>
                <div className="text-xs text-slate-500 mt-1">Total</div>
              </div>
              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                <div className="text-2xl font-bold text-emerald-700">{derived.readySegments}</div>
                <div className="text-xs text-emerald-600 mt-1">Ready</div>
              </div>
              <div className="bg-rose-50 p-3 rounded-lg border border-rose-100">
                <div className="text-2xl font-bold text-rose-700">{derived.quarantinedLineages}</div>
                <div className="text-xs text-rose-600 mt-1">Quarantined</div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <div className="text-2xl font-bold text-blue-700">{derived.averageBpm}</div>
                <div className="text-xs text-blue-600 mt-1">Avg BPM</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Center - Provenance Atlas */}
        <section className="flex-1 p-6 overflow-y-auto bg-slate-50 order-1 lg:order-2">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <ShieldAlert className="text-slate-400" size={20} />
              Provenance Atlas View
            </h2>
            <div className="grid gap-4">
              <AnimatePresence>
                {store.records.map((record) => (
                  <RecordItem key={record.id} record={record} />
                ))}
              </AnimatePresence>
              {store.records.length === 0 && (
                <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                  No segments found. Add one or import a session.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right Sidebar - Inspector/Editor */}
        <aside className="w-full lg:w-80 bg-white border-l border-slate-200 p-6 flex-shrink-0 flex flex-col order-3 border-t lg:border-t-0 overflow-y-auto">
          <Inspector />
        </aside>
      </main>
    </div>
  );
};

const RecordItem = ({ record }: { record: any }) => {
  const store = useStore();
  const isSelected = store.selectedId === record.id;

  const handleTrace = (e: React.MouseEvent) => {
    e.stopPropagation();
    store.traceAndQuarantine(record.id, `Manual quarantine at ${new Date().toLocaleTimeString()}`);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => store.selectRecord(record.id)}
      className={`
        relative p-4 rounded-xl border-2 transition-colors cursor-pointer flex items-center justify-between
        ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}
        ${record.quarantined ? 'border-rose-300 bg-rose-50 opacity-80' : ''}
      `}
    >
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h3 className={`font-semibold ${record.quarantined ? 'text-rose-900 line-through' : 'text-slate-900'}`}>
            {record.title}
          </h3>
          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold
            ${record.status === 'ready' ? 'bg-emerald-100 text-emerald-700' :
              record.status === 'changed' ? 'bg-amber-100 text-amber-700' :
              'bg-slate-100 text-slate-600'}
          `}>
            {record.status}
          </span>
          {record.quarantined && (
            <span className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold bg-rose-100 text-rose-700 flex items-center gap-1">
              <AlertCircle size={10} /> Quarantined
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-4">
          <span>{record.bpm} BPM</span>
          <span>{record.measures} Measures</span>
          <span className="text-slate-400">ID: {record.id}</span>
        </div>
      </div>

      {!record.quarantined && isSelected && (
        <button
          onClick={handleTrace}
          className="px-3 py-1.5 bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg hover:bg-rose-200 flex items-center gap-1 transition-colors"
        >
          <ShieldAlert size={14} /> Trace & Quarantine
        </button>
      )}
    </motion.div>
  );
};

const Inspector = () => {
  const store = useStore();
  const selectedRecord = store.records.find(r => r.id === store.selectedId);
  const [formData, setFormData] = useState<any>({ title: '', status: 'draft', bpm: 120, measures: 4 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedRecord) {
      setFormData({
        title: selectedRecord.title,
        status: selectedRecord.status,
        bpm: selectedRecord.bpm,
        measures: selectedRecord.measures
      });
      setError(null);
    } else {
      setFormData({ title: '', status: 'draft', bpm: 120, measures: 4 });
      setError(null);
    }
  }, [selectedRecord]);

  const validate = (data: any) => {
    if (!data.title.trim()) return "Title is required";
    if (data.bpm < 1 || data.bpm > 300) return "BPM must be between 1 and 300";
    if (data.measures < 1 || data.measures > 128) return "Measures must be between 1 and 128";
    return null;
  };

  const handleSave = () => {
    const err = validate(formData);
    if (err) {
      setError(err);
      return;
    }
    setError(null);

    if (selectedRecord) {
      store.updateRecord(selectedRecord.id, formData);
    } else {
      store.addRecord({ ...formData, atlasState: 'idle' });
    }
  };

  return (
    <div>
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-6">
        {selectedRecord ? 'Edit Segment' : 'New Segment'}
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={selectedRecord?.quarantined}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">BPM</label>
            <input
              type="number"
              value={formData.bpm}
              onChange={e => setFormData({...formData, bpm: parseInt(e.target.value) || 0})}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={selectedRecord?.quarantined}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Measures</label>
            <input
              type="number"
              value={formData.measures}
              onChange={e => setFormData({...formData, measures: parseInt(e.target.value) || 0})}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={selectedRecord?.quarantined}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
          <select
            value={formData.status}
            onChange={e => setFormData({...formData, status: e.target.value})}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            disabled={selectedRecord?.quarantined}
          >
            <option value="empty">Empty</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg flex items-start gap-2">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{error}. Previous valid state preserved.</span>
          </div>
        )}

        {selectedRecord?.quarantined && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">
            <strong>Quarantined Lineage</strong>
            <p className="mt-1 opacity-80">{selectedRecord.sourceEvidence}</p>
          </div>
        )}

        <div className="pt-4 flex gap-2">
          {!selectedRecord?.quarantined && (
            <button
              onClick={handleSave}
              className="flex-1 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              {selectedRecord ? 'Update' : 'Create'}
            </button>
          )}

          {selectedRecord && (
            <button
              onClick={() => store.deleteRecord(selectedRecord.id)}
              className="px-4 py-2 text-rose-600 bg-rose-50 rounded-lg text-sm font-medium hover:bg-rose-100 transition-colors"
              title="Delete Record"
            >
              <Trash2 size={16} />
            </button>
          )}

          {selectedRecord && (
            <button
              onClick={() => store.selectRecord(null)}
              className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
