import { useRef, useState } from 'react';
import TaskBoard from './components/TaskBoard';
import ForecastRibbon from './components/ForecastRibbon';
import { useStore } from './store';
import { Download, Upload, AlertCircle } from 'lucide-react';

export default function App() {
  const exportSession = useStore(state => state.exportSession);
  const importSession = useStore(state => state.importSession);


  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleExport = () => {
    const session = exportSession();
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fridge-restock-v1.json';
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
        importSession(json);
        setImportError(null);
      } catch (err: any) {
        setImportError(err.message || 'Invalid JSON file');
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset input
      }
    };
    reader.readAsText(file);
  };

  const summary = useStore(state => state.exportSession().derived.summary);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <h1 className="text-xl font-bold text-slate-800">Community Fridge Restock Planner</h1>
        <div className="flex items-center gap-4 text-sm">
           <div className="text-slate-500 mr-4">
              Total: {summary.total} | Draft: {summary.draft} | Ready: {summary.ready} | Changed: {summary.changed} | Archived: {summary.archived}
           </div>
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleImport}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
          >
            <Upload size={16} /> Import
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            <Download size={16} /> Export
          </button>
        </div>
      </header>

      {importError && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle size={16} />
          {importError}
        </div>
      )}

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto flex flex-col md:flex-row gap-6">

        {/* Left Column: Task Board */}
        <div className="w-full md:w-1/2 lg:w-2/3 h-[calc(100vh-120px)]">
          <TaskBoard />
        </div>

        {/* Right Column: Forecast Ribbon & derived state details */}
        <div className="w-full md:w-1/2 lg:w-1/3 h-[calc(100vh-120px)] flex flex-col gap-6">
          <div className="flex-1">
             <ForecastRibbon />
          </div>
        </div>

      </main>
    </div>
  );
}