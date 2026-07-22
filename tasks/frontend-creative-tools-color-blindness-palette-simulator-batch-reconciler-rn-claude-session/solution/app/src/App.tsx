import { useEffect } from "react";
import { SwatchesCollection } from './components/SwatchesCollection';
import { BatchReconciler, DerivedSummary } from './components/BatchReconciler';
import { SessionLedger } from './components/SessionLedger';
import { ArtifactTransfer } from './components/ArtifactTransfer';
import { initWebMCP } from './webmcp';

function App() {
  useEffect(() => {
    initWebMCP();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex flex-col font-sans">
      <header className="mb-6">
        <h1 className="text-3xl font-black tracking-tight text-gray-900">
          Color Blindness Palette Simulator
        </h1>
        <p className="text-gray-600 mt-1">Batch Reconciler Workbench</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        <div className="flex-[2] flex flex-col gap-6">
          <SwatchesCollection />
        </div>

        <div className="flex-1 flex flex-col gap-6">
          <BatchReconciler />
          <DerivedSummary />
          <ArtifactTransfer />
          <div className="flex-1 min-h-[250px]">
            <SessionLedger />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
