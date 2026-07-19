import React, { useCallback, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { deselectAll, panCanvas, removeConnector } from '../slices/appSlice';
import CanvasObjectComponent from './CanvasObject';
import ConnectorLine, { connectorMidpoint } from './ConnectorLine';
import MiniMap from './MiniMap';

interface CanvasProps {
  width: number;
  height: number;
}

const Canvas: React.FC<CanvasProps> = ({ width, height }) => {
  const dispatch = useAppDispatch();
  const boards = useAppSelector(s => s.app.boards);
  const activeBoardId = useAppSelector(s => s.app.activeBoardId);
  const selectedIds = useAppSelector(s => s.app.selectedIds);
  const activeTool = useAppSelector(s => s.app.activeTool);
  const connectFromId = useAppSelector(s => s.app.connectFromId);
  const canvasView = useAppSelector(s => s.app.canvasView);
  const searchMatchIds = useAppSelector(s => s.app.searchMatchIds);
  const searchQuery = useAppSelector(s => s.app.searchQuery);

  const board = boards.find(b => b.id === activeBoardId);
  const objects = board?.objects || [];
  const connectors = board?.connectors || [];

  const containerRef = useRef<HTMLDivElement>(null);
  const isPanningRef = useRef(false);
  const [cursorWorld, setCursorWorld] = useState<{ x: number; y: number } | null>(null);

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-canvas-object]')) return;
      if (target.closest('[data-canvas-ui]')) return;
      e.preventDefault();

      isPanningRef.current = true;
      const startX = e.clientX;
      const startY = e.clientY;
      let lastX = startX;
      let lastY = startY;
      let movedTotal = 0;

      const onMove = (me: MouseEvent) => {
        if (!isPanningRef.current) return;
        const dx = me.clientX - lastX;
        const dy = me.clientY - lastY;
        movedTotal += Math.abs(dx) + Math.abs(dy);
        lastX = me.clientX;
        lastY = me.clientY;
        dispatch(panCanvas({ dx, dy }));
      };
      const onUp = () => {
        isPanningRef.current = false;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        if (movedTotal < 4 && activeTool === 'select') {
          dispatch(deselectAll());
        }
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [activeTool, dispatch]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (activeTool !== 'connect' || !connectFromId || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setCursorWorld({
        x: (e.clientX - rect.left - canvasView.panX) / canvasView.zoom,
        y: (e.clientY - rect.top - canvasView.panY) / canvasView.zoom,
      });
    },
    [activeTool, connectFromId, canvasView]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.target !== e.currentTarget) return;
      const step = 60;
      if (e.key === 'ArrowLeft') dispatch(panCanvas({ dx: step, dy: 0 }));
      else if (e.key === 'ArrowRight') dispatch(panCanvas({ dx: -step, dy: 0 }));
      else if (e.key === 'ArrowUp') dispatch(panCanvas({ dx: 0, dy: step }));
      else if (e.key === 'ArrowDown') dispatch(panCanvas({ dx: 0, dy: -step }));
      else return;
      e.preventDefault();
    },
    [dispatch]
  );

  const isEmpty = objects.length === 0;
  const connectSource = connectFromId ? objects.find(o => o.id === connectFromId) : null;
  const sortedObjects = [...objects].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden w-full h-full"
      role="region"
      aria-label="Canvas — arrow keys pan the view"
      tabIndex={0}
      style={{
        backgroundColor: 'var(--color-background)',
        cursor: activeTool === 'connect' ? 'crosshair' : 'grab',
      }}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onKeyDown={handleKeyDown}
    >
      {/* Dot grid backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #C9C3E4 1px, transparent 1px)',
          backgroundSize: `${24 * canvasView.zoom}px ${24 * canvasView.zoom}px`,
          backgroundPosition: `${canvasView.panX}px ${canvasView.panY}px`,
          opacity: 0.7,
        }}
      />

      {/* World transform layer */}
      <div
        className="absolute"
        style={{
          transform: `translate(${canvasView.panX}px, ${canvasView.panY}px) scale(${canvasView.zoom})`,
          transformOrigin: '0 0',
          width: 0,
          height: 0,
        }}
      >
        <svg
          aria-hidden="true"
          className="absolute"
          style={{ left: 0, top: 0, width: 1, height: 1, overflow: 'visible', pointerEvents: 'none' }}
        >
          {connectors.map(conn => (
            <ConnectorLine key={conn.id} connector={conn} objects={objects} />
          ))}
          {connectSource && cursorWorld && (
            <line
              x1={connectSource.x + connectSource.width / 2}
              y1={connectSource.y + connectSource.height / 2}
              x2={cursorWorld.x}
              y2={cursorWorld.y}
              stroke="#6D5BD0"
              strokeWidth={2.5}
              strokeDasharray="7 5"
              strokeLinecap="round"
            />
          )}
        </svg>

        {sortedObjects.map(obj => (
          <CanvasObjectComponent
            key={obj.id}
            obj={obj}
            isSelected={selectedIds.includes(obj.id)}
            isSearchHighlight={searchMatchIds.includes(obj.id)}
            isConnectSource={connectFromId === obj.id}
            zoom={canvasView.zoom}
          />
        ))}

        {/* Connector remove controls */}
        {connectors.map(conn => {
          const mid = connectorMidpoint(conn, objects);
          if (!mid) return null;
          return (
            <button
              key={`remove-${conn.id}`}
              type="button"
              aria-label="Remove Connector"
              title="Remove Connector"
              data-canvas-ui
              onClick={() => dispatch(removeConnector(conn.id))}
              onMouseDown={e => e.stopPropagation()}
              className="hover:bg-[#EAE6F7]"
              style={{
                position: 'absolute',
                left: mid.x - 13,
                top: mid.y - 13,
                width: 26,
                height: 26,
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                border: '1.5px solid var(--color-text-secondary)',
                color: 'var(--color-text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 500,
                boxShadow: '0 1px 4px rgba(33, 29, 58, 0.25)',
                padding: 0,
              }}
            >
              <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 2 L10 10 M10 2 L2 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-4">
          <div
            className="text-center px-8 py-6"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)', borderRadius: '12px', maxWidth: 420 }}
          >
            <p className="font-semibold" style={{ fontSize: '18px', color: 'var(--color-text-primary)' }}>
              This board is empty
            </p>
            <p className="mt-1" style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--color-text-secondary)' }}>
              Add a note, flashcard or shape to get started
            </p>
          </div>
        </div>
      )}

      {/* Connect mode helper */}
      {activeTool === 'connect' && (
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-2 font-medium text-white shadow-md pointer-events-none"
          style={{ backgroundColor: 'var(--color-primary)', borderRadius: '8px', fontSize: '13px', zIndex: 40, maxWidth: 'calc(100% - 24px)' }}
        >
          {connectFromId
            ? 'Click a second object to finish the connector'
            : 'Click an object to start a connector'}
        </div>
      )}

      {/* No search results */}
      {searchQuery.trim() && searchMatchIds.length === 0 && (
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-2 shadow-md pointer-events-none"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1.5px solid var(--color-text-secondary)',
            borderRadius: '8px',
            fontSize: '13px',
            color: 'var(--color-text-primary)',
            zIndex: 40,
            maxWidth: 'calc(100% - 24px)',
          }}
        >
          No results for "{searchQuery.trim()}" — try a different word
        </div>
      )}

      <MiniMap objects={objects} viewportWidth={width} viewportHeight={height} />
    </div>
  );
};

export default Canvas;
