
import { AppProvider } from "./store";
import { IngredientEditor } from "./components/IngredientEditor";
import { ConstraintCanvas } from "./components/ConstraintCanvas";
import { TopBar } from "./components/TopBar";

function MainApp() {


  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans">
      <TopBar />
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <aside className="w-full md:w-80 border-r border-slate-200 bg-white flex flex-col overflow-y-auto">
          <IngredientEditor />
        </aside>
        <main className="flex-1 overflow-x-auto overflow-y-auto bg-slate-100 p-4">
          <ConstraintCanvas />
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

export default App;
