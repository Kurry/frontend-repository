import React, { useEffect } from 'react';
import { StoreProvider, useStore } from './store';
import { PackingList } from './components/PackingList';
import { RecoveryBoard, Summary } from './components/RecoveryBoard';
import { ArtifactManager } from './components/ArtifactManager';
import { Undo } from 'lucide-react';

function AppContent() {
  const { state, dispatch } = useStore();

  useEffect(() => {
    window.__WEBMCP_DISPATCH = dispatch;
    window.__WEBMCP_STATE = state;
  }, [state, dispatch]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 relative">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200 gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Carry-On Packing Optimizer</h1>
          <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
            <button
              onClick={() => dispatch({ type: 'UNDO' })}
              disabled={state.history.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap"
            >
              <Undo className="w-4 h-4" />
              Undo
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <PackingList />
          </div>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Summary</h2>
              <Summary />
            </div>
            <ArtifactManager />
          </div>
        </div>
      </div>

      <RecoveryBoard />
    </div>
  );
}

function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}

export default App;
