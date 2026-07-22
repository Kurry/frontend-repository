import React from 'react';
import { StoreProvider } from './Store';
import { ComicPanels } from './components/ComicPanels';
import { RecoveryBoard } from './components/RecoveryBoard';
import { DerivedSummary } from './components/DerivedSummary';
import { MobilePreview } from './components/MobilePreview';
import { ExportImport } from './components/ExportImport';
import { WebMCPSetup } from './utils/webmcp';

const AppContent = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6 lg:p-8 font-sans flex flex-col md:flex-row gap-6">
      <WebMCPSetup />

      {/* Desktop Primary Surface - left column */}
      <div className="flex-1 flex flex-col gap-6 max-w-3xl">
        <header className="flex justify-between items-end border-b border-gray-300 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Comic Panel Rhythm Board</h1>
            <p className="text-gray-500 text-sm mt-1">Design workspace, live preview, and portable artifact</p>
          </div>
          <ExportImport />
        </header>

        <div className="h-64 shrink-0">
          <RecoveryBoard />
        </div>

        <DerivedSummary />

        <div className="flex-1 min-h-[400px]">
          <ComicPanels />
        </div>
      </div>

      {/* Mobile Preview Surface - right column */}
      <div className="hidden lg:block w-80 shrink-0 pt-16">
        <MobilePreview />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
