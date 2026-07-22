import React, { useEffect } from 'react';
import { AppProvider, useAppContext } from './store';
import { Header } from './components/Header';
import { ConstraintCanvas } from './components/ConstraintCanvas';

// Dispatch injector for WebMCP
const WebMCPBridge = () => {
  const { state, dispatch } = useAppContext();

  useEffect(() => {
    window.__DISPATCH__ = dispatch;
    window.__STATE__ = state;
  }, [state, dispatch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch]);

  return null;
};

const Dashboard = () => {
  const { state } = useAppContext();

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <WebMCPBridge />
      <Header />

      <main className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Main Work Surface */}
        <div className="flex-1 h-full min-w-0 border-b md:border-b-0 md:border-r border-gray-200">
          <ConstraintCanvas />
        </div>

        {/* Derived Summary Side Panel */}
        <aside className="w-full md:w-80 bg-white flex flex-col md:h-full border-gray-200 overflow-y-auto shrink-0 max-h-64 md:max-h-full">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Derived Summary</h2>
          </div>

          <div className="p-4 space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Status Breakdown</h3>
              <div className="space-y-3">
                {['Draft', 'Ready', 'Changed', 'Archived'].map(status => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-gray-700 text-sm">{status}</span>
                    <span className="bg-gray-100 text-gray-700 py-1 px-2.5 rounded-full text-xs font-medium">
                      {state.derived.summary[status] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-3">System Information</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Total Records:</span>
                  <span className="font-medium">{state.records.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Schema Version:</span>
                  <span className="font-mono text-xs">{state.schemaVersion}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <Dashboard />
    </AppProvider>
  );
}

export default App;
