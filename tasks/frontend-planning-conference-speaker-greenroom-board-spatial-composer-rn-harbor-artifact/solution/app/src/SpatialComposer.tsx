import React, { useRef, useState } from 'react';
import { SpeakerSlotRecord } from './types';

export default function SpatialComposer({
  records,
  selectedId,
  onSelect,
  onMutate
}: {
  records: SpeakerSlotRecord[],
  selectedId: string | null,
  onSelect: (id: string) => void,
  onMutate: (id: string, payload: Partial<SpeakerSlotRecord['spatialComposerState']> & { status?: SpeakerSlotRecord['status'] }) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-auto bg-slate-100 p-8">
      <div className="absolute inset-0 grid grid-cols-[repeat(40,100px)] grid-rows-[repeat(40,100px)] opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)', backgroundSize: '100px 100px' }} />

      {records.map(record => (
        <ComposerNode
          key={record.id}
          record={record}
          isSelected={selectedId === record.id}
          onSelect={() => onSelect(record.id)}
          onMutate={(payload) => onMutate(record.id, payload)}
        />
      ))}
    </div>
  );
}

function ComposerNode({ record, isSelected, onSelect, onMutate }: { record: SpeakerSlotRecord, isSelected: boolean, onSelect: () => void, onMutate: (payload: any) => void }) {
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    onSelect();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = record.spatialComposerState.x;
    const initialY = record.spatialComposerState.y;

    const onPointerMove = (moveEvent: PointerEvent) => {
      setIsDragging(true);
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      onMutate({
        x: Math.max(0, initialX + dx),
        y: Math.max(0, initialY + dy),
        status: 'changed'
      });
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      setIsDragging(false);
      target.releasePointerCapture(upEvent.pointerId);
      target.removeEventListener('pointermove', onPointerMove);
      target.removeEventListener('pointerup', onPointerUp);
    };

    target.addEventListener('pointermove', onPointerMove);
    target.addEventListener('pointerup', onPointerUp);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isSelected) return;
    const step = e.shiftKey ? 40 : 10;

    switch(e.key) {
      case 'ArrowUp':
        e.preventDefault();
        onMutate({ y: Math.max(0, record.spatialComposerState.y - step), status: 'changed' });
        break;
      case 'ArrowDown':
        e.preventDefault();
        onMutate({ y: record.spatialComposerState.y + step, status: 'changed' });
        break;
      case 'ArrowLeft':
        e.preventDefault();
        onMutate({ x: Math.max(0, record.spatialComposerState.x - step), status: 'changed' });
        break;
      case 'ArrowRight':
        e.preventDefault();
        onMutate({ x: record.spatialComposerState.x + step, status: 'changed' });
        break;
      case '+':
      case '=':
        e.preventDefault();
        onMutate({ capacity: Math.min(500, record.spatialComposerState.capacity + 10), status: 'changed' });
        break;
      case '-':
      case '_':
        e.preventDefault();
        onMutate({ capacity: Math.max(0, record.spatialComposerState.capacity - 10), status: 'changed' });
        break;
    }
  };

  return (
    <div
      data-testid={`node-${record.id}`}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      className={`absolute flex flex-col items-center justify-center p-2 rounded shadow-sm border transition-shadow outline-none
        ${isSelected ? 'ring-2 ring-blue-500 shadow-md z-20' : 'hover:shadow-md z-10'}
        ${isDragging ? 'opacity-80 cursor-grabbing' : 'cursor-grab'}
        ${
          record.status === 'ready' ? 'bg-green-100 border-green-300 text-green-900' :
          record.status === 'changed' ? 'bg-yellow-100 border-yellow-300 text-yellow-900' :
          record.status === 'draft' ? 'bg-white border-slate-300 text-slate-800' :
          record.status === 'archived' ? 'bg-slate-200 border-slate-300 text-slate-500' :
          'bg-red-50 border-red-300 text-red-900'
        }
      `}
      style={{
        transform: `translate3d(${record.spatialComposerState.x}px, ${record.spatialComposerState.y}px, 0)`,
        width: 120,
        height: 80,
        transition: isDragging || window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'none' : 'transform 0.1s ease-out'
      }}
    >
      <div className="font-semibold text-sm truncate w-full text-center pointer-events-none">{record.speakerName}</div>
      <div className="text-xs opacity-75 truncate w-full text-center pointer-events-none mt-1">Cap: {record.spatialComposerState.capacity}</div>

      {isSelected && (
        <div className="absolute -bottom-8 flex gap-1 bg-white p-1 rounded shadow border">
          <button
            data-testid={`cap-minus-${record.id}`}
            className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
            onClick={(e) => { e.stopPropagation(); onMutate({ capacity: Math.max(0, record.spatialComposerState.capacity - 10), status: 'changed' }); }}
          >-</button>
          <button
            data-testid={`cap-plus-${record.id}`}
            className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
            onClick={(e) => { e.stopPropagation(); onMutate({ capacity: Math.min(500, record.spatialComposerState.capacity + 10), status: 'changed' }); }}
          >+</button>
        </div>
      )}
    </div>
  );
}
