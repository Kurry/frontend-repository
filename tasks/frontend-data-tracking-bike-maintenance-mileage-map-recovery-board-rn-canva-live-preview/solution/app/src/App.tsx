import { useEffect, useState } from 'react';
import { Collection } from './components/Collection';
import { RecoveryBoard } from './components/RecoveryBoard';
import { Inspector } from './components/Inspector';
import { useStore } from './store';
import { Bike } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const { undo } = useStore();
  const [mobileTab, setMobileTab] = useState<'collection' | 'recovery' | 'inspector'>('collection');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">

      {/* Header */}
      <header className="bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
           <div className="bg-slate-800 p-2 rounded-lg text-white">
             <Bike size={20} />
           </div>
           <h1 className="font-bold text-lg hidden sm:block tracking-tight text-slate-900">
             Mileage Map Workspace
           </h1>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 max-w-[1600px] w-full mx-auto flex flex-col md:flex-row gap-4 h-[calc(100vh-73px)]">

        {/* Desktop Layout (hidden on mobile, controlled by CSS grid/flex) */}
        <div className="hidden md:flex w-full gap-4 h-full">
           <div className="w-1/3 min-w-[300px] h-full">
             <Collection />
           </div>
           <div className="flex-1 h-full min-w-[400px]">
             <RecoveryBoard />
           </div>
           <div className="w-1/4 min-w-[280px] h-full">
             <Inspector />
           </div>
        </div>

        {/* Mobile Layout (stacked/tabbed) */}
        <div className="md:hidden flex flex-col h-full overflow-hidden relative">

          <div className="flex bg-white rounded-t-lg border-b border-slate-200">
             <button
               onClick={() => setMobileTab('collection')}
               className={`flex-1 py-3 flex justify-center text-sm font-medium ${mobileTab === 'collection' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
             >
                Collection
             </button>
             <button
               onClick={() => setMobileTab('recovery')}
               className={`flex-1 py-3 flex justify-center text-sm font-medium ${mobileTab === 'recovery' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
             >
                Recovery
             </button>
             <button
               onClick={() => setMobileTab('inspector')}
               className={`flex-1 py-3 flex justify-center text-sm font-medium ${mobileTab === 'inspector' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
             >
                Inspector
             </button>
          </div>

          <div className="flex-1 overflow-hidden relative">
             <AnimatePresence mode="wait">
                {mobileTab === 'collection' && (
                  <motion.div key="col" initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:20}} className="h-full pt-4">
                     <Collection />
                  </motion.div>
                )}
                {mobileTab === 'recovery' && (
                  <motion.div key="rec" initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:20}} className="h-full pt-4">
                     <RecoveryBoard />
                  </motion.div>
                )}
                {mobileTab === 'inspector' && (
                  <motion.div key="ins" initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:20}} className="h-full pt-4">
                     <Inspector />
                  </motion.div>
                )}
             </AnimatePresence>
          </div>

        </div>

      </main>
    </div>
  );
}

export default App;
