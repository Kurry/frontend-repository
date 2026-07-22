import React from 'react';
import { useStore } from '../store';
import { projectCutout, projectToPixel } from '../geometry';

export const PerspectiveStage: React.FC = () => {
  const { cutouts, viewerOffset, selectedCutoutId, selectCutout, stagedDepthMove } = useStore();

  const boardWidth = 800;
  const boardHeight = 500;

  const sortedCutouts = Object.values(cutouts).sort((a, b) => b.depthSlot - a.depthSlot);

  return (
    <div className="relative w-full h-full bg-gray-100 flex items-center justify-center overflow-hidden">
      <div
        className="relative shadow-lg bg-white border border-gray-300"
        style={{ width: boardWidth, height: boardHeight }}
      >
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" id="parallax-stage">
          {sortedCutouts.map(cutout => {
            const isSelected = cutout.id === selectedCutoutId;
            const slotToUse = (stagedDepthMove?.cutoutId === cutout.id) ? stagedDepthMove.newSlot : cutout.depthSlot;

            const projected = projectCutout({ ...cutout, depthSlot: slotToUse }, viewerOffset);

            const x = projectToPixel(projected.xMinFixed8);
            const y = projectToPixel(projected.yMinFixed8);
            const width = projectToPixel(projected.xMaxFixed8 - projected.xMinFixed8);
            const height = projectToPixel(projected.yMaxFixed8 - projected.yMinFixed8);

            return (
              <rect
                key={cutout.id}
                id={`svg-rect-${cutout.id}`}
                x={x}
                y={y}
                width={width}
                height={height}
                fill={isSelected ? '#3b82f6' : '#d1d5db'}
                stroke={isSelected ? '#1d4ed8' : '#9ca3af'}
                strokeWidth="2"
                onClick={() => selectCutout(cutout.id)}
                className="cursor-pointer transition-all duration-300"
              />
            );
          })}
        </svg>

        {/* Center view lock marker and viewer stop ruler can go here */}
        <div className="absolute top-2 left-2 text-xs font-mono text-gray-500">
          Viewer Offset: {viewerOffset} | Center Lock {viewerOffset === 0 ? 'Active' : 'Inactive'}
        </div>
      </div>
    </div>
  );
};
