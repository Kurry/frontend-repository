import React, { useState } from 'react';
import { useStore } from '../store';
import { Download, Upload, X, Copy, Trash2, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';

const artifactSchema = z.object({
  schemaVersion: z.literal('fit-annotations-v1'),
  exportedAt: z.string().datetime(),
  records: z.array(z.object({
    id: z.string(),
    status: z.enum(['empty', 'draft', 'ready', 'changed', 'archived']),
    'typed-fields': z.object({
      garment: z.string().min(1),
      fitIssue: z.string().min(1),
      measurementDelta: z.number().min(-50).max(50)
    }),
    'duplicate-merge-id': z.string().nullable(),
    'saved-query': z.string().nullable(),
    'release-provenance': z.string().nullable(),
    'forecast-ribbonState': z.object({
      projection: z.string(),
      priority: z.number(),
      release: z.string()
    }).optional()
  })).refine(records => {
    const ids = new Set();
    for (const r of records) {
      if (ids.has(r.id)) return false;
      ids.add(r.id);
    }
    return true;
  }, { message: "Duplicate Record IDs found" })
});

export const ExportImportModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const store = useStore();
  const [importText, setImportText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const currentArtifact = {
    schemaVersion: 'fit-annotations-v1',
    exportedAt: new Date().toISOString(),
    records: store.records,
    derived: store.derived,
    history: store.history
  };

  const artifactStr = JSON.stringify(currentArtifact, null, 2);

  const handleCopy = () => {
    const textarea = document.createElement('textarea');
    textarea.value = artifactStr;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      setSuccessMsg('Copied to clipboard');
      setTimeout(() => setSuccessMsg(''), 2000);
    } catch (err) {
      setErrorMsg('Failed to copy');
    } finally {
      document.body.removeChild(textarea);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([artifactStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fit-annotations-v1-forecast-ribbon.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a); // Using removeChild immediately here might cause a race condition in headless according to memory, but we'll wrap in setTimeout
  };

  const handleImport = () => {
    try {
      setErrorMsg('');
      const data = JSON.parse(importText);
      const result = artifactSchema.safeParse(data);
      if (!result.success) {
        setErrorMsg(`Validation Error: ${result.error.errors[0].path.join('.')} - ${result.error.errors[0].message}`);
        return;
      }
      store.importArtifact(data);
      setSuccessMsg('Import successful');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
    } catch (e) {
      setErrorMsg('Malformed JSON');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative">

        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Artifact Transfer</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5"/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex gap-6">

          <div className="flex-1 flex flex-col gap-4">
            <h3 className="font-semibold flex items-center gap-2"><Upload className="w-5 h-5"/> Import JSON</h3>
            <textarea
              className="flex-1 w-full border rounded-md p-3 font-mono text-xs focus:ring-2 outline-none resize-none"
              placeholder="Paste JSON here..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
            <button
              onClick={handleImport}
              className="bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 w-full"
            >
              Validate & Import
            </button>
            <button
              onClick={() => { store.clearWorkspace(); setSuccessMsg('Workspace cleared'); setTimeout(() => setSuccessMsg(''), 2000); }}
              className="border border-red-200 text-red-600 hover:bg-red-50 py-2 rounded font-medium w-full flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Clear Workspace
            </button>
          </div>

          <div className="flex-1 flex flex-col gap-4 border-l pl-6">
            <h3 className="font-semibold flex items-center gap-2"><Download className="w-5 h-5"/> Export Preview</h3>
            <div className="flex-1 bg-gray-50 border rounded-md p-3 font-mono text-xs overflow-y-auto whitespace-pre">
              {currentArtifact.records.length === 0 ? '{"schemaVersion": "fit-annotations-v1", "records": []}' : artifactStr}
            </div>
            <div className="flex gap-2">
              <button onClick={handleCopy} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded font-medium hover:bg-gray-300 flex items-center justify-center gap-2">
                <Copy className="w-4 h-4"/> Copy
              </button>
              <button onClick={handleDownload} className="flex-1 bg-slate-800 text-white py-2 rounded font-medium hover:bg-slate-900 flex items-center justify-center gap-2">
                <Download className="w-4 h-4"/> Download
              </button>
            </div>
          </div>

        </div>

        {/* Transient State Announcers */}
        <div aria-live="polite" className="absolute bottom-4 left-1/2 -translate-x-1/2">
          {errorMsg && (
            <div className="bg-red-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium">
              {errorMsg.replace(/\s\d+$/, '')}
            </div>
          )}
          {successMsg && (
            <div className="bg-green-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" /> {successMsg.replace(/\s\d+$/, '')}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
