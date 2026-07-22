import { useStore } from '../store';

export const Tray = () => {
  const store = useStore();
  const trayCapsules = store.capsules.filter(c => c.status === 'tray');

  return (
    <div className="p-4 bg-white border rounded shadow">
      <h3 className="font-bold mb-2">Tray</h3>
      <div className="flex gap-2 flex-wrap">
        {trayCapsules.map(cap => (
          <button
            key={cap.capsuleId}
            onClick={() => store.setSelection({ kind: 'capsule', ids: [cap.capsuleId], primaryId: cap.capsuleId })}
            className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-xs font-bold text-white transition-transform ${
              store.selection.primaryId === cap.capsuleId ? 'ring-4 ring-blue-500 scale-110' : 'hover:scale-105'
            }`}
            style={{ backgroundColor: cap.variant }}
          >
            {cap.capsuleId.replace('CAP-', '')}
          </button>
        ))}
      </div>
    </div>
  );
};
