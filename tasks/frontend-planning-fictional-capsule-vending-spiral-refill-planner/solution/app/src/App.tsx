import { useStore } from './store';
import { Spiral } from './components/Spiral';
import { Tray } from './components/Tray';
import { QueueRibbon } from './components/QueueRibbon';
import { DemandProfile } from './components/DemandProfile';
import { Rehearsal } from './components/Rehearsal';

function App() {
  const store = useStore();

  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col font-sans overflow-hidden">
      <header className="p-4 bg-white border-b shadow-sm flex items-center justify-between shrink-0">
        <h1 className="text-xl font-bold">Fictional Capsule-Vending Spiral Refill Planner</h1>
        <div className="flex gap-4">
            <button onClick={() => store.undo()} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">Undo</button>
            <button onClick={() => store.redo()} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">Redo</button>
            <button onClick={() => (window as any).webmcp_invoke_tool('export_packet', {})} className="px-3 py-1 bg-blue-600 text-white font-bold rounded hover:bg-blue-700">Export ZIP</button>
        </div>
      </header>
      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 border-r border-gray-200 p-4 flex flex-col overflow-y-auto">
          <div className="mb-4 shrink-0">
            <Tray />
          </div>
          <div className="flex flex-col gap-8 pb-8">
            {store.tracks.map(track => (
              <Spiral key={track.trackId} track={track} />
            ))}
          </div>
        </div>
        <div className="w-96 flex flex-col border-l border-gray-200 bg-white shrink-0 overflow-y-auto">
            <div className="p-4 border-b">
               <QueueRibbon />
            </div>
            <div className="p-4 border-b">
               <DemandProfile />
            </div>
            <div className="p-4">
               <Rehearsal />
            </div>
        </div>
      </main>
    </div>
  );
}

export default App;
