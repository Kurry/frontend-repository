import { useEffect, useState } from 'react';
import { PlantCollection } from './PlantCollection';
import { BatchReconciler } from './BatchReconciler';
import { ArtifactTransfer } from './ArtifactTransfer';
import { setupWebMCP } from './webmcp';

function App() {
  useEffect(() => {
    setupWebMCP();
  }, []);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold underline text-primary">
          Indoor Plant Growth Journal
        </h1>
        <p className="text-muted-foreground mt-2">Manage plant observations and reconcile batches.</p>
      </header>

      <div className="grid gap-6">
        <BatchReconciler selectedIds={selectedIds} clearSelection={clearSelection} />
        <PlantCollection selectedIds={selectedIds} onToggleSelect={handleToggleSelect} />
        <ArtifactTransfer />
      </div>
    </div>
  );
}

export default App;
