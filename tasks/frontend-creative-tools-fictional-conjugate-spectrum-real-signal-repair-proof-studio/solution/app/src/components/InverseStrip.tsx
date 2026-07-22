
import { useStore } from '../store';
import { formatGaussian } from '../lib/math';

export function InverseStrip() {
  const store = useStore();

  // Use preview samples if previewing, otherwise current
  const samples = store.getInverseSamples();

  return (
    <div className="flex flex-col gap-4 p-4 bg-white border rounded shadow mt-4">
      <h2 className="font-bold text-lg">Inverse Time Samples</h2>
      <div className="flex gap-4 overflow-x-auto">
        {samples.map((s, n) => {
          // Render stems for Real and Imaginary
          // Sample value is in quarters.
          // Max amplitude ~ 8 quarters (value 2).
          // SVG height 200, origin 100.
          const O = 100;
          const scale = 20; // 1 quarter = 20px

          const yR = O - (s.r / 4) * scale;
          const yI = O - (s.i / 4) * scale;

          const isSelected = store.selectedSample === n;

          return (
            <div
              key={n}
              className={`flex flex-col items-center border p-2 rounded cursor-pointer ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => store.selectSample(n)}
            >
              <div className="text-sm font-mono font-semibold mb-2">n={n}</div>
              <svg width="60" height="200" className="bg-gray-50 border">
                {/* Zero line */}
                <line x1="0" y1={O} x2="60" y2={O} stroke="black" />

                {/* Real stem */}
                <line x1="20" y1={O} x2="20" y2={yR} stroke="blue" strokeWidth="4" />
                <circle cx="20" cy={yR} r="4" fill="blue" />

                {/* Imaginary stem */}
                <line x1="40" y1={O} x2="40" y2={yI} stroke="red" strokeWidth="4" />
                <circle cx="40" cy={yI} r="4" fill="red" />
              </svg>
              <div className="text-xs mt-2 text-center h-8 font-mono">
                {formatGaussian(s, true)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Proof / Energy Info */}
      <div className="grid grid-cols-2 gap-4 mt-4 bg-gray-50 p-4 border rounded font-mono text-sm">
        <div>
          <div className="font-bold text-gray-700">Invariants</div>
          <div>Residual: {formatGaussian(store.getResidual(), true)}</div>
          <div>Max |Im x|: {formatGaussian({r: store.getMaxImaginaryMagnitude(), i: 0}, true)}</div>
          <div className="text-red-600">
             Imag Energy: {store.getMaxImaginaryMagnitude() > 0 ? formatGaussian({r: store.getMaxImaginaryMagnitude() * store.getMaxImaginaryMagnitude(), i:0}, true) : "0"}
          </div>
        </div>
        <div>
          <div className="font-bold text-gray-700">Parseval Ledger</div>
          <div>Spectrum Energy: {formatGaussian({r: store.getSpectrumEnergy(), i:0}, false)}</div>
          <div>Time Energy: {formatGaussian({r: store.getTimeEnergy(), i:0}, false)}</div>
        </div>
      </div>
    </div>
  );
}
