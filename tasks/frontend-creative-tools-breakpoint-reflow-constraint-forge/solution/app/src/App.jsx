import React from 'react';
import Toolbar from './components/Toolbar';
import Canvas from './components/Canvas';
import Inspector from './components/Inspector';
import ConflictGraph from './components/ConflictGraph';
import RehearsalOverlay from './components/RehearsalOverlay';

export default function App() {
  return (
    <div className="flex flex-col h-screen w-full bg-[#1e1e1e] text-[#cccccc] font-mono overflow-hidden">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden relative">
        <Canvas />
        <RehearsalOverlay />
        <ConflictGraph />
        <Inspector />
      </div>

      {/* Basic dialogs for export/import UI */}
      <dialog id="export-modal" className="p-4 bg-[#252526] text-white border border-[#333] rounded-md backdrop:bg-black/50">
         <h2 className="text-lg font-bold mb-4">Export Layout Contract</h2>
         <button onClick={() => {
           const json = window.webmcp_invoke_tool('artifact_export', {}).result;
           console.log(json);
           alert("Check console for JSON dump");
           document.getElementById('export-modal').close();
         }} className="bg-[#007acc] px-4 py-2 rounded">Dump to Console</button>
         <button onClick={() => document.getElementById('export-modal').close()} className="ml-2 px-4 py-2">Close</button>
      </dialog>

      <dialog id="import-modal" className="p-4 bg-[#252526] text-white border border-[#333] rounded-md backdrop:bg-black/50">
         <h2 className="text-lg font-bold mb-4">Import Layout Contract</h2>
         <textarea className="w-full h-32 bg-[#1e1e1e] border border-[#333] text-xs p-2 mb-4" placeholder="Paste JSON..."></textarea>
         <button onClick={() => document.getElementById('import-modal').close()} className="bg-[#007acc] px-4 py-2 rounded">Import</button>
         <button onClick={() => document.getElementById('import-modal').close()} className="ml-2 px-4 py-2">Cancel</button>
      </dialog>
    </div>
  );
}
