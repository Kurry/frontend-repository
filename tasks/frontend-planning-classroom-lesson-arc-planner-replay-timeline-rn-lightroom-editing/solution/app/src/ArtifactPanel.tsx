import { useState } from 'react';
import type { ClassroomLessonArcPlannerSession } from './types';

interface Props {
  onExport: () => ClassroomLessonArcPlannerSession;
  onImport: (session: any) => void;
  onClear: () => void;
}

export function ArtifactPanel({ onExport, onImport, onClear }: Props) {
  const [importText, setImportText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [exportPreview, setExportPreview] = useState<string | null>(null);

  const handleExport = () => {
    const session = onExport();
    const json = JSON.stringify(session, null, 2);
    setExportPreview(json);

    // Attempt download if not in strict headless/no-op mode
    try {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'lesson-arc-v1.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch(e) {
      // ignore
    }
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(importText);
      onImport(data);
      setImportText('');
      setErrorMsg('');
      setExportPreview(null);
    } catch (e: any) {
      setErrorMsg(e.message || "Invalid JSON format");
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded shadow-sm bg-white mt-4">
      <h3 className="font-semibold">Portable Artifact Transfer</h3>

      <div className="flex gap-2">
        <button onClick={handleExport} className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors">Export Session</button>
        <button onClick={onClear} className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors">Clear Session</button>
      </div>

      <div className="mt-4">
         <h4 className="text-sm font-medium mb-1">Import JSON</h4>
         <textarea
           value={importText}
           onChange={e => setImportText(e.target.value)}
           className="w-full h-24 p-2 border rounded text-xs font-mono mb-2"
           placeholder="Paste lesson-arc-v1.json contents here..."
         />
         {errorMsg && <p className="text-red-500 text-xs mb-2">{errorMsg}</p>}
         <button onClick={handleImport} className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors">Import Session</button>
      </div>

      {exportPreview && (
        <div className="mt-4">
           <h4 className="text-sm font-medium mb-1">Exported Artifact Preview</h4>
           <pre className="p-2 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-48 border border-gray-300">
             {exportPreview}
           </pre>
        </div>
      )}
    </div>
  );
}
