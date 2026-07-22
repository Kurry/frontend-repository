import React, { useState, useEffect, useRef } from 'react';

function App() {
  const [started, setStarted] = useState(false);

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

  useEffect(() => {
    window.webmcp_session_info = {};
    window.webmcp_list_tools = () => [];
    window.webmcp_invoke_tool = () => {};
  }, []);

  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Focus Soundscape Automation Mixer</h1>

      {!started ? (
        <button className="bg-blue-500 text-white p-2 rounded" onClick={startAudio}>
          Start Audio
        </button>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="border p-2">
            <h2 className="font-semibold">Patch Bay</h2>
            <div className="flex gap-2">
              {['White', 'Pink', 'Brown', 'Osc A', 'Osc B'].map(src => (
                <div key={src} className="border p-1 text-sm">{src}</div>
              ))}
            </div>
          </div>

          <div className="border p-2">
            <h2 className="font-semibold">XY Pad</h2>
            <div className="w-64 h-64 bg-gray-100 relative border">
              <div className="absolute w-4 h-4 bg-red-500 rounded-full left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="border p-2">
            <h2 className="font-semibold">Filters & Freq</h2>
            <input type="range" min="80" max="12000" />
          </div>

          <div className="border p-2">
            <h2 className="font-semibold">Automation Timeline</h2>
            <div className="w-full h-12 bg-gray-200"></div>
          </div>

          <div className="border p-2">
            <h2 className="font-semibold">Analyser</h2>
            <div className="w-full h-16 bg-black text-green-500 text-xs">Live Spectrum</div>
          </div>

          <div className="border p-2">
            <h2 className="font-semibold">Safety Guard</h2>
            <div>Peak: 0.5 - Safe</div>
          </div>

          <div className="border p-2">
            <h2 className="font-semibold">Focus Session</h2>
            <button className="bg-green-500 text-white p-1 rounded">Start 25m Focus</button>
            <button className="bg-yellow-500 text-white p-1 rounded ml-2">Pause/Interrupt</button>
          </div>

          <div className="border p-2">
            <h2 className="font-semibold">Artifacts</h2>
            <button className="bg-gray-300 p-1 rounded">Export JSON</button>
            <button className="bg-gray-300 p-1 rounded ml-2">Export WAV</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
