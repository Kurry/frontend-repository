import { FIXTURES } from '../lib/fixtures';
import { useStore } from '../store/useStore';
export function TakeShelf() {
  const { selectedTake, selectWordSpan } = useStore();
  return (
    <div className="flex flex-col gap-4 p-4 border-b">
      <h2 className="text-xl font-bold">Takes</h2>
      {Object.values(FIXTURES.takes).map(take => (
        <div key={take.id} className={`p-4 border rounded ${selectedTake === take.id ? 'bg-blue-50' : ''}`}>
          <div className="font-mono mb-2">{take.id}</div>
          <div className="flex gap-2">
            {take.words.map(w => (
              <div key={w.id} className="px-2 py-1 bg-gray-200 cursor-pointer" draggable
                   onDragStart={() => selectWordSpan(take.id, [w.id])}>
                {w.text}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
