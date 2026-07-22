import React, { useEffect } from 'react'
import { useStore } from './store'
import { Plus, Undo, Download, Upload, Trash2, Edit2, CheckCircle2, Circle, AlertCircle } from 'lucide-react'

export default function App() {
  const {
    records, derived, history, batchError, editingId,
    addRecord, updateRecord, deleteRecord, toggleSelection,
    setEditingId, reconcileBatch, exportData, importData, undo, clearSession
  } = useStore()

  useEffect(() => {
    window.webmcp_session_info = () => ({
      title: "Soundscape Scene Composer",
      version: "1.0.0",
      status: "ready"
    })

    window.webmcp_list_tools = () => [
      { name: "entity_create", description: "Create a new record" },
      { name: "entity_select", description: "Select a record" },
      { name: "entity_update", description: "Update a record" },
      { name: "entity_delete", description: "Delete a record" },
      { name: "entity_batch_mutate", description: "Batch reconcile selected records" },
      { name: "artifact_export", description: "Export session as JSON" },
      { name: "artifact_import", description: "Import session from JSON string" }
    ]

    window.webmcp_invoke_tool = (name, args) => {
      if (name === 'entity_create') {
        addRecord();
        return { success: true };
      }
      if (name === 'entity_select') {
        toggleSelection(args.id);
        return { success: true };
      }
      if (name === 'entity_update') {
        updateRecord(args.id, args.updates);
        return { success: true };
      }
      if (name === 'entity_delete') {
        if(args.confirm) deleteRecord(args.id);
        return { success: true };
      }
      if (name === 'entity_batch_mutate') {
        reconcileBatch();
        return { success: true };
      }
      if (name === 'artifact_export') {
        exportData();
        return { success: true };
      }
      if (name === 'artifact_import') {
        importData(args.data);
        return { success: true };
      }
      return { success: false, error: "Tool not found" }
    }
  }, [])

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-slate-950 text-slate-300 font-sans">
      {/* Primary Surface */}
      <main className="flex-1 flex flex-col p-6 overflow-y-auto">
        <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-bold text-white tracking-tight">Soundscape Composer</h1>
          <div className="flex gap-3">
            <button
              onClick={undo}
              disabled={history.length === 0}
              className="p-2 bg-slate-800 rounded hover:bg-slate-700 disabled:opacity-50 transition-colors"
              title="Undo"
            >
              <Undo size={18} />
            </button>
            <button
              onClick={addRecord}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 transition-colors"
            >
              <Plus size={18} /> Add Layer
            </button>
          </div>
        </header>

        <div className="flex-1 space-y-3">
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <p>No sound layers. Click "Add Layer" to begin.</p>
            </div>
          ) : (
            records.map(record => (
              <div
                key={record.id}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-all duration-300 ease-out transform ${
                  record.selected ? 'border-indigo-500 bg-indigo-950/30' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                }`}
              >
                <button
                  onClick={() => toggleSelection(record.id)}
                  className="text-slate-400 hover:text-indigo-400 transition-colors"
                >
                  {record.selected ? <CheckCircle2 className="text-indigo-500" /> : <Circle />}
                </button>

                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                  <div>
                    <div className="text-sm font-medium text-slate-200">{record.name}</div>
                    <div className="text-xs text-slate-500 capitalize flex items-center gap-1 mt-1">
                      <span className={`w-2 h-2 rounded-full ${
                        record.status === 'ready' ? 'bg-green-500' :
                        record.status === 'changed' ? 'bg-yellow-500' :
                        record.status === 'empty' ? 'bg-red-500' : 'bg-slate-500'
                      }`}></span>
                      {record.status}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-slate-500 text-xs">Volume</div>
                    <div>{record.volume}%</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-slate-500 text-xs">Pan</div>
                    <div>{record.pan}</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-slate-500 text-xs">Length</div>
                    <div>{record.length}s</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingId(record.id)}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deleteRecord(record.id)}
                    className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Linked Summary / Inspector Sidebar */}
      <aside className="w-full md:w-80 bg-slate-900 border-l border-slate-800 p-6 flex flex-col gap-6 overflow-y-auto">
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Batch Reconciler</h2>
          <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
            <div className="space-y-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Selected Items</span>
                <span className="font-mono text-white">{records.filter(r => r.selected).length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Total Volume</span>
                <span className="font-mono text-white">{derived.totalVolume}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Avg Pan</span>
                <span className="font-mono text-white">{derived.averagePan.toFixed(1)}</span>
              </div>
            </div>

            {batchError && (
              <div className="mb-4 text-xs text-red-400 flex items-start gap-1 p-2 bg-red-950/30 rounded border border-red-900/50">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{batchError}</span>
              </div>
            )}

            <button
              onClick={reconcileBatch}
              className="w-full py-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded hover:bg-indigo-600 hover:text-white transition-colors"
            >
              Reconcile Batch
            </button>
          </div>
        </section>

        <section className="mt-auto pt-6 border-t border-slate-800">
          <h2 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Session</h2>
          <div className="space-y-2">
            <button
              onClick={exportData}
              className="w-full flex items-center gap-2 px-3 py-2 bg-slate-800 text-sm rounded hover:bg-slate-700 transition-colors"
            >
              <Download size={16} /> Export Artifact
            </button>
            <div className="relative w-full">
              <input
                type="file"
                accept=".json"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if(file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => importData(ev.target.result);
                    reader.readAsText(file);
                  }
                  e.target.value = null; // reset
                }}
              />
              <div className="w-full flex items-center gap-2 px-3 py-2 bg-slate-800 text-sm rounded hover:bg-slate-700 transition-colors">
                <Upload size={16} /> Import Artifact
              </div>
            </div>
            <button
              onClick={clearSession}
              className="w-full text-left px-3 py-2 text-sm text-slate-500 hover:text-red-400 transition-colors"
            >
              Clear Session
            </button>
          </div>
        </section>
      </aside>

      {/* Editor Overlay */}
      {editingId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Edit Layer</h2>
            {(() => {
              const record = records.find(r => r.id === editingId);
              if (!record) return null;

              const validateAndSave = (field, value) => {
                let num = Number(value);
                if(field === 'volume' && (num < 0 || num > 100)) return;
                if(field === 'pan' && (num < -100 || num > 100)) return;
                if(field === 'length' && num < 0) return;
                updateRecord(editingId, { [field]: field === 'name' ? value : num });
              }

              return (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Name</label>
                    <input
                      type="text"
                      value={record.name}
                      onChange={(e) => updateRecord(editingId, { name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Volume (0-100)</label>
                    <input
                      type="number"
                      min="0" max="100"
                      value={record.volume}
                      onChange={(e) => validateAndSave('volume', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Pan (-100 to 100)</label>
                    <input
                      type="number"
                      min="-100" max="100"
                      value={record.pan}
                      onChange={(e) => validateAndSave('pan', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
