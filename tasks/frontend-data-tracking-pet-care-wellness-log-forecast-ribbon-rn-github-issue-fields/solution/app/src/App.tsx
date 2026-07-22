import { useEffect } from 'react';
import { Header } from './Header';
import { Summary } from './Summary';
import { EventList } from './EventList';
import { ForecastRibbon } from './ForecastRibbon';
import { WebMCPHandler } from './WebMCPHandler';
import { useAppStore } from './store';

function App() {
  const undo = useAppStore(state => state.undo);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <WebMCPHandler />
      <Header />
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 flex flex-col gap-4">
        <Summary />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
          <div className="md:col-span-1 h-full overflow-hidden">
             <EventList />
          </div>
          <div className="md:col-span-2 h-full">
             <ForecastRibbon />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
