import React, { useState, useEffect } from 'react';
import { RecipeIngredients } from './components/RecipeIngredients';
import { RecoveryBoard } from './components/RecoveryBoard';
import { Summary } from './components/Summary';
import { Inspector } from './components/Inspector';
import { useStore } from './store/useStore';
import { initWebMCP } from './lib/webmcp';
import { Download, Upload, Trash } from 'lucide-react';

function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { exportArtifact, importArtifact, clearAll, undo } = useStore();
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    initWebMCP();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  const handleExport = () => {
    const data = exportArtifact();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recipe-substitution-v1.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const success = importArtifact(json);
        if (!success) {
          setImportError("Malformed schema or references. State unchanged.");
        } else {
          setImportError(null);
          setSelectedId(null);
        }
      } catch (err) {
        setImportError("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Recipe Substitution Sandbox</h1>
          <p className="text-sm text-gray-500">Recovery Board & Canva Live Preview</p>
        </div>
        <div className="flex items-center gap-4">
          {importError && <span className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded">{importError}</span>}

          <label className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500">
            <Upload size={16} />
            Import
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Download size={16} />
            Export Artifact
          </button>

          <button
            onClick={() => { clearAll(); setSelectedId(null); }}
            className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md shadow-sm text-sm font-medium text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            title="Clear All Session Data"
          >
            <Trash size={16} />
            Clear
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 flex flex-col md:flex-row gap-6 overflow-hidden">
        {/* Left Column: Collection */}
        <div className="w-full md:w-1/3 flex flex-col h-[calc(100vh-100px)]">
          <RecipeIngredients onSelect={setSelectedId} selectedId={selectedId} />
        </div>

        {/* Middle Column: Recovery Board */}
        <div className="w-full md:w-1/3 flex flex-col h-[calc(100vh-100px)]">
          <RecoveryBoard selectedId={selectedId} />
        </div>

        {/* Right Column: Linked Views (Summary + Inspector) */}
        <div className="w-full md:w-1/3 flex flex-col gap-6 h-[calc(100vh-100px)] overflow-y-auto">
          <Summary />
          <div className="flex-1">
            <Inspector selectedId={selectedId} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
