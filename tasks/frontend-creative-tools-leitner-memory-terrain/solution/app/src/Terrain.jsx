import React from 'react';
import { useStore } from './store';

const BOX_COLORS = [
  'bg-red-100 border-red-300 text-red-900',
  'bg-orange-100 border-orange-300 text-orange-900',
  'bg-yellow-100 border-yellow-300 text-yellow-900',
  'bg-green-100 border-green-300 text-green-900',
  'bg-blue-100 border-blue-300 text-blue-900'
];

export function Terrain() {
  const cards = useStore(state => state.cards);
  const moveCardToBox = useStore(state => state.moveCardToBox);
  const activeSession = useStore(state => state.activeSession);

  const handleDrop = (e, boxIndex) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('cardId');
    if (cardId && !activeSession) {
      const reason = prompt('Reason for manual adjustment:');
      if (reason) {
        moveCardToBox(cardId, boxIndex + 1, reason);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="flex gap-4 p-4 h-64 bg-slate-50">
      {[1, 2, 3, 4, 5].map((box, idx) => {
        const boxCards = cards.filter(c => c.box === box);
        return (
          <div
            key={box}
            className={`flex-1 border-2 rounded p-2 overflow-y-auto ${BOX_COLORS[idx]}`}
            onDrop={(e) => handleDrop(e, idx)}
            onDragOver={handleDragOver}
          >
            <h3 className="font-bold border-b border-current mb-2">Box {box}</h3>
            <div className="text-xs mb-2">{boxCards.length} cards</div>
            <div className="flex flex-col gap-1">
              {boxCards.map(c => (
                <div
                  key={c.id}
                  className="bg-white p-1 rounded shadow-sm text-xs truncate cursor-grab"
                  draggable={!activeSession}
                  onDragStart={(e) => { e.dataTransfer.setData('cardId', c.id); }}
                >
                  {c.id}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
