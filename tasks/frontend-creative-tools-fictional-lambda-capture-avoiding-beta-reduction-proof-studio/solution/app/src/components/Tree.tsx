import React, { useState } from 'react';
import { useLambdaStore } from '../store';
import { DndContext, useDraggable, useDroppable, DragEndEvent, DragMoveEvent } from '@dnd-kit/core';

export const Tree = () => {
  const nodes = useLambdaStore(state => state.nodes);
  const phase = useLambdaStore(state => state.phase);
  const setDragOverScope = useLambdaStore(state => state.setDragOverScope);
  const confirmBetaReduction = useLambdaStore(state => state.confirmBetaReduction);
  const cancelBetaReduction = useLambdaStore(state => state.cancelBetaReduction);
  const setPreviewFreshName = useLambdaStore(state => state.setPreviewFreshName);

  const [showWheel, setShowWheel] = useState(false);

  const handleDragMove = (e: DragMoveEvent) => {
    if (e.over?.id === 'membrane-BINDER-Y') {
      setDragOverScope('BINDER-Y');
      setShowWheel(true);
    } else {
      setDragOverScope(null);
    }
  };

  const handleDragEnd = (e: DragEndEvent) => {
    if (e.over?.id === 'VAR-X') {
      if (showWheel) {
          // Open confirm dialog
      } else {
          confirmBetaReduction(); // naive capture or normal
      }
    }
  };

  const handleZClick = () => {
    setPreviewFreshName('z');
  };

  const isInvalid = phase === 'Invalid';

  return (
    <DndContext onDragMove={handleDragMove} onDragEnd={handleDragEnd}>
      <div className="relative w-full h-[600px] border rounded bg-slate-50 flex items-center justify-center p-8 overflow-hidden">
        {/* Render Tree Graphically */}
        <div className="flex flex-col items-center gap-4 relative">

          {nodes['APP-ROOT']?.active && (
            <div className="flex flex-col items-center">
              <div className="font-bold border p-2 bg-white rounded">APP-ROOT</div>
              <div className="flex gap-16 mt-4 relative">
                {nodes['ABS-X']?.active && (
                  <div className="flex flex-col items-center border p-4 bg-blue-100 rounded-lg">
                    <span className="font-bold text-blue-800">{nodes['ABS-X'].displayName}</span>
                    <div className="mt-4 border p-4 bg-green-100 rounded-lg relative" id="membrane-BINDER-Y-container">
                      <MembraneDroppable id="membrane-BINDER-Y" />
                      <span className="font-bold text-green-800">{nodes['ABS-INNER'].displayName}</span>
                      <div className="mt-4 border p-4 bg-white rounded">
                        <div className="font-bold mb-2">APP-INNER</div>
                        <div className="flex gap-4">
                           {nodes['VAR-X']?.active && <SlotDroppable id="VAR-X" label={nodes['VAR-X'].displayName || ''} />}
                           {nodes['VAR-INNER-Y']?.active && <div className="border p-2 bg-gray-100 rounded text-green-800">{nodes['VAR-INNER-Y'].displayName}</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {nodes['VAR-ARG-Y']?.active && nodes['VAR-ARG-Y'].parentId === 'APP-ROOT' && (
                  <DraggableVar id="VAR-ARG-Y" label={nodes['VAR-ARG-Y'].displayName || ''} />
                )}
              </div>
            </div>
          )}

          {phase === 'Proof' && (
            <div className="flex flex-col items-center border p-4 bg-green-100 rounded-lg">
              <span className="font-bold text-green-800">{nodes['ABS-INNER']?.displayName}</span>
              <div className="mt-4 border p-4 bg-white rounded">
                <div className="font-bold mb-2">APP-INNER</div>
                <div className="flex gap-4">
                   <div className="border p-2 bg-gray-100 rounded text-black">{nodes['VAR-ARG-Y']?.displayName}</div>
                   <div className="border p-2 bg-gray-100 rounded text-green-800">{nodes['VAR-INNER-Y']?.displayName}</div>
                </div>
              </div>
            </div>
          )}

        </div>

        {isInvalid && (
           <div className="absolute inset-0 bg-red-100/80 flex items-center justify-center text-red-800 font-bold text-xl pointer-events-none">
             capture detected · zero durable mutation
           </div>
        )}

        {showWheel && phase === 'Draft' && (
          <div className="absolute top-1/4 right-1/4 bg-white p-4 shadow-xl border rounded z-50">
            <h3 className="font-bold text-red-600 mb-2">Capture Risk!</h3>
            <p className="text-sm mb-4">Choose fresh name for BINDER-Y</p>
            <div className="flex gap-2">
              {['z', 'w', 'v', 'u', 't', 's'].map(name => (
                <button key={name} onClick={() => { handleZClick(); confirmBetaReduction(); setShowWheel(false); }} className="px-3 py-1 bg-slate-200 hover:bg-slate-300 rounded">
                  {name}
                </button>
              ))}
            </div>
            <button onClick={() => { cancelBetaReduction(); setShowWheel(false); }} className="mt-4 text-sm text-gray-500 underline">Cancel</button>
          </div>
        )}

      </div>
    </DndContext>
  );
};

const DraggableVar = ({ id, label }: { id: string, label: string }) => {
  const {attributes, listeners, setNodeRef, transform} = useDraggable({
    id,
  });
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="border p-4 bg-yellow-200 rounded shadow cursor-grab active:cursor-grabbing font-bold z-10">
      {label}
    </div>
  );
}

const SlotDroppable = ({ id, label }: { id: string, label: string }) => {
  const {isOver, setNodeRef} = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`border-2 p-2 rounded ${isOver ? 'border-blue-500 bg-blue-50' : 'border-dashed border-gray-400 bg-gray-50'} text-blue-800`}>
      {label}
    </div>
  );
}

const MembraneDroppable = ({ id }: { id: string }) => {
  const {isOver, setNodeRef} = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`absolute -inset-2 border-2 rounded-xl pointer-events-none ${isOver ? 'border-red-500 bg-red-500/10' : 'border-transparent'}`} />
  );
}
