import { useState, useRef } from 'react';
import { useFlavorStore } from '../store';
import { Download, Upload, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ExportImport() {
  const { getExportableState, importState, clearSession } = useFlavorStore();
  const [importError, setImportError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef(null);

  const handleExport = () => {
    const state = getExportableState();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "flavor-balance-v1-audit-lens.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    showSuccess('Exported successfully');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = importState(event.target.result);
      if (result.success) {
        setImportError('');
        showSuccess('Imported successfully');
      } else {
        setImportError(`Import failed: ${result.error}`);
      }
      // Reset input so the same file can be selected again
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-lg p-4 mt-auto">
      <h2 className="font-semibold mb-4 text-slate-200">Session Artifact</h2>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 p-2 rounded border border-slate-700 transition-colors text-sm"
        >
          <Download size={16} /> Export
        </button>

        <button
          onClick={handleImportClick}
          className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 p-2 rounded border border-slate-700 transition-colors text-sm"
        >
          <Upload size={16} /> Import
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          className="hidden"
        />
      </div>

      <button
        onClick={() => {
          if (confirm('Clear current session? This cannot be undone.')) {
            clearSession();
            showSuccess('Session cleared');
          }
        }}
        className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-red-400 p-2 rounded border border-transparent hover:border-red-900/50 hover:bg-red-900/20 transition-colors text-sm"
      >
        <Trash2 size={16} /> Clear Session
      </button>

      <AnimatePresence>
        {importError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 text-xs text-red-400 bg-red-950/50 p-2 rounded border border-red-900/50"
          >
            {importError}
          </motion.div>
        )}
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 text-xs text-teal-400 bg-teal-950/50 p-2 rounded border border-teal-900/50 text-center"
          >
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
