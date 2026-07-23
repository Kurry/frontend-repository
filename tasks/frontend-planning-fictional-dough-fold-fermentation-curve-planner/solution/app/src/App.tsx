import { useEffect } from 'react';
import { usePlanStore } from './store';
import { Timeline } from './components/Timeline';
import { CurveChart } from './components/CurveChart';
import { Inspector } from './components/Inspector';
import { DndContext, useSensor, useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';

function App() {
  const store = usePlanStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    // Setup WebMCP
    (window as any).webmcp_session_info = () => ({
      status: "ready",
      session_id: "moonrise-test"
    });

    (window as any).webmcp_list_tools = () => [
      { name: 'editor_select' },
      { name: 'editor_update_property' },
      { name: 'editor_set_content' },
      { name: 'editor_preview' },
      { name: 'entity_select' },
      { name: 'entity_update' },
      { name: 'entity_toggle' },
      { name: 'artifact_export' },
      { name: 'artifact_import' },
      { name: 'artifact_copy' }
    ];

    (window as any).webmcp_invoke_tool = (name: string, args: any) => {
      if (name === 'editor_update_property') {
        if (args.object_type === 'event' && args.property === 'time') {
          const success = usePlanStore.getState().moveEvent(args.object_id, args.value);
          return { success };
        }
      }
      return { error: 'Unknown tool or incomplete mock' };
    };
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const eventId = String(active.id);

    // Very basic coordinate-to-time mapping for the timeline
    // The timeline is 800px wide, representing 300 minutes (08:00 to 13:00)
    // 5 minutes = (5/300) * 800 = 13.33px

    // Determine the active event
    const activeEvent = store.events.find(e => e.id === eventId);
    if (!activeEvent) return;

    // Determine minutes offset
    const minutesDelta = Math.round((delta.x / 800) * 300);

    // Snap to 5-minute increments
    const snappedMinutesDelta = Math.round(minutesDelta / 5) * 5;

    if (snappedMinutesDelta !== 0) {
      const date = new Date(activeEvent.start);
      date.setMinutes(date.getMinutes() + snappedMinutesDelta);
      const newStart = date.toISOString();
      store.moveEvent(eventId, newStart);
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex h-screen bg-[#fdfcfa] text-[#1a1a1a] font-mono overflow-hidden">
        <div className="flex-1 flex flex-col">
          <header className="p-4 border-b border-gray-300 flex justify-between items-center bg-white">
            <div>
              <h1 className="text-xl font-bold">{store.title}</h1>
              <p className="text-sm text-gray-500">Readiness credits are fictional planning units, not culinary advice.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex bg-gray-100 rounded p-1">
                {store.actors.filter(a => a.id !== 'ACT-SYSTEM').map(a => (
                  <button
                    key={a.id}
                    onClick={() => store.setActiveActor(a.id)}
                    className={`px-3 py-1 text-sm rounded ${store.activeActorId === a.id ? 'bg-white shadow font-bold' : 'text-gray-500'}`}
                  >
                    {a.name}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => store.undoActorAction(store.activeActorId)} className="px-3 py-1 border rounded bg-white hover:bg-gray-50 text-sm">Selective Undo</button>
                <button onClick={() => store.redoActorAction(store.activeActorId)} className="px-3 py-1 border rounded bg-white hover:bg-gray-50 text-sm">Selective Redo</button>
              </div>
            </div>
          </header>

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col">
              <Timeline />
              <CurveChart />
            </div>
            <Inspector />
          </div>
        </div>
      </div>
    </DndContext>
  );
}

export default App;
