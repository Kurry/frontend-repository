import { useStore } from '../store';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { clsx } from 'clsx';
import { useState } from 'react';

export function PassRibbon() {
  const passes = useStore(state => state.passes);
  const inkSources = useStore(state => state.inkSources);
  const reorderPass = useStore(state => state.reorderPass);

  const [proposedOrder, setProposedOrder] = useState<{ id: string, order: number } | null>(null);

  const passList = Object.values(passes).sort((a, b) => a.order - b.order);

  const handleDragEnd = (result: DropResult) => {
    setProposedOrder(null);
    if (!result.destination) return;
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    if (sourceIndex === destinationIndex) return;

    // In our UI, index 0 means order 1
    const passId = passList[sourceIndex].id;
    const newOrder = destinationIndex + 1;
    reorderPass(passId, newOrder);
  };

  const handleDragUpdate = (result: any) => {
      if (!result.destination) {
          setProposedOrder(null);
          return;
      }
      setProposedOrder({ id: passList[result.source.index].id, order: result.destination.index + 1 });
  };

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-bold">Pass Order</h2>
      <DragDropContext onDragEnd={handleDragEnd} onDragUpdate={handleDragUpdate}>
        <Droppable droppableId="pass-list">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="flex flex-col gap-2 relative"
            >
              {passList.map((pass, index) => {
                const ink = inkSources[pass.inkSourceId];
                return (
                  <Draggable key={pass.id} draggableId={pass.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={clsx(
                          "p-3 rounded border shadow-sm flex items-center gap-3 bg-white",
                          snapshot.isDragging ? "ring-2 ring-blue-500 opacity-90 z-50" : "border-gray-200"
                        )}
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.altKey && e.shiftKey) {
                                if (e.key === 'ArrowUp' && index > 0) {
                                    reorderPass(pass.id, index);
                                } else if (e.key === 'ArrowDown' && index < passList.length - 1) {
                                    reorderPass(pass.id, index + 2);
                                }
                            }
                        }}
                      >
                        <div className="font-mono text-gray-500 w-4">{pass.order}</div>
                        <div
                          className="w-6 h-6 rounded-full border border-gray-300"
                          style={{ backgroundColor: ink ? `rgba(${ink.rgb[0]},${ink.rgb[1]},${ink.rgb[2]},${ink.alphaMilli/1000})` : '#ccc' }}
                        />
                        <div className="flex-1 font-medium">{ink?.label || pass.id}</div>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}

              {/* Render ghost insertion slots when dragging */}
              {proposedOrder && (
                  <div
                      className="absolute left-0 right-0 h-1 bg-blue-500 pointer-events-none transition-all"
                      style={{
                          top: `${proposedOrder.order === passList.length ? proposedOrder.order * 52 - 4 : (proposedOrder.order - 1) * 52 - 4}px`,
                          zIndex: 40
                      }}
                  />
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      {proposedOrder && (
          <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded animate-pulse">
              Feed-forward: Move {proposedOrder.id.replace('pass-','')} to position {proposedOrder.order}. ~300 cells will be updated.
          </div>
      )}
      <div className="text-xs text-gray-400 mt-2">Alt+Shift+ArrowUp/Down to reorder via keyboard</div>
    </div>
  );
}
