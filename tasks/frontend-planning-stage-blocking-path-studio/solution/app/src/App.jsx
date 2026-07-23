import React, { useEffect } from 'react';
import { Canvas } from './components/Canvas';
import { Timeline } from './components/Timeline';
import { useStore } from './store';
import { bindWebMCP } from './webmcp';

const App = () => {
    const { activeTool, setTool, exportState, importState, approveScore, score, feedbackMessage, setFeedbackMessage, analysisFindings, createBranch, checkoutBranch } = useStore();

    useEffect(() => {
        bindWebMCP();
    }, []);

    const handleApprove = () => {
        approveScore();
        setFeedbackMessage(feedbackMessage === 'Score approved' ? 'Score approved\u200B' : 'Score approved');
    };

    const handleExport = () => {
        const data = exportState();
        const a = document.createElement('a');
        a.href = `data:application/json;charset=utf-8,${encodeURIComponent(data)}`;
        a.download = 'score.json';
        document.body.appendChild(a);
        a.click();
        // note: intentionally not removing child immediately for playwright compat
        setFeedbackMessage(feedbackMessage === 'Score exported' ? 'Score exported\u200B' : 'Score exported');
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            importState(evt.target.result);
            setFeedbackMessage('Score imported\u200B');
            e.target.value = '';
        };
        reader.readAsText(file);
    };

    const handleNewBranch = () => {
        const name = prompt("New branch name:");
        if (name) {
            createBranch(name);
            setFeedbackMessage(`Branch ${name} created`);
        }
    };

    return (
        <div className="flex flex-col h-screen w-full overflow-hidden text-base">
            <header className="bg-gray-800 text-white p-4 flex flex-col md:flex-row justify-between items-center shrink-0 gap-4">
                <h1 className="text-xl font-bold">Stage Blocking Path Studio</h1>
                <div className="flex gap-4 items-center flex-wrap">
                    <div className="flex items-center gap-2">
                        <span className="text-sm">Branch:</span>
                        <select
                            value={score.activeBranch}
                            onChange={(e) => checkoutBranch(e.target.value)}
                            className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label="Select Branch"
                        >
                            {Object.keys(score.branches).map(b => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>
                        <button onClick={handleNewBranch} className="text-sm bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded">+</button>
                    </div>
                    <button onClick={handleApprove} className="min-h-[44px] px-4 py-2 bg-green-600 rounded-md shadow-sm transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">Approve</button>
                    <button onClick={handleExport} className="min-h-[44px] px-4 py-2 bg-blue-600 rounded-md shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">Export</button>
                    <label className="min-h-[44px] px-4 py-2 bg-purple-600 rounded-md shadow-sm transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer flex items-center">
                        Import
                        <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                    </label>
                </div>
            </header>

            {/* Live region for feedback */}
            <div aria-live="polite" className="sr-only">
                {feedbackMessage}
            </div>

            {feedbackMessage && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-2 absolute top-16 right-4 z-50 shadow-md rounded">
                    {feedbackMessage}
                </div>
            )}

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                <aside className="w-full md:w-64 bg-white border-b md:border-r border-gray-200 p-4 shrink-0 flex flex-row md:flex-col gap-4 overflow-x-auto">
                    <div className="flex flex-row md:flex-col gap-2 min-w-max">
                        <h2 className="font-semibold text-lg flex items-center">Tools</h2>
                        {['select', 'path', 'face', 'handoff', 'rehearsal', 'artifacts', 'analysis'].map(tool => (
                            <button
                                key={tool}
                                onClick={() => setTool(tool)}
                                className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-md border shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize ${activeTool === tool ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-white hover:bg-gray-100'}`}
                            >
                                {tool}
                            </button>
                        ))}
                    </div>

                    {analysisFindings.length > 0 && (
                        <div className="mt-4 flex flex-col gap-2 hidden md:flex">
                            <h2 className="font-semibold text-lg">Analysis</h2>
                            <ul className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200 list-disc pl-5">
                                {analysisFindings.map((f, i) => <li key={i}>{f}</li>)}
                            </ul>
                        </div>
                    )}
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
