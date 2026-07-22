import React from 'react';
import { CalendarCanvas } from './components/CalendarCanvas';
import { WaitlistLattice } from './components/WaitlistLattice';
import { DroppableGapArea } from './components/DroppableGap';
import { RepairPreview } from './components/RepairPreview';
import { ResourceStrips } from './components/ResourceStrips';
import { OfferClock } from './components/OfferClock';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { useStore } from './store';
import { ExportImportTools } from './components/ExportImportTools';

function App() {
  const { previewWeave } = useStore();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && over.id === 'GAP-04' && active.id === 'WL-07') {
      previewWeave('GAP-04', 'WL-07', 'BENCH-B');
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-gray-100 text-gray-900 p-6 font-sans">
        <header className="mb-6 flex justify-between items-end border-b border-gray-300 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">LANTERN-PRINT-DAY-01</h1>
            <p className="text-sm text-gray-500">2027-04-17 • America/Detroit</p>
          </div>
          <div className="flex gap-4">
            <ExportImportTools />
            <OfferClock />
          </div>
        </header>

        <main className="flex gap-6 relative">
          <WaitlistLattice />

          <DroppableGapArea>
            <div className="flex flex-col gap-6 w-full">
              <CalendarCanvas />
              <ResourceStrips />
            </div>

            <RepairPreview />
          </DroppableGapArea>
        </main>
      </div>
    </DndContext>
  );
}

export default App;
