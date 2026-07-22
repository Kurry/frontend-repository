import React, { useState } from 'react';
import { Download, Upload, Copy, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ArtifactIntegration({ exportState, importState }) {
  const [importText, setImportText] = useState('');
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', msg: string }

  const handleExport = () => {
    const data = exportState();
    const jsonStr = JSON.stringify(data, null, 2);

    // Download
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fiction-branches-v1.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setStatus({ type: 'success', msg: 'Exported fiction-branches-v1.json' });
    setTimeout(() => setStatus(null), 3000);
  };

  const handleCopy = () => {
    const data = exportState();
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setStatus({ type: 'success', msg: 'Copied to clipboard' });
    setTimeout(() => setStatus(null), 3000);
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(importText);
      const success = importState(data);
      if (success) {
        setStatus({ type: 'success', msg: 'Import successful. Work restored.' });
        setImportText('');
      } else {
        setStatus({ type: 'error', msg: 'Validation failed: Invalid schema, duplicate IDs, unknown references, or bounds.' });
      }
    } catch (e) {
      setStatus({ type: 'error', msg: 'Malformed JSON: Unparseable document.' });
    }
  };

  return (
    <div className="w-full md:w-72 border-l border-slate-200 bg-white flex flex-col h-full shrink-0 z-10 overflow-y-auto">
      <div className="p-4 border-b border-slate-200 sticky top-0 bg-white z-10">
        <h2 className="hidden md:block text-lg font-semibold text-slate-800">Artifact Inspector</h2>
        <p className="text-xs text-slate-500 mt-1">fiction-branches-v1.json</p>
      </div>

      <div className="p-4 flex flex-col gap-6">
        {/* Export Section */}
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-2">Export Work</h3>
          <div className="flex flex-col gap-2">
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded text-sm transition-colors"
            >
              <Download size={16} /> Download JSON
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-sm transition-colors"
            >
              <Copy size={16} /> Copy to Clipboard
            </button>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Import Section */}
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-2">Restore Session</h3>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste fiction-branches-v1.json content here..."
            className="w-full h-32 text-xs font-mono border border-slate-300 rounded p-2 mb-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <button
            onClick={handleImport}
            disabled={!importText.trim()}
            className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
          >
            <Upload size={16} /> Clear & Import
          </button>
        </div>

        {/* Status Message */}
        {status && (
          <div className={`p-3 rounded flex items-start gap-2 text-sm ${status.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {status.type === 'success' ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
            <span>{status.msg}</span>
          </div>
        )}

        <div className="mt-auto pt-6">
          <div className="bg-slate-50 p-3 rounded border border-slate-100 hidden md:block">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Live Schema</h4>
            <div className="text-[10px] font-mono text-slate-500 whitespace-pre overflow-x-auto">
              {JSON.stringify(exportState(), null, 2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
