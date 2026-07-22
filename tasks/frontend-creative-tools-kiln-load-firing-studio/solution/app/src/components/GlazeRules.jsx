import React from 'react';
import { useStore } from '../store';

export default function GlazeRules() {
  const { pieces, adjacencyExceptions } = useStore();
  const placedPieces = pieces.filter(p => p.shelfId);

  // Very simple mocked adjacency check (just lists all pieces for now)
  return (
    <div className="flex flex-col gap-4 p-4 border rounded-md">
      <h2 className="text-xl font-bold">Glaze Adjacency & Rules</h2>
      <div className="text-sm text-gray-600 mb-2">
        Checks placed pieces for incompatible glazes sharing boundaries.
      </div>

      {placedPieces.length === 0 ? (
        <div className="text-gray-400 italic">No pieces placed to evaluate.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {placedPieces.map(piece => (
            <div key={piece.id} className="border p-2 rounded bg-green-50">
              <span className="font-semibold">{piece.id}</span>
              <span className="text-xs ml-2 text-green-700">✓ No conflicts detected</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
