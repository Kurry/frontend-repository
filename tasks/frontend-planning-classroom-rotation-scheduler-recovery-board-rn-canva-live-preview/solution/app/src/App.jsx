import React, { useState, useEffect } from 'react';
import { createInitialState } from './store.js';
import { StationsCollection } from './components/StationsCollection.jsx';
import { RecoveryBoard } from './components/RecoveryBoard.jsx';
import { ExportImport } from './components/ExportImport.jsx';
import { registerWebMcpTools } from './webmcp.js';

function App() {
  const [state, setState] = useState(createInitialState());

  useEffect(() => {
    registerWebMcpTools(state, setState);
  }, [state]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-gray-900 font-sans">
      <header className="mb-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">Classroom Rotation Scheduler</h1>
        <p className="text-gray-500 mt-2">Manage stations and recover failed records across linked views.</p>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <StationsCollection state={state} setState={setState} />
          <RecoveryBoard state={state} setState={setState} />
        </div>
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Live Preview (Mobile)</h2>
            <div className="border-[8px] border-gray-800 rounded-3xl h-[600px] overflow-hidden bg-gray-50 relative">
              <div className="p-4">
                <h3 className="font-bold text-lg mb-4">Stations Mobile</h3>
                <div className="space-y-3">
                  {state.records.map(record => (
                    <div key={record.id} className="bg-white p-3 rounded shadow-sm border text-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold truncate">{record.name}</span>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">{record.status}</span>
                      </div>
                      {record.failed && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded inline-block">Failed</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <ExportImport state={state} setState={setState} />
        </div>
      </main>
    </div>
  );
}

export default App;
