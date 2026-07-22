import React, { useState } from 'react';
import { StoryNodesList } from './components/StoryNodesList';
import { HandoffMap } from './components/HandoffMap';
import { SummaryInspector } from './components/SummaryInspector';
import { Menu, X, BarChart2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-gray-100 text-gray-900 overflow-hidden font-sans relative">

      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-gray-200 p-3 z-20 absolute top-0 left-0 right-0">
        <button
          onClick={() => { setMobileMenuOpen(!mobileMenuOpen); setMobileSummaryOpen(false); }}
          className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <span className="font-semibold text-gray-900 text-sm">Handoff Map</span>
        <button
          onClick={() => { setMobileSummaryOpen(!mobileSummaryOpen); setMobileMenuOpen(false); }}
          className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
        >
          {mobileSummaryOpen ? <X size={24} /> : <BarChart2 size={24} />}
        </button>
      </div>

      {/* Main Container - Padded on mobile to avoid header */}
      <div className="flex flex-1 w-full h-full pt-[60px] md:pt-0 relative overflow-hidden">

        {/* Left Drawer (Story Nodes) */}
        <div className={cn(
          "fixed inset-y-0 left-0 z-30 w-80 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:flex-shrink-0 pt-[60px] md:pt-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <StoryNodesList onClose={() => setMobileMenuOpen(false)} />
        </div>

        {/* Backdrop for Left Drawer */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-20 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Main Workspace (Handoff Map) */}
        <main className="flex-1 flex flex-col min-w-0 z-0 h-full overflow-hidden">
          <HandoffMap />
        </main>

        {/* Right Drawer (Summary & Inspector) */}
        <div className={cn(
          "fixed inset-y-0 right-0 z-30 w-72 bg-white border-l border-gray-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:w-64 md:flex-shrink-0 pt-[60px] md:pt-0 shadow-lg md:shadow-none",
          mobileSummaryOpen ? "translate-x-0" : "translate-x-full"
        )}>
          <SummaryInspector />
        </div>

        {/* Backdrop for Right Drawer */}
        {mobileSummaryOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-20 md:hidden"
            onClick={() => setMobileSummaryOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
