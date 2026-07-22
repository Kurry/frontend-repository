import React, { useReducer, useState, useEffect, useRef } from 'react';
import {
  StoreContext,
  initialState,
  reducer,
  calculateDerivedState,
  type BookStatus,

  type LedgerSession,
  useStore
} from './store';
import { Book as BookIcon, Plus, Trash2, Undo, Download, Upload, Info } from 'lucide-react';
import { initWebMCP } from './webmcp';

function WebMCPBridge() {
  const { state, dispatch, derived } = useStore();

  useEffect(() => {
    initWebMCP(dispatch, () => ({ state, derived }));
  }, [state, dispatch, derived]);

  return null;
}

function BookList() {
  const { state, dispatch } = React.useContext(StoreContext)!;
  const [filter, setFilter] = useState<BookStatus | 'all'>('all');

  const filteredRecords = state.records.filter(r => filter === 'all' || r.status === filter);

  return (
    <div className="flex flex-col gap-4 p-4 border-r border-slate-200 bg-slate-50 w-full md:w-80 md:h-full overflow-y-auto shrink-0">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BookIcon className="w-5 h-5" /> Books
        </h2>
        <button
          onClick={() => {
            dispatch({
              type: 'ADD_BOOK',
              payload: {
                title: 'New Book',
                author: 'Unknown',
                isbn: '000-0000000000',
                status: 'draft',
                capacity: 1,
                spatialComposerState: { placed: false, x: 0, y: 0 }
              }
            });
          }}
          className="p-1 hover:bg-slate-200 rounded text-slate-700"
          title="Add Book"
          aria-label="Add Book"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value as BookStatus | 'all')}
        className="w-full p-2 border border-slate-300 rounded text-sm bg-white"
        aria-label="Filter Books"
      >
        <option value="all">All Statuses</option>
        <option value="draft">Draft</option>
        <option value="ready">Ready</option>
        <option value="changed">Changed</option>
        <option value="archived">Archived</option>
      </select>

      <div className="flex flex-col gap-2">
        {filteredRecords.map(book => (
          <div
            key={book.id}
            className={`p-3 rounded border cursor-pointer transition-colors relative group ${
              state.selectedId === book.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
            onClick={() => dispatch({ type: 'SELECT_BOOK', payload: book.id })}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                dispatch({ type: 'SELECT_BOOK', payload: book.id });
              }
            }}
          >
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-medium text-slate-800 line-clamp-1 pr-6">{book.title}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                book.status === 'draft' ? 'bg-slate-200 text-slate-700' :
                book.status === 'ready' ? 'bg-green-100 text-green-700' :
                book.status === 'changed' ? 'bg-amber-100 text-amber-700' :
                'bg-slate-100 text-slate-500'
              }`}>
                {book.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-2">{book.author}</p>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Cap: {book.capacity}</span>
              {book.spatialComposerState.placed && <span className="text-blue-600">Placed</span>}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Delete book?')) {
                  dispatch({ type: 'DELETE_BOOK', payload: book.id });
                }
              }}
              className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Delete Book"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {filteredRecords.length === 0 && (
          <div className="text-sm text-slate-500 text-center py-4">No books found.</div>
        )}
      </div>
    </div>
  );
}

function ArtifactPanel() {
  const { state, dispatch, derived } = React.useContext(StoreContext)!;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const session: LedgerSession = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived,
      history: state.history,
    };
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'library-lending-v1-spatial-composer.json';
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
        const text = event.target?.result as string;
        const session = JSON.parse(text);

        if (session.schemaVersion !== 'v1' || !Array.isArray(session.records)) {
          dispatch({ type: 'SET_ERROR', payload: 'Invalid artifact schema. schemaVersion must be v1.' });
          return;
        }

        dispatch({ type: 'IMPORT_ARTIFACT', payload: session });
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to parse artifact JSON.' });
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExport}
        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded"
        aria-label="Export Artifact"
      >
        <Download className="w-4 h-4" /> Export
      </button>
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 rounded"
        aria-label="Import Artifact"
      >
        <Upload className="w-4 h-4" /> Import
      </button>
      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        onChange={handleImport}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
}


function SpatialComposer() {
  const { state, dispatch, derived } = React.useContext(StoreContext)!;
  const composerRef = useRef<HTMLDivElement>(null);

  const selectedBook = state.records.find(r => r.id === state.selectedId);

  const handleComposerClick = (e: React.MouseEvent) => {
    if (!selectedBook) return;

    if (composerRef.current) {
      const rect = composerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newCapacity = selectedBook.capacity > 0 ? selectedBook.capacity : 1;

      dispatch({
        type: 'PLACE_IN_COMPOSER',
        payload: {
          id: selectedBook.id,
          x: Math.max(0, Math.min(x - 50, rect.width - 100)),
          y: Math.max(0, Math.min(y - 25, rect.height - 50)),
          newCapacity
        }
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (selectedBook) {
        const newCapacity = selectedBook.capacity > 0 ? selectedBook.capacity : 1;
        dispatch({
          type: 'PLACE_IN_COMPOSER',
          payload: {
            id: selectedBook.id,
            x: 100,
            y: 100,
            newCapacity
          }
        });
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-[400px]">
      <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Spatial Composer</h2>
          <button
            onClick={() => dispatch({ type: 'UNDO' })}
            disabled={state.history.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded text-slate-700"
            aria-label="Undo"
          >
            <Undo className="w-4 h-4" /> Undo (Cmd+Z)
          </button>
        </div>
        <ArtifactPanel />
      </div>

      <div className="flex-1 p-4 relative bg-slate-100 overflow-hidden flex flex-col gap-4">
        {state.error && (
          <div className="bg-red-100 text-red-700 p-3 rounded text-sm flex justify-between items-center z-10 shrink-0">
            <span>{state.error}</span>
            <button onClick={() => dispatch({ type: 'CLEAR_ERROR' })} className="font-bold">&times;</button>
          </div>
        )}

        <div
          ref={composerRef}
          className="flex-1 bg-white border-2 border-dashed border-slate-300 rounded-lg relative overflow-hidden focus:outline-none focus:border-blue-500 transition-colors"
          onClick={handleComposerClick}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          aria-label="Spatial Composer Canvas"
          role="application"
        >
          {state.records.filter(r => r.spatialComposerState.placed).map(book => (
            <div
              key={book.id}
              className={`absolute p-2 rounded shadow-sm text-xs font-medium cursor-pointer transition-all duration-300 ${
                state.selectedId === book.id ? 'bg-blue-500 text-white ring-2 ring-blue-300' : 'bg-slate-800 text-white hover:bg-slate-700'
              }`}
              style={{
                left: `${book.spatialComposerState.x}px`,
                top: `${book.spatialComposerState.y}px`,
                width: '100px',
                height: '50px',
              }}
              onClick={(e) => {
                e.stopPropagation();
                dispatch({ type: 'SELECT_BOOK', payload: book.id });
              }}
            >
              <div className="truncate">{book.title}</div>
              <div className="opacity-80">Cap: {book.capacity}</div>
            </div>
          ))}
          {!selectedBook && state.records.filter(r => r.spatialComposerState.placed).length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 pointer-events-none">
              Select a book and click here to place and rebalance capacity.
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shrink-0 shadow-sm flex flex-wrap gap-6 justify-between items-center">
          <div className="flex items-center gap-2 text-slate-600">
            <Info className="w-5 h-5 text-blue-500" />
            <span className="font-medium">Derived Summary</span>
          </div>
          <div className="flex gap-4 md:gap-8 flex-wrap">
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 uppercase tracking-wide">Active Books</span>
              <span className="text-lg font-semibold">{derived.summary.activeBooks}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 uppercase tracking-wide">Total Cap</span>
              <span className="text-lg font-semibold">{derived.summary.totalCapacity}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 uppercase tracking-wide text-blue-600">Placed Cap</span>
              <span className="text-lg font-semibold text-blue-700">{derived.summary.placedCapacity}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 uppercase tracking-wide">Remaining Cap</span>
              <span className="text-lg font-semibold">{derived.summary.remainingCapacity}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const derived = calculateDerivedState(state.records);

  return (
    <StoreContext.Provider value={{ state, dispatch, derived }}>
      <WebMCPBridge />
      <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-slate-100 text-slate-900 font-sans">
        <BookList />
        <SpatialComposer />
      </div>
    </StoreContext.Provider>
  );
}
