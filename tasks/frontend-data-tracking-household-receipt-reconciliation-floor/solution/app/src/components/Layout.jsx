import React from 'react';
import { Download, Upload, RotateCcw } from 'lucide-react';
import { useStore } from '../store';

const TABS = [
  { id: 'canvas', label: 'Canvas' },
  { id: 'rules', label: 'Split Rules' },
  { id: 'matching', label: 'Matching' },
  { id: 'budget', label: 'Budget Matrix' },
  { id: 'graph', label: 'Obligation Graph' },
  { id: 'settlement', label: 'Settlement' },
  { id: 'review', label: 'Review' },
];

export default function Layout({ children, activeTab, setActiveTab }) {
  const reset = useStore(s => s.reset);
  const state = useStore();

  const handleExport = () => {
    const data = JSON.stringify({
      schemaVersion: "household-reconciliation/v1",
      exportedAt: new Date().toISOString(),
      state: state
    }, null, 2);

    // Playwright downloads this blob in testing
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'household-ledger.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900">
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
        <h1 className="text-xl font-semibold">Household Receipt Reconciliation Floor</h1>
        <div className="flex space-x-2">
          <button onClick={reset} className="p-2 text-gray-600 hover:bg-gray-100 rounded" title="Reset">
            <RotateCcw size={20} />
          </button>
          <button onClick={handleExport} className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            <Download size={16} className="mr-2" /> Export
          </button>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <nav className="w-48 bg-white border-r border-gray-200 p-4 space-y-1 flex flex-col">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-3 py-2 rounded ${activeTab === tab.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <main className="flex-1 overflow-hidden flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
