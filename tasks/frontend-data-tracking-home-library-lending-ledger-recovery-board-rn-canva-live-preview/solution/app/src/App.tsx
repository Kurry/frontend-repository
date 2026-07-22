import React, { useState, useEffect, useRef } from 'react';
import { StoreProvider, useStore } from './store';
import { BooksCollection } from './components/BooksCollection';
import { RecoveryBoard } from './components/RecoveryBoard';
import { PortableArtifact } from './components/PortableArtifact';
import { setupWebMCP } from './webmcp';

const AppContent: React.FC = () => {
  const { state, dispatch } = useStore();
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    setupWebMCP(() => stateRef.current, dispatch);
  }, [dispatch]);

  const [activeTab, setActiveTab] = useState<'collection' | 'recovery'>('collection');
  const recoveryCount = state.records.filter(r => r.status === 'recovery').length;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <header className="bg-white border-b shadow-sm sticky top-0 z-10 p-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Lending Ledger Workspace</h1>
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              className={`px-4 py-2 rounded-md font-semibold transition-colors ${activeTab === 'collection' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:bg-gray-200'}`}
              onClick={() => setActiveTab('collection')}
            >
              Collection
            </button>
            <button
              className={`px-4 py-2 rounded-md font-semibold transition-colors flex items-center gap-2 ${activeTab === 'recovery' ? 'bg-white shadow text-orange-700' : 'text-gray-600 hover:bg-gray-200'}`}
              onClick={() => setActiveTab('recovery')}
            >
              Recovery Board
              {recoveryCount > 0 && (
                <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">{recoveryCount}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-6 lg:p-8 max-w-6xl mx-auto w-full flex flex-col gap-6">
        <PortableArtifact />

        {/* Derived View Snippet */}
        <div className="grid grid-cols-3 gap-4 mb-2">
           <div className="bg-white p-4 rounded shadow text-center border-t-4 border-blue-500">
             <p className="text-gray-500 text-sm font-bold uppercase tracking-wide">Total Items</p>
             <p className="text-3xl font-light">{state.records.length}</p>
           </div>
           <div className="bg-white p-4 rounded shadow text-center border-t-4 border-green-500">
             <p className="text-gray-500 text-sm font-bold uppercase tracking-wide">Ready</p>
             <p className="text-3xl font-light">{state.records.filter(r => r.status === 'ready').length}</p>
           </div>
           <div className="bg-white p-4 rounded shadow text-center border-t-4 border-orange-500">
             <p className="text-gray-500 text-sm font-bold uppercase tracking-wide">In Recovery</p>
             <p className="text-3xl font-light">{recoveryCount}</p>
           </div>
        </div>

        <div className="flex-grow flex flex-col overflow-hidden">
          {activeTab === 'collection' ? <BooksCollection /> : <RecoveryBoard />}
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}

export default App;
