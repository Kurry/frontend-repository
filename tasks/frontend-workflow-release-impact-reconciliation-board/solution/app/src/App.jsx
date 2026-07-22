import React from 'react';
import { DndContext, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { ReleaseFeed } from './components/ReleaseFeed';
import { ImpactGraph } from './components/ImpactGraph';
import { Timeline } from './components/Timeline';
import { EvidenceInspector } from './components/EvidenceInspector';
import { useStore } from './store';

function App() {
  const mapImpact = useStore(state => state.mapImpact);
  const undo = useStore(state => state.undo);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over) return;

    if (active.data.current?.type === 'entry' && over.data.current?.type === 'surface') {
       const entryId = active.id;
       const surfaceId = over.id;
       mapImpact(entryId, surfaceId, null, null);
    }

    if (active.data.current?.type === 'mapped-entry' && over.data.current?.type === 'timeline') {
        const entryId = active.data.current.entry.id;
        const surfaceId = active.data.current.surfaceId;
        const stageId = over.data.current.stage;

        const canaryPercent = stageId === 'canary' ? 20 : null;
        mapImpact(entryId, surfaceId, stageId, canaryPercent);
    }
  };

  React.useEffect(() => {
      const handleKeyDown = (e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
              if (!e.shiftKey) {
                  undo();
              }
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-screen overflow-hidden">
        <div className="h-14 border-b border-gray-200 bg-white flex items-center px-4 justify-between shrink-0 shadow-sm z-10">
           <h1 className="font-bold text-gray-800">Release Impact Board</h1>
           <div className="flex gap-4 items-center">
              <span className="text-sm font-medium">Risk: 0 High</span>
              <span className="text-sm text-gray-500">Saved Views: 0</span>
           </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <ReleaseFeed />
          <div className="flex-1 flex flex-col h-full relative">
            <ImpactGraph />
            <Timeline />
          </div>
          <EvidenceInspector />
        </div>
      </div>
    </DndContext>
  );
}

export default App;
