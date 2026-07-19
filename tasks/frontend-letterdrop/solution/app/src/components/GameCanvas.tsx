import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { TILE_SIZE, DANGER_LINE_Y, COLUMN_COUNT } from '../game/types';

interface GameCanvasProps {
  width: number;
  height: number;
  onTileClick: (tileId: string) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ width, height, onTileClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const [keyboardTileId, setKeyboardTileId] = useState<string | null>(null);
  const tileCount = useGameStore(state => state.tiles.length);
  const selectedLetters = useGameStore(state => state.selectedWord.map(tile => tile.letter).join(''));

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = useGameStore.getState();
    const { tiles, isPaused, isGameOver, slowActive } = state;

    const actualWidth = width * dpr;
    const actualHeight = height * dpr;

    if (canvas.width !== actualWidth || canvas.height !== actualHeight) {
      canvas.width = actualWidth;
      canvas.height = actualHeight;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // Board background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#E6EEF7');
    bgGrad.addColorStop(1, '#D8E3F0');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Column lines (subtle)
    const colWidth = width / COLUMN_COUNT;
    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 1;
    for (let i = 1; i < COLUMN_COUNT; i++) {
      ctx.beginPath();
      ctx.moveTo(i * colWidth, 0);
      ctx.lineTo(i * colWidth, height);
      ctx.stroke();
    }

    // Danger line
    ctx.save();
    const dangerGrad = ctx.createLinearGradient(0, DANGER_LINE_Y - 5, 0, height);
    dangerGrad.addColorStop(0, 'rgba(255,59,48,0.06)');
    dangerGrad.addColorStop(1, 'rgba(255,59,48,0.12)');
    ctx.fillStyle = dangerGrad;
    ctx.fillRect(0, DANGER_LINE_Y, width, height - DANGER_LINE_Y);

    ctx.strokeStyle = '#FF3B30';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(0, DANGER_LINE_Y);
    ctx.lineTo(width, DANGER_LINE_Y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#FF3B30';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('⚠ Danger line', 6, DANGER_LINE_Y - 4);
    ctx.restore();

    // Slow effect overlay
    if (slowActive && !isPaused) {
      ctx.fillStyle = 'rgba(52,199,89,0.06)';
      ctx.fillRect(0, 0, width, height);
    }

    // Paused overlay
    if (isPaused && !isGameOver) {
      ctx.fillStyle = 'rgba(245,245,247,0.85)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#1D1D1E';
      ctx.font = 'bold 28px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Paused', width / 2, height / 2 - 12);
      ctx.font = '15px Arial, sans-serif';
      ctx.fillStyle = '#4F4F55';
      ctx.fillText('Press Resume to continue', width / 2, height / 2 + 20);
    }

    // Draw tiles
    for (const tile of tiles) {
      const x = tile.x;
      const y = tile.y;
      const size = TILE_SIZE;
      const half = size / 2;

      ctx.save();
      ctx.globalAlpha = tile.opacity;
      ctx.shadowColor = 'rgba(0,0,0,0.15)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 2;

      if (tile.type === 'bomb') {
        // Diamond shape
        ctx.fillStyle = '#FF6B35';
        ctx.beginPath();
        ctx.moveTo(x, y - half);
        ctx.lineTo(x + half, y);
        ctx.lineTo(x, y + half);
        ctx.lineTo(x - half, y);
        ctx.closePath();
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.fillStyle = '#FF9A5C';
        ctx.beginPath();
        ctx.moveTo(x, y - half * 0.55);
        ctx.lineTo(x + half * 0.55, y);
        ctx.lineTo(x, y + half * 0.55);
        ctx.lineTo(x - half * 0.55, y);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#FEFEFE';
        ctx.font = `bold ${size * 0.45}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tile.letter.toUpperCase(), x, y + 1);
      } else if (tile.type === 'slow') {
        // Circle shape
        ctx.fillStyle = '#34C759';
        ctx.beginPath();
        ctx.arc(x, y, half, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.fillStyle = '#5AE07A';
        ctx.beginPath();
        ctx.arc(x, y - 2, half * 0.55, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FEFEFE';
        ctx.font = `bold ${size * 0.45}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tile.letter.toUpperCase(), x, y + 1);
      } else {
        // Rounded rect
        ctx.fillStyle = tile.selected ? '#007AFF' : '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(x - half, y - half, size, size, 8);
        ctx.fill();

        ctx.shadowColor = 'transparent';
        if (tile.selected) {
          ctx.strokeStyle = '#0056CC';
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = 'rgba(0,0,0,0.08)';
          ctx.lineWidth = 1;
        }
        ctx.beginPath();
        ctx.roundRect(x - half, y - half, size, size, 8);
        ctx.stroke();

        ctx.fillStyle = tile.selected ? '#FEFEFE' : '#1D1D1E';
        ctx.font = `bold ${size * 0.5}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tile.letter.toUpperCase(), x, y + 1);
      }

      if (tile.selected && tile.type !== 'normal') {
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = '#003F88';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, y, half + 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (tile.id === keyboardTileId) {
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = '#003F88';
        ctx.lineWidth = 4;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(x - half - 4, y - half - 4, size + 8, size + 8);
        ctx.setLineDash([]);
      }

      ctx.restore();
    }

    // The pre-run empty state ("Press Start game to begin!") is rendered as
    // a DOM overlay in App.tsx (not canvas pixels) so it is readable in the
    // accessibility tree / page text as well as visually.
  }, [width, height, dpr, keyboardTileId]);

  // Animation loop for smooth rendering
  useEffect(() => {
    let running = true;
    const animate = () => {
      if (!running) return;
      drawFrame();
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      running = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [drawFrame]);

  // Handle click/touch
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const state = useGameStore.getState();
      if (!state.gameStarted || state.isPaused || state.isGameOver) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = width / rect.width;
      const scaleY = height / rect.height;

      let clientX: number, clientY: number;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const clickX = (clientX - rect.left) * scaleX;
      const clickY = (clientY - rect.top) * scaleY;

      // Forgiving hit test: tiles are in constant downward motion, so by the
      // time a deliberate click lands the tile has fallen below where the
      // player (or an automated pointer) last saw it. Accept clicks within a
      // small horizontal margin and a vertical window that extends further
      // ABOVE the tile's current center (the tile's recent position) than
      // below it, and select the closest matching tile rather than whichever
      // happens to come last in the array.
      const HIT_MARGIN = 8;
      const FALL_GRACE = 30;
      const half = TILE_SIZE / 2;

      let bestTile: (typeof state.tiles)[number] | null = null;
      let bestDist = Infinity;
      for (const tile of state.tiles) {
        if (tile.removing) continue;
        // Selected tiles remain hit-testable so tapping a selected tile
        // again toggles it back off (selection is symmetric).
        const dx = clickX - tile.x;
        const dy = clickY - tile.y;

        const withinX = Math.abs(dx) <= half + HIT_MARGIN;
        const withinY = dy >= -(half + FALL_GRACE) && dy <= half + HIT_MARGIN;
        if (!withinX || !withinY) continue;

        const dist = dx * dx + dy * dy;
        if (dist < bestDist) {
          bestDist = dist;
          bestTile = tile;
        }
      }

      if (bestTile) {
        onTileClick(bestTile.id);
      }
    },
    [width, height, onTileClick]
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLCanvasElement>) => {
    const state = useGameStore.getState();
    if (!state.gameStarted || state.isPaused || state.isGameOver) return;

    // Include already-selected tiles in the navigable set (excluding only
    // tiles mid-removal) so keyboard users can move the cursor onto a
    // selected tile and press Enter/Space to toggle it back off — the same
    // symmetric select/deselect behavior the mouse path already supports via
    // onTileClick, rather than keyboard-only being able to add letters.
    const availableTiles = state.tiles.filter(tile => !tile.removing);
    if (availableTiles.length === 0) return;

    const currentIndex = availableTiles.findIndex(tile => tile.id === keyboardTileId);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % availableTiles.length;
      setKeyboardTileId(availableTiles[nextIndex].id);
      return;
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const nextIndex = currentIndex < 0
        ? availableTiles.length - 1
        : (currentIndex - 1 + availableTiles.length) % availableTiles.length;
      setKeyboardTileId(availableTiles[nextIndex].id);
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const tile = availableTiles[currentIndex < 0 ? 0 : currentIndex];
      onTileClick(tile.id);
      setKeyboardTileId(null);
      return;
    }

    if (/^[a-z]$/i.test(e.key)) {
      const matchingTile = availableTiles.find(tile => tile.letter.toLowerCase() === e.key.toLowerCase());
      if (matchingTile) {
        e.preventDefault();
        onTileClick(matchingTile.id);
        setKeyboardTileId(null);
      }
    }
  }, [keyboardTileId, onTileClick]);

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onBlur={() => setKeyboardTileId(null)}
      onTouchStart={(e) => {
        e.preventDefault();
        handleClick(e);
      }}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        borderRadius: '6px',
        cursor: 'pointer',
        display: 'block',
        touchAction: 'none',
      }}
      aria-label={`LetterDrop game board with ${tileCount} falling tiles. Selected letters: ${selectedLetters || 'none'}. Click tiles or use arrow keys and Enter to select letters.`}
      aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Enter Space"
      role="application"
      tabIndex={0}
    />
  );
};

export default GameCanvas;
