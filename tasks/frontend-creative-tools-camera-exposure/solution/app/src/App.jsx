import { createSignal, createEffect } from 'solid-js';
import { store, setStore } from './store';
import MeterLab from './MeterLab';
import PresetsCompare from './PresetsCompare';
import HelpPanel from './HelpPanel';

function App() {
  const [mode, setMode] = createSignal("Meter/Lab");

  createEffect(() => {
    // Keep internal mode in sync
    setStore('mode', mode());
  });

  return (
    <div class="flex flex-col h-screen w-screen bg-black text-white overflow-hidden font-sans">
      <header class="flex justify-between items-center p-4 z-50 bg-black/50 backdrop-blur-md">
        <div class="text-xl font-bold tracking-tight brand-chip">Camera Exposure Simulator</div>
        <div class="flex items-center space-x-4">
          <div class="flex bg-gray-800 rounded-full p-1" role="group" aria-label="Mode Switch">
            <button
              class={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${mode() === 'Meter/Lab' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setMode('Meter/Lab')}
            >
              Meter/Lab
            </button>
            <button
              class={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${mode() === 'Presets/Compare' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setMode('Presets/Compare')}
            >
              Presets/Compare
            </button>
          </div>
          <HelpPanel />
        </div>
      </header>

      <main class="flex-1 relative overflow-hidden">
        {mode() === 'Meter/Lab' ? <MeterLab /> : <PresetsCompare />}
      </main>
    </div>
  );
}

export default App;
