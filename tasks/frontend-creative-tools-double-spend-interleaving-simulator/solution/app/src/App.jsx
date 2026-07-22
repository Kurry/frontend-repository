import { onMount } from 'solid-js';
import Timeline from './Timeline.jsx';
import AccountCards from './AccountCards.jsx';
import GraphView from './GraphView.jsx';
import ResolutionPanel from './ResolutionPanel.jsx';
import ScenarioCompare from './ScenarioCompare.jsx';
import { registerWebMCP } from './webmcp.js';
import { state, setState } from './store.js';

export default function App() {
  onMount(() => {
    registerWebMCP();
  });

  return (
    <div class="min-h-screen bg-gray-100 p-8 font-sans">
      <header class="mb-8">
        <h1 class="text-3xl font-black tracking-tight text-gray-900">
          Double-Spend Interleaving Simulator
        </h1>
        <p class="text-gray-600 mt-2">
          Drag phases to reorder concurrent transactions. Observe isolation strategies and serialization graphs.
        </p>
      </header>

      <main class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div class="xl:col-span-2 space-y-6">
          <Timeline />
          <AccountCards />

          {/* Simulation Scrubber Controls */}
          <div class="border p-4 rounded-lg bg-white flex items-center gap-4">
             <button
               class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded"
               onClick={() => setState('currentStep', 0)}
             >
               Reset Scrubber
             </button>
             <input
               type="range"
               min="0"
               max="24"
               value={state.currentStep}
               onInput={(e) => setState('currentStep', parseInt(e.target.value, 10))}
               class="flex-1"
             />
             <span class="font-bold w-20">Step {state.currentStep}</span>
          </div>
        </div>

        <div class="space-y-6">
          <ResolutionPanel />
          <GraphView />
          <ScenarioCompare />
        </div>
      </main>
    </div>
  );
}
