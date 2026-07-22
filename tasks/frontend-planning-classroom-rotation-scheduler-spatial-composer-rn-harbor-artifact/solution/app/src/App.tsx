import React, { useEffect, useRef } from 'react';
import { StationsProvider, useStations } from './context/StationsContext';
import { StationsList } from './components/StationsList';
import { Summary } from './components/Summary';
import { SpatialComposer } from './components/SpatialComposer';
import { Header } from './components/Header';
import { initWebMCP } from './webmcp';

const WebMCPBridge: React.FC = () => {
  const { state, dispatch } = useStations();
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    initWebMCP(() => stateRef.current, dispatch);
  }, [dispatch]);

  return null;
}

function App() {
  return (
    <StationsProvider>
      <WebMCPBridge />
      <div className="min-h-screen flex flex-col bg-gray-100">
        <Header />

        <main className="flex-1 p-4 lg:p-6 max-w-[1600px] mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-100px)]">

            {/* Left Panel: Stations Collection */}
            <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6 h-full">
              <div className="flex-shrink-0">
                <Summary />
              </div>
              <div className="flex-1 min-h-0">
                <StationsList />
              </div>
            </div>

            {/* Right Panel: Spatial Composer */}
            <div className="lg:col-span-8 xl:col-span-9 h-[500px] lg:h-full">
              <SpatialComposer />
            </div>

          </div>
        </main>
      </div>
    </StationsProvider>
  );
}

export default App;
