import React, { useEffect } from 'react';
import { StateProvider, useAppState } from './store';
import { PhotoSequenceList } from './components/PhotoSequenceList';
import { ConstraintCanvas } from './components/ConstraintCanvas';
import { photoSequenceCaptionLoomSessionSchema } from './schemas';

function MainLayout() {
  const { state, dispatch } = useAppState();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch]);

  const handleExport = () => {
    const data = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: {
        summary: `Exported ${state.records.length} records.`,
        stats: {
          total: state.records.length,
          resolved: state.records.filter(r => r.canvasState === 'resolved').length
        }
      },
      history: state.history
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'photo-caption-v1-constraint-canvas.json';
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
        const parsed = photoSequenceCaptionLoomSessionSchema.parse(json);

        const ids = parsed.records.map(r => r.id);
        const hasDuplicates = new Set(ids).size !== ids.length;
        if (hasDuplicates) {
          alert('Import failed: Duplicate IDs found.');
          return;
        }

        dispatch({
          type: 'IMPORT',
          payload: {
            records: parsed.records,
            history: parsed.history,
          }
        });
      } catch (err) {
        alert('Invalid import file: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex h-screen w-full bg-gray-100 flex-col md:flex-row overflow-hidden text-sm md:text-base">
      <div className="bg-white border-b md:border-b-0 md:border-r border-gray-200 p-4 shrink-0 flex flex-col justify-between">
         <div>
            <h1 className="font-black text-xl mb-4 tracking-tight">CaptionLoom</h1>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => dispatch({ type: 'UNDO' })}
                disabled={state.undoStack.length === 0}
                className="bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 px-3 py-1.5 rounded transition-colors text-left"
              >
                Undo (Cmd+Z)
              </button>
              <button
                onClick={() => dispatch({ type: 'CLEAR' })}
                className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded transition-colors text-left"
              >
                Clear All
              </button>
            </div>
         </div>

         <div className="mt-8 flex flex-col gap-2 border-t pt-4">
           <button
              onClick={handleExport}
              className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded transition-colors text-left font-medium"
            >
              Export JSON
            </button>
            <label className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1.5 rounded transition-colors cursor-pointer block">
              Import JSON
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
         </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        <PhotoSequenceList />
        <ConstraintCanvas />
      </div>
    </div>
  );
}

function App() {
  return (
    <MainLayout />
  );
}

export default App;
