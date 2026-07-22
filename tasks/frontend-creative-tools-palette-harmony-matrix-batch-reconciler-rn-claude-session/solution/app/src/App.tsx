import React, { useState, useEffect, useRef } from 'react';
import { useStore, store, ColorStatus, exportArtifact, importArtifact } from './store';
import { Plus, Archive, Trash2, Edit2, CheckCircle2, Undo2, LayoutGrid, CheckSquare, Download, Upload, Copy, X } from 'lucide-react';

export default function App() {
  const state = useStore();
  const [filter, setFilter] = useState<ColorStatus | "all">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', hex: '' });
  const [newForm, setNewForm] = useState({ name: '', hex: '#000000' });
  const [newError, setNewError] = useState('');

  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [copied, setCopied] = useState(false);

  const filteredRecords = state.records.filter(r => filter === "all" || r.status === filter);
  const selectedCount = state.records.filter(r => r.batchReconcilerState === "selected").length;
  const conflictCount = state.records.filter(r => r.batchReconcilerState === "conflict").length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        store.undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.name.trim() || !/^#[0-9A-Fa-f]{6}$/.test(newForm.hex)) {
      setNewError('Invalid hex or name required');
      return;
    }
    setNewError('');
    store.addRecord({ name: newForm.name, hex: newForm.hex });
    setNewForm({ name: '', hex: '#000000' });
  };

  const startEdit = (id: string, name: string, hex: string) => {
    setEditingId(id);
    setEditForm({ name, hex });
  };

  const saveEdit = (id: string) => {
    store.updateRecord(id, { name: editForm.name, hex: editForm.hex });
    setEditingId(null);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(exportArtifact());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([exportArtifact()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "palette-harmony-v1.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = () => {
    const success = importArtifact(importText);
    if (success) {
      setShowImport(false);
      setImportText('');
      setImportError('');
    } else {
      setImportError('Invalid or malformed palette-harmony-v1 JSON.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-gray-900 font-sans">
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Palette Harmony Matrix</h1>
          <p className="text-gray-500 font-mono text-sm">Session Ledger & Batch Reconciler</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => store.undo()}
            disabled={!store.hasUndo()}
            className="flex items-center gap-2 px-3 py-2 bg-white border rounded-md shadow-sm disabled:opacity-50 hover:bg-gray-50"
          >
            <Undo2 size={16} /> Undo
          </button>
          <button onClick={() => setShowImport(true)} className="flex items-center gap-2 px-3 py-2 bg-white border rounded-md shadow-sm hover:bg-gray-50">
            <Upload size={16} /> Import
          </button>
          <button onClick={() => setShowExport(true)} className="flex items-center gap-2 px-3 py-2 bg-black text-white rounded-md shadow-sm hover:bg-gray-800">
            <Download size={16} /> Export
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <main className="lg:col-span-3 space-y-6">
          <section className="bg-white p-5 md:p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Plus size={20}/> Add Color</h2>
            <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-4 sm:items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" value={newForm.name} onChange={e => setNewForm({...newForm, name: e.target.value})} className="w-full border-gray-300 rounded-md shadow-sm border p-2" placeholder="e.g. Cerulean" />
              </div>
              <div className="w-full sm:w-32">
                <label className="block text-sm font-medium text-gray-700 mb-1">Hex</label>
                <div className="flex items-center border rounded-md p-1">
                  <input type="color" value={newForm.hex} onChange={e => setNewForm({...newForm, hex: e.target.value})} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                  <input type="text" value={newForm.hex} onChange={e => setNewForm({...newForm, hex: e.target.value})} className="w-full border-0 focus:ring-0 text-sm ml-2" />
                </div>
              </div>
              <button type="submit" className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 h-[42px] mt-2 sm:mt-0">
                <Plus size={16} /> Add
              </button>
            </form>
            {newError && <p className="text-red-500 text-sm mt-2">{newError}</p>}
          </section>

          <section className="bg-white p-5 md:p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2"><LayoutGrid size={20}/> Colors Collection</h2>
              <div className="flex items-center gap-3">
                <select value={filter} onChange={e => setFilter(e.target.value as ColorStatus | "all")} className="border-gray-300 border rounded-md shadow-sm text-sm p-2 w-full sm:w-auto">
                  <option value="all">All Statuses</option>
                  <option value="empty">Empty</option>
                  <option value="draft">Draft</option>
                  <option value="ready">Ready</option>
                  <option value="changed">Changed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            {filteredRecords.length === 0 ? (
              <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                <p>No colors match this filter.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRecords.map(record => (
                  <div key={record.id} className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-md transition-all ${record.batchReconcilerState === 'selected' ? 'border-blue-500 bg-blue-50/50' : record.batchReconcilerState === 'conflict' ? 'border-red-500 bg-red-50/50' : 'hover:border-gray-400 bg-white'}`}>

                    <div className="flex items-center gap-4 flex-1">
                      <button
                        onClick={() => store.toggleSelection(record.id)}
                        className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${record.batchReconcilerState === 'selected' ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 hover:border-gray-400 bg-white text-transparent'}`}
                      >
                        <CheckSquare size={14} />
                      </button>

                      <div className="w-12 h-12 rounded shadow-inner shrink-0" style={{ backgroundColor: record.hex }} />

                      {editingId === record.id ? (
                        <div className="flex-1 flex gap-2 w-full">
                          <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="border rounded p-1 w-full min-w-0" />
                          <input type="text" value={editForm.hex} onChange={e => setEditForm({...editForm, hex: e.target.value})} className="border rounded p-1 w-24 shrink-0" />
                          <button onClick={() => saveEdit(record.id)} className="text-green-600 p-1 hover:bg-green-50 rounded shrink-0"><CheckCircle2 size={18}/></button>
                        </div>
                      ) : (
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium flex flex-wrap items-center gap-2 truncate">
                            {record.name}
                            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              record.status === 'draft' ? 'bg-gray-100 text-gray-600 border-gray-200' :
                              record.status === 'ready' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                              record.status === 'changed' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                              record.status === 'archived' ? 'bg-red-50 text-red-600 border-red-200' :
                              'bg-gray-50 text-gray-500'
                            }`}>
                              {record.status}
                            </span>
                            {record.batchReconcilerState === 'conflict' && (
                              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">Conflict</span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-500 font-mono mt-0.5">{record.hex}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-1 justify-end sm:opacity-0 sm:group-hover:opacity-100 sm:hover:opacity-100 transition-opacity [&:has(:focus-visible)]:opacity-100" style={{ opacity: editingId === record.id ? 0 : undefined }}>
                      <button onClick={() => startEdit(record.id, record.name, record.hex)} className="p-2 text-gray-400 hover:text-gray-900 rounded-md hover:bg-gray-100" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => store.archiveRecord(record.id)} className="p-2 text-gray-400 hover:text-orange-600 rounded-md hover:bg-orange-50" title="Archive">
                        <Archive size={16} />
                      </button>
                      <button onClick={() => store.deleteRecord(record.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>

        <aside className="space-y-6">
          <section className="bg-white border-2 border-blue-100 rounded-lg shadow-sm overflow-hidden sticky top-6">
            <div className="bg-blue-50 p-4 border-b border-blue-100">
              <h2 className="font-semibold text-blue-900">Batch Reconciler</h2>
              <p className="text-sm text-blue-700 mt-1">Group selected records to reconcile aggregate totals to ready state.</p>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Selected for batch</span>
                <span className="font-mono font-medium">{selectedCount}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Conflicts detected</span>
                <span className={`font-mono font-medium ${conflictCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>{conflictCount}</span>
              </div>

              {conflictCount > 0 && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-md text-sm text-red-800">
                  Archived items cannot be reconciled. Undo and deselect conflicts to proceed.
                </div>
              )}

              <button
                onClick={() => store.reconcileBatch()}
                disabled={selectedCount === 0}
                className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reconcile Batch
              </button>
            </div>
          </section>

          <section className="bg-gray-900 text-white p-5 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-100">Derived Summary</h2>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex justify-between border-b border-gray-700 pb-2">
                <span>Total Records</span>
                <span className="font-mono text-white">{state.derived.total}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Reconciled</span>
                <span className="font-mono text-blue-400">{state.derived.reconciledCount}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Draft</span>
                <span className="font-mono">{state.derived.byStatus.draft}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Ready</span>
                <span className="font-mono">{state.derived.byStatus.ready}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Changed</span>
                <span className="font-mono">{state.derived.byStatus.changed}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-gray-800 mt-2">
                <span>Archived</span>
                <span className="font-mono text-gray-500">{state.derived.byStatus.archived}</span>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {showExport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Export Session JSON</h2>
              <button onClick={() => setShowExport(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto bg-gray-50">
              <pre className="text-xs font-mono bg-white p-4 rounded border overflow-x-auto">
                {exportArtifact()}
              </pre>
            </div>
            <div className="p-4 border-t flex justify-end gap-3 bg-gray-50">
              <button onClick={handleCopy} className="flex items-center gap-2 px-4 py-2 bg-white border rounded shadow-sm hover:bg-gray-50">
                {copied ? <CheckCircle2 size={16} className="text-green-600"/> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
              <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded shadow-sm hover:bg-gray-800">
                <Download size={16} /> Download JSON
              </button>
            </div>
          </div>
        </div>
      )}

      {showImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Import Session JSON</h2>
              <button onClick={() => setShowImport(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 flex-1 flex flex-col gap-4">
              <p className="text-sm text-gray-600">Paste your session JSON below to replace the current state.</p>
              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                className="w-full flex-1 min-h-[200px] font-mono text-xs p-3 border rounded-md"
                placeholder='{"schemaVersion": "palette-harmony-v1", ...}'
              />
              {importError && <p className="text-red-500 text-sm">{importError}</p>}
            </div>
            <div className="p-4 border-t flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setShowImport(false)} className="px-4 py-2 bg-white border rounded shadow-sm hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleImportSubmit} className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded shadow-sm hover:bg-gray-800">
                <Upload size={16} /> Restore Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
