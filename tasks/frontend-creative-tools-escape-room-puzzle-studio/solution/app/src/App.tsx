import { useState } from 'react';
import './App.css';
import { useStore } from './store';

function App() {
  const [activeTab, setActiveTab] = useState('canvas');
  const store = useStore();

  const handleExport = () => {
    const json = JSON.stringify({ props: store.props, nodes: store.nodes, edges: store.edges, events: store.events }, null, 2);
    return json;
  };

  const handleImport = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      store.importState(data);
    } catch (e) {
      alert("Invalid JSON");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Escape Room Puzzle Studio</h1>
        <div className="flex space-x-2 mt-4 border-b border-gray-300">
          <button
            className={`px-4 py-2 ${activeTab === 'canvas' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
            onClick={() => setActiveTab('canvas')}
          >
            Canvas
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'graph' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
            onClick={() => setActiveTab('graph')}
          >
            Dependency Graph
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'simulation' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
            onClick={() => setActiveTab('simulation')}
          >
            Playtest Simulation
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'export' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
            onClick={() => setActiveTab('export')}
          >
            Export / Import
          </button>
        </div>
      </header>

      <main className="bg-white p-4 shadow rounded-lg h-[80vh] flex flex-col">
        {activeTab === 'canvas' && (
          <div className="flex-1 flex flex-col">
            <h2 className="text-xl font-semibold mb-2">Room Layout (9x7m)</h2>
            <div className="mb-2 flex gap-2">
                <button
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                  onClick={() => store.addProp({ id: 'p' + Date.now(), x: 0, y: 0, width: 10, height: 10, name: 'Prop' })}
                >
                  Add Prop
                </button>
            </div>
            <div className="flex-1 bg-gray-50 border border-gray-300 relative w-[900px] h-[700px] overflow-hidden" id="canvas-area">
               <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
               {store.props.map(p => (
                 <div key={p.id} style={{ position: 'absolute', left: p.x * 10, top: p.y * 10, width: p.width * 10, height: p.height * 10 }} className="bg-amber-700/80 border-2 border-amber-900 cursor-pointer flex items-center justify-center text-white text-xs">
                    {p.name}
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === 'graph' && (
          <div className="flex-1 flex flex-col">
            <h2 className="text-xl font-semibold mb-2">Dependency Graph</h2>
            <div className="mb-2 flex gap-2">
                <button className="bg-blue-500 text-white px-2 py-1 rounded" onClick={() => store.addNode({ id: 'n' + Date.now(), type: 'clue', label: 'Clue' })}>Add Node</button>
            </div>
            <div className="flex-1 border border-gray-300 bg-gray-50 rounded p-4 flex gap-4 flex-wrap content-start">
                {store.nodes.map(n => (
                    <div key={n.id} className="bg-white border border-gray-400 p-2 rounded shadow-sm w-32 text-center text-sm">{n.label} ({n.type})</div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'simulation' && (
          <div className="flex-1 flex flex-col">
             <h2 className="text-xl font-semibold mb-2">Playtest Simulation</h2>
             <div className="flex gap-4 flex-1">
                <div className="w-1/3 border border-gray-300 rounded p-2 flex flex-col">
                    <h3 className="font-semibold mb-2">Available Actions</h3>
                    <div className="flex-1 overflow-auto">
                        {store.nodes.filter(n => n.type === 'action').map(n => (
                            <button key={n.id} className="block w-full text-left p-2 hover:bg-gray-100 border-b">{n.label}</button>
                        ))}
                    </div>
                </div>
                <div className="w-1/3 border border-gray-300 rounded p-2">
                    <h3 className="font-semibold mb-2">Inventory & Knowledge</h3>
                </div>
                <div className="w-1/3 border border-gray-300 rounded p-2 bg-gray-800 text-white font-mono text-sm overflow-auto">
                    <h3 className="font-semibold mb-2 border-b border-gray-600 pb-1">Event Log</h3>
                    {store.events.map(e => <div key={e.id}>- {e.actionId}</div>)}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="flex-1 flex flex-col">
            <h2 className="text-xl font-semibold mb-4">Export / Import Artifacts</h2>
            <div className="grid grid-cols-2 gap-4 flex-1">
                <div className="border border-gray-300 rounded p-4 flex flex-col">
                    <h3 className="font-semibold mb-2">Export JSON</h3>
                    <textarea className="flex-1 border border-gray-300 rounded p-2 font-mono text-sm" readOnly value={handleExport()} />
                </div>
                <div className="border border-gray-300 rounded p-4 flex flex-col">
                    <h3 className="font-semibold mb-2">Import JSON</h3>
                    <textarea id="import-json" className="flex-1 border border-gray-300 rounded p-2 font-mono text-sm mb-2" placeholder="Paste JSON here..." />
                    <button className="bg-purple-500 text-white px-4 py-2 rounded" onClick={() => handleImport((document.getElementById('import-json') as HTMLTextAreaElement).value)}>Import State</button>
                </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
