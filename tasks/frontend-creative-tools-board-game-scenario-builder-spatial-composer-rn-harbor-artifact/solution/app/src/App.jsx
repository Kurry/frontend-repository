import React, { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { SpatialComposer } from './components/SpatialComposer';
import { Toolbar } from './components/Toolbar';
import { useStore } from './store';

function App() {
  const { undo } = useStore();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100 overflow-hidden text-black">
      <Toolbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <SpatialComposer />
      </div>
    </div>
  );
}

export default App;
