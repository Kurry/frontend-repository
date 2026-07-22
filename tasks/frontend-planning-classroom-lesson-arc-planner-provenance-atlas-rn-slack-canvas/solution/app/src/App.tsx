import React, { useState, useEffect } from 'react';
import { useAppState } from './useAppState';
import type { LessonBlock, DomainStatus } from './types';
import { ShieldAlert, Download, Upload, Trash2, Undo2, Plus, Edit2, Play, FileJson, AlertCircle } from 'lucide-react';
import { initWebMCP } from './webmcp';

const App = () => {
  const {
    records,
    derived,
    createBlock,
    updateBlock,
    deleteBlock,
    executeProvenanceAtlasMutation,
    undo,
    canUndo,
    exportState,
    importState,
    clearState,
  } = useAppState();

  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<DomainStatus | 'all'>('all');

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<LessonBlock>>({});

  const [sourceEvidenceInput, setSourceEvidenceInput] = useState('');
  const [importError, setImportError] = useState('');

  useEffect(() => {
    initWebMCP({
      getRecords: () => records,
      getDerived: () => derived,
      exportState: () => exportState(),
      importState: (data: any) => importState(data),
      executeProvenanceAtlasMutation: (id: string, evidence: string) => executeProvenanceAtlasMutation(id, evidence),
      clearState: () => clearState()
    });
  }, [records, derived, exportState, importState, executeProvenanceAtlasMutation, clearState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  const filteredRecords = records.filter(r => filterStatus === 'all' || r.status === filterStatus);
  const selectedRecord = records.find(r => r.id === selectedRecordId);

  const handleCreate = () => {
    const newId = `blk-${Date.now()}`;
    createBlock({
      id: newId,
      title: 'New Lesson Block',
      content: '',
      status: 'empty',
      provenance: { sourceEvidence: '', lineageStatus: 'clean' }
    });
    setSelectedRecordId(newId);
    setEditForm({ title: 'New Lesson Block', content: '', status: 'empty' });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (selectedRecordId && editForm) {
      if (!editForm.title || editForm.title.trim() === '') {
        alert("Title is required");
        return;
      }
      updateBlock(selectedRecordId, editForm);
      setIsEditing(false);
    }
  };

  const handleExport = () => {
    const data = exportState();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lesson-arc-v1-provenance-atlas.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const json = JSON.parse(evt.target?.result as string);
          if (!importState(json)) {
            setImportError('Invalid import schema or validation failed.');
          } else {
            setImportError('');
          }
        } catch (err) {
          setImportError('Malformed JSON');
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const handleProvenanceMutation = () => {
    if (selectedRecordId && sourceEvidenceInput.trim() !== '') {
      executeProvenanceAtlasMutation(selectedRecordId, sourceEvidenceInput);
      setSourceEvidenceInput('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col md:flex-row h-screen overflow-hidden">

      {/* Sidebar / List View */}
      <div className="w-full md:w-1/3 border-r border-slate-200 bg-white flex flex-col h-[50vh] md:h-full shrink-0">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h1 className="font-bold text-lg">Lesson Blocks</h1>
          <button
            onClick={handleCreate}
            className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-colors"
            aria-label="Create new lesson block"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="p-2 border-b border-slate-200 bg-slate-50">
          <select
            className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as DomainStatus | 'all')}
            aria-label="Filter blocks by status"
          >
            <option value="all">All Statuses</option>
            <option value="empty">Empty</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {filteredRecords.map(block => (
            <div
              key={block.id}
              onClick={() => { setSelectedRecordId(block.id); setIsEditing(false); }}
              onKeyDown={(e) => { if(e.key === 'Enter') { setSelectedRecordId(block.id); setIsEditing(false); } }}
              tabIndex={0}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedRecordId === block.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'} ${block.provenance.lineageStatus === 'quarantined' ? 'border-red-200 bg-red-50' : ''}`}
              role="button"
              aria-pressed={selectedRecordId === block.id}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-sm truncate">{block.title || 'Untitled'}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  block.status === 'ready' ? 'bg-green-100 text-green-700' :
                  block.status === 'changed' ? 'bg-amber-100 text-amber-700' :
                  block.status === 'archived' ? 'bg-slate-200 text-slate-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {block.status}
                </span>
              </div>
              {block.provenance.lineageStatus === 'quarantined' && (
                <div className="flex items-center text-xs text-red-600 mt-2 gap-1 font-medium">
                  <ShieldAlert size={12} /> Quarantined Lineage
                </div>
              )}
            </div>
          ))}
          {filteredRecords.length === 0 && (
            <div className="text-center p-4 text-sm text-slate-500">No records found.</div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full md:w-2/3 flex flex-col h-[50vh] md:h-full overflow-y-auto relative">
        {/* Top bar (derived summary & tools) */}
        <div className="p-4 border-b border-slate-200 bg-white sticky top-0 z-10 flex flex-wrap gap-4 items-center justify-between shadow-sm">
          <div className="flex gap-4 text-sm">
            <div className="flex flex-col">
              <span className="text-slate-500 text-xs uppercase font-bold tracking-wider">Total</span>
              <span className="font-semibold text-lg">{derived.summary.totalBlocks}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-green-600 text-xs uppercase font-bold tracking-wider">Ready</span>
              <span className="font-semibold text-lg text-green-700">{derived.summary.readyCount}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-red-600 text-xs uppercase font-bold tracking-wider">Quarantined</span>
              <span className="font-semibold text-lg text-red-700">{derived.summary.quarantinedCount}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="p-2 border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Undo (Ctrl+Z)"
              aria-label="Undo"
            >
              <Undo2 size={16} />
            </button>
            <button
              onClick={clearState}
              className="p-2 border border-red-200 text-red-600 rounded hover:bg-red-50 transition-colors"
              title="Clear all state"
              aria-label="Clear state"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 transition-colors text-sm font-medium"
            >
              <Download size={14} /> Export
            </button>
            <label className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded hover:bg-slate-100 cursor-pointer transition-colors text-sm font-medium">
              <Upload size={14} /> Import
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
          </div>
        </div>
        {importError && (
          <div className="bg-red-100 text-red-700 p-2 text-sm text-center font-medium">
            {importError}
          </div>
        )}

        <div className="p-6 flex-1 bg-slate-50/50">
          {selectedRecord ? (
            <div className="max-w-2xl mx-auto space-y-6">

              {/* Detail Card */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.title || ''}
                        onChange={e => setEditForm({...editForm, title: e.target.value})}
                        className="text-xl font-bold border-b border-slate-300 focus:border-blue-500 focus:outline-none w-full"
                        placeholder="Block Title"
                      />
                    ) : (
                      <h2 className="text-xl font-bold">{selectedRecord.title}</h2>
                    )}
                    <button
                      onClick={() => {
                        if (isEditing) {
                          handleSaveEdit();
                        } else {
                          setEditForm(selectedRecord);
                          setIsEditing(true);
                        }
                      }}
                      className="p-1.5 text-slate-500 hover:bg-slate-100 rounded ml-2"
                      aria-label={isEditing ? "Save edits" : "Edit record"}
                    >
                      {isEditing ? <FileJson size={18} /> : <Edit2 size={18} />}
                    </button>
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
                    {isEditing ? (
                      <select
                        value={editForm.status || 'empty'}
                        onChange={e => setEditForm({...editForm, status: e.target.value as DomainStatus})}
                        className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="empty">Empty</option>
                        <option value="draft">Draft</option>
                        <option value="ready">Ready</option>
                        <option value="changed">Changed</option>
                        <option value="archived">Archived</option>
                      </select>
                    ) : (
                      <span className="text-sm px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium inline-block">
                        {selectedRecord.status}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Content</label>
                    {isEditing ? (
                      <textarea
                        value={editForm.content || ''}
                        onChange={e => setEditForm({...editForm, content: e.target.value})}
                        className="w-full p-2 border border-slate-300 rounded text-sm min-h-[100px] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="Lesson content..."
                      />
                    ) : (
                      <div className="text-sm text-slate-700 whitespace-pre-wrap min-h-[50px] bg-slate-50 p-3 rounded border border-slate-100">
                        {selectedRecord.content || <span className="text-slate-400 italic">No content</span>}
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="mt-6 flex justify-end">
                       <button
                         onClick={() => { deleteBlock(selectedRecord.id); setSelectedRecordId(null); }}
                         className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                       >
                         <Trash2 size={14} /> Delete
                       </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Provenance Atlas Surface */}
              <div className={`rounded-xl shadow-sm border overflow-hidden transition-all duration-500 ${selectedRecord.provenance.lineageStatus === 'quarantined' ? 'border-red-300 bg-red-50/30' : 'border-indigo-200 bg-white'}`}>
                <div className={`p-4 border-b flex items-center gap-2 ${selectedRecord.provenance.lineageStatus === 'quarantined' ? 'bg-red-100 border-red-200' : 'bg-indigo-50 border-indigo-100'}`}>
                  {selectedRecord.provenance.lineageStatus === 'quarantined' ? <ShieldAlert className="text-red-600" size={18} /> : <AlertCircle className="text-indigo-600" size={18} />}
                  <h3 className="font-bold text-sm">Provenance Atlas</h3>
                </div>
                <div className="p-6">
                  {selectedRecord.provenance.lineageStatus === 'quarantined' ? (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-red-50 text-red-900 rounded border border-red-200 text-sm">
                        <ShieldAlert size={16} className="mt-0.5 shrink-0" />
                        <div>
                          <strong>Lineage Quarantined.</strong> This record was traced to compromised source evidence and its status was changed to prevent derived errors.
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Source Evidence</label>
                        <div className="font-mono text-sm bg-slate-100 p-2 rounded border border-slate-200 break-words">
                          {selectedRecord.provenance.sourceEvidence}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-slate-600">
                        Trace this record to its source evidence and quarantine its lineage if a derived conflict is detected. This will mutate the primary record and update linked representations.
                      </p>
                      <div>
                         <label className="block text-xs font-semibold text-slate-500 mb-1">Source Evidence URL or ID</label>
                         <input
                           type="text"
                           value={sourceEvidenceInput}
                           onChange={e => setSourceEvidenceInput(e.target.value)}
                           className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                           placeholder="e.g. source-doc-123"
                         />
                      </div>
                      <button
                        onClick={handleProvenanceMutation}
                        disabled={sourceEvidenceInput.trim() === ''}
                        className="flex items-center justify-center gap-2 w-full py-2 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Play size={16} /> Trace & Quarantine Lineage
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
              <FileJson size={48} className="mb-4 opacity-20" />
              <p className="text-lg font-medium text-slate-500">No Block Selected</p>
              <p className="text-sm max-w-sm mt-2">Select a lesson block from the sidebar to view details and access the Provenance Atlas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
