import React, { useState } from 'react';
import { useStore } from '../store/store';
import { recipeSubstitutionSandboxSessionSchema } from '../schema/schema';
import { Download, Upload, Trash } from 'lucide-react';

export default function PortableWorkArtifact() {
  const { getExportData, clearSession, importSession, importError, setImportError } = useStore();
  const [jsonText, setJsonText] = useState('');

  const handleExport = () => {
    const data = getExportData();
    const jsonString = JSON.stringify(data, null, 2);
    setJsonText(jsonString);

    // Create blob and download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recipe-substitution-v1-spatial-composer.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const parsed = recipeSubstitutionSandboxSessionSchema.safeParse(json);

        if (parsed.success) {
          // Regenerate exportedAt as required
          const validData = parsed.data;
          validData.exportedAt = new Date().toISOString();
          importSession(validData);
          e.target.value = ''; // Reset input
        } else {
          setImportError(`Invalid schema: ${parsed.error.errors.map(err => err.path.join('.') + ' ' + err.message).join(', ')}`);
        }
      } catch (err) {
        setImportError("Malformed JSON string.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-md overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Portable Work Artifact</h2>
      </div>

      <div className="p-4 flex flex-col gap-4 flex-1 overflow-y-auto">

        {importError && (
          <div className="p-3 bg-red-100 text-red-800 rounded text-sm font-medium">
            Import Failed: {importError}
          </div>
        )}

        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Download size={18} /> Export Session
          </button>

          <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer">
            <Upload size={18} /> Import Session
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>

          <button
            onClick={clearSession}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 ml-auto"
          >
            <Trash size={18} /> Clear Session
          </button>
        </div>

        <div className="flex-1 border rounded bg-gray-50 p-2">
          <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Last Export Preview</h3>
          <pre className="text-xs font-mono whitespace-pre-wrap overflow-auto h-full text-gray-700">
            {jsonText || 'No export generated yet.'}
          </pre>
        </div>
      </div>
    </div>
  );
}
