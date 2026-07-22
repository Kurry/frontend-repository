import { History } from "./components/History";
import { Rehearsal } from "./components/Rehearsal";
import { LinkedEvidence } from "./components/LinkedEvidence";
import { HookRail } from "./components/HookRail";
import { useEffect } from 'react';
import { useStore } from './store';
import { Layout } from './components/Layout';

function App() {
  const init = useStore(state => state.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <Layout>
      <div className="flex w-full flex-col lg:flex-row h-full">
         <div className="flex-1 overflow-auto border-r border-border p-4 bg-muted/10">
            {/* Hook Rail Area */}
            <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Badge Rail</h2>
            <div className="flex gap-4">
                <HookRail />
            </div>
         </div>
         <div className="w-full lg:w-[400px] xl:w-[480px] shrink-0 overflow-y-auto bg-background p-4">
            {/* Arrival desk / linked evidence area */}
            <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Arrival Desk</h2>
            <div className="space-y-6">
                <LinkedEvidence />
                <Rehearsal />
                <History />
            </div>
         </div>
      </div>
    </Layout>
  );
}

export default App;
