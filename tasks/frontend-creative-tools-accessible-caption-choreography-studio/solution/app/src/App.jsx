import React from 'react';
import Timeline from './components/Timeline';
import Transcript from './components/Transcript';
import Branching from './components/Branching';
import Import from './components/Import';
import Review from './components/Review';
import { exportJSON, exportVTT, exportSRT, exportSVG } from './utils/export';
import { useGlobalState, updateProjectState } from './store';
import './webmcp';

function App() {
  const [project] = useGlobalState('project');

  return (
    <div className="h-screen w-full flex flex-col bg-gray-900 text-white font-sans overflow-hidden">
      {/* Header */}
      <header className="bg-gray-950 border-b border-gray-800 p-3 flex justify-between items-center shrink-0">
         <div>
            <h1 className="text-xl font-bold text-blue-400">Caption Choreography Studio</h1>
         </div>
         <div className="space-x-2">
            <button onClick={() => updateProjectState({ cues: [] })} className="px-3 py-1 bg-red-900/50 hover:bg-red-900 rounded text-sm text-red-200">Reset</button>
            <Import />
            <button onClick={() => exportJSON(project)} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm">JSON</button>
            <button onClick={() => exportVTT(project)} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm">VTT</button>
            <button onClick={() => exportSRT(project)} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm">SRT</button>
            <button onClick={() => exportSVG(project)} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm">SVG</button>
         </div>
      </header>

      {/* Main Workspace - Responsive Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
         {/* Transcript Sidebar - Hidden on small mobile, visible on desktop */}
         <div className="hidden lg:block h-full">
            <Transcript />
         </div>

         {/* Center Column: Timeline & Media */}
         <div className="flex-1 flex flex-col h-full overflow-hidden">
            <Timeline />
            <div className="flex-1 border-b border-gray-700 overflow-y-auto">
               <Review />
            </div>
         </div>

         {/* Right Rail: Inspector & Branching */}
         <div className="hidden lg:block h-full">
            <Branching />
         </div>
      </div>

      {/* Mobile-only tools (visible when transcript/branching are hidden) */}
      <div className="lg:hidden flex border-t border-gray-700 h-64 bg-gray-800 overflow-hidden">
         <div className="flex-1 border-r border-gray-700"><Transcript /></div>
         <div className="flex-1"><Branching /></div>
      </div>
    </div>
  );
}

export default App;
