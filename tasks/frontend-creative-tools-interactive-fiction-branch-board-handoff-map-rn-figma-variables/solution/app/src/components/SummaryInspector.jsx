import React from 'react';
import { useStore } from '../store';
import { motion } from 'framer-motion';
import { Undo2, Download, Upload, Trash } from 'lucide-react';

export const SummaryInspector = () => {
  const derived = useStore((state) => state.derived);
  const undo = useStore((state) => state.undo);
  const historyIndex = useStore((state) => state.historyIndex);
  const exportArtifact = useStore((state) => state.exportArtifact);
  const importArtifact = useStore((state) => state.importArtifact);
  const clearAll = useStore((state) => state.clearAll);
  const error = useStore((state) => state.error);
  const clearError = useStore((state) => state.clearError);

  const fileInputRef = React.useRef(null);

  const handleExport = () => {
    const data = exportArtifact();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fiction-branches-v1.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        importArtifact(json);
      } catch (err) {
        importArtifact({ error: "Invalid JSON file" }); // trigger error
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  return (
    <div className="w-64 bg-white border-l border-gray-200 flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Derived Summary</h2>

        <motion.div layout className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Total Nodes</span>
            <span className="font-medium">{derived.summary.total}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Assigned</span>
            <span className="font-medium text-blue-600">{derived.summary.assigned}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Unassigned</span>
            <span className="font-medium text-yellow-600">{derived.summary.unassigned}</span>
          </div>

          <div className="pt-3 border-t border-gray-100">
            <div className="text-xs font-medium text-gray-500 mb-2">Statuses</div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs"><span className="text-gray-400">Ready</span><span>{derived.summary.ready}</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-400">Changed</span><span>{derived.summary.changed}</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-400">Draft</span><span>{derived.summary.draft}</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-400">Empty</span><span>{derived.summary.empty}</span></div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="p-4 border-b border-gray-200 space-y-3">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">Actions</h2>

        <button
          onClick={undo}
          disabled={historyIndex < 0}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors text-gray-700"
        >
          <Undo2 size={16} /> Undo Last Action
        </button>

        <button
          onClick={handleExport}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-sm font-medium transition-colors"
        >
          <Download size={16} /> Export JSON
        </button>

        <input
          type="file"
          accept=".json"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <button
          onClick={handleImportClick}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded text-sm font-medium transition-colors text-gray-700"
        >
          <Upload size={16} /> Import JSON
        </button>

        <button
          onClick={() => {
            if(window.confirm('Clear all data? This cannot be undone.')) clearAll();
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded text-sm font-medium transition-colors mt-4"
        >
          <Trash size={16} /> Clear Canvas
        </button>
      </div>

      {error && (
        <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-800 relative">
          <strong className="block font-medium mb-1">Error</strong>
          <p className="break-words">{error}</p>
          <button onClick={clearError} className="absolute top-2 right-2 text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}
    </div>
  );
};
