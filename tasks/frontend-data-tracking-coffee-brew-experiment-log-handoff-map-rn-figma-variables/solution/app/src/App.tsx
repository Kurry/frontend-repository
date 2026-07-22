
import { Header } from './components/Header';
import { BrewList } from './components/BrewList';
import { BrewDetail } from './components/BrewDetail';
import { HandoffMap } from './components/HandoffMap';

function App() {
  return (
    <div className="h-screen w-screen flex flex-col bg-stone-50 overflow-hidden font-sans">
      <Header />
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="w-full md:w-80 shrink-0 h-1/3 md:h-full border-b md:border-b-0 md:border-r border-stone-200 z-10">
          <BrewList />
        </div>
        <div className="w-full md:w-80 shrink-0 h-1/3 md:h-full border-b md:border-b-0 md:border-r border-stone-200 z-10">
          <BrewDetail />
        </div>
        <div className="flex-1 h-1/3 md:h-full z-0">
          <HandoffMap />
        </div>
      </div>
    </div>
  );
}

export default App;
