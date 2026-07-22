import { useStore } from '../store';

export const QueueRibbon = () => {
  const store = useStore();
  const trackA = store.capsules.filter(c => c.trackId === 'TRACK-A').sort((a, b) => (a.bayIndex || 0) - (b.bayIndex || 0));

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-bold">Queue (Track A)</h3>
      <div className="flex gap-1 overflow-x-auto pb-2">
        {store.bays.map(bayIndex => {
          const cap = trackA.find(c => c.bayIndex === bayIndex);
          return (
            <div key={bayIndex} className={`w-10 h-10 border flex items-center justify-center text-xs ${cap ? '' : 'bg-gray-100 border-dashed'}`}
                 style={cap ? { backgroundColor: cap.variant, color: 'white' } : {}}>
              {cap ? cap.capsuleId.replace('CAP-', '') : `G${bayIndex}`}
            </div>
          );
        })}
      </div>
    </div>
  );
};
