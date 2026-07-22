import React from 'react';
import { ColorsCollection } from './components/ColorsCollection';
import { ProvenanceAtlas } from './components/ProvenanceAtlas';
import { ArtifactTransfer } from './components/ArtifactTransfer';
import { useStore } from './store';
import { Undo2, Menu } from 'lucide-react';

function App() {
  const { undo, history } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-2 -ml-2 rounded-md hover:bg-neutral-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            <Menu className="w-5 h-5 text-neutral-600" />
          </button>
          <h1 className="font-semibold text-lg tracking-tight">Palette Harmony Matrix</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={undo}
            disabled={history.length === 0}
            className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-md hover:bg-neutral-100 disabled:opacity-50 disabled:pointer-events-none transition-colors"
            title="Undo last mutation (Ctrl/Cmd+Z)"
          >
            <Undo2 className="w-4 h-4" />
            <span className="hidden sm:inline">Undo</span>
          </button>
          <ArtifactTransfer />
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Colors Collection Pane */}
        <aside className={`
          absolute md:static inset-y-0 left-0 z-20 w-80 bg-white border-r border-neutral-200 flex flex-col
          transform transition-transform duration-200 ease-in-out md:transform-none
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
            <h2 className="font-semibold text-neutral-700">Colors Collection</h2>
            <button className="md:hidden text-sm text-neutral-500" onClick={() => setMobileMenuOpen(false)}>Close</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <ColorsCollection />
          </div>
        </aside>

        {/* Backdrop for mobile drawer */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-10 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Provenance Atlas Primary Surface */}
        <main className="flex-1 bg-neutral-50 overflow-hidden flex flex-col">
          <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
            <ProvenanceAtlas />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
