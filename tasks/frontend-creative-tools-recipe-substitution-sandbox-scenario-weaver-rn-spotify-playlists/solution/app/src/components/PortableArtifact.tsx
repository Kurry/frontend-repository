import { useState } from 'react';
import { useStore } from '../store';
import { Download, Upload, Copy, AlertCircle, CheckCircle2 } from 'lucide-react';
import { RecipeSubstitutionSandboxSessionSchema } from '../schema';

export const PortableArtifact: React.FC = () => {
  const { exportSession, importSession, getDerivedSummary } = useStore();
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);
  const summary = getDerivedSummary();

  const handleExport = () => {
    const session = exportSession();
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recipe-substitution-v1-scenario-weaver.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    const session = exportSession();
    navigator.clipboard.writeText(JSON.stringify(session, null, 2));
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const result = RecipeSubstitutionSandboxSessionSchema.safeParse(json);

        if (!result.success) {
          setImportError(`Validation failed: ${result.error.issues[0].path.join('.')} - ${result.error.issues[0].message}`);
          return;
        }

        // Additional validation for unique IDs and specific sum rules if necessary
        const ids = new Set(result.data.records.map(r => r.id));
        if (ids.size !== result.data.records.length) {
          setImportError('Validation failed: Duplicate record IDs found.');
          return;
        }

        // Regenerate exportedAt for the restored session conceptually (though we just load it)
        importSession(result.data);
        setImportSuccess(true);
        setTimeout(() => setImportSuccess(false), 3000);
      } catch (err) {
        setImportError('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  return (
    <div className="bg-slate-800 text-white p-6 rounded-xl shadow-lg flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-6 text-slate-100 flex items-center gap-2">
        <Upload size={18} />
        Session Artifact
      </h2>

      <div className="bg-slate-700 p-4 rounded-lg mb-6 text-sm flex justify-between items-center">
        <div>
          <div className="text-slate-400 mb-1">Total Ingredients</div>
          <div className="text-2xl font-bold">{summary.totalItems}</div>
        </div>
        <div>
          <div className="text-slate-400 mb-1">Modified / Scenarios</div>
          <div className="text-2xl font-bold text-blue-400">{summary.modifiedItems}</div>
        </div>
      </div>

      <div className="space-y-4">
        <button
          onClick={handleExport}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium"
        >
          <Download size={18} />
          Export Session JSON
        </button>

        <button
          onClick={handleCopy}
          className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium text-sm"
        >
          <Copy size={16} />
          Copy to Clipboard
        </button>

        <div className="pt-4 border-t border-slate-700 mt-4">
          <label className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium cursor-pointer text-sm">
            <Upload size={16} />
            Import Session JSON
            <input type="file" accept=".json" className="hidden" onChange={handleImport} data-testid="import-input" />
          </label>
        </div>
      </div>

      {importError && (
        <div className="mt-4 p-3 bg-red-900/50 text-red-200 text-xs rounded border border-red-800 flex items-start gap-2">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <p>{importError}</p>
        </div>
      )}

      {importSuccess && (
        <div className="mt-4 p-3 bg-green-900/50 text-green-200 text-xs rounded border border-green-800 flex items-start gap-2">
          <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
          <p>Session imported successfully.</p>
        </div>
      )}

      <div className="mt-auto pt-6">
        <div className="text-xs text-slate-500 font-mono text-center">
          recipe-substitution-v1-scenario-weaver.json
        </div>
      </div>
    </div>
  );
};