import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '../store';
import { motion } from 'framer-motion';

export const Canvas = () => {
    const { fixture, currentBeat, score, selectedEntity, selectEntity, activeTool, updateWaypoint, addWaypoint, setAnalysisFindings } = useStore();
    const branch = score.branches[score.activeBranch];
    const canvasRef = useRef(null);

    // Compute interpolated positions for the current beat
    const computePositions = () => {
        const pos = {};
        [...fixture.actors, ...fixture.props].forEach(entity => {
            const waypoints = Object.values(branch.waypoints)
                .filter(w => w.entityId === entity.id)
                .sort((a, b) => a.beat - b.beat);

            if (waypoints.length === 0) return;

            let prev = waypoints[0];
            let next = waypoints[waypoints.length - 1];

            for (let i = 0; i < waypoints.length; i++) {
                if (waypoints[i].beat <= currentBeat) prev = waypoints[i];
                if (waypoints[i].beat >= currentBeat) {
                    next = waypoints[i];
                    break;
                }
            }

            if (prev.beat === next.beat || currentBeat <= prev.beat) {
                pos[entity.id] = { x: prev.x, y: prev.y, facing: prev.facing };
            } else if (currentBeat >= next.beat) {
                pos[entity.id] = { x: next.x, y: next.y, facing: next.facing };
            } else {
                const ratio = (currentBeat - prev.beat) / (next.beat - prev.beat);
                pos[entity.id] = {
                    x: prev.x + (next.x - prev.x) * ratio,
                    y: prev.y + (next.y - prev.y) * ratio,
                    facing: prev.facing + (next.facing - prev.facing) * ratio
                };
            }
        });
        return pos;
    };

    const positions = computePositions();

    // Scale mapping (12x8 stage -> SVG pixels)
    const pxPerMeter = 50;
    const stageWidth = fixture.stage.width * pxPerMeter;
    const stageHeight = fixture.stage.height * pxPerMeter;

    const handleStageClick = (e) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / pxPerMeter;
        const y = (e.clientY - rect.top) / pxPerMeter;

        if (activeTool === 'path' && selectedEntity) {
            const key = `${selectedEntity}-b${currentBeat}`;
            if (branch.waypoints[key]) {
                updateWaypoint(key, { x, y });
            } else {
                addWaypoint({ entityId: selectedEntity, beat: currentBeat, x, y, facing: 0, type: 'walk', hold: false });
            }
        }
    };

    return (
        <div className="relative w-full overflow-hidden bg-gray-100 p-4 flex items-center justify-center min-h-[500px]">
            <svg
                ref={canvasRef}
                width={stageWidth}
                height={stageHeight}
                className="bg-white border-2 border-gray-300 shadow-lg cursor-crosshair"
                onClick={handleStageClick}
            >
                {/* Grid */}
                <pattern id="grid" width={pxPerMeter * fixture.stage.gridSize} height={pxPerMeter * fixture.stage.gridSize} patternUnits="userSpaceOnUse">
                    <path d={`M ${pxPerMeter * fixture.stage.gridSize} 0 L 0 0 0 ${pxPerMeter * fixture.stage.gridSize}`} fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                </pattern>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Entrances */}
                {fixture.entrances.map(ent => (
                    <rect key={ent.id} x={ent.x * pxPerMeter} y={ent.y * pxPerMeter} width={ent.width * pxPerMeter} height={ent.height * pxPerMeter} fill="#dcfce3" stroke="#86efac" />
                ))}

                {/* Obstacles */}
                {fixture.obstacles.map(obs => (
                    <rect key={obs.id} x={obs.x * pxPerMeter} y={obs.y * pxPerMeter} width={obs.width * pxPerMeter} height={obs.height * pxPerMeter} fill="#d1d5db" stroke="#9ca3af" />
                ))}

                {/* Entities */}
                {[...fixture.actors, ...fixture.props].map(entity => {
                    const pos = positions[entity.id];
                    if (!pos) return null;
                    const isSelected = selectedEntity === entity.id;
                    const isProp = fixture.props.some(p => p.id === entity.id);
                    return (
                        <g
                            key={entity.id}
                            transform={`translate(${pos.x * pxPerMeter}, ${pos.y * pxPerMeter}) rotate(${pos.facing})`}
                            onClick={(e) => { e.stopPropagation(); selectEntity(entity.id); }}
                            className="cursor-pointer"
                        >
                            {isProp ? (
                                <rect x={-entity.radius * pxPerMeter} y={-entity.radius * pxPerMeter} width={entity.radius * 2 * pxPerMeter} height={entity.radius * 2 * pxPerMeter} fill={entity.color} stroke={isSelected ? '#000' : '#fff'} strokeWidth="2" />
                            ) : (
                                <circle r={entity.radius * pxPerMeter} fill={entity.color} stroke={isSelected ? '#000' : '#fff'} strokeWidth="2" />
                            )}
                            {/* Facing indicator */}
                            {!isProp && <line x1="0" y1="0" x2={entity.radius * pxPerMeter} y2="0" stroke="#000" strokeWidth="2" />}
                            <text y={-entity.radius * pxPerMeter - 5} textAnchor="middle" fontSize="12" fill="#374151" transform={`rotate(${-pos.facing})`}>{entity.name}</text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};
