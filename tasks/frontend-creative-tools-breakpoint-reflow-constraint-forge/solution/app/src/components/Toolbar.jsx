import React from 'react';
import { useStore } from '../store';
import { Monitor, Tablet, Smartphone, Play, SplitSquareHorizontal, Download, Upload } from 'lucide-react';

export default function Toolbar() {
  const { activeMode, setActiveMode, viewportWidth, setViewportWidth } = useStore();

  const handleScrub = (e) => {
    setViewportWidth(Number(e.target.value));

    // Auto-switch mode based on viewport
    const width = Number(e.target.value);
    if (width >= 1024 && activeMode !== 'desktop') setActiveMode('desktop');
    else if (width >= 600 && width < 1024 && activeMode !== 'tablet') setActiveMode('tablet');
    else if (width < 600 && activeMode !== 'mobile') setActiveMode('mobile');
  };

  const setBreakpoint = (mode, width) => {
    setActiveMode(mode);
    setViewportWidth(width);
  };

  return (
    <div className="flex items-center justify-between p-4 bg-[#252526] border-b border-[#333333]">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold mr-4 text-white">Constraint Forge</h1>

        <div className="flex bg-[#1e1e1e] rounded-md overflow-hidden border border-[#333333]">
          <button
            className={`p-2 px-3 flex items-center gap-2 ${activeMode === 'desktop' ? 'bg-[#007acc] text-white' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setBreakpoint('desktop', 1440)}
          >
            <Monitor size={16} /> Desktop
          </button>
          <button
            className={`p-2 px-3 flex items-center gap-2 ${activeMode === 'tablet' ? 'bg-[#007acc] text-white' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setBreakpoint('tablet', 768)}
          >
            <Tablet size={16} /> Tablet
          </button>
          <button
            className={`p-2 px-3 flex items-center gap-2 ${activeMode === 'mobile' ? 'bg-[#007acc] text-white' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setBreakpoint('mobile', 375)}
          >
            <Smartphone size={16} /> Mobile
          </button>
        </div>

        <div className="flex items-center gap-2 bg-[#1e1e1e] px-4 py-2 rounded-md border border-[#333333] w-64">
          <span className="text-xs text-gray-400 w-8">{viewportWidth}px</span>
          <input
            type="range"
            min="320"
            max="1440"
            value={viewportWidth}
            onChange={handleScrub}
            className="flex-1 cursor-pointer accent-[#007acc]"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          className={`p-2 flex items-center gap-2 rounded-md border border-[#333333] ${activeMode === 'rehearsal' ? 'bg-[#007acc] text-white' : 'bg-[#1e1e1e] text-gray-400 hover:text-white'}`}
          onClick={() => setActiveMode('rehearsal')}
          title="Rehearsal Mode"
        >
          <Play size={16} />
        </button>
        <button
          className={`p-2 flex items-center gap-2 rounded-md border border-[#333333] ${activeMode === 'compare' ? 'bg-[#007acc] text-white' : 'bg-[#1e1e1e] text-gray-400 hover:text-white'}`}
          onClick={() => setActiveMode('compare')}
          title="Compare Strategy"
        >
          <SplitSquareHorizontal size={16} />
        </button>
        <div className="w-px h-6 bg-[#333] mx-2"></div>
        <button
          className="px-3 py-1.5 flex items-center gap-2 rounded-md bg-[#1e1e1e] text-gray-300 border border-[#333333] hover:bg-[#333]"
          onClick={() => window.document.getElementById('export-modal')?.showModal()}
        >
          <Download size={14} /> Export
        </button>
        <button
          className="px-3 py-1.5 flex items-center gap-2 rounded-md bg-[#1e1e1e] text-gray-300 border border-[#333333] hover:bg-[#333]"
          onClick={() => window.document.getElementById('import-modal')?.showModal()}
        >
          <Upload size={14} /> Import
        </button>
      </div>
    </div>
  );
}
