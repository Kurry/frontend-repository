import { useStore } from '../lib/store';

export function PassStack() {
  const store = useStore();

  return (
    <div className="w-80 bg-neutral-800 border-l border-neutral-700 p-4 flex flex-col gap-2 overflow-y-auto">
      <h2 className="text-sm font-semibold mb-2">Pass Stack</h2>
      {store.passes.filter(p => p.status === 'active').sort((a,b) => a.order - b.order).map(pass => (
        <div
          key={pass.id}
          className={`p-3 rounded border text-sm cursor-pointer ${store.selectedPassId === pass.id ? 'border-blue-500 bg-blue-500/10' : 'border-neutral-600 bg-neutral-900'}`}
          onClick={() => store.selectPass(pass.id)}
        >
          <div className="font-medium text-neutral-200">{pass.label}</div>
          <div className="text-neutral-400 text-xs mt-1">
            Duration: {pass.durationDs} ds<br/>
            Bounds: [{pass.mask.xMm}, {pass.mask.xMm + pass.mask.widthMm}) mm<br/>
            Factor: {pass.outputFactorMilli / 1000}x
          </div>

          {store.selectedPassId === pass.id && (
            <div className="mt-3 flex gap-2">
              <button
                className="px-2 py-1 bg-neutral-700 hover:bg-neutral-600 rounded text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  store.previewRecipeRebase(pass.id, 900);
                  store.commitRecipeRebase(pass.id, 900);
                }}
              >
                Simulate 0.9x Corr
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
