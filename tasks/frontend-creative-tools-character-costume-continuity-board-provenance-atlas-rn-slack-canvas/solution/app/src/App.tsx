import React, { useState, useEffect } from 'react';
import { useStore } from './store';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Clock, Archive, Upload, Download, Trash2, Undo, Plus } from 'lucide-react';
import type { CostumeStatus } from './types';

const StatusIcon = ({ status, className }: { status: CostumeStatus, className?: string }) => {
  switch (status) {
    case 'ready': return <CheckCircle className={`w-4 h-4 text-green-500 ${className}`} />;
    case 'changed': return <AlertTriangle className={`w-4 h-4 text-amber-500 ${className}`} />;
    case 'draft': return <Clock className={`w-4 h-4 text-blue-500 ${className}`} />;
    case 'archived': return <Archive className={`w-4 h-4 text-gray-500 ${className}`} />;
  }
};

export default function App() {
  const {
    records,
    selectedRecordId,
    selectRecord,
    traceAndQuarantine,
    resolveConflict,
    undo,
    exportArtifact,
    importArtifact,
    clearSession,
    addRecord,
    updateRecord,

  } = useStore();

  const [filter, setFilter] = useState<CostumeStatus | 'all'>('all');
  const [quarantineReason, setQuarantineReason] = useState('');

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const selectedRecord = records.find(r => r.id === selectedRecordId);
  const filteredRecords = filter === 'all' ? records : records.filter(r => r.status === filter);

  const derived = {
    total: records.length,
    ready: records.filter(r => r.status === 'ready').length,
    conflicts: records.filter(r => r.status === 'changed').length,
  };

  const handleExport = () => {
    const artifact = exportArtifact();
    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'costume-continuity-v1-provenance-atlas.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const success = importArtifact(json);
        if (!success) alert('Invalid artifact format');
      } catch (err) {
        alert('Failed to parse JSON');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Keyboard shortcut for Undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-semibold text-slate-800">Costume Continuity Board</h1>
        <div className="flex items-center space-x-2">
          <button onClick={undo} className="p-2 text-slate-600 hover:bg-slate-100 rounded-md" aria-label="Undo" title="Undo (Ctrl+Z)">
            <Undo className="w-5 h-5" />
          </button>
          <button onClick={handleExport} className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md" data-testid="export-btn">
            <Download className="w-4 h-4 mr-1.5" /> Export
          </button>
          <label className="flex items-center px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md cursor-pointer" data-testid="import-btn">
            <Upload className="w-4 h-4 mr-1.5" /> Import
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
          <button onClick={clearSession} className="p-2 text-red-600 hover:bg-red-50 rounded-md" aria-label="Clear Session" title="Clear Session">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Main List */}
        <div className="flex-1 border-r border-slate-200 bg-white flex flex-col max-w-full md:max-w-md lg:max-w-lg shrink-0">
          <div className="p-4 border-b border-slate-100 flex flex-col space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-slate-800">Costume Looks</h2>
              <button
                onClick={() => addRecord({ character: 'New', scene: 'Scene', description: 'Description' })}
                className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                aria-label="Add Record"
                data-testid="add-record-btn"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide" data-testid="filter-bar">
              {['all', 'draft', 'ready', 'changed', 'archived'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-3 py-1 text-sm rounded-full capitalize whitespace-nowrap ${filter === f ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {filteredRecords.length === 0 ? (
              <div className="text-center p-8 text-slate-400">No records found.</div>
            ) : (
              <AnimatePresence>
                {filteredRecords.map(record => (
                  <motion.div
                    layout
                    key={record.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => selectRecord(record.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedRecordId === record.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                    data-testid={`record-${record.id}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-slate-800 text-sm">{record.character}</span>
                      <StatusIcon status={record.status} />
                    </div>
                    <div className="text-xs text-slate-500 mb-2">{record.scene}</div>
                    <div className="text-sm text-slate-700 line-clamp-2">{record.description}</div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Provenance Atlas Canvas */}
        <div className="flex-[2] bg-slate-50 flex flex-col relative overflow-hidden">
          {selectedRecord ? (
            <div className="h-full flex flex-col">
              {/* Canvas Header */}
              <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
                <h3 className="text-lg font-medium text-slate-800 flex items-center">
                  Provenance Atlas
                  <span className={`ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider
                    ${selectedRecord.provenanceAtlasState === 'conflict' ? 'bg-red-100 text-red-700' :
                      selectedRecord.provenanceAtlasState === 'resolved' ? 'bg-green-100 text-green-700' :
                      'bg-slate-100 text-slate-700'}`}
                  >
                    {selectedRecord.provenanceAtlasState}
                  </span>
                </h3>
              </div>

              {/* Canvas Body */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">

                {/* Visual Lineage Nodes */}
                <div className="w-full max-w-2xl">

                  {/* Selected Record Node */}
                  <motion.div
                    layoutId={`record-node-${selectedRecord.id}`}
                    className={`bg-white rounded-xl shadow-sm border p-5 mb-8 relative
                      ${selectedRecord.provenanceAtlasState === 'conflict' ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'}`}
                  >
                    <div className="absolute -top-3 -right-3">
                       <StatusIcon status={selectedRecord.status} className="w-6 h-6 bg-white rounded-full p-0.5 shadow-sm" />
                    </div>

                    <h4 className="font-semibold text-slate-800 mb-1">{selectedRecord.character}</h4>
                    <p className="text-sm text-slate-500 mb-3">{selectedRecord.scene}</p>

                    <textarea
                      className="w-full text-sm text-slate-700 border border-slate-200 rounded p-2 mb-3 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500"
                      value={selectedRecord.description}
                      onChange={(e) => updateRecord(selectedRecord.id, { description: e.target.value })}
                      rows={3}
                    />

                    <div className="flex space-x-2">
                      <select
                        className="text-sm border-slate-200 rounded bg-white"
                        value={selectedRecord.status}
                        onChange={(e) => updateRecord(selectedRecord.id, { status: e.target.value as CostumeStatus })}
                      >
                        <option value="draft">Draft</option>
                        <option value="ready">Ready</option>
                        <option value="changed">Changed</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </motion.div>

                  {/* Actions Area */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                     <h4 className="font-medium text-slate-800 mb-4">Lineage Actions</h4>

                     {selectedRecord.provenanceAtlasState !== 'conflict' ? (
                       <div className="space-y-3">
                         <input
                           type="text"
                           placeholder="Reason for quarantine (e.g. Director requested color change)"
                           className="w-full text-sm border-slate-200 rounded p-2"
                           value={quarantineReason}
                           onChange={(e) => setQuarantineReason(e.target.value)}
                         />
                         <button
                           onClick={() => {
                             traceAndQuarantine(selectedRecord.id, quarantineReason || 'Unspecified discrepancy found');
                             setQuarantineReason('');
                           }}
                           className="w-full flex justify-center items-center px-4 py-2 bg-amber-100 text-amber-800 hover:bg-amber-200 font-medium rounded-md text-sm transition-colors"
                           data-testid="quarantine-btn"
                         >
                           <AlertTriangle className="w-4 h-4 mr-2" />
                           Trace and Quarantine Lineage
                         </button>
                       </div>
                     ) : (
                       <div className="space-y-4">
                         <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm">
                           <strong>Quarantined:</strong> {selectedRecord.quarantineReason}
                         </div>
                         <button
                           onClick={() => resolveConflict(selectedRecord.id)}
                           className="w-full flex justify-center items-center px-4 py-2 bg-green-100 text-green-800 hover:bg-green-200 font-medium rounded-md text-sm transition-colors"
                           data-testid="resolve-btn"
                         >
                           <CheckCircle className="w-4 h-4 mr-2" />
                           Resolve Conflict
                         </button>
                       </div>
                     )}
                  </div>

                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400">
              Select a record to view its Provenance Atlas
            </div>
          )}
        </div>

        {/* Derived Summary Sidebar */}
        <div className={`w-full md:w-64 bg-white border-l border-slate-200 flex flex-col shrink-0 ${isMobile ? (selectedRecord ? 'hidden' : 'block') : 'block'}`}>
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-medium text-slate-800 mb-4">Continuity Summary</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                <span className="text-slate-600">Total Looks</span>
                <span className="font-medium text-slate-800">{derived.total}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-green-50 rounded text-green-800">
                <span>Ready</span>
                <span className="font-medium">{derived.ready}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-amber-50 rounded text-amber-800">
                <span>Conflicts</span>
                <span className="font-medium">{derived.conflicts}</span>
              </div>
            </div>
          </div>

          <div className="p-4 flex-1">
             <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Usage Evidence</h4>
             <div className="text-xs text-slate-500 p-3 bg-slate-50 rounded border border-slate-100 border-dashed" data-testid="derived-summary">
               {derived.total} total looks in session. {derived.ready} ready for shoot. {derived.conflicts} active conflicts requiring review.
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
