import React from 'react';
import { RecipeCollection } from './components/RecipeCollection';
import { AuditLens } from './components/AuditLens';
import { ArtifactInspector } from './components/ArtifactInspector';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-6 lg:p-8 flex flex-col font-sans">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Recipe Substitution Sandbox</h1>
        <p className="text-slate-500 text-sm">Audit Lens Workbench</p>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row gap-6 max-h-[calc(100vh-120px)]">
        {/* Left Column: Collection */}
        <div className="flex-1 flex flex-col h-full min-h-[400px]">
          <RecipeCollection />
        </div>

        {/* Right Column: Lens & Inspector */}
        <div className="w-full lg:w-[400px] flex flex-col gap-6 shrink-0 h-full">
          <div className="flex-1 min-h-[300px]">
            <AuditLens />
          </div>
          <div className="shrink-0">
            <ArtifactInspector />
          </div>
        </div>
      </main>
    </div>
  );
}
