import React, { useEffect } from 'react';
import { Canvas } from './components/Canvas';
import { Timeline } from './components/Timeline';
import { useStore } from './store';
import { bindWebMCP } from './webmcp';

const App = () => {
    const { activeTool, setTool, exportState, importState, approveScore, score } = useStore();

    useEffect(() => {
        bindWebMCP();
    }, []);

    const handleExport = () => {
        const data = exportState();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'score.json';
        document.body.appendChild(a);
        a.click();
        // note: intentionally not removing child immediately for playwright compat
    };

    return (
        <div className="flex flex-col h-screen w-full overflow-hidden">
            <header className="bg-gray-800 text-white p-4 flex justify-between items-center shrink-0">
                <h1 className="text-xl font-bold">Stage Blocking Path Studio</h1>
                <div className="flex gap-4 items-center">
                    <span className="text-sm">Branch: {score.activeBranch}</span>
                    <button onClick={approveScore} className="px-3 py-1 bg-green-600 rounded hover:bg-green-700">Approve</button>
                    <button onClick={handleExport} className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700">Export</button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <aside className="w-64 bg-white border-r border-gray-200 p-4 shrink-0 flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <h3 className="font-semibold">Tools</h3>
                        <button onClick={() => setTool('select')} className={`px-2 py-1 rounded border ${activeTool === 'select' ? 'bg-blue-100 border-blue-500' : ''}`}>Select</button>
                        <button onClick={() => setTool('path')} className={`px-2 py-1 rounded border ${activeTool === 'path' ? 'bg-blue-100 border-blue-500' : ''}`}>Path</button>
                    </div>
                </aside>

                <main className="flex-1 flex flex-col bg-gray-100 overflow-hidden relative">
                    <Canvas />
                    <Timeline />
                </main>
            </div>
        </div>
    );
};

export default App;
