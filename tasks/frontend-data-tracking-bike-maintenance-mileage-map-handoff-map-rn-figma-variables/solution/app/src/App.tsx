import { RecordList } from './components/RecordList';
import { HandoffMap } from './components/HandoffMap';
import { Inspector } from './components/Inspector';

function App() {
  return (
    <div className="flex flex-col sm:flex-row h-screen w-full overflow-hidden bg-white text-gray-900 font-sans">
      <div className="w-full sm:w-80 shrink-0 h-1/3 sm:h-full border-b sm:border-b-0 sm:border-r border-gray-200">
         <RecordList />
      </div>
      <div className="flex-1 min-w-0 flex flex-col relative h-1/3 sm:h-full">
         <HandoffMap />
      </div>
      <div className="w-full sm:w-80 shrink-0 h-1/3 sm:h-full">
         <Inspector />
      </div>
    </div>
  );
}

export default App;
