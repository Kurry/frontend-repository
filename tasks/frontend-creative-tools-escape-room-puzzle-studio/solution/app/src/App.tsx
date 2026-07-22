import { useState } from 'react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('canvas');

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
            <p className="text-sm text-gray-600 mb-4">Place props within the room. Do not overlap.</p>
            <div className="flex-1 bg-gray-50 border border-gray-300 relative w-full h-full max-w-[900px] max-h-[700px] mx-auto overflow-hidden">
               {/* 90x70 grid */}
               <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
            </div>
          </div>
        )}

        {activeTab === 'graph' && (
          <div className="flex-1 flex flex-col">
            <h2 className="text-xl font-semibold mb-2">Dependency Graph</h2>
            <p className="text-sm text-gray-600 mb-4">Connect Clues, Facts, Items, Actions, and Locks.</p>
            <div className="flex-1 border border-gray-300 bg-gray-50 rounded">
                {/* Graph area */}
            </div>
          </div>
        )}

        {activeTab === 'simulation' && (
          <div className="flex-1 flex flex-col">
             <h2 className="text-xl font-semibold mb-2">Playtest Simulation</h2>
             <p className="text-sm text-gray-600 mb-4">Step through actions and verify constraints.</p>
             <div className="flex gap-4 flex-1">
                <div className="w-1/3 border border-gray-300 rounded p-2">
                    <h3 className="font-semibold mb-2">Available Actions</h3>
                </div>
                <div className="w-1/3 border border-gray-300 rounded p-2">
                    <h3 className="font-semibold mb-2">Inventory & Knowledge</h3>
                </div>
                <div className="w-1/3 border border-gray-300 rounded p-2 bg-gray-800 text-white font-mono text-sm overflow-auto">
                    <h3 className="font-semibold mb-2 border-b border-gray-600 pb-1">Event Log</h3>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="flex-1 flex flex-col">
            <h2 className="text-xl font-semibold mb-4">Export / Import Artifacts</h2>
            <div className="grid grid-cols-2 gap-4 flex-1">
                <div className="border border-gray-300 rounded p-4 flex flex-col">
                    <h3 className="font-semibold mb-2">Export</h3>
                    <div className="flex space-x-2 mb-4">
                        <button className="bg-blue-500 text-white px-3 py-1 rounded">JSON</button>
                        <button className="bg-blue-500 text-white px-3 py-1 rounded">SVG</button>
                        <button className="bg-blue-500 text-white px-3 py-1 rounded">CSV</button>
                        <button className="bg-blue-500 text-white px-3 py-1 rounded">Markdown</button>
                    </div>
                    <textarea className="flex-1 border border-gray-300 rounded p-2 font-mono text-sm" readOnly value="Export preview will appear here..." />
                    <div className="mt-2 flex gap-2">
                        <button className="bg-green-500 text-white px-4 py-2 rounded">Copy to Clipboard</button>
                        <button className="bg-green-500 text-white px-4 py-2 rounded">Download</button>
                    </div>
                </div>
                <div className="border border-gray-300 rounded p-4 flex flex-col">
                    <h3 className="font-semibold mb-2">Import JSON</h3>
                    <textarea className="flex-1 border border-gray-300 rounded p-2 font-mono text-sm mb-2" placeholder="Paste JSON here..." />
                    <button className="bg-purple-500 text-white px-4 py-2 rounded">Import State</button>
                </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
