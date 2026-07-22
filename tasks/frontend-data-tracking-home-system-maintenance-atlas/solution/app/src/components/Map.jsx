import React, { useState } from 'react';
import { useAppContext } from '../store';
import { Link } from 'lucide-react';

export const Map = () => {
  const { state, dispatch } = useAppContext();
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [draggedAsset, setDraggedAsset] = useState(null);
  const [linkSource, setLinkSource] = useState(null);

  const roomsByFloor = state.rooms.reduce((acc, r) => {
    if (!acc[r.floor]) acc[r.floor] = [];
    acc[r.floor].push(r);
    return acc;
  }, {});

  const handleDrop = (e, roomId) => {
    e.preventDefault();
    if (draggedAsset) {
      dispatch({ type: 'MOVE_ASSET', payload: { assetId: draggedAsset, roomId } });
      setDraggedAsset(null);
    }
  };

  const handleAssetClick = (e, assetId) => {
    e.stopPropagation();
    if (linkSource) {
      if (linkSource !== assetId) {
        dispatch({ type: 'ADD_EDGE', payload: { source: linkSource, target: assetId, type: 'supplies' } });
      }
      setLinkSource(null);
    } else {
      setSelectedAsset(assetId);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 flex flex-col gap-4">
      <h2 className="text-lg font-bold">Floor & System Topology</h2>

      <div className="flex gap-2 mb-2">
        <button className="flex items-center gap-1 px-3 py-1 bg-white border rounded text-sm hover:bg-gray-100 shadow-sm" onClick={() => setLinkSource(selectedAsset)} disabled={!selectedAsset}>
          <Link size={16} /> Link Selected
        </button>
      </div>

      <div className="flex gap-4">
        {[1, 2, 3].map(floor => (
          <div key={floor} className="flex-1 min-w-[200px]">
            <h3 className="font-semibold text-gray-700 mb-2 border-b pb-1">Floor {floor}</h3>
            <div className="flex flex-col gap-2">
              {(roomsByFloor[floor] || []).map(room => (
                <div
                  key={room.id}
                  className="min-h-[100px] border-2 border-dashed border-gray-300 p-2 bg-white relative rounded-md transition-colors"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, room.id)}
                >
                  <div className="text-xs text-gray-400 absolute top-1 left-1">{room.name}</div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {state.assets.filter(a => a.roomId === room.id).map(asset => (
                      <div
                        key={asset.id}
                        draggable
                        onDragStart={() => setDraggedAsset(asset.id)}
                        onClick={(e) => handleAssetClick(e, asset.id)}
                        className={`text-xs px-2 py-1 rounded cursor-pointer border shadow-sm transition-all
                          ${selectedAsset === asset.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white hover:bg-gray-50'}
                          ${linkSource === asset.id ? 'ring-2 ring-purple-500 animate-pulse' : ''}
                        `}
                      >
                        <div className="font-medium truncate max-w-[120px]">{asset.name}</div>
                        <div className="text-[10px] text-gray-500 uppercase">{asset.type}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-semibold text-gray-600 mb-2">System Dependencies</h3>
        <div className="text-xs text-gray-600 max-h-32 overflow-y-auto border p-2 bg-white rounded">
          {state.edges.map(e => {
            const src = state.assets.find(a => a.id === e.source)?.name;
            const tgt = state.assets.find(a => a.id === e.target)?.name;
            return <div key={e.id}>{src} <span className="font-mono text-blue-600 mx-1">--[{e.type}]-&gt;</span> {tgt}</div>;
          })}
        </div>
      </div>
    </div>
  );
};
