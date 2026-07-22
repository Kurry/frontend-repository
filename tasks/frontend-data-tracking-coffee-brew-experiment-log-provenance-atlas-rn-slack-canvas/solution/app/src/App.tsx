import React, { useState, useEffect } from 'react';
import { useStore } from './store/useStore';
import { WebMCP } from './components/WebMCP';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, GitCommit, AlertTriangle, Download, Upload, Undo2 } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

function StatusBadge({ status, quarantined }: { status: string, quarantined?: boolean }) {
  if (quarantined) {
    return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full border border-red-200">Quarantined</span>;
  }

  const colors: globalThis.Record<string, string> = {
    empty: 'bg-gray-100 text-gray-800',
    draft: 'bg-yellow-100 text-yellow-800',
    ready: 'bg-green-100 text-green-800',
    changed: 'bg-blue-100 text-blue-800',
    archived: 'bg-gray-200 text-gray-600',
  };

  return (
    <span className={cn("px-2 py-1 text-xs font-medium rounded-full border", colors[status] || colors.empty)}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function App() {
  const { records, history, addRecord, updateRecord, traceAndQuarantine, undo, exportArtifact, importArtifact } = useStore();
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isQuarantineModalOpen, setIsQuarantineModalOpen] = useState(false);
  const [quarantineReason, setQuarantineReason] = useState('');

  // Seed initial data
  useEffect(() => {
    if (records.length === 0 && history.length === 0) {
      useStore.getState().setInitialRecords([
        { id: '1', title: 'Ethiopia Yirgacheffe Test', beanOrigin: 'Ethiopia', roastDate: '2023-10-01', status: 'ready' },
        { id: '2', title: 'Colombian Supremo Batch B', beanOrigin: 'Colombia', roastDate: '2023-10-05', status: 'draft' },
        { id: '3', title: 'Kenya AA Dark Roast', beanOrigin: 'Kenya', roastDate: '2023-09-20', status: 'archived' }
      ]);
    }
  }, []);

  const selectedRecord = records.find(r => r.id === selectedRecordId);
  const derived = {
    total: records.length,
    quarantinedCount: records.filter(r => r.provenanceAtlasState?.quarantined).length,
    readyCount: records.filter(r => r.status === 'ready').length
  };

  const filteredRecords = records.filter(r => filterStatus === 'all' || r.status === filterStatus);

  const handleCreate = () => {
    addRecord({ title: 'New Experiment', beanOrigin: '', roastDate: new Date().toISOString().split('T')[0] });
  };

  const handleExport = () => {
    const artifact = exportArtifact();
    const blob = new Blob([artifact], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'brew-experiment-v1.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        importArtifact(content);
      };
      reader.readAsText(file);
    }
  };

  const handleQuarantine = () => {
    if (selectedRecordId) {
      traceAndQuarantine(selectedRecordId, quarantineReason || 'Unknown lineage issue');
      setIsQuarantineModalOpen(false);
      setQuarantineReason('');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans flex flex-col md:flex-row h-screen overflow-hidden">
      <WebMCP />

      {/* Sidebar - Collection View */}
      <div className="w-full md:w-1/3 lg:w-1/4 bg-white border-r border-neutral-200 flex flex-col h-full z-10 shadow-sm relative">
        <div className="p-4 border-b border-neutral-200 bg-white sticky top-0">
          <h1 className="text-xl font-bold text-neutral-800 flex items-center gap-2">
            <span className="w-6 h-6 bg-primary rounded-md flex items-center justify-center text-white text-xs">☕</span>
            Brew Log
          </h1>

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleCreate}
              className="flex-1 bg-primary text-white px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-1 hover:bg-opacity-90 transition-colors"
            >
              <Plus size={16} /> New
            </button>
            <button
              onClick={() => undo()}
              disabled={useStore.getState().pastStates.length === 0}
              className="px-3 py-2 bg-neutral-100 text-neutral-700 rounded-md text-sm font-medium hover:bg-neutral-200 disabled:opacity-50 transition-colors"
              title="Undo last action"
            >
              <Undo2 size={16} />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-1">
            {['all', 'draft', 'ready', 'changed', 'archived'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  "px-2 py-1 text-xs rounded-full border capitalize transition-colors",
                  filterStatus === status
                    ? "bg-neutral-800 text-white border-neutral-800"
                    : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          <AnimatePresence>
            {filteredRecords.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center p-8 text-neutral-400 text-sm"
              >
                No experiments found.
              </motion.div>
            ) : (
              filteredRecords.map(record => (
                <motion.div
                  key={record.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelectedRecordId(record.id)}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-all",
                    selectedRecordId === record.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-neutral-200 bg-white hover:border-primary/30",
                    record.provenanceAtlasState?.quarantined && "border-red-200 bg-red-50/30"
                  )}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium text-sm truncate pr-2">{record.title}</h3>
                    <StatusBadge status={record.status} quarantined={record.provenanceAtlasState?.quarantined} />
                  </div>
                  <div className="text-xs text-neutral-500 flex justify-between">
                    <span>{record.beanOrigin || 'Unknown origin'}</span>
                    <span>{record.roastDate}</span>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex justify-between text-xs text-neutral-500">
          <span>{derived.total} Total</span>
          <span className="text-red-600">{derived.quarantinedCount} Quarantined</span>
        </div>
      </div>

      {/* Main Content - Provenance Atlas */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-white md:bg-neutral-50/50">
        <div className="p-4 flex justify-end gap-2 border-b border-neutral-200 bg-white sticky top-0 z-10">
           <button onClick={handleExport} className="text-xs flex items-center gap-1 px-3 py-1.5 border border-neutral-200 rounded-md hover:bg-neutral-50 text-neutral-600">
             <Download size={14} /> Export
           </button>
           <label className="text-xs flex items-center gap-1 px-3 py-1.5 border border-neutral-200 rounded-md hover:bg-neutral-50 text-neutral-600 cursor-pointer">
             <Upload size={14} /> Import
             <input type="file" className="hidden" accept=".json" onChange={handleImport} />
           </label>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {selectedRecord ? (
            <div className="max-w-3xl mx-auto space-y-8">

              {/* Record Editor Header */}
              <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <input
                    type="text"
                    value={selectedRecord.title}
                    onChange={(e) => updateRecord(selectedRecord.id, { title: e.target.value })}
                    className="text-2xl font-bold bg-transparent border-none outline-none focus:ring-2 focus:ring-primary/20 rounded px-2 -ml-2 w-full"
                    placeholder="Experiment Title"
                  />
                  <StatusBadge status={selectedRecord.status} quarantined={selectedRecord.provenanceAtlasState?.quarantined} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Bean Origin</label>
                    <input
                      type="text"
                      value={selectedRecord.beanOrigin}
                      onChange={(e) => updateRecord(selectedRecord.id, { beanOrigin: e.target.value })}
                      className="w-full text-sm border-b border-neutral-200 focus:border-primary outline-none py-1 bg-transparent"
                      placeholder="e.g. Colombia"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Roast Date</label>
                    <input
                      type="date"
                      value={selectedRecord.roastDate}
                      onChange={(e) => updateRecord(selectedRecord.id, { roastDate: e.target.value })}
                      className="w-full text-sm border-b border-neutral-200 focus:border-primary outline-none py-1 bg-transparent"
                    />
                  </div>
                  <div>
                     <label className="block text-xs text-neutral-500 mb-1">Status</label>
                     <select
                       value={selectedRecord.status}
                       onChange={(e) => updateRecord(selectedRecord.id, { status: e.target.value as any })}
                       className="w-full text-sm border-b border-neutral-200 focus:border-primary outline-none py-1 bg-transparent"
                     >
                       <option value="draft">Draft</option>
                       <option value="ready">Ready</option>
                       <option value="changed">Changed</option>
                       <option value="archived">Archived</option>
                     </select>
                  </div>
                </div>
              </div>

              {/* Provenance Atlas Canvas */}
              <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                <div className="bg-neutral-50 border-b border-neutral-200 p-4 flex items-center gap-2">
                  <GitCommit className="text-primary" size={18} />
                  <h2 className="font-semibold text-neutral-800">Provenance Atlas</h2>
                </div>

                <div className="p-6">
                  {selectedRecord.provenanceAtlasState?.quarantined ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-4"
                    >
                      <div className="bg-red-100 p-2 rounded-full text-red-600 mt-1">
                        <AlertTriangle size={20} />
                      </div>
                      <div>
                        <h3 className="text-red-800 font-semibold mb-1">Lineage Quarantined</h3>
                        <p className="text-red-600 text-sm mb-3">This experiment was traced to source evidence and isolated.</p>
                        <div className="bg-white border border-red-100 rounded p-3 text-sm text-neutral-700 font-mono">
                          <span className="text-neutral-400 select-none">Reason: </span>
                          {selectedRecord.provenanceAtlasState.reason}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                        <Search size={24} />
                      </div>
                      <h3 className="text-neutral-800 font-medium mb-2">Trace Source Evidence</h3>
                      <p className="text-neutral-500 text-sm text-center max-w-md mb-6">
                        Investigate this experiment's lineage to verify source integrity. If evidence shows anomalies, you can quarantine this lineage.
                      </p>
                      <button
                        onClick={() => setIsQuarantineModalOpen(true)}
                        className="bg-white border border-neutral-300 text-neutral-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-neutral-50 transition-colors shadow-sm flex items-center gap-2"
                      >
                        <AlertTriangle size={16} className="text-neutral-500" />
                        Quarantine Lineage
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-neutral-400">
              <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl">☕</span>
              </div>
              <h2 className="text-xl font-medium text-neutral-600 mb-2">Select an Experiment</h2>
              <p className="text-sm">Choose an experiment from the log or create a new one.</p>
            </div>
          )}
        </div>
      </div>

      {/* Quarantine Modal */}
      <AnimatePresence>
        {isQuarantineModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl border border-neutral-200 w-full max-w-md overflow-hidden"
            >
              <div className="p-4 border-b border-neutral-200 bg-red-50 flex items-center gap-3">
                <div className="bg-red-100 p-1.5 rounded-md text-red-600">
                  <AlertTriangle size={18} />
                </div>
                <h3 className="font-semibold text-red-800">Quarantine Lineage</h3>
              </div>
              <div className="p-6">
                <p className="text-sm text-neutral-600 mb-4">
                  Provide a reason for quarantining this lineage. This action will update the experiment's status to 'changed' and isolate it in the Provenance Atlas.
                </p>
                <textarea
                  value={quarantineReason}
                  onChange={(e) => setQuarantineReason(e.target.value)}
                  placeholder="e.g. Temperature probe failure during roast"
                  className="w-full border border-neutral-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-h-[100px] resize-none"
                  autoFocus
                />
              </div>
              <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex justify-end gap-2">
                <button
                  onClick={() => setIsQuarantineModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleQuarantine}
                  disabled={!quarantineReason.trim()}
                  className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Quarantine
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
