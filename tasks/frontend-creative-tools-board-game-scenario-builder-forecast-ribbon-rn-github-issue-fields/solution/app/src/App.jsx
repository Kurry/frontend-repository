import React, { useState } from 'react';
import { ForecastRibbon } from './components/ForecastRibbon';
import { ScenarioList } from './components/ScenarioList';
import { IssueSidebar } from './components/IssueSidebar';
import { ExportImportModal } from './components/ExportImportModal';
import { useStore } from './store';
import { Settings, HelpCircle, Menu } from 'lucide-react';

function App() {
  const { records, selectedId } = useStore();
  const selectedRecord = records.find(r => r.id === selectedId);
  const [modalOpen, setModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden text-slate-900 font-sans">
      {/* Top Header */}
      <header className="h-14 bg-slate-900 text-white flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-1 hover:bg-slate-800 rounded"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-lg tracking-tight">Scenario Builder</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalOpen(true)}
            className="text-sm font-medium bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded transition-colors"
          >
            Export / Import
          </button>
        </div>
      </header>

      {/* Main Workbench */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Sidebar: List */}
        <div className={`${mobileMenuOpen ? 'block absolute z-20 inset-y-0 left-0 w-64 shadow-xl' : 'hidden'} md:block md:relative md:w-64 lg:w-80 shrink-0 h-full`}>
          <ScenarioList />
        </div>

        {/* Center: Forecast Ribbon & (on mobile) Editor */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <ForecastRibbon />

          {/* Mobile-only view for the selected record's issue fields */}
          <div className="md:hidden flex-1 p-4 bg-white">
             {selectedRecord ? (
                <div className="border border-slate-200 rounded-lg overflow-hidden h-full">
                  <IssueSidebar record={selectedRecord} />
                </div>
             ) : (
                <div className="h-full flex items-center justify-center text-slate-500 p-4 text-center">
                  Select a scenario from the menu to edit its fields
                </div>
             )}
          </div>
        </div>

        {/* Right Sidebar: Issue Fields (Desktop only) */}
        <div className="hidden md:block w-72 lg:w-80 shrink-0 bg-white border-l border-slate-200 h-full">
          <IssueSidebar record={selectedRecord} />
        </div>

        {/* Mobile Overlay to close menu */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-10 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
        )}
      </main>

      <ExportImportModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

export default App;
