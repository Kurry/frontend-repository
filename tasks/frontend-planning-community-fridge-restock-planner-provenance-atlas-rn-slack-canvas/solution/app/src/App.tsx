import React, { useEffect, useRef } from 'react';
import { RestockTasks } from './RestockTasks.js';
import { ProvenanceAtlas } from './ProvenanceAtlas.js';
import { useAppStore } from './store.js';

export function App() {
  const store = useAppStore();
  const storeRef = useRef(store);

  useEffect(() => {
    storeRef.current = store;
  }, [store]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        storeRef.current.undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-slate-200 p-4 font-sans text-gray-900">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6 h-[calc(100vh-2rem)]">
        <div className="flex-[2] overflow-y-auto">
          <RestockTasks store={store} />
        </div>
        <div className="flex-[3] overflow-y-auto">
          <ProvenanceAtlas store={store} />
        </div>
      </div>
    </div>
  );
}
