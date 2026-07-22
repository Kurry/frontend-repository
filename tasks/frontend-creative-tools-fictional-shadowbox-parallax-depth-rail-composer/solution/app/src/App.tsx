import { useEffect } from 'react';
import { useStore } from './store';
import { PerspectiveStage } from './components/PerspectiveStage';
import { DepthRail } from './components/DepthRail';
import { EvidencePanels } from './components/EvidencePanels';
import { ComparisonReview } from './components/ComparisonReview';
import { exportPacket } from './io';

function App() {
  const { initFixture, viewerOffset, setViewerOffset } = useStore();

  useEffect(() => {
    initFixture();
  }, [initFixture]);

  const handleExport = () => {
    const storeData = useStore.getState();
    exportPacket(storeData);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-200">
      <header className="bg-white shadow px-6 py-3 flex justify-between items-center z-10">
        <h1 className="text-lg font-bold">Fictional Shadowbox Parallax Depth-Rail Composer</h1>
        <div className="flex gap-4 items-center">
          <label className="text-sm font-mono flex items-center gap-2">
            Viewer Stop:
            <input
              type="range"
              min="-40"
              max="40"
              step="5"
              value={viewerOffset}
              onChange={(e) => setViewerOffset(Number(e.target.value))}
            />
            <span>{viewerOffset}</span>
          </label>
          <button className="px-3 py-1 bg-indigo-600 text-white text-sm" onClick={handleExport}>Export Packet</button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col relative">
          <PerspectiveStage />
          <DepthRail />
        </div>
        <aside className="w-80 flex-shrink-0 bg-white shadow-xl z-20">
          <EvidencePanels />
        </aside>
      </main>

      <ComparisonReview />
    </div>
  );
}

export default App;
