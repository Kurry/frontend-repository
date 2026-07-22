import React, { useState } from 'react';
import { useStore } from '../store';
import { DndContext, useDroppable } from '@dnd-kit/core';

function MapDroppable({ location, shots, onMove }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `map-${location.id}`,
    data: { type: 'map', locationId: location.id }
  });

  return (
    <div
      ref={setNodeRef}
      className={`relative w-full h-full min-h-[300px] border-2 border-dashed rounded-lg motion-safe:transition-colors ${isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}`}
      role="region"
      aria-label={`Map for ${location.name}`}
    >
      <div className="absolute top-2 left-2 text-sm font-bold text-gray-500 bg-white/80 px-2 py-1 rounded z-10 pointer-events-none">
        {location.name}
      </div>

      {/* Draw polygon base */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 300 300" preserveAspectRatio="xMidYMid meet">
        <polygon
          points={location.polygon.map(p => `${p[0]},${p[1]}`).join(' ')}
          fill="#f3f4f6"
          stroke="#d1d5db"
          strokeWidth="2"
        />
        <text x="50" y="50" fill="#9ca3af" fontSize="12">Placement Zone</text>
      </svg>

      {/* Render placed shots */}
      {shots.filter(s => s.locationId === location.id && s.x !== null && s.y !== null).map(shot => (
        <div
          key={`placed-${shot.id}`}
          className="absolute w-8 h-8 -ml-4 -mt-4 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs shadow-md shadow-blue-900/20 cursor-grab motion-safe:transition-transform"
          style={{
            left: `${shot.x}%`,
            top: `${shot.y}%`,
            transform: `rotate(${shot.rotation}deg)`
          }}
          title={shot.title}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') onMove(shot.id, { rotation: (shot.rotation + 45) % 360 });
            if (e.key === 'ArrowLeft') onMove(shot.id, { rotation: (shot.rotation - 45 + 360) % 360 });
          }}
          aria-label={`${shot.title} placed marker. Use left/right arrows to rotate.`}
        >
          <div className="w-1 h-3 bg-white absolute -top-1 rounded-sm" /> {/* Direction indicator */}
        </div>
      ))}
    </div>
  );
}

export default function LocationMap() {
  const locations = useStore(state => state.locations);
  const shots = useStore(state => state.shots);
  const moveShot = useStore(state => state.moveShot);
  const [activeTab, setActiveTab] = useState(locations[0]?.id);

  const activeLocation = locations.find(l => l.id === activeTab);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && over.id.startsWith('map-')) {
      const locationId = over.data.current.locationId;
      // In a real implementation we would convert pointer coords to relative container % coords
      // Here we place it near the center with a slight random offset to prevent exact stacking visually
      const x = 50 + (Math.random() * 10 - 5);
      const y = 50 + (Math.random() * 10 - 5);
      moveShot(active.id, { locationId, x, y, status: 'required' });
    }
  };

  return (
    <div className="flex flex-col h-full absolute inset-0 p-4">
      <div className="flex gap-2 mb-4">
        {locations.map(loc => (
          <button
            key={loc.id}
            onClick={() => setActiveTab(loc.id)}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${activeTab === loc.id ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-200 border border-gray-300'}`}
            aria-selected={activeTab === loc.id}
            role="tab"
          >
            {loc.name}
          </button>
        ))}
      </div>
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        <DndContext onDragEnd={handleDragEnd}>
          {activeLocation && (
            <MapDroppable location={activeLocation} shots={shots} onMove={moveShot} />
          )}
        </DndContext>
      </div>
    </div>
  );
}
