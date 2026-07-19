import React, { useMemo } from 'react';
import type { CanvasObject } from '../types';
import { useAppDispatch, useAppSelector } from '../hooks';
import { setCanvasView } from '../slices/appSlice';

interface MiniMapProps {
  objects: CanvasObject[];
  viewportWidth: number;
  viewportHeight: number;
}

const MiniMap: React.FC<MiniMapProps> = ({ objects, viewportWidth, viewportHeight }) => {
  const dispatch = useAppDispatch();
  const canvasView = useAppSelector(s => s.app.canvasView);

  const bounds = useMemo(() => {
    if (objects.length === 0) {
      return { minX: -500, minY: -300, maxX: 500, maxY: 300, width: 1000, height: 600 };
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const obj of objects) {
      minX = Math.min(minX, obj.x);
      minY = Math.min(minY, obj.y);
      maxX = Math.max(maxX, obj.x + obj.width);
      maxY = Math.max(maxY, obj.y + obj.height);
    }
    const pad = 150;
    minX -= pad;
    minY -= pad;
    maxX += pad;
    maxY += pad;
    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
  }, [objects]);

  const isNarrow = viewportWidth < 480;
  const mapWidth = isNarrow ? 120 : 170;
  const mapHeight = isNarrow ? 78 : 110;
  const scale = Math.min(mapWidth / bounds.width, mapHeight / bounds.height);

  const viewLeft = -canvasView.panX / canvasView.zoom;
  const viewTop = -canvasView.panY / canvasView.zoom;
  const viewWidth = viewportWidth / canvasView.zoom;
  const viewHeight = viewportHeight / canvasView.zoom;

  const vpX = (viewLeft - bounds.minX) * scale;
  const vpY = (viewTop - bounds.minY) * scale;
  const vpW = viewWidth * scale;
  const vpH = viewHeight * scale;

  const centerOn = (worldX: number, worldY: number) => {
    dispatch(
      setCanvasView({
        ...canvasView,
        panX: -(worldX * canvasView.zoom - viewportWidth / 2),
        panY: -(worldY * canvasView.zoom - viewportHeight / 2),
      })
    );
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (e.detail === 0) {
      // Keyboard activation: center the view on the middle of the content
      centerOn((bounds.minX + bounds.maxX) / 2, (bounds.minY + bounds.maxY) / 2);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left - 4) / scale + bounds.minX;
    const clickY = (e.clientY - rect.top - 4) / scale + bounds.minY;
    centerOn(clickX, clickY);
  };

  const getObjectColor = (obj: CanvasObject): string => {
    if (obj.type === 'flashcard') return '#FFFFFF';
    return obj.color || '#6D5BD0';
  };

  return (
    <button
      type="button"
      aria-label="Board overview map — activate to recenter the view"
      title="Board overview map"
      data-canvas-ui
      onClick={handleClick}
      onMouseDown={e => e.stopPropagation()}
      className="bg-white/95 shadow-md overflow-hidden"
      style={{
        width: mapWidth + 8,
        height: mapHeight + 8,
        borderRadius: '12px',
        border: '1.5px solid var(--color-text-secondary)',
        position: 'absolute',
        bottom: 12,
        right: 12,
        zIndex: 30,
        cursor: 'pointer',
        padding: 0,
      }}
    >
      <svg aria-hidden="true" width={mapWidth + 8} height={mapHeight + 8}>
        <g transform="translate(4, 4)">
          <rect width={mapWidth} height={mapHeight} fill="#F4F2FB" rx="6" />
          {objects.map(obj => (
            <rect
              key={obj.id}
              x={(obj.x - bounds.minX) * scale}
              y={(obj.y - bounds.minY) * scale}
              width={Math.max(3, obj.width * scale)}
              height={Math.max(3, obj.height * scale)}
              fill={getObjectColor(obj)}
              stroke="rgba(33, 29, 58, 0.3)"
              strokeWidth={0.5}
              rx={obj.type === 'circle' ? Math.min(obj.width, obj.height) * scale * 0.5 : 1.5}
            />
          ))}
          <rect
            x={Math.max(0, Math.min(mapWidth - 4, vpX))}
            y={Math.max(0, Math.min(mapHeight - 4, vpY))}
            width={Math.min(mapWidth, Math.max(6, vpW))}
            height={Math.min(mapHeight, Math.max(6, vpH))}
            fill="rgba(109, 91, 208, 0.12)"
            stroke="#6D5BD0"
            strokeWidth={1.5}
            rx={2}
          />
        </g>
      </svg>
    </button>
  );
};

export default MiniMap;
