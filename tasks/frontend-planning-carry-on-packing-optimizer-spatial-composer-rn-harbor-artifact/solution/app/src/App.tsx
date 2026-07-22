import { useEffect } from 'react';
import { SpatialComposer } from './components/SpatialComposer';
import { PackingItemList } from './components/PackingItemList';
import { ExportImport } from './components/ExportImport';
import { usePackingStore } from './store';
import { useStore } from 'zustand';

function App() {
  const store = useStore(usePackingStore);
  const undo = store.undo;

  // Global undo listener (Ctrl/Cmd + Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
      <header className="bg-indigo-900 text-white p-4 shadow-md mb-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Carry-On Packing Optimizer</h1>
          <div className="text-sm font-medium bg-indigo-800 px-3 py-1 rounded">
            Spatial Composer
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-8">
        <PackingItemList />
        <SpatialComposer />
        <ExportImport />
      </main>

      <footer className="text-center p-4 text-gray-500 text-sm">
        <p>Use Ctrl/Cmd+Z to undo placement or changes.</p>
      </footer>
    </div>
  );
}

export default App;
