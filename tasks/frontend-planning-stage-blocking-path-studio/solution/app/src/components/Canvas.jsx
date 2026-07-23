import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '../store';
import { motion } from 'framer-motion';

export const Canvas = () => {
    const { fixture, currentBeat, score, selectedEntity, selectEntity, activeTool, updateWaypoint, addWaypoint, setAnalysisFindings } = useStore();
    const branch = score.branches[score.activeBranch];
    const canvasRef = useRef(null);
    const [isReducedMotion, setIsReducedMotion] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setIsReducedMotion(mediaQuery.matches);
        const listener = (e) => setIsReducedMotion(e.matches);
        mediaQuery.addEventListener('change', listener);
        return () => mediaQuery.removeEventListener('change', listener);
    }, []);

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

    // Helper to get paths for a specific entity
    const getEntityPaths = (entityId) => {
        const waypoints = Object.values(branch.waypoints)
            .filter(w => w.entityId === entityId)
            .sort((a, b) => a.beat - b.beat);

        if (waypoints.length < 2) return null;

        const points = waypoints.map(w => `${w.x * pxPerMeter},${w.y * pxPerMeter}`).join(' ');
        return points;
    };

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
        <div className="relative w-full overflow-auto bg-gray-100 p-4 flex items-start justify-start md:items-center md:justify-center min-h-[500px]">
            <svg
                ref={canvasRef}
                width={stageWidth}
                height={stageHeight}
                viewBox={`0 0 ${stageWidth} ${stageHeight}`}
                className="bg-white border-2 border-gray-300 shadow-lg cursor-crosshair min-w-max"
                onClick={handleStageClick}
                role="img"
                aria-label="Stage Canvas"
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

                {/* Paths (Rendered when path tool is active and entity is selected) */}
                {activeTool === 'path' && selectedEntity && getEntityPaths(selectedEntity) && (
                    <polyline
                        points={getEntityPaths(selectedEntity)}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                    />
                )}

                {/* Entities */}
                {[...fixture.actors, ...fixture.props].map(entity => {
                    const pos = positions[entity.id];
                    if (!pos) return null;
                    const isSelected = selectedEntity === entity.id;
                    const isProp = fixture.props.some(p => p.id === entity.id);

                    return (
                        <motion.g
                            key={entity.id}
                            initial={false}
                            animate={{ x: pos.x * pxPerMeter, y: pos.y * pxPerMeter, rotate: pos.facing }}
                            transition={isReducedMotion ? { duration: 0 } : { type: "spring", bounce: 0, duration: 0.4 }}
                            onClick={(e) => { e.stopPropagation(); selectEntity(entity.id); }}
                            className="cursor-pointer outline-none"
                            tabIndex={0}
                            role="button"
                            aria-label={entity.name}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    selectEntity(entity.id);
                                }
                            }}
                        >
                            <title>{entity.name}</title>
                            {isProp ? (
                                <rect x={-entity.radius * pxPerMeter} y={-entity.radius * pxPerMeter} width={entity.radius * 2 * pxPerMeter} height={entity.radius * 2 * pxPerMeter} fill={entity.color} stroke={isSelected ? '#000' : '#fff'} strokeWidth="2" />
                            ) : (
                                <circle r={entity.radius * pxPerMeter} fill={entity.color} stroke={isSelected ? '#000' : '#fff'} strokeWidth="2" />
                            )}
                            {/* Facing indicator */}
                            {!isProp && <line x1="0" y1="0" x2={entity.radius * pxPerMeter} y2="0" stroke="#000" strokeWidth="2" />}

                            {/* Entity Label - counteract rotation to keep text upright */}
                            <g transform={`rotate(${-pos.facing})`}>
                                <rect
                                    x={-20}
                                    y={-entity.radius * pxPerMeter - 15}
                                    width="40"
                                    height="16"
                                    fill="rgba(255,255,255,0.8)"
                                    rx="2"
                                />
                                <text
                                    y={-entity.radius * pxPerMeter - 4}
                                    textAnchor="middle"
                                    fontSize="12"
                                    fontWeight={isSelected ? 'bold' : 'normal'}
                                    fill="#374151"
                                >
                                    {entity.name}
                                </text>
                            </g>
                        </motion.g>
                    );
                })}
            </svg>
        </div>
    );
};
