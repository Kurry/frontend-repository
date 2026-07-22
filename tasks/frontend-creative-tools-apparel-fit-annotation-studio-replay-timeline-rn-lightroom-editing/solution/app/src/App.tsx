import React, { useEffect } from 'react';
import { useStore } from './store';
import AnnotationList from './components/AnnotationList';
import Editor from './components/Editor';
import Timeline from './components/Timeline';
import Summary from './components/Summary';
import { Download, Upload, Plus } from 'lucide-react';

import { WebMCPBinding } from './webmcp';

function App() {
  const { seedInitialData, exportSession, importSession, createRecord } = useStore();

  useEffect(() => {
    seedInitialData();
    WebMCPBinding.registerTools();
  }, [seedInitialData]);

  const handleExport = () => {
    const data = exportSession();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fit-annotations-v1-replay-timeline.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          importSession(event.target.result);
        }
      };
      reader.readAsText(file);
    }
    // reset input
    e.target.value = '';
  };

  const handleCreate = () => {
    createRecord({
      title: 'New Annotation',
      status: 'draft',
      notes: '',
      measurementOffset: 0
    });
  };

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 font-sans flex flex-col">
      <header className="bg-white border-b border-neutral-200 px-6 py-4 flex justify-between items-center shrink-0">
        <h1 className="text-xl font-semibold tracking-tight text-neutral-800">Apparel Fit Annotation Studio</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 text-white text-sm font-medium rounded hover:bg-neutral-800 transition-colors"
          >
            <Plus size={16} /> Create
          </button>
          <div className="h-4 w-px bg-neutral-300 mx-2" />
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-300 text-neutral-700 text-sm font-medium rounded hover:bg-neutral-50 transition-colors"
          >
            <Download size={16} /> Export
          </button>
          <label className="flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-300 text-neutral-700 text-sm font-medium rounded hover:bg-neutral-50 transition-colors cursor-pointer">
            <Upload size={16} /> Import
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-6">
        <div className="h-full w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
          {/* Left Column: Collection */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6 h-full shrink-0">
            <Summary />
            <AnnotationList />
          </div>

          {/* Right Column: Editor & Timeline */}
          <div className="w-full lg:w-2/3 flex flex-col gap-6 h-full min-w-0">
            <Editor />
            <Timeline />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
