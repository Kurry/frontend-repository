import React from 'react';
import { Collection } from './components/Collection';
import { RecoveryBoard } from './components/RecoveryBoard';
import { ArtifactManager } from './components/ArtifactManager';
import './webmcp';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded shadow">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Apparel Fit Annotation Studio</h1>
            <p className="text-sm text-gray-500">Design Workspace & Recovery Canvas</p>
          </div>
          <ArtifactManager />
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6 flex flex-col">
            <Collection />
          </div>

          <div className="space-y-6 flex flex-col">
            <RecoveryBoard />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
