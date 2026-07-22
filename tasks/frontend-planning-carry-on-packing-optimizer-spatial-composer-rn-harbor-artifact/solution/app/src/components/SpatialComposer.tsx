import { usePackingStore } from '../store';
import { useStore } from 'zustand';

const GRID_SIZE = 4; // 4x4 grid

export function SpatialComposer() {
  const store = useStore(usePackingStore);
  const { items, placeItem, unplaceItem, selectedItemId, setSelectedItemId } = store;

  const placedItems = items.filter(i => i.placed);
  const unplacedItems = items.filter(i => !i.placed);

  const derived = store.getDerivedState();

  const handleCellClick = (x: number, y: number) => {
    // If a cell is already occupied, allow clicking it to unplace or select
    const occupiedItem = placedItems.find(i => i.x === x && i.y === y);

    if (selectedItemId) {
        if (occupiedItem && occupiedItem.id !== selectedItemId) {
            // Can't place here
            return;
        }
        placeItem(selectedItemId, x, y);
        setSelectedItemId(null);
    } else if (occupiedItem) {
        // Toggle selection for unplacing
        setSelectedItemId(occupiedItem.id);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 p-4">
      {/* Left panel: Unplaced items */}
      <div className="flex-1 bg-white p-4 rounded shadow-md border border-gray-200">
        <h2 className="text-xl font-bold mb-4">Available Items</h2>
        <div className="space-y-2">
          {unplacedItems.length === 0 ? (
            <p className="text-gray-500 italic">No available items.</p>
          ) : (
            unplacedItems.map(item => (
              <div
                key={item.id}
                onClick={() => setSelectedItemId(item.id === selectedItemId ? null : item.id)}
                className={`p-3 rounded cursor-pointer border transition-colors ${
                  selectedItemId === item.id
                    ? 'bg-blue-100 border-blue-500'
                    : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                }`}
                tabIndex={0}
                role="button"
                aria-pressed={selectedItemId === item.id}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedItemId(item.id === selectedItemId ? null : item.id);
                    }
                }}
              >
                <div className="font-semibold">{item.name}</div>
                <div className="text-sm text-gray-600">
                  Status: {item.status} | Vol: {item.volume} | Wt: {item.weight}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Center panel: Spatial Grid */}
      <div className="flex-1 flex flex-col items-center">
        <h2 className="text-xl font-bold mb-4">Spatial Composer</h2>
        <div
          className="grid gap-2 p-4 bg-gray-100 rounded-xl"
          style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
          role="grid"
          aria-label="Packing grid"
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
            const x = index % GRID_SIZE;
            const y = Math.floor(index / GRID_SIZE);
            const itemInCell = placedItems.find(i => i.x === x && i.y === y);

            return (
              <div
                key={`${x}-${y}`}
                role="gridcell"
                tabIndex={0}
                aria-label={`Cell at ${x}, ${y}`}
                onClick={() => handleCellClick(x, y)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCellClick(x, y);
                    }
                }}
                className={`w-16 h-16 sm:w-20 sm:h-20 border-2 rounded flex items-center justify-center cursor-pointer transition-all duration-300 ${
                  itemInCell
                    ? (selectedItemId === itemInCell.id ? 'bg-blue-300 border-blue-600 shadow-lg scale-105' : 'bg-green-200 border-green-500 shadow')
                    : (selectedItemId ? 'bg-white hover:bg-blue-50 border-dashed border-gray-400' : 'bg-white border-gray-200')
                }`}
                style={{
                  transform: itemInCell && selectedItemId === itemInCell.id ? 'scale(1.05)' : 'none',
                  // Fallback for reduced motion can be handled globally via CSS or conditionally here
                }}
              >
                {itemInCell && (
                    <span className="text-xs font-bold text-center p-1 break-words">
                        {itemInCell.name}
                    </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions for placed items */}
        {selectedItemId && placedItems.find(i => i.id === selectedItemId) && (
            <div className="mt-4">
                <button
                    onClick={() => {
                        unplaceItem(selectedItemId);
                        setSelectedItemId(null);
                    }}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded font-medium focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                    Remove from Grid
                </button>
            </div>
        )}
      </div>

      {/* Right panel: Derived Decision Summary */}
      <div className="flex-1 bg-white p-4 rounded shadow-md border border-gray-200">
        <h2 className="text-xl font-bold mb-4">Capacity Summary</h2>
        <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded border">
                <span className="block text-sm text-gray-500 font-semibold">Total Weight</span>
                <span className="text-2xl font-bold">{derived.totalWeight.toFixed(1)} <span className="text-sm font-normal">kg</span></span>
            </div>
            <div className="p-3 bg-gray-50 rounded border">
                <span className="block text-sm text-gray-500 font-semibold">Total Volume</span>
                <span className="text-2xl font-bold">{derived.totalVolume.toFixed(1)} <span className="text-sm font-normal">L</span></span>
            </div>
            <div className="p-3 bg-gray-50 rounded border">
                <span className="block text-sm text-gray-500 font-semibold">Items Placed</span>
                <span className="text-2xl font-bold">{derived.placedItemsCount}</span>
            </div>

            <div className={`p-4 rounded-lg font-bold text-center border-2 ${
                derived.capacityStatus === 'under' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                derived.capacityStatus === 'optimal' ? 'bg-green-50 text-green-700 border-green-200' :
                'bg-red-50 text-red-700 border-red-200'
            }`}>
                Status: {derived.capacityStatus.toUpperCase()}
            </div>
        </div>
      </div>
    </div>
  );
}
