import { useState } from 'react';
import type { HomeEnergyPeakObservatorySession } from '../types';
import { X, Copy, Download, Upload } from 'lucide-react';
import { clsx } from 'clsx';

interface ExportImportModalProps {
  sessionData: HomeEnergyPeakObservatorySession;
  onImport: (session: HomeEnergyPeakObservatorySession) => void;
  onClose: () => void;
}

export function ExportImportModal({ sessionData, onImport, onClose }: ExportImportModalProps) {
  const [mode, setMode] = useState<'export' | 'import'>('export');
  const [importText, setImportText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const exportJson = JSON.stringify(sessionData, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([exportJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'energy-peak-v1-forecast-ribbon.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    setError(null);
    try {
      const parsed = JSON.parse(importText);

      // Basic validation
      if (parsed.schemaVersion !== 'energy-peak-v1') {
        throw new Error("Invalid schemaVersion: expected 'energy-peak-v1'");
      }
      if (!Array.isArray(parsed.records)) {
        throw new Error("Invalid records array");
      }

      // Additional constraints check
      const ids = new Set<string>();
      for (const record of parsed.records) {
        if (!record.id || typeof record.id !== 'string') throw new Error("Missing or invalid record ID");
        if (ids.has(record.id)) throw new Error(`Duplicate record ID: ${record.id}`);
        ids.add(record.id);

        if (typeof record.value !== 'number' || record.value < -50 || record.value > 300) {
          throw new Error(`Invalid value for record ${record.id}. Must be between -50 and 300.`);
        }

        const validStatuses = ['draft', 'ready', 'changed', 'archived'];
        if (!validStatuses.includes(record.status)) {
          throw new Error(`Invalid status for record ${record.id}`);
        }
      }

      onImport(parsed as HomeEnergyPeakObservatorySession);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 id="modal-title" className="text-lg font-semibold text-gray-800">Session Artifact</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setMode('export')}
            className={clsx(
              "flex-1 py-3 text-sm font-medium transition-colors",
              mode === 'export' ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            )}
          >
            Export
          </button>
          <button
            onClick={() => setMode('import')}
            className={clsx(
              "flex-1 py-3 text-sm font-medium transition-colors",
              mode === 'import' ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            )}
          >
            Import
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          {mode === 'export' ? (
            <div className="flex flex-col gap-4 h-full">
              <div className="flex-1 bg-gray-900 rounded-md p-4 overflow-y-auto relative font-mono text-xs text-gray-300">
                <pre>{exportJson}</pre>
              </div>
              <div className="flex justify-end gap-2 shrink-0">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-md transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 h-full">
              <p className="text-sm text-gray-600">Paste your energy-peak-v1-forecast-ribbon.json contents below to restore a session.</p>

              <textarea
                value={importText}
                onChange={e => { setImportText(e.target.value); setError(null); }}
                placeholder='{"schemaVersion": "energy-peak-v1", ...}'
                className={clsx(
                  "flex-1 w-full p-4 font-mono text-xs rounded-md border resize-none focus:ring-2 outline-none",
                  error ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-blue-200"
                )}
              />

              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
                  {error}
                </div>
              )}

              <div className="flex justify-end shrink-0">
                <button
                  onClick={handleImport}
                  disabled={!importText.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Import Session
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
