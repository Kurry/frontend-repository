import { useReducer, useState, useMemo, useEffect } from 'react';
import { reducer, initialState } from './store';
import { ReadingsList } from './components/ReadingsList';
import { ReadingForm } from './components/ReadingForm';
import { ForecastRibbon } from './components/ForecastRibbon';
import { SummaryPanel } from './components/SummaryPanel';
import { ExportImportModal } from './components/ExportImportModal';
import type { EnergyReading, HomeEnergyPeakObservatorySession } from './types';
import { Undo2, Settings } from 'lucide-react';

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [editingRecord, setEditingRecord] = useState<EnergyReading | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Expose state logic for WebMCP
  useEffect(() => {
    (window as any).__dispatch = dispatch;
    (window as any).__getState = () => state;
  }, [state]);

  // Derived state
  const summary = useMemo(() => {
    const totalReadings = state.records.length;
    const averageValue = totalReadings > 0
      ? state.records.reduce((sum, r) => sum + r.value, 0) / totalReadings
      : 0;
    const averageProjection = totalReadings > 0
      ? state.records.reduce((sum, r) => sum + (r.forecastProjection ?? r.value), 0) / totalReadings
      : 0;

    return {
      totalReadings,
      averageValue,
      averageProjection,
    };
  }, [state.records]);

  const selectedRecord = state.selectedId
    ? state.records.find(r => r.id === state.selectedId) ?? null
    : null;

  // Keyboard undo shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleExportImport = () => {
    setIsExportModalOpen(true);
  };

  const getSessionData = (): HomeEnergyPeakObservatorySession => {
    return {
      schemaVersion: 'energy-peak-v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: summary,
      history: state.history.map(h => JSON.stringify(h))
    };
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans text-gray-900">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shrink-0 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">Home Energy Peak Observatory</h1>

        <div className="flex gap-2">
          <button
            onClick={() => dispatch({ type: 'UNDO' })}
            disabled={state.history.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
            <span className="hidden sm:inline">Undo</span>
          </button>

          <button
            onClick={handleExportImport}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Artifact</span>
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-hidden flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto w-full">
        {/* Left column / Drawer */}
        <div className="flex flex-col gap-6 lg:w-1/3 shrink-0 h-full">
          {isFormOpen ? (
            <ReadingForm existingIds={state.records.map(r => r.id)}
              initialData={editingRecord}
              onSubmit={(record) => {
                if (editingRecord) {
                  dispatch({ type: 'UPDATE_RECORD', payload: record });
                } else {
                  dispatch({ type: 'ADD_RECORD', payload: record });
                }
                setIsFormOpen(false);
                setEditingRecord(null);
                dispatch({ type: 'SELECT_RECORD', payload: record.id });
              }}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingRecord(null);
              }}
            />
          ) : (
            <ReadingsList
              className="flex-1"
              records={state.records}
              selectedId={state.selectedId}
              onSelect={(id) => dispatch({ type: 'SELECT_RECORD', payload: id })}
              onDelete={(id) => dispatch({ type: 'DELETE_RECORD', payload: id })}
              onEdit={(record) => {
                setEditingRecord(record);
                setIsFormOpen(true);
              }}
              onCreateNew={() => {
                setEditingRecord(null);
                setIsFormOpen(true);
              }}
            />
          )}
        </div>

        {/* Right column / Main canvas */}
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto">
          <SummaryPanel summary={summary} />
          <ForecastRibbon
            selectedRecord={selectedRecord}
            onMutateForecast={(id, projection) => {
              dispatch({ type: 'MUTATE_FORECAST', payload: { id, projection } });
            }}
          />
        </div>
      </main>

      {isExportModalOpen && (
        <ExportImportModal
          sessionData={getSessionData()}
          onImport={(session) => {
            dispatch({ type: 'IMPORT', payload: { ...session, exportedAt: new Date().toISOString() } });
            setIsExportModalOpen(false);
          }}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
