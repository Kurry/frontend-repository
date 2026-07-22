import React, { useState, useRef } from 'react';
import { CanvasLayer } from './types';

export default function Canvas({ layers, setLayers }: { layers: CanvasLayer[], setLayers: React.Dispatch<React.SetStateAction<CanvasLayer[]>> }) {
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedLayerId(id);
    const layer = layers.find(l => l.id === id);
    if (!layer || layer.locked) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const initialPos = layer.position;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      setLayers(prev => prev.map(l =>
        l.id === id ? { ...l, position: { x: initialPos.x + dx, y: initialPos.y + dy } } : l
      ));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleContainerClick = () => {
    setSelectedLayerId(null);
  };

  const addLayer = () => {
    const newLayer: CanvasLayer = {
      id: `layer-${Date.now()}`,
      type: 'text',
      position: { x: 50, y: 50 },
      rotation: 0,
      dimensions: { width: 150, height: 50 },
      content: 'New Text Layer',
      locked: false,
      hidden: false,
      zIndex: layers.length,
    };
    setLayers(prev => [...prev, newLayer]);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-2 flex gap-2">
        <button onClick={addLayer} className="px-2 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300">Add Layer</button>
      </div>
      <div
        ref={containerRef}
        onClick={handleContainerClick}
        className="relative bg-white shadow-xl overflow-hidden"
        style={{ width: '5in', height: '7in', border: '1px solid #ccc' }}
      >
        <div className="absolute inset-0 flex items-center justify-center text-gray-200 select-none pointer-events-none text-2xl font-bold">
          Canvas (5x7)
        </div>
        {layers.filter(l => !l.hidden).map(layer => (
          <div
            key={layer.id}
            onMouseDown={(e) => handleDragStart(e, layer.id)}
            className={`absolute cursor-move flex items-center justify-center ${selectedLayerId === layer.id ? 'border-2 border-blue-500 shadow-md' : 'border border-dashed border-gray-400'} ${layer.locked ? 'bg-gray-100 cursor-not-allowed' : 'bg-blue-50/50 hover:bg-blue-100/50'}`}
            style={{
              left: layer.position.x, top: layer.position.y,
              width: layer.dimensions.width, height: layer.dimensions.height,
              transform: `rotate(${layer.rotation}deg)`,
              zIndex: layer.zIndex
            }}>
            {layer.type === 'text' && <span className="p-1 break-words w-full h-full text-center font-serif text-2xl text-blue-900">{layer.content}</span>}
            {layer.type === 'image' && <img src={layer.src || 'https://via.placeholder.com/150'} alt={layer.altText || 'Image layer'} className="w-full h-full object-cover" />}
            {layer.type === 'shape' && <div className="w-full h-full bg-blue-300 rounded"></div>}
            {layer.type === 'rsvp-code' && <div className="w-full h-full bg-gray-800 text-white flex items-center justify-center font-mono text-xl tracking-widest">{layer.content}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
