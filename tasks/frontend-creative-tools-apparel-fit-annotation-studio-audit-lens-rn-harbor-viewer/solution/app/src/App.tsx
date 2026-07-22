import { useEffect, useState } from 'react';
import { FitAnnotations } from './components/FitAnnotations';
import { AuditLens } from './components/AuditLens';
import { ArtifactManager } from './components/ArtifactManager';
import { registerWebMCP } from './webmcp';

function App() {
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  useEffect(() => {
    registerWebMCP();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6 lg:p-8 flex flex-col font-sans">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Apparel Fit Annotation Studio</h1>
          <p className="text-sm text-gray-500 mt-1">Audit Lens • Job Viewer</p>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0">
        <div className="md:col-span-4 lg:col-span-3 flex flex-col min-h-0 h-[600px] md:h-auto">
          <FitAnnotations onSelectRecord={setSelectedRecordId} />
        </div>

        <div className="md:col-span-8 lg:col-span-6 flex flex-col min-h-0 h-[600px] md:h-auto">
          <AuditLens
            selectedId={selectedRecordId}
            onClose={() => setSelectedRecordId(null)}
          />
        </div>

        <div className="md:col-span-12 lg:col-span-3 flex flex-col min-h-0 h-[500px] md:h-auto">
          <ArtifactManager />
        </div>
      </main>
    </div>
  );
}

export default App;
