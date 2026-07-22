import React, { useState } from 'react';
import { useStore } from '../store';
import { Download, Upload, Copy, RefreshCw, AlertTriangle } from 'lucide-react';
import { MusicPracticeLoopComposerSession } from '../types';

export const ArtifactManager: React.FC = () => {
  const { exportSession, importSession, clearSession } = useStore();
  const [importText, setImportText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleExport = () => {
    const session = exportSession();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(session, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "practice-loop-v1-audit-lens.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleCopy = async () => {
    const session = exportSession();
    await navigator.clipboard.writeText(JSON.stringify(session, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importText);

      if (parsed.schemaVersion !== 'v1') {
        throw new Error("Invalid schemaVersion. Expected 'v1'.");
      }
      if (!Array.isArray(parsed.records)) {
        throw new Error("Invalid format: 'records' must be an array.");
      }

      const ids = new Set();
      const validStatuses = ['empty', 'draft', 'ready', 'changed', 'archived'];

      for (const record of parsed.records) {
        if (!record.id) throw new Error("A record is missing an ID.");
        if (ids.has(record.id)) throw new Error(`Duplicate ID found: ${record.id}`);
        ids.add(record.id);

        if (!validStatuses.includes(record.status)) {
          throw new Error(`Invalid status: ${record.status}`);
        }
        if (!record.title || typeof record.bpm !== 'number') {
           throw new Error(`Record ${record.id} is missing required fields or has invalid types.`);
        }
      }

      const sessionToImport: MusicPracticeLoopComposerSession = {
        ...parsed,
        exportedAt: new Date().toISOString()
      };

      importSession(sessionToImport);
      setImportText('');
      setError(null);
      alert('Session imported successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to parse JSON.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Download size={20} className="text-slate-500" />
        Portable Work Artifact
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <h3 className="font-medium text-slate-700 mb-2">Export Session</h3>
          <p className="text-sm text-slate-500 mb-4">
            Download your current practice segments and audit history as an interoperable JSON artifact.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
            >
              <Download size={16} />
              Download JSON
            </button>
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 py-2 px-4 rounded-md text-sm font-medium transition-colors"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <h3 className="font-medium text-slate-700 mb-2">Import Session</h3>
          <p className="text-sm text-slate-500 mb-2">
            Paste session JSON below to restore a previous state.
          </p>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder='{"schemaVersion": "v1", "records": [...]}'
            className="w-full h-24 text-xs font-mono p-2 border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 mb-2 resize-none"
          />
          {error && (
            <div className="flex items-start gap-1 text-red-600 text-xs mb-2 bg-red-50 p-2 rounded">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          <div className="flex justify-between items-center mt-2">
            <button
              onClick={() => {
                if(confirm('Are you sure you want to clear the current session?')) {
                  clearSession();
                }
              }}
              className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
            >
              <RefreshCw size={14} />
              Clear Current
            </button>
            <button
              onClick={handleImport}
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white py-1.5 px-4 rounded-md text-sm font-medium transition-colors"
            >
              <Upload size={16} />
              Import
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function Check(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
