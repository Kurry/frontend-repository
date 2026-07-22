import { useState } from 'react';
import { useStore } from '../store';
import { Download, Upload, Trash2, Copy, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export function ArtifactManager() {
  const { session, importSession, clearSession } = useStore();
  const [importError, setImportError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const exportData = () => {
    // Generate fresh export with current timestamp
    const artifact = {
      ...session,
      exportedAt: new Date().toISOString()
    };
    const json = JSON.stringify(artifact, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fit-annotations-v1-audit-lens.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyData = () => {
    const artifact = {
      ...session,
      exportedAt: new Date().toISOString()
    };
    const json = JSON.stringify(artifact, null, 2);

    // Fallback for headless environments
    const textArea = document.createElement('textarea');
    textArea.value = json;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    } finally {
      document.body.removeChild(textArea);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const res = importSession(json);
        if (!res.success) {
          setImportError(res.error || 'Invalid session file');
        }
      } catch (err) {
        setImportError('Failed to parse JSON file');
      }
      // reset input
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">Artifact Inspector</h2>
      </div>

      <div className="p-4 space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-1">Derived Summary</h3>
          <p className="text-2xl font-bold text-blue-700">{session.derived.summary}</p>
          <div className="flex justify-between text-xs text-blue-600 mt-2">
            <span>Total Records: {session.derived.totalRecords}</span>
            <span>Resolved: {session.derived.resolvedCount}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={exportData}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors w-full"
          >
            <Download className="w-4 h-4" /> Export Session
          </button>

          <button
            onClick={copyData}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors w-full relative overflow-hidden"
          >
            <Copy className="w-4 h-4" /> {copySuccess ? 'Copied!' : 'Copy JSON'}
          </button>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <label className="flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 hover:border-gray-400 cursor-pointer transition-colors w-full">
            <Upload className="w-4 h-4" /> Import Session
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>

          {importError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2 p-2 bg-red-50 text-red-700 text-xs rounded border border-red-200 flex items-start gap-1.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{importError}</span>
            </motion.div>
          )}
        </div>

        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to clear all records and history?')) clearSession();
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 text-red-600 bg-red-50 rounded-md text-sm font-medium hover:bg-red-100 transition-colors w-full"
          >
            <Trash2 className="w-4 h-4" /> Clear Session
          </button>
        </div>
      </div>
    </div>
  );
}
