import { useStore } from '../store/store';

export function AdvancedViews() {
  const store = useStore();
  const { supportEdges, bricks } = store;

  return (
    <div className="w-full bg-white border-t p-4 flex flex-col gap-4 max-h-64 overflow-y-auto">
      <div className="flex gap-4">
        {/* Support Matrix */}
        <div className="flex-1 border p-2 rounded">
          <h3 className="font-bold border-b mb-2 text-sm">Support Matrix & Graph</h3>
          <div className="text-xs text-gray-700">
            {Object.values(supportEdges).length > 0 ? (
              <table className="w-full text-left">
                <thead><tr><th>Lower</th><th>Upper</th><th>Fraction</th></tr></thead>
                <tbody>
                  {Object.values(supportEdges).map(edge => (
                    <tr key={edge.id} className="border-t">
                      <td>{edge.supporterBrickId}</td>
                      <td>{edge.supportedBrickId}</td>
                      <td className={edge.ratioNumerator * 2 < edge.ratioDenominator ? "text-red-500 font-bold" : "text-green-600"}>
                        {edge.ratioNumerator}/{edge.ratioDenominator}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div className="italic text-gray-500">No support derived.</div>}
          </div>
        </div>

        {/* Elevations (Front/Side Cutaway) */}
        <div className="flex-1 border p-2 rounded">
          <h3 className="font-bold border-b mb-2 text-sm">Elevations</h3>
          <div className="text-xs text-gray-700 flex flex-col gap-1">
            <div className="flex gap-2 items-center">
              <span className="font-semibold w-16">Course 4:</span>
              <span className="h-4 bg-gray-100 flex-1 border border-gray-300"></span>
            </div>
            <div className="flex gap-2 items-center">
              <span className="font-semibold w-16">Course 3:</span>
              <span className="h-4 bg-gray-200 flex-1 border border-gray-300 relative">
                {Object.values(bricks).filter(b => b.course === 3).map((b, i) => (
                  <span key={i} className="absolute inset-y-0 bg-red-400 opacity-50" style={{left: `${(b.x/12)*100}%`, width: `${(2/12)*100}%`}}></span>
                ))}
              </span>
            </div>
            <div className="flex gap-2 items-center">
              <span className="font-semibold w-16">Course 2:</span>
              <span className="h-4 bg-gray-200 flex-1 border border-gray-300 relative">
                {Object.values(bricks).filter(b => b.course === 2).map((b, i) => (
                  <span key={i} className="absolute inset-y-0 bg-blue-400 opacity-50" style={{left: `${(b.x/12)*100}%`, width: `${(4/12)*100}%`}}></span>
                ))}
              </span>
            </div>
            <div className="flex gap-2 items-center">
              <span className="font-semibold w-16">Course 1:</span>
              <span className="h-4 bg-gray-300 flex-1 border border-gray-400 relative">
                <span className="absolute inset-y-0 bg-gray-500 opacity-50" style={{left: '33%', width: '33%'}}></span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Histogram & Parts Ledger */}
      <div className="flex gap-4 text-xs">
        <div className="flex-1">
          <h3 className="font-bold border-b mb-1">Fraction Histogram</h3>
          <div className="flex gap-2 text-gray-700">
            <span>&ge; 1/1: {Object.values(supportEdges).filter(e => e.ratioNumerator === e.ratioDenominator).length}</span>
            <span>&ge; 1/2: {Object.values(supportEdges).filter(e => e.ratioNumerator * 2 >= e.ratioDenominator && e.ratioNumerator !== e.ratioDenominator).length}</span>
            <span className="text-red-500 font-bold">&lt; 1/2: {Object.values(supportEdges).filter(e => e.ratioNumerator * 2 < e.ratioDenominator).length}</span>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-bold border-b mb-1">Parts Ledger</h3>
          <div className="text-gray-700">
            Total active bricks: {Object.values(bricks).filter(b => b.status === 'active').length}
          </div>
        </div>
      </div>
    </div>
  );
}
