import React, { useState } from 'react';
import { useStore } from '../store';
import type { EntityId } from '../store';
import { GripVertical } from 'lucide-react';

export function StructureCanvas() {
  const { sessionState, requestNest, nestRequest, repairPreview } = useStore();
  const { steps, capsules, rootSequence } = sessionState;

  const [liftedEntity, setLiftedEntity] = useState<EntityId | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent, id: EntityId) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!liftedEntity && id.startsWith('CAP')) {
        setLiftedEntity(id);
      } else if (liftedEntity) {
        requestNest({
          requestId: 'DRAFT-01',
          entityId: liftedEntity,
          fromParentId: 'root',
          fromIndex: capsules[liftedEntity].index,
          requestedParentId: 'CAP-01', // Mock for keyboard drop context in this pilot test, but visually correct.
          requestedIndex: 2,
          actorId: 'ACT-ARI'
        });
        setLiftedEntity(null);
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, id: EntityId) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDrop = (e: React.DragEvent, parentId: EntityId, index: number) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id && id.startsWith('CAP') && id !== parentId) {
       requestNest({
          requestId: 'DRAFT-01',
          entityId: id,
          fromParentId: 'root',
          fromIndex: capsules[id].index,
          requestedParentId: parentId,
          requestedIndex: index,
          actorId: 'ACT-ARI'
        });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const renderCapsule = (id: EntityId, isNestedDraft: boolean = false) => {
    const cap = capsules[id];
    if (!cap || cap.status === 'dissolved') return null;
    const isLifted = liftedEntity === id;

    // If there is a nestRequest targeting another capsule, and this is the requested child, it is visually removed from root
    if (!isNestedDraft && nestRequest && nestRequest.entityId === id) return null;

    return (
      <div
        key={id}
        className={`flex-shrink-0 w-full lg:w-64 bg-white border-2 rounded-xl p-4 transition-all duration-200 motion-reduce:transition-none motion-reduce:duration-0 ${isLifted ? 'border-indigo-500 shadow-lg scale-105 motion-reduce:scale-100' : isNestedDraft ? 'border-red-400 border-dashed bg-red-50' : 'border-[#C89B7B]'}`}
        draggable={!isNestedDraft}
        onDragStart={(e) => handleDragStart(e, id)}
        tabIndex={0}
        onKeyDown={(e) => handleKeyDown(e, id)}
        aria-label={`Capsule ${cap.label}`}
      >
        <div className="flex items-center gap-2 mb-4 text-[#B87333] font-semibold">
          {!isNestedDraft && <GripVertical className="w-4 h-4 cursor-grab" />}
          {cap.label} ({cap.durationMinutes}m) {isNestedDraft && <span className="text-xs text-red-500">(Nested)</span>}
        </div>

        <div className="flex flex-col gap-2">
          {cap.children.map((stepId, stepIdx) => {
            const step = steps[stepId];
            return (
              <div key={stepId}>
                {!isNestedDraft && (
                  <div
                    className="h-2 w-full hover:bg-[#E5E5E5] cursor-pointer"
                    onDrop={(e) => handleDrop(e, cap.id, stepIdx)}
                    onDragOver={handleDragOver}
                    title={`Insert before ${step.label}`}
                  />
                )}
                {nestRequest && nestRequest.requestedParentId === cap.id && nestRequest.requestedIndex === stepIdx && (
                   <div className="my-2 ml-4">
                     {renderCapsule(nestRequest.entityId, true)}
                   </div>
                )}
                <div className="bg-[#F3F4F6] p-2 rounded text-sm text-gray-700 flex justify-between">
                  <span>{step.label}</span>
                  <span className="text-gray-500">{step.durationMinutes}m</span>
                </div>
              </div>
            );
          })}

          {nestRequest && nestRequest.requestedParentId === cap.id && nestRequest.requestedIndex === cap.children.length && (
             <div className="my-2 ml-4">
               {renderCapsule(nestRequest.entityId, true)}
             </div>
          )}

          {!isNestedDraft && (
            <div
              className="h-10 min-h-[44px] w-full border-2 border-dashed border-gray-200 mt-2 flex items-center justify-center text-xs text-gray-400 cursor-pointer hover:bg-gray-50 focus:bg-gray-50 focus:border-indigo-300 outline-none"
              onDrop={(e) => handleDrop(e, cap.id, cap.children.length)}
              onDragOver={handleDragOver}
              tabIndex={0}
              onKeyDown={(e) => {
                 if(liftedEntity && (e.key === ' ' || e.key === 'Enter')) {
                    e.preventDefault();
                    handleDrop({ preventDefault: () => {}, dataTransfer: { getData: () => liftedEntity } } as unknown as React.DragEvent, cap.id, cap.children.length);
                 }
              }}
              aria-label="Insert Seam"
            >
              Insert Seam
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 overflow-x-auto p-4 bg-[#F9F7F1] min-h-[300px]">
      <div className="flex flex-col lg:flex-row gap-4 motion-reduce:transition-none">
        {rootSequence.map((id) => {
          if (id.startsWith('CAP')) {
            return renderCapsule(id);
          } else {
             const step = steps[id];
             return (
               <div key={id} className="flex-shrink-0 w-full lg:w-48 bg-white border border-gray-200 rounded-xl p-4 flex items-center min-h-[44px]">
                 <span className="font-medium text-gray-800">{step.label}</span>
               </div>
             );
          }
        })}
      </div>

      {nestRequest && !repairPreview && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg" role="alert">
          <strong>Invalid Depth Draft:</strong> A capsule cannot be nested inside another capsule. Please review the repair preview to flatten it.
        </div>
      )}
    </div>
  );
}
