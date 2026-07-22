import { useState, useRef } from 'react';
import { StoreProvider, useStore } from './store';
import { WebMCP } from './WebMCP';
import { RecordList } from './RecordList';
import { AuditLens } from './AuditLens';
import { Download, Upload, Undo2, Map, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';

function Header() {
  const { derivedState, undo, state, importState } = useStore();
  const fileInputRef = useRef(null);

  const handleExport = () => {
    const payload = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: derivedState,
      history: state.history
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bike-maintenance-v1-audit-lens.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const payload = JSON.parse(event.target.result);
        if (payload && payload.schemaVersion === 'v1' && Array.isArray(payload.records)) {
          importState({
            records: payload.records,
            history: payload.history || [],
            auditLensState: { selectedRecordId: null, isResolving: false },
            exportedAt: new Date().toISOString()
          });
        } else {
          alert("Invalid file format. Expected schemaVersion 'v1' and a records array.");
        }
      } catch (err) {
        alert("Failed to parse JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="bg-primary-100 p-2 rounded-lg">
          <Map className="w-6 h-6 text-primary-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">Bike Maintenance Tracker</h1>
          <div className="text-sm text-gray-500 mt-1 flex items-center gap-4">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              {derivedState.readyCount} Ready
            </span>
            <span className="flex items-center gap-1">
              {derivedState.discrepanciesCount > 0 ? (
                <ShieldAlert className="w-4 h-4 text-red-500" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-gray-400" />
              )}
              {derivedState.discrepanciesCount} Needs Audit
            </span>
            <span className="hidden sm:inline">
              • {derivedState.totalMileage.toLocaleString()} Total Miles
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={undo}
          disabled={state.history.length === 0}
          className="p-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Undo last action"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-5 h-5" />
        </button>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded hover:bg-primary-100 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Import
        </button>
        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          className="hidden"
          onChange={handleImport}
        />
      </div>
    </header>
  );
}

function MainLayout() {
  const { undo } = useStore();

  // Keyboard shortcut for Undo (Ctrl+Z / Cmd+Z)
  useState(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div className="min-h-screen flex flex-col bg-surface-50 font-sans text-gray-900">
      <WebMCP />
      <Header />
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-80px)]">
        <div className="lg:col-span-7 h-full flex flex-col">
          <RecordList />
        </div>
        <div className="lg:col-span-5 h-full flex flex-col">
          <AuditLens />
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <MainLayout />
    </StoreProvider>
  );
}
