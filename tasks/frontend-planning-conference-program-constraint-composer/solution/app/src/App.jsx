import React, { useState } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Grid } from './components/Grid';
import { Inspector } from './components/Inspector';
import { ExportPanel } from './components/Export';
import { DisruptionsPanel } from './components/Disruptions';
import { useStore } from './store';

function App() {
  const [day, setDay] = useState(1);
  const placeSession = useStore(state => state.placeSession);
  const removePlacement = useStore(state => state.removePlacement);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) {
      if (active.data.current?.placement) {
        removePlacement(active.data.current.session.id);
      }
      return;
    }

    const { roomId, time, day: targetDay } = over.data.current;
    const session = active.data.current.session;
    placeSession(session.id, roomId, targetDay, time);
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex h-screen overflow-hidden flex-col">
        <header className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Conference Program Constraint Composer</h1>
          <div className="flex space-x-2">
            <button className={`px-4 py-1 rounded ${day === 1 ? 'bg-blue-600' : 'bg-slate-700'}`} onClick={() => setDay(1)}>Day 1</button>
            <button className={`px-4 py-1 rounded ${day === 2 ? 'bg-blue-600' : 'bg-slate-700'}`} onClick={() => setDay(2)}>Day 2</button>
          </div>
        </header>
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 flex flex-col relative overflow-hidden">
             <Grid day={day} />
          </main>
          <aside className="w-80 bg-gray-50 border-l flex flex-col h-full">
            <div className="flex-1 overflow-hidden">
               <Inspector />
            </div>
            <DisruptionsPanel />
            <ExportPanel />
          </aside>
        </div>
      </div>
    </DndContext>
  );
}

export default App;
