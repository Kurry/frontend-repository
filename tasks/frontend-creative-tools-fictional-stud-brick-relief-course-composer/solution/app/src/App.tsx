import { useEffect } from 'react';
import { useStore } from './store/store';
import { initWebMCP } from './lib/webmcp';
import { CourseCanvas } from './components/CourseCanvas';
import { Toolbar } from './components/Toolbar';
import { EvidencePanel } from './components/EvidencePanel';
import { AdvancedViews } from './components/AdvancedViews';

function App() {
  const reset = useStore(state => state.reset);

  useEffect(() => {
    reset(); // Initialize fixture data
    initWebMCP();
  }, [reset]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { viewState, previewMove, bricks, setPreviewMove } = useStore.getState();

      if (e.altKey && viewState.selectedBrickId) {
        const brick = bricks[viewState.selectedBrickId];
        if (brick.locked) return;

        let dx = 0, dy = 0;
        if (e.key === 'ArrowRight') dx = 1;
        if (e.key === 'ArrowLeft') dx = -1;
        if (e.key === 'ArrowDown') dy = 1;
        if (e.key === 'ArrowUp') dy = -1;

        if (dx !== 0 || dy !== 0) {
          e.preventDefault();
          const currX = previewMove?.brickId === brick.id ? previewMove.x : brick.x;
          const currY = previewMove?.brickId === brick.id ? previewMove.y : brick.y;
          setPreviewMove(brick.id, currX + dx, currY + dy);
        }
      }

      if (e.key === 'Escape') {
        useStore.getState().cancelMove();
        useStore.getState().cancelGuideRepair();
      }
      if (e.key === 'Enter') {
        const state = useStore.getState();
        if (state.previewRepair) state.commitGuideRepair();
        else if (state.previewMove) state.commitMove();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-screen bg-gray-100 flex flex-col font-sans overflow-hidden">
      <Toolbar />
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 flex flex-col">
          <div className="flex-1 p-6 overflow-auto flex items-start justify-center">
            <CourseCanvas />
          </div>
          <AdvancedViews />
        </main>
        <EvidencePanel />
      </div>
    </div>
  );
}

export default App;
