import ExportImport from './components/ExportImport';
import SemanticLane from './components/SemanticLane';
import Stage from './components/Stage';
import Inspector from './components/Inspector';
import Timeline from './components/Timeline';

export default function App() {
  return (
    <div class="h-screen w-screen flex flex-col overflow-hidden bg-neutral-200">
      <ExportImport />
      <SemanticLane />
      <div class="flex-1 flex overflow-hidden">
        <div class="flex-1 flex flex-col p-4 gap-4">
          <Stage />
          <Timeline />
        </div>
        <Inspector />
      </div>
    </div>
  );
}
