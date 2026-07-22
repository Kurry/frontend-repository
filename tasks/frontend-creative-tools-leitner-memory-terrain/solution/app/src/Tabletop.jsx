import React, { useState, useRef, useEffect } from 'react';
import { useStore } from './store';

export function Tabletop() {
  const cards = useStore(state => state.cards);
  const groupRegions = useStore(state => state.groupRegions);
  const setCardPosition = useStore(state => state.setCardPosition);
  const addGroupRegion = useStore(state => state.addGroupRegion);
  const selectCards = useStore(state => state.selectCards);
  const selectedIds = useStore(state => state.viewState.selectedCardIds);

  const containerRef = useRef(null);
  const [dragCardId, setDragCardId] = useState(null);
  const [lasso, setLasso] = useState(null);
  const [drawingRegion, setDrawingRegion] = useState(null);

  const handlePointerDown = (e) => {
    if (e.target.closest('.card')) return; // handled by card
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (e.shiftKey) {
      setDrawingRegion({ startX: x, startY: y, x, y, w: 0, h: 0 });
    } else {
      setLasso({ startX: x, startY: y, x, y, w: 0, h: 0 });
    }
  };

  const handlePointerMove = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (dragCardId) {
       setCardPosition(dragCardId, x - 50, y - 50); // rough center offset
    } else if (lasso) {
       setLasso(prev => ({
         ...prev,
         x: Math.min(prev.startX, x),
         y: Math.min(prev.startY, y),
         w: Math.abs(x - prev.startX),
         h: Math.abs(y - prev.startY)
       }));
    } else if (drawingRegion) {
       setDrawingRegion(prev => ({
         ...prev,
         x: Math.min(prev.startX, x),
         y: Math.min(prev.startY, y),
         w: Math.abs(x - prev.startX),
         h: Math.abs(y - prev.startY)
       }));
    }
  };

  const handlePointerUp = () => {
    if (dragCardId) {
      setDragCardId(null);
    }
    if (lasso) {
      // Find cards in lasso
      const inLasso = cards.filter(c => {
        const cx = c.tabletopPosition.x + 50;
        const cy = c.tabletopPosition.y + 50;
        return cx >= lasso.x && cx <= lasso.x + lasso.w && cy >= lasso.y && cy <= lasso.y + lasso.h;
      });
      selectCards(inLasso.map(c => c.id));
      setLasso(null);
    }
    if (drawingRegion) {
      if (drawingRegion.w > 20 && drawingRegion.h > 20) {
        const name = prompt('Enter group tag name:');
        if (name) {
          addGroupRegion({
            id: `region-${Date.now()}`,
            name,
            bounds: { x: drawingRegion.x, y: drawingRegion.y, w: drawingRegion.w, h: drawingRegion.h }
          });
        }
      }
      setDrawingRegion(null);
    }
  };

  return (
    <div
      className="relative w-[1600px] h-[1000px] bg-slate-100 overflow-hidden border-2 border-slate-300"
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Regions */}
      {groupRegions.map(region => (
        <div
          key={region.id}
          className="absolute border-2 border-dashed border-blue-400 bg-blue-400/10"
          style={{ left: region.bounds.x, top: region.bounds.y, width: region.bounds.w, height: region.bounds.h }}
        >
          <span className="bg-blue-400 text-white text-xs px-1 absolute top-0 left-0">{region.name}</span>
        </div>
      ))}

      {/* Cards */}
      {cards.map(card => (
        <div
          key={card.id}
          className={`card absolute w-24 h-32 p-2 bg-white border-2 rounded shadow-sm cursor-grab select-none
            ${selectedIds.includes(card.id) ? 'border-blue-500 shadow-md ring-2 ring-blue-300' : 'border-slate-300'}`}
          style={{
            left: card.tabletopPosition.x,
            top: card.tabletopPosition.y,
            zIndex: dragCardId === card.id ? 100 : 1
          }}
          onPointerDown={(e) => { e.stopPropagation(); setDragCardId(card.id); }}
        >
          <div className="text-xs truncate font-semibold mb-1">{card.front}</div>
          <div className="text-[10px] text-slate-500">{card.tags.join(', ')}</div>
        </div>
      ))}

      {/* Lasso/Drawing */}
      {lasso && (
        <div
          className="absolute border border-blue-500 bg-blue-500/20"
          style={{ left: lasso.x, top: lasso.y, width: lasso.w, height: lasso.h }}
        />
      )}
      {drawingRegion && (
        <div
          className="absolute border border-green-500 bg-green-500/20"
          style={{ left: drawingRegion.x, top: drawingRegion.y, width: drawingRegion.w, height: drawingRegion.h }}
        />
      )}
    </div>
  );
}
