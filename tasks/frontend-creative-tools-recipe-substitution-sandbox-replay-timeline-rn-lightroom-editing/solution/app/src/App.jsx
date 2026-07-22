import React from 'react';
import { IngredientList } from './components/IngredientList';
import { ReplayTimeline } from './components/ReplayTimeline';
import { ExportImport } from './components/ExportImport';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8">
      <div className="w-full max-w-6xl px-4 flex flex-col h-[calc(100vh-4rem)]">

        <header className="mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Recipe Substitution Sandbox</h1>
          <p className="text-gray-600 mt-1">Manage ingredients, test substitutions, and scrub timeline history.</p>
        </header>

        <div className="flex flex-1 gap-6 bg-white rounded-2xl shadow-xl overflow-hidden p-6 border border-gray-200">
          <div className="w-1/3 min-w-[320px] flex flex-col h-full">
            <IngredientList />
          </div>
          <div className="w-2/3 flex flex-col h-full">
            <ReplayTimeline />
          </div>
        </div>

        <ExportImport />

      </div>
    </div>
  );
}

export default App;
