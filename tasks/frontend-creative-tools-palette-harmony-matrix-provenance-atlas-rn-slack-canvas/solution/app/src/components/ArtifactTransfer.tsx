import React, { useRef, useState } from 'react';
import { useStore, SessionSchema } from '../store';
import { Download, Upload, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export const ArtifactTransfer = () => {
  const { exportSession, importSession } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleExport = () => {
    const session = exportSession();
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `palette-harmony-v1-provenance-atlas-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const result = SessionSchema.safeParse(json);

        if (!result.success) {
          setErrorMsg("Malformed schema or invalid bounds in import file.");
          console.error(result.error);
          return;
        }

        // Generate new exportedAt on import per requirements (just updating it in the session object before applying)
        const sessionToImport = {
          ...result.data,
          exportedAt: new Date().toISOString()
        };

        importSession(sessionToImport);

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (err) {
        setErrorMsg("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          onClick={handleExport}
          className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 bg-neutral-800 text-white rounded-md hover:bg-neutral-700 transition-colors"
          title="Export Session JSON"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 bg-white border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50 transition-colors"
          title="Import Session JSON"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Import</span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImport}
          accept=".json"
          className="hidden"
          aria-hidden="true"
        />
      </div>

      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full right-0 mt-2 w-64 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg shadow-lg z-50 flex gap-2 items-start text-sm"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium mb-1">Import Failed</p>
              <p className="text-xs text-red-600/80">{errorMsg}</p>
              <button
                onClick={() => setErrorMsg(null)}
                className="mt-2 text-xs font-semibold underline hover:text-red-800"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
