import React from 'react';
import { GlazeTestsList } from './components/GlazeTestsList';
import { HandoffMap } from './components/HandoffMap';
import { Inspector } from './components/Inspector';
import { useStore } from './store';
import { Download, Upload, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

function App() {
  const { records, history, schemaVersion, importAtlas, clearAtlas } = useStore();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = {
      schemaVersion,
      exportedAt: new Date().toISOString(),
      records,
      history,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `glaze-atlas-v1-handoff-map-${format(new Date(), 'yyyyMMdd-HHmmss')}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        importAtlas(data);
      } catch (err) {
        console.error('Failed to parse atlas JSON', err);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden font-sans">
      <header className="bg-indigo-900 text-white p-4 flex items-center justify-between shrink-0 shadow-md relative z-20">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Ceramic Glaze Test Atlas</h1>
          <p className="text-indigo-200 text-xs mt-0.5">Handoff Map v1</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={clearAtlas}
            className="flex items-center px-3 py-1.5 text-sm font-medium rounded text-indigo-100 hover:bg-indigo-800 transition-colors"
          >
            <Trash2 size={16} className="mr-2" />
            Clear
          </button>

          <div className="h-6 w-px bg-indigo-700 mx-1" />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center px-3 py-1.5 text-sm font-medium rounded text-indigo-100 hover:bg-indigo-800 transition-colors"
          >
            <Upload size={16} className="mr-2" />
            Import
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-1.5 text-sm font-medium rounded bg-indigo-500 hover:bg-indigo-400 text-white shadow-sm transition-colors"
          >
            <Download size={16} className="mr-2" />
            Export
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden lg:flex-row flex-col">
        {/* Mobile stacking strategy: List takes top part or becomes drawer. Here we use flex-col for small screens */}
        <div className="w-full lg:w-72 h-64 lg:h-full shrink-0 border-b lg:border-b-0 lg:border-r border-gray-200">
          <GlazeTestsList />
        </div>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          <HandoffMap />
        </div>

        <div className="w-full lg:w-80 h-auto lg:h-full shrink-0 border-t lg:border-t-0 lg:border-l border-gray-200 bg-white">
          <Inspector />
        </div>
      </main>
    </div>
  );
}

export default App;
