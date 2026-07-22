import { useEffect } from 'react';
import { ArtifactTools } from './components/ArtifactTools';
import { CheckpointsList } from './components/CheckpointsList';
import { ForecastRibbon } from './components/ForecastRibbon';
import { DerivedSummaryPanel } from './components/DerivedSummary';
import { initWebMCP } from './webmcp';

export default function App() {
  useEffect(() => {
    initWebMCP();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden font-sans text-gray-900">
      <ArtifactTools />

      {/* Main Workbench Area */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">

        {/* Left pane: Collection */}
        <div className="w-full md:w-1/3 max-w-sm h-1/2 md:h-full border-r border-gray-200 shadow-sm z-0 relative">
          <CheckpointsList />
        </div>

        {/* Right pane: Forecast Ribbon */}
        <div className="flex-1 h-1/2 md:h-full overflow-y-auto">
          <ForecastRibbon />
        </div>

      </div>

      {/* Bottom pane: Derived Summary */}
      <DerivedSummaryPanel />
    </div>
  );
}
