import { DrumGrid } from './components/DrumGrid';
import { RecoveryBoard } from './components/RecoveryBoard';
import { PortableArtifact } from './components/PortableArtifact';
import { WebMCP } from './WebMCP';

function App() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="flex justify-between items-center p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white tracking-tight">Practice Board</h1>
        <div className="flex gap-4 items-center">
          <RecoveryBoard />
          <div className="w-px h-6 bg-gray-800" />
          <PortableArtifact />
        </div>
      </div>
      <div className="flex-1">
        <DrumGrid /><WebMCP />
      </div>
    </div>
  );
}

export default App;
