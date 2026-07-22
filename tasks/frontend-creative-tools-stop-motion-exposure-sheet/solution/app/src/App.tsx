
import { ExposureGrid } from './components/ExposureGrid';
import { Stage } from './components/Stage';
import { CueTrack } from './components/CueTrack';
import { Inspector } from './components/Inspector';
import { ArtifactsPanel } from './components/ArtifactsPanel';
import { useStore } from './store/useStore';

export default function App() {
  const store = useStore();

  return (
    <div className="h-screen w-screen bg-gray-50 flex flex-col p-2 gap-2 overflow-hidden">
      <header className="flex justify-between items-center bg-white border border-gray-200 p-2 rounded shadow-sm shrink-0">
        <h1 className="font-bold text-lg">Stop-Motion Exposure Sheet</h1>
        <div className="flex gap-4 text-sm text-gray-600">
          <div>Frame: <span className="font-mono bg-gray-100 px-1 rounded">{store.currentFrame}</span></div>
          <div>Take: <span className="font-mono bg-gray-100 px-1 rounded">{store.activeTakeId}</span></div>
        </div>
      </header>

      <div className="flex flex-1 gap-2 min-h-0">
        {/* Left column: Stage & Grid */}
        <div className="flex-[3] flex flex-col gap-2 min-w-0">
          <Stage />
          <div className="flex flex-col flex-1 gap-1 min-h-0">
            <CueTrack />
            <ExposureGrid />
          </div>
        </div>

        {/* Right column: Inspector */}
        <div className="flex-1 min-w-[250px] max-w-[350px]">
          <Inspector />
        </div>
      </div>

      <div className="shrink-0">
        <ArtifactsPanel />
      </div>
    </div>
  );
}
