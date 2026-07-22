import React from 'react';
import { useStore } from '../store';
import { motion } from 'framer-motion';

export default function ShelfCanvas() {
  const { shelves, pieces, placePiece, unplacePiece } = useStore();

  const handleDragEnd = (piece, event, info) => {
    // simplified drag handling: just snap it back or place it for now
    const x = Math.round(info.point.x);
    const y = Math.round(info.point.y);
    // Find closest shelf based on position (very simple approximation)
    const shelfId = pieces.find(p => p.id === piece.id)?.shelfId || shelves[0].id;

    // Check bounds (mock)
    const inBounds = true;

    if (inBounds) {
      placePiece(piece.id, shelfId, x, y, 0); // Need full collision logic later
    } else {
      unplacePiece(piece.id);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-md">
      <h2 className="text-xl font-bold">Shelf Canvas</h2>
      <div className="flex gap-4">
        {shelves.map(shelf => (
          <div key={shelf.id} className="relative w-64 h-64 rounded-full border-2 border-gray-400 bg-gray-50 flex items-center justify-center overflow-hidden">
            <span className="text-gray-300 absolute">{shelf.id}</span>
            {pieces.filter(p => p.shelfId === shelf.id).map(piece => (
              <motion.div
                key={piece.id}
                drag
                onDragEnd={(e, info) => handleDragEnd(piece, e, info)}
                initial={{ x: piece.x, y: piece.y, rotate: piece.rotation }}
                animate={{ x: piece.x, y: piece.y, rotate: piece.rotation }}
                className="absolute w-8 h-8 bg-blue-500 rounded flex items-center justify-center cursor-move"
              >
                <span className="text-[8px] text-white">{piece.id}</span>
              </motion.div>
            ))}
          </div>
        ))}
      </div>
      <div className="border p-2">
        <h3 className="font-semibold mb-2">Catalog</h3>
        <div className="flex gap-2 flex-wrap">
           {pieces.filter(p => !p.shelfId).map(piece => (
               <button
                key={piece.id}
                onClick={() => placePiece(piece.id, shelves[0].id, 0, 0, 0)}
                className="p-1 text-xs border rounded bg-gray-100"
               >
                   {piece.id}
               </button>
           ))}
        </div>
      </div>
    </div>
  );
}
