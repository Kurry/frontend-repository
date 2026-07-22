import { LessonBlocksList } from './components/LessonBlocksList';
import { SpatialComposer } from './components/SpatialComposer';
import { ExportImport } from './components/ExportImport';

function App() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-100 font-sans">
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Left Drawer / Panel: Lesson Blocks */}
        <div className="w-full md:w-80 lg:w-96 flex-shrink-0 z-20">
          <LessonBlocksList />
        </div>

        {/* Main Work Surface: Spatial Composer */}
        <div className="flex-1 flex flex-col min-w-0 z-10 border-t md:border-t-0 md:border-l border-slate-200">
          <SpatialComposer />
        </div>
      </div>

      {/* Bottom Panel: Artifact Inspector & Export */}
      <div className="flex-shrink-0 z-30">
        <ExportImport />
      </div>
    </div>
  );
}

export default App;
