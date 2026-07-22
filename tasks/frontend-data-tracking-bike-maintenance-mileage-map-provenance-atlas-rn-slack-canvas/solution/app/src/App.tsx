import { RecordCollection } from './components/RecordCollection';
import { ProvenanceAtlas } from './components/ProvenanceAtlas';
import { ArtifactManager } from './components/ArtifactManager';

function App() {
  return (
    <div className="h-screen w-screen flex flex-col bg-gray-200 font-sans overflow-hidden">
      <ArtifactManager />
      <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
        <div className="w-full md:w-1/2 min-w-[300px]">
          <RecordCollection />
        </div>
        <div className="w-full md:w-1/2 min-w-[300px]">
          <ProvenanceAtlas />
        </div>
      </div>
    </div>
  );
}

export default App;
