import { useRef, useState } from 'react';
import { downloadArtifact, importArtifact } from '../artifact';
import { Download, Upload, ShieldAlert, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export function AppHeader() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = () => {
    downloadArtifact();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = importArtifact(event.target?.result as string);
      if (!result.success) {
        setError(result.error || 'Failed to import session');
      } else {
        setError(null);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <header className="bg-slate-900 text-white shadow-md sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-amber-500 p-1.5 rounded-md">
            <ShieldAlert size={20} className="text-slate-900" />
          </div>
          <h1 className="font-bold text-lg hidden sm:block">Evacuation Planner</h1>
        </div>

        <div className="flex items-center gap-4">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs bg-red-500/20 text-red-200 px-3 py-1.5 rounded flex items-center gap-1.5 border border-red-500/30"
              >
                <AlertCircle size={14} />
                {error}
                <button onClick={() => setError(null)} className="ml-2 hover:text-white">&times;</button>
              </motion.div>
            )}
          </AnimatePresence>

          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleImport}
            className="hidden"
            aria-label="Import session"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
          >
            <Upload size={16} />
            <span className="hidden sm:inline">Import</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded transition-colors"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>
    </header>
  );
}
