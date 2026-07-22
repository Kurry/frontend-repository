import { Header } from './components/Header';
import { Summary } from './components/Summary';
import { ServiceRecordsList } from './components/ServiceRecordsList';

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col gap-6">
          <Summary />
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-semibold mb-2">Instructions</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Create or edit service records for your bike.</li>
              <li>Use the forecast ribbon to adjust projected mileage.</li>
              <li>Observe derived metrics update in real-time.</li>
              <li>Export to save, Import to resume.</li>
            </ul>
          </div>
        </div>

        <div className="w-full md:w-2/3 lg:w-3/4 h-[calc(100vh-140px)] min-h-[500px]">
          <ServiceRecordsList />
        </div>
      </main>
    </div>
  );
}

export default App;
