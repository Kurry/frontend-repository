import { useReducer } from 'react';
import { appReducer, initialState, StateContext } from './store';
import { Sidebar, MainCanvas, InspectorPanel } from './Components';
import { WebMCPManager } from './WebMCP';

function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <StateContext.Provider value={{ state, dispatch }}>
      <WebMCPManager />
      <div className="flex flex-col md:flex-row h-screen w-full bg-slate-100 overflow-hidden text-slate-800 font-sans">
        <Sidebar />
        <MainCanvas />
        <InspectorPanel />
      </div>
    </StateContext.Provider>
  );
}

export default App;
