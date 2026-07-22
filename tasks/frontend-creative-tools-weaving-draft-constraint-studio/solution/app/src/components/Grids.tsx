import { useWeavingStore } from '../store';
import { Shaft, Treadle } from '../types';

export function ThreadingGrid({ store }: { store: ReturnType<typeof useWeavingStore> }) {
  const { state, dispatch } = store;

  return (
    <div className="flex flex-col">
      <h3 className="text-sm font-semibold mb-2">Threading</h3>
      <div className="grid border border-gray-300 w-fit" style={{ gridTemplateColumns: `repeat(${state.dimensions.ends}, minmax(0, 1fr))` }}>
        {[3, 2, 1, 0].map(shaft => (
          Array.from({ length: state.dimensions.ends }).map((_, end) => (
             <div
               key={`t-${shaft}-${end}`}
               onClick={() => dispatch({ type: 'SET_THREADING', index: end, shaft: shaft as Shaft })}
               className={`w-6 h-6 border-r border-b border-gray-200 cursor-pointer ${state.threading[end] === shaft ? 'bg-black' : 'bg-white'}`}
             ></div>
          ))
        ))}
      </div>
    </div>
  );
}

export function TreadlingGrid({ store }: { store: ReturnType<typeof useWeavingStore> }) {
  const { state, dispatch } = store;

  return (
    <div className="flex flex-col">
      <h3 className="text-sm font-semibold mb-2">Treadling</h3>
      <div className="grid border border-gray-300 w-fit" style={{ gridTemplateRows: `repeat(${state.dimensions.picks}, minmax(0, 1fr))`, gridTemplateColumns: `repeat(4, minmax(0, 1fr))` }}>
         {Array.from({ length: state.dimensions.picks }).map((_, pick) => (
            [0, 1, 2, 3].map(treadle => (
               <div
                 key={`tr-${pick}-${treadle}`}
                 onClick={() => dispatch({ type: 'SET_TREADLING', index: pick, treadle: treadle as Treadle })}
                 className={`w-6 h-6 border-r border-b border-gray-200 cursor-pointer ${state.treadling[pick] === treadle ? 'bg-black' : 'bg-white'}`}
               ></div>
            ))
         ))}
      </div>
    </div>
  );
}

export function TieUpGrid({ store }: { store: ReturnType<typeof useWeavingStore> }) {
  const { state, dispatch } = store;
  return (
    <div className="flex flex-col">
      <h3 className="text-sm font-semibold mb-2">Tie-up</h3>
      <div className="grid border border-gray-300 w-fit" style={{ gridTemplateRows: 'repeat(4, minmax(0,1fr))', gridTemplateColumns: 'repeat(4, minmax(0,1fr))' }}>
        {[3, 2, 1, 0].map(shaft => (
          [0, 1, 2, 3].map(treadle => (
            <div
               key={`tu-${treadle}-${shaft}`}
               onClick={() => dispatch({ type: 'SET_TIE_UP', treadle, shaft, value: !state.tieUp[treadle][shaft] })}
               className={`w-6 h-6 border-r border-b border-gray-200 cursor-pointer ${state.tieUp[treadle][shaft] ? 'bg-black' : 'bg-white'}`}
            ></div>
          ))
        ))}
      </div>
    </div>
  );
}
