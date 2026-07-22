import { useEffect, useState } from 'react';
import { useAppStore } from './store';
import { BookList } from './components/BookList';
import { ProvenanceAtlas } from './components/ProvenanceAtlas';
import { SummaryPanel } from './components/SummaryPanel';
import { ExportImport } from './components/ExportImport';

function App() {
  const { state, dispatch } = useAppStore();
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  // Bind WebMCP globals
  useEffect(() => {
    window.__STATE__ = state;
    window.__DISPATCH__ = dispatch;
  }, [state, dispatch]);

  const selectedBook = state.records.find((r) => r.id === selectedBookId) || null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-semibold tracking-tight">Home Library Lending Ledger</h1>
        <div className="flex gap-4">
          <ExportImport state={state} dispatch={dispatch} />
          <button
            onClick={() => dispatch({ type: 'UNDO' })}
            disabled={state.history.length === 0}
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded transition-colors text-sm font-medium"
          >
            Undo (Cmd+Z)
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="w-full md:w-64 border-r border-slate-200 bg-white p-4 flex flex-col overflow-y-auto">
          <SummaryPanel derived={state.derived} />
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          <div className={`flex-1 p-6 overflow-y-auto ${selectedBookId ? 'hidden md:block' : 'block'}`}>
            <BookList
              records={state.records}
              onSelect={setSelectedBookId}
              selectedId={selectedBookId}
              dispatch={dispatch}
            />
          </div>

          {selectedBookId && (
            <div className="w-full md:w-96 border-l border-slate-200 bg-white shadow-xl md:shadow-none flex flex-col absolute md:relative inset-0 md:inset-auto z-10">
              <ProvenanceAtlas
                book={selectedBook}
                onClose={() => setSelectedBookId(null)}
                dispatch={dispatch}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
