import { useEffect, useRef } from 'react';
import { useWeavingStore } from './store';
import { initWebMCP } from './webmcp';
import { ThreadingGrid, TieUpGrid, TreadlingGrid } from './components/Grids';
import { Drawdown } from './components/Drawdown';
import { ColorPalette, VariantManager, ArtifactsPanel, ValidationPanel, SimulationPanel } from './components/Tools';
import { RepeatEditor } from './components/Repeats';

function App() {
  const store = useWeavingStore();
  const stateRef = useRef(store.state);

  useEffect(() => {
    stateRef.current = store.state;
  }, [store.state]);

  useEffect(() => {
    initWebMCP(store.dispatch, () => stateRef.current);
  }, [store.dispatch]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8 flex flex-col md:flex-row gap-8">
       <div className="flex-1 overflow-auto">
         <h1 className="text-3xl font-bold mb-8">Weaving Draft Constraint Studio</h1>

         <div className="flex flex-col gap-8">
           <div className="flex gap-4 items-start">
             <ThreadingGrid store={store} />
             <TieUpGrid store={store} />
           </div>

           <ColorPalette store={store} type="warp" />

           <div className="flex gap-4 items-start">
             <Drawdown store={store} />
             <TreadlingGrid store={store} />
           </div>

           <ColorPalette store={store} type="weft" />
         </div>
       </div>

       <div className="w-80 flex-shrink-0 flex flex-col gap-4">
          <ValidationPanel store={store} />
          <SimulationPanel store={store} />
          <RepeatEditor store={store} />
          <VariantManager store={store} />
          <ArtifactsPanel store={store} />
       </div>
    </div>
  );
}

export default App;
