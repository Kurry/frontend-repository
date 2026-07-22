import React, { useState } from 'react';
import { useStore } from './store';

export function ReviewSession() {
  const { cards, activeSession, startReview, revealCard, rateCard, undoLastRating, abandonSession } = useStore();

  if (!activeSession) {
    return (
      <div className="p-4 bg-slate-100 rounded">
        <h2 className="text-xl font-bold mb-4">Review Session</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={() => startReview()}>
          Start Review
        </button>
      </div>
    );
  }

  const { queue, currentIndex, revealed, ledger } = activeSession;

  if (currentIndex >= queue.length) {
    return (
      <div className="p-4 bg-green-100 rounded text-green-900">
        <h2 className="text-xl font-bold mb-2">Session Complete!</h2>
        <p>Reviewed {queue.length} cards.</p>
      </div>
    );
  }

  const activeCardId = queue[currentIndex];
  const card = cards.find(c => c.id === activeCardId);

  return (
    <div className="p-4 bg-slate-100 rounded flex flex-col items-center">
      <div className="flex w-full justify-between mb-4 text-sm text-slate-600">
        <span>Card {currentIndex + 1} of {queue.length}</span>
        <div className="flex gap-2">
           <button className="px-2 py-1 bg-slate-200 rounded" onClick={undoLastRating} disabled={ledger.length === 0}>Undo</button>
           <button className="px-2 py-1 bg-red-200 text-red-900 rounded" onClick={abandonSession}>Abandon</button>
        </div>
      </div>

      <div
        className="w-96 h-64 bg-white rounded shadow-lg p-6 flex flex-col justify-center items-center text-center cursor-pointer mb-6"
        onClick={() => !revealed && revealCard()}
      >
        <div className="text-xl font-medium mb-4">{card.front}</div>
        {revealed && (
          <div className="text-lg text-slate-700 border-t pt-4 w-full">
            {card.back}
          </div>
        )}
        {!revealed && (
          <div className="text-sm text-slate-400 mt-auto">Click to reveal</div>
        )}
      </div>

      {revealed && (
        <div className="flex gap-4">
          <button className="px-4 py-2 bg-red-100 text-red-900 border border-red-300 rounded hover:bg-red-200" onClick={() => rateCard('again')}>Again (Box 1)</button>
          <button className="px-4 py-2 bg-orange-100 text-orange-900 border border-orange-300 rounded hover:bg-orange-200" onClick={() => rateCard('hard')}>Hard</button>
          <button className="px-4 py-2 bg-green-100 text-green-900 border border-green-300 rounded hover:bg-green-200" onClick={() => rateCard('good')}>Good</button>
          <button className="px-4 py-2 bg-blue-100 text-blue-900 border border-blue-300 rounded hover:bg-blue-200" onClick={() => rateCard('easy')}>Easy</button>
        </div>
      )}
    </div>
  );
}
