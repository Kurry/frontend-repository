import React from 'react';
import { KilnPieces } from './components/KilnPieces';
import { AuditLens } from './components/AuditLens';
import { ExportImport } from './components/ExportImport';
import { Summary } from './components/Summary';

function App() {
  return (
    <div className="min-h-screen bg-neutral-100 p-4 sm:p-8 font-sans text-neutral-900">
      <div className="max-w-6xl mx-auto space-y-6">

        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Ceramic Kiln Load Composer</h1>
            <p className="text-neutral-500 text-sm mt-1">Audit Lens Workbench</p>
          </div>
          <div className="hidden sm:block">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              System Active
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          <div className="lg:col-span-8 flex flex-col gap-6">
            <KilnPieces />
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <Summary />
            <AuditLens />
            <ExportImport />
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
