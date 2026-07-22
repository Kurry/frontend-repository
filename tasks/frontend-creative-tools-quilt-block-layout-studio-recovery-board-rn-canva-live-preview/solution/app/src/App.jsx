import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { QuiltBlocksList } from './components/QuiltBlocksList';
import { RecoveryBoard } from './components/RecoveryBoard';
import { ExportImport } from './components/ExportImport';
import { useStore } from './store';
import { Undo2 } from 'lucide-react';

function SummaryView() {
  const summary = useStore(state => state.derivedSummary);
  return (
    <div className="grid grid-cols-2 gap-4 text-sm" data-testid="summary-view">
      <div className="bg-slate-100 p-3 rounded-lg border border-slate-200">
        <div className="text-slate-500 font-medium">Total</div>
        <div className="text-2xl font-semibold mt-1">{summary.total}</div>
      </div>
      <div className="bg-green-50 p-3 rounded-lg border border-green-200 text-green-800">
        <div className="font-medium">Ready</div>
        <div className="text-2xl font-semibold mt-1">{summary.ready || 0}</div>
      </div>
      <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-800">
        <div className="font-medium">Draft</div>
        <div className="text-2xl font-semibold mt-1">{summary.draft || 0}</div>
      </div>
      <div className="bg-red-50 p-3 rounded-lg border border-red-200 text-red-800">
        <div className="font-medium">Conflict</div>
        <div className="text-2xl font-semibold mt-1">{summary.conflict || 0}</div>
      </div>
    </div>
  );
}

function InspectorView() {
  const { undo, history, recoveryBoardSelection, records } = useStore();
  const selectedRecord = records.find(r => r.id === recoveryBoardSelection);

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex-1">
        {selectedRecord ? (
          <div className="space-y-4" data-testid="inspector-view">
             <div className="text-lg font-medium">{selectedRecord.name}</div>
             <div className="flex justify-between py-2 border-b border-slate-200 text-sm">
                <span className="text-slate-500">Status</span>
                <span className="font-medium capitalize">{selectedRecord.status}</span>
             </div>
             <div className="flex justify-between py-2 border-b border-slate-200 text-sm">
                <span className="text-slate-500">Dimensions</span>
                <span className="font-medium">{selectedRecord.dimensions}</span>
             </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500 italic h-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
            Select a block from the collection or recovery board to view details.
          </div>
        )}
      </div>

      <div className="space-y-4 pt-4 border-t border-slate-200">
        <button
          onClick={undo}
          disabled={history.length === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-md font-medium text-sm transition-colors text-slate-700"
          data-testid="undo-btn"
        >
          <Undo2 size={16} /> Undo Last Action
        </button>
        <ExportImport />
      </div>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('collection');

  return (
    <Layout
      summary={<SummaryView />}
      inspector={<InspectorView />}
    >
      <div className="mb-8">
        <nav className="flex space-x-1 bg-slate-200/50 p-1 rounded-lg w-max mb-6">
          <button
            onClick={() => setActiveTab('collection')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'collection' ? 'bg-white shadow-sm text-primary-dark' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
          >
            Block Collection
          </button>
          <button
            onClick={() => setActiveTab('recovery')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'recovery' ? 'bg-white shadow-sm text-primary-dark' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
            data-testid="nav-recovery-board"
          >
            Recovery Board
          </button>
        </nav>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[500px]">
          {activeTab === 'collection' ? <QuiltBlocksList /> : <RecoveryBoard />}
        </div>
      </div>
    </Layout>
  )
}

export default App
