import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Download, Upload, Copy, Check, FileJson } from 'lucide-react';

export function ArtifactManager() {
  const { exportSession, importSession } = useStore();
  const [jsonText, setJsonText] = useState('');
  const [copied, setCopied] = useState(false);
  const [importInput, setImportInput] = useState('');
  const [importMode, setImportMode] = useState(false);
  const [importError, setImportError] = useState('');

  // Update export JSON whenever the component renders (which happens when store changes if we subscribe, but here we just call exportSession directly)
  // To keep it live, we actually subscribe to the whole store state changes.
  const state = useStore();

  useEffect(() => {
    if (!importMode) {
      setJsonText(exportSession());
    }
  }, [state, importMode, exportSession]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'soundscape-scene-v1-audit-lens.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!importInput.trim()) return;
    const result = importSession(importInput);
    if (result.success) {
      setImportMode(false);
      setImportInput('');
      setImportError('');
    } else {
      setImportError(result.error || 'Import failed');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportInput(content);
      const result = importSession(content);
      if (result.success) {
        setImportMode(false);
        setImportInput('');
        setImportError('');
      } else {
        setImportError(result.error || 'Import failed');
      }
    };
    reader.readAsText(file);
    // reset input
    e.target.value = '';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <FileJson className="w-5 h-5 text-indigo-600" />
          Session Artifact
        </h2>
        <div className="flex bg-slate-200 p-1 rounded-lg text-sm">
          <button
            onClick={() => setImportMode(false)}
            className={`px-3 py-1 rounded-md transition-colors ${!importMode ? 'bg-white shadow-sm text-indigo-700 font-medium' : 'text-slate-600 hover:text-slate-800'}`}
          >
            Export
          </button>
          <button
            onClick={() => setImportMode(true)}
            className={`px-3 py-1 rounded-md transition-colors ${importMode ? 'bg-white shadow-sm text-indigo-700 font-medium' : 'text-slate-600 hover:text-slate-800'}`}
          >
            Import
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-4 overflow-hidden">
        {!importMode ? (
          <>
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy JSON'}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-slate-900 rounded-lg p-4">
              <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap break-all">
                {jsonText}
              </pre>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-lg cursor-pointer bg-slate-50 hover:bg-indigo-50 transition-colors text-slate-600 hover:text-indigo-700">
                <Upload className="w-5 h-5" />
                <span className="font-medium">Select JSON File</span>
                <input type="file" accept=".json" className="hidden" onChange={handleFileChange} />
              </label>
            </div>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">OR PASTE JSON</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <div className="flex-1 flex flex-col gap-2">
              <textarea
                value={importInput}
                onChange={(e) => setImportInput(e.target.value)}
                placeholder="Paste session JSON here..."
                className="flex-1 w-full border border-slate-300 rounded-lg p-3 font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
              />
              {importError && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                  {importError}
                </div>
              )}
              <button
                onClick={handleImport}
                disabled={!importInput.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Import Session
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
