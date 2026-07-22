import { createSignal, onMount } from 'solid-js';
import { state, undo, redo, pushHistory } from './store';
import { startRehearsal, stopRehearsal, injectRehearsalDelay, startLiveShow, stopLiveShow } from './clock';
import Timeline from './components/Timeline';
import ResourceMatrix from './components/ResourceMatrix';
import ShowCall from './components/ShowCall';
import DriftContingency from './components/DriftContingency';
import MobileRunway from './components/MobileRunway';
import './webmcp';

export default function App() {
  const [viewMode, setViewMode] = createSignal('desktop');
  const [activeTab, setActiveTab] = createSignal('timeline');
  onMount(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 768) setViewMode('mobile');
      else if (w < 1024) setViewMode('tablet');
      else setViewMode('desktop');
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  });
  return (
    <div class="h-screen w-screen flex flex-col bg-gray-50 overflow-hidden">
      <header class="h-14 bg-gray-900 text-white flex items-center justify-between px-4 shrink-0">
        <h1 class="text-xl font-bold">Live Cue Run-Sheet Director</h1>
        <div class="flex gap-2">
          {state.historyIndex > 0 && <button class="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600" onClick={undo}>Undo</button>}
          {state.historyIndex < state.history.length - 1 && <button class="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600" onClick={redo}>Redo</button>}
        </div>
      </header>
      <div class="flex-1 flex overflow-hidden">
        {viewMode() === 'mobile' ? (
          <MobileRunway />
        ) : (
          <div class="flex-1 flex flex-col">
            <div class="h-12 border-b bg-white flex items-center px-4 gap-4">
              <button class={`px-3 py-1 rounded ${activeTab() === 'timeline' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`} onClick={() => setActiveTab('timeline')}>Timeline</button>
              <button class={`px-3 py-1 rounded ${activeTab() === 'matrix' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`} onClick={() => setActiveTab('matrix')}>Resource Matrix</button>
              <button class={`px-3 py-1 rounded ${activeTab() === 'showcall' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`} onClick={() => setActiveTab('showcall')}>Show Call</button>
              <button class={`px-3 py-1 rounded ${activeTab() === 'drift' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`} onClick={() => setActiveTab('drift')}>Drift & Contingency</button>
            </div>
            <div class="flex-1 relative overflow-auto p-4">
              {activeTab() === 'timeline' && <Timeline />}
              {activeTab() === 'matrix' && <ResourceMatrix />}
              {activeTab() === 'showcall' && <ShowCall />}
              {activeTab() === 'drift' && <DriftContingency />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
