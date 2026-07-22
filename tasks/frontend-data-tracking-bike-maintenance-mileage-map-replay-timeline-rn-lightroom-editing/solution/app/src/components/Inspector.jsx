import React, { useRef, useState } from 'react';
import { useStore } from '../store';
import { PieChart, SaveAll, Upload, Download, Trash2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function Inspector({ selectedId, clearSelection }) {
  const records = useStore(state => state.records);
  const derived = useStore(state => state.derived);
  const exportState = useStore(state => state.exportState);
  const importState = useStore(state => state.importState);
  const updateRecord = useStore(state => state.updateRecord);
  const deleteRecord = useStore(state => state.deleteRecord);
  const fileInputRef = useRef(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const record = records.find(r => r.id === selectedId);

  const handleUpdate = (id, partial) => {
    setErrorMsg(null);
    const result = updateRecord(id, partial);
    if (result && result.error) {
      setErrorMsg(result.error);
    }
  };

  const handleDelete = () => {
    if (!showConfirmDelete) {
      setShowConfirmDelete(true);
      return;
    }
    deleteRecord(record.id);
    clearSelection();
    setShowConfirmDelete(false);
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportState(), null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "bike-maintenance-v1.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        const res = importState(json);
        if (res && res.error) {
          alert(`Import failed: ${res.error}`);
        }
      } catch (err) {
        console.error("Failed to parse imported JSON", err);
        alert("Invalid JSON file. Import aborted.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full md:w-80 border-l border-slate-200 bg-slate-50 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-white shrink-0">
        <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2 mb-4">
          <PieChart size={16} className="text-indigo-500" />
          Fleet Summary
        </h3>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-100 p-2 rounded">
            <div className="text-slate-500 mb-1">Total</div>
            <div className="font-semibold text-slate-800 text-lg">{derived.summary.total}</div>
          </div>
          <div className="bg-blue-50 text-blue-800 p-2 rounded border border-blue-100">
            <div className="opacity-75 mb-1">Drafts</div>
            <div className="font-semibold text-lg">{derived.summary.byStatus.draft}</div>
          </div>
          <div className="bg-emerald-50 text-emerald-800 p-2 rounded border border-emerald-100">
            <div className="opacity-75 mb-1">Ready</div>
            <div className="font-semibold text-lg">{derived.summary.byStatus.ready}</div>
          </div>
          <div className="bg-amber-50 text-amber-800 p-2 rounded border border-amber-100">
            <div className="opacity-75 mb-1">Changed</div>
            <div className="font-semibold text-lg">{derived.summary.byStatus.changed}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {record ? (
          <motion.div
            key={record.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Edit Record</h4>

              <AnimatePresence>
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-50 text-red-600 text-xs p-2 rounded mb-3 flex items-center gap-2"
                  >
                    <AlertCircle size={14} />
                    {errorMsg}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-3 text-sm">
                <div>
                  <label className="block text-slate-600 text-xs mb-1">Title</label>
                  <input
                    type="text"
                    value={record.title}
                    onChange={(e) => handleUpdate(record.id, { title: e.target.value })}
                    className="w-full border-slate-200 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 text-xs mb-1">Status</label>
                  <select
                    value={record.status}
                    onChange={(e) => handleUpdate(record.id, { status: e.target.value })}
                    className="w-full border-slate-200 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    data-testid="status-select"
                  >
                    <option value="empty">Empty</option>
                    <option value="draft">Draft</option>
                    <option value="ready">Ready</option>
                    <option value="changed">Changed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 text-xs mb-1">Mileage</label>
                  <input
                    type="number"
                    value={record.mileage}
                    onChange={(e) => handleUpdate(record.id, { mileage: parseInt(e.target.value) || 0 })}
                    className="w-full border-slate-200 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 text-xs mb-1">Notes</label>
                  <textarea
                    value={record.notes}
                    onChange={(e) => handleUpdate(record.id, { notes: e.target.value })}
                    className="w-full border-slate-200 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px] resize-y"
                  />
                </div>

                <div className="pt-2">
                  {!showConfirmDelete ? (
                    <button
                      onClick={handleDelete}
                      className="w-full flex items-center justify-center gap-2 p-2 text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-red-600 rounded-lg transition-colors border border-slate-200"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowConfirmDelete(false)}
                        className="flex-1 p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDelete}
                        className="flex-1 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Confirm
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm text-center p-6 space-y-2">
            <PieChart size={32} className="opacity-20" />
            <p>Select a record to view details and timeline.</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-200 shrink-0 space-y-2 z-10 relative">
        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          onChange={handleImport}
          className="hidden"
        />
        <button
          onClick={handleExport}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white p-2.5 rounded-lg text-sm hover:bg-slate-800 transition-colors shadow-sm"
          data-testid="export-btn"
        >
          <Download size={16} />
          Export Session JSON
        </button>
        <button
          onClick={triggerFileInput}
          className="w-full flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200 p-2.5 rounded-lg text-sm hover:bg-slate-50 transition-colors shadow-sm"
          data-testid="import-btn"
        >
          <Upload size={16} />
          Import Session JSON
        </button>
      </div>
    </div>
  );
}
