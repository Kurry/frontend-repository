import { useState } from 'react';
import { useStore } from '../store';
import { AlertCircle, Layers, Undo2, Check, Download, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function BatchReconciler() {
  const { selectedIds, records, batchReconcileRecords, undo, undoStack, importSession, exportSession } = useStore();
  const [importError, setImportError] = useState('');

  const selectedRecords = records.filter(r => selectedIds.includes(r.id));
  const hasSelection = selectedIds.length > 0;

  const hasConflict = selectedRecords.some(r => r.status === 'archived');
  const canUndo = undoStack.length > 0;

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importSession(content);
      if (!success) {
        setImportError("Malformed schema, duplicate IDs, unknown references, or invalid bounds. No state change was made.");
        setTimeout(() => setImportError(''), 5000);
      }
      e.target.value = ''; // reset
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const data = exportSession();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'camera-path-v1-batch-reconciler.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-500" />
          Batch Reconciler
        </h2>
        <div className="flex gap-2">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Undo (Cmd+Z)"
            aria-label="Undo last action"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />

          <label className="cursor-pointer p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors" title="Import Session">
            <Upload className="w-4 h-4" />
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
          <button
            onClick={handleExport}
            className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
            title="Export Session"
            aria-label="Export session artifact"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col justify-center items-center text-center max-w-md mx-auto w-full relative">
        <AnimatePresence mode="wait">
          {importError && (
             <motion.div
               initial={{ opacity: 0, y: -20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0 }}
               className="absolute top-4 left-4 right-4 bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200 flex items-start gap-2 text-left shadow-sm"
             >
               <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
               <p>{importError}</p>
             </motion.div>
          )}

          {!hasSelection ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-zinc-500 dark:text-zinc-400"
            >
              <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mx-auto mb-4">
                <Layers className="w-8 h-8 opacity-50" />
              </div>
              <p className="text-sm font-medium">Select story beats to batch reconcile</p>
              <p className="text-xs mt-1 opacity-75">Grouping updates linked views and standardizes states</p>
            </motion.div>
          ) : hasConflict ? (
            <motion.div
              key="conflict"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl p-6 text-left"
            >
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-3">
                <AlertCircle className="w-6 h-6" />
                <h3 className="font-semibold">Conflict Detected</h3>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                Cannot reconcile {selectedRecords.length} record(s). Selection contains archived items which cannot be modified in a batch operation.
              </p>
              <p className="text-xs text-red-600/70 dark:text-red-400/70">
                Action: Deselect archived items to proceed.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="ready"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-xl p-6"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{selectedIds.length}</span>
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Ready to Reconcile</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 px-4">
                This will group {selectedIds.length} records into a batch, update their status to "changed", and reconcile aggregate totals.
              </p>
              <button
                onClick={() => batchReconcileRecords(selectedIds)}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm flex justify-center items-center gap-2"
                aria-label="Group selected records into a batch and reconcile aggregate totals"
              >
                <Check className="w-4 h-4" />
                Reconcile {selectedIds.length} Records
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
