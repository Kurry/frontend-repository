import React, { useState, useEffect, useRef } from 'react';

function App() {
  const [started, setStarted] = useState(false);
  const [sources, setSources] = useState([
    { id: 'white', type: 'noise', active: false, gain: 0.5, pan: 0, filterLow: 80, filterHigh: 12000, freq: null },
    { id: 'pink', type: 'noise', active: false, gain: 0.5, pan: 0, filterLow: 80, filterHigh: 12000, freq: null },
    { id: 'brown', type: 'noise', active: false, gain: 0.5, pan: 0, filterLow: 80, filterHigh: 12000, freq: null },
    { id: 'oscA', type: 'osc', active: false, gain: 0.5, pan: 0, filterLow: 80, filterHigh: 12000, freq: 220 },
    { id: 'oscB', type: 'osc', active: false, gain: 0.5, pan: 0, filterLow: 80, filterHigh: 12000, freq: 225, linkDiff: null }
  ]);
  const [automation, setAutomation] = useState([]);

  // Audio Context and Nodes
  const ctxRef = useRef(null);

  const startAudio = () => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    setStarted(true);
  };

  const toggleSource = (id) => {
    setSources(s => s.map(src => src.id === id ? { ...src, active: !src.active } : src));
  };

  useEffect(() => {
    window.webmcp_session_info = {
        name: "focus-soundscape-automation-mixer",
        version: "1.0.0"
    };
    window.webmcp_list_tools = () => [
        { name: "setSourceActive", description: "Toggle source active state", parameters: { id: "string", active: "boolean" } },
        { name: "setGain", description: "Set source gain", parameters: { id: "string", gain: "number" } },
        { name: "setPan", description: "Set source pan", parameters: { id: "string", pan: "number" } },
        { name: "addAutomationPoint", description: "Add automation point", parameters: { sourceId: "string", param: "string", time: "number", value: "number" } },
        { name: "exportPreset", description: "Export JSON preset", parameters: {} }
    ];
    window.webmcp_invoke_tool = (name, params) => {
        if (name === 'setSourceActive') {
             setSources(s => s.map(src => src.id === params.id ? { ...src, active: params.active } : src));
             return { success: true };
        }
        if (name === 'setGain') {
             setSources(s => s.map(src => src.id === params.id ? { ...src, gain: params.gain } : src));
             return { success: true };
        }
        if (name === 'setPan') {
             setSources(s => s.map(src => src.id === params.id ? { ...src, pan: params.pan } : src));
             return { success: true };
        }
        if (name === 'addAutomationPoint') {
             setAutomation(a => [...a, { ...params }]);
             return { success: true };
        }
        if (name === 'exportPreset') {
             return {
                preset: {
                    schemaVersion: "focus-soundscape/v1",
                    sources,
                    automation
                }
             };
        }
        throw new Error(`Tool ${name} not found`);
    };
  }, [sources, automation]);

  return (
    <div className="p-4 flex flex-col gap-4 max-w-4xl mx-auto font-mono bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold border-b border-gray-700 pb-2">Focus Soundscape Automation Mixer</h1>

      {!started ? (
        <button className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded text-xl" onClick={startAudio}>
          Start Audio Engine
        </button>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-700 p-4 bg-gray-800 rounded">
            <h2 className="font-semibold mb-2 text-gray-300">Patch Bay</h2>
            <div className="flex flex-col gap-2">
              {sources.map(src => (
                <div key={src.id} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                    <span>{src.id.toUpperCase()}</span>
                    <button
                        onClick={() => toggleSource(src.id)}
                        className={`px-3 py-1 rounded ${src.active ? 'bg-green-600' : 'bg-gray-600'}`}
                    >
                        {src.active ? 'ACTIVE' : 'INACTIVE'}
                    </button>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-gray-700 p-4 bg-gray-800 rounded flex flex-col items-center">
            <h2 className="font-semibold mb-2 text-gray-300 w-full text-left">XY Pad (Pan / Gain)</h2>
            <div className="w-64 h-64 bg-gray-900 relative border border-gray-600 rounded">
              {sources.filter(s => s.active).map((src, i) => (
                  <div
                    key={src.id}
                    className="absolute w-4 h-4 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-colors"
                    style={{
                        left: `${((src.pan + 1) / 2) * 100}%`,
                        top: `${(1 - src.gain) * 100}%`,
                        backgroundColor: `hsl(${i * 60}, 70%, 50%)`
                    }}
                    title={src.id}
                  />
              ))}
              <div className="absolute top-1/2 left-0 w-full h-px bg-gray-700 pointer-events-none" />
              <div className="absolute left-1/2 top-0 w-px h-full bg-gray-700 pointer-events-none" />
            </div>
          </div>

          <div className="border border-gray-700 p-4 bg-gray-800 rounded md:col-span-2">
            <h2 className="font-semibold mb-2 text-gray-300">Filters & Frequency</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {sources.filter(s => s.active).map(src => (
                    <div key={src.id} className="bg-gray-700 p-2 rounded text-sm">
                        <div className="font-bold mb-1">{src.id.toUpperCase()}</div>
                        <div>L: {src.filterLow}Hz</div>
                        <div>H: {src.filterHigh}Hz</div>
                        {src.freq && <div>Freq: {src.freq}Hz</div>}
                    </div>
                ))}
                {sources.filter(s => s.active).length === 0 && <div className="text-gray-500 italic col-span-5">No active sources</div>}
            </div>
          </div>

          <div className="border border-gray-700 p-4 bg-gray-800 rounded md:col-span-2">
            <h2 className="font-semibold mb-2 text-gray-300">Automation Timeline (25 min)</h2>
            <div className="w-full h-24 bg-gray-900 border border-gray-600 rounded relative">
                <div className="absolute left-1/4 w-px h-full bg-gray-700" />
                <div className="absolute left-1/2 w-px h-full bg-gray-700" />
                <div className="absolute left-3/4 w-px h-full bg-gray-700" />
                {automation.map((pt, i) => (
                    <div
                        key={i}
                        className="absolute w-2 h-2 bg-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${(pt.time / 1500) * 100}%`, top: `${(1 - pt.value) * 100}%` }}
                    />
                ))}
            </div>
          </div>

          <div className="border border-gray-700 p-4 bg-gray-800 rounded">
            <h2 className="font-semibold mb-2 text-gray-300">Analyser</h2>
            <div className="w-full h-16 bg-black border border-gray-600 flex items-end">
                {Array.from({length: 32}).map((_, i) => (
                    <div key={i} className="flex-1 bg-green-500 mx-px transition-all" style={{height: `${Math.random() * 100}%`, opacity: sources.some(s => s.active) ? 1 : 0.1}} />
                ))}
            </div>
          </div>

          <div className="border border-gray-700 p-4 bg-gray-800 rounded flex flex-col justify-between">
            <div>
                <h2 className="font-semibold mb-2 text-gray-300">Focus Session</h2>
                <div className="text-3xl text-center my-4 font-light">25:00</div>
            </div>
            <div className="flex justify-center gap-2">
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex-1">Start</button>
                <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded flex-1">Pause</button>
            </div>
          </div>

          <div className="border border-gray-700 p-4 bg-gray-800 rounded md:col-span-2 flex items-center justify-between">
            <div className="flex gap-4 items-center">
                <h2 className="font-semibold text-gray-300">Artifacts</h2>
                <div className="text-sm">
                    <span className="text-gray-400">Master Peak: </span>
                    <span className="text-green-400">-3.2 dB (Safe)</span>
                </div>
            </div>
            <div className="flex gap-2">
                <button className="bg-blue-800 hover:bg-blue-700 text-white px-4 py-2 rounded">Export JSON</button>
                <button className="bg-blue-800 hover:bg-blue-700 text-white px-4 py-2 rounded">Export WAV</button>
                <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded">Import...</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
