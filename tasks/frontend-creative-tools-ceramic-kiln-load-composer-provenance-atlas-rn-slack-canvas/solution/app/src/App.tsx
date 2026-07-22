import { KilnPieces } from './components/KilnPieces';
import { ProvenanceAtlas } from './components/ProvenanceAtlas';
import { ArtifactManager } from './components/ArtifactManager';

function App() {
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-[var(--color-kiln-empty)]">
      <ArtifactManager />
      <div className="flex flex-col lg:flex-row flex-grow overflow-hidden">
        <KilnPieces />
        <ProvenanceAtlas />
      </div>
    </div>
  );
}

export default App;
