import { useState, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { TokenId, IMMUTABLE_TOKENS, SLOT_ROLES } from '../lib/domain';

export function Zipper() {
  const order = useStore((s) => s.order);
  const repairSwap = useStore((s) => s.repairSwap);
  const undo = useStore((s) => s.undo);

  const [dragged, setDragged] = useState<TokenId | null>(null);
  const [, setHoverTarget] = useState<TokenId | null>(null);
  const [previewOrder, setPreviewOrder] = useState<TokenId[] | null>(null);

  // Keyboard support
  const [focusedToken, setFocusedToken] = useState<TokenId | null>(null);
  const [isKeyboardLifted, setIsKeyboardLifted] = useState(false);

  const handleDragStart = (id: TokenId) => {
    setDragged(id);
    setPreviewOrder(order);
  };

  const handleDragEnter = (targetId: TokenId) => {
    if (!dragged || dragged === targetId) return;
    setHoverTarget(targetId);

    // Calculate preview if adjacent
    const dIndex = order.indexOf(dragged);
    const tIndex = order.indexOf(targetId);
    if (Math.abs(dIndex - tIndex) === 1) {
      const newOrder = [...order];
      newOrder[dIndex] = targetId;
      newOrder[tIndex] = dragged;
      setPreviewOrder(newOrder);
    } else {
      setPreviewOrder(null);
    }
  };

  const handleDragEnd = () => {
    setDragged(null);
    setHoverTarget(null);
    setPreviewOrder(null);
  };

  const handleDrop = (targetId: TokenId) => {
    if (!dragged) return;
    if (previewOrder) {
      repairSwap(dragged, targetId, 'adjacent-stable-swap');
    }
    handleDragEnd();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>, id: TokenId) => {
    if (e.key === 'Space' || e.key === ' ') {
      e.preventDefault();
      if (!isKeyboardLifted) {
        setIsKeyboardLifted(true);
        setFocusedToken(id);
      }
    } else if (isKeyboardLifted) {
      if (e.key === 'Escape') {
        setIsKeyboardLifted(false);
        setFocusedToken(null);
        setPreviewOrder(null);
        undo();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const idx = order.indexOf(id);
        const direction = e.key === 'ArrowLeft' ? -1 : 1;
        const targetIdx = idx + direction;

        if (targetIdx >= 0 && targetIdx < order.length) {
          const targetId = order[targetIdx];
          const newOrder = [...order];
          newOrder[idx] = targetId;
          newOrder[targetIdx] = id;
          setPreviewOrder(newOrder);
        }
      } else if (e.key === 'Enter') {
        if (previewOrder) {
          // const originalIdx = order.indexOf(id);
          const newIdx = previewOrder.indexOf(id);
          const targetId = order[newIdx];
          repairSwap(id, targetId, 'adjacent-stable-swap');
        }
        setIsKeyboardLifted(false);
        setFocusedToken(null);
        setPreviewOrder(null);
      }
    }
  };

  const currentOrder = previewOrder || order;

  return (
    <div className="p-4 bg-white border border-gray-300 rounded shadow-sm w-full overflow-x-auto">
      <h2 className="text-xl font-bold mb-4">Provenance Bit Zipper</h2>
      <div className="flex gap-4 min-w-max">
        {currentOrder.map((tokenId, index) => {
          const token = IMMUTABLE_TOKENS[tokenId];
          const role = SLOT_ROLES[index];
          const isLifted = (dragged === tokenId) || (isKeyboardLifted && focusedToken === tokenId);

          return (
            <motion.div
              layout
              key={tokenId}
              className={`w-20 h-32 border-2 rounded-lg flex flex-col items-center justify-between p-2 cursor-grab focus:outline-none focus:ring-4 focus:ring-blue-400 ${isLifted ? 'bg-blue-50 border-blue-500 z-10 shadow-lg scale-105' : 'bg-gray-50 border-gray-400'}`}
              draggable
              onDragStart={() => handleDragStart(tokenId)}
              onDragEnter={() => handleDragEnter(tokenId)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(tokenId)}
              onKeyDown={(e) => handleKeyDown(e, tokenId)}
              tabIndex={0}
              role="button"
              aria-pressed={isLifted}
              aria-label={`Token ${tokenId}, Value ${token.value}, Slot ${role}`}
            >
              <div className="text-sm font-semibold text-gray-500 uppercase bg-gray-200 px-2 py-1 rounded w-full text-center">
                {role}
              </div>
              <div className="text-2xl font-black">{tokenId}</div>
              <div className="text-sm font-mono font-bold bg-gray-800 text-white w-8 h-8 flex items-center justify-center rounded-full">
                {token.value}
              </div>
            </motion.div>
          );
        })}
      </div>
      {previewOrder && <div className="mt-4 text-blue-600 font-bold">Previewing Swap... Press Enter to confirm, Escape to cancel.</div>}
    </div>
  );
}
