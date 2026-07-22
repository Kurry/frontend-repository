import { useEffect } from 'react';
import { Toolbar } from './components/Toolbar';
import { GlazeList } from './components/GlazeList';
import { ConstraintCanvas } from './components/ConstraintCanvas';
import { setupWebMCP } from './webmcp';
import { Toaster } from 'react-hot-toast';

function App() {
  useEffect(() => {
    setupWebMCP();
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-stone-100 text-stone-900 font-sans">
      <Toaster position="bottom-right" toastOptions={{ duration: 3000, style: { background: '#333', color: '#fff' } }} />
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 shrink-0 border-r border-stone-200 bg-white">
          <GlazeList />
        </div>
        <div className="flex-1 bg-stone-100">
          <ConstraintCanvas />
        </div>
      </div>
    </div>
  );
}

export default App;
