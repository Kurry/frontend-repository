import re

with open('/tmp/App.jsx', 'r') as f:
    content = f.read()

# 1. Add drawer support for navigation instead of flex-wrap
old_nav = """<div class="flex flex-wrap gap-2">
                    <button class="bg-indigo-500 hover:bg-indigo-400 px-3 py-2 min-h-[44px] rounded transition-all duration-300 ease-in-out hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none" onClick={() => setActiveTab('coverage')}>Coverage Matrix</button>
                    <button class="bg-indigo-500 hover:bg-indigo-400 px-3 py-2 min-h-[44px] rounded transition-all duration-300 ease-in-out hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none" onClick={() => setActiveTab('commitments')}>Commitments</button>
                    <button class="bg-indigo-500 hover:bg-indigo-400 px-3 py-2 min-h-[44px] rounded transition-all duration-300 ease-in-out hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none" onClick={() => setActiveTab('buffet')}>Buffet Layout</button>
                    <button class="bg-indigo-500 hover:bg-indigo-400 px-3 py-2 min-h-[44px] rounded transition-all duration-300 ease-in-out hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none" onClick={() => setActiveTab('run')}>Run Day</button>
                    <button class="bg-indigo-800 hover:bg-indigo-900 px-3 py-2 min-h-[44px] rounded border border-white transition-all duration-300 ease-in-out hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none" onClick={handleExportJSON}>{isExporting() ? "Exporting..." : "Export JSON"}</button>
                </div>"""

new_nav = """<div class="hidden sm:flex flex-wrap gap-2">
                    <button class="bg-indigo-500 hover:bg-indigo-400 px-3 py-2 min-h-[44px] rounded transition-all duration-300 ease-in-out hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none" onClick={() => setActiveTab('coverage')}>Coverage Matrix</button>
                    <button class="bg-indigo-500 hover:bg-indigo-400 px-3 py-2 min-h-[44px] rounded transition-all duration-300 ease-in-out hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none" onClick={() => setActiveTab('commitments')}>Commitments</button>
                    <button class="bg-indigo-500 hover:bg-indigo-400 px-3 py-2 min-h-[44px] rounded transition-all duration-300 ease-in-out hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none" onClick={() => setActiveTab('buffet')}>Buffet Layout</button>
                    <button class="bg-indigo-500 hover:bg-indigo-400 px-3 py-2 min-h-[44px] rounded transition-all duration-300 ease-in-out hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none" onClick={() => setActiveTab('run')}>Run Day</button>
                    <button class="bg-indigo-800 hover:bg-indigo-900 px-3 py-2 min-h-[44px] rounded border border-white transition-all duration-300 ease-in-out hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none" onClick={handleExportJSON}>{isExporting() ? "Exporting..." : "Export JSON"}</button>
                </div>
                <div class="sm:hidden relative">
                    <button class="bg-indigo-800 px-4 py-2 min-h-[44px] rounded border border-white" onClick={() => setIsMenuOpen(!isMenuOpen())}>Menu</button>
                    <Show when={isMenuOpen()}>
                        <div class="absolute right-0 top-12 bg-white text-indigo-900 rounded shadow-lg p-2 flex flex-col gap-2 w-48 z-50">
                            <button class="text-left px-3 py-2 min-h-[44px] hover:bg-indigo-100 rounded" onClick={() => { setActiveTab('coverage'); setIsMenuOpen(false); }}>Coverage Matrix</button>
                            <button class="text-left px-3 py-2 min-h-[44px] hover:bg-indigo-100 rounded" onClick={() => { setActiveTab('commitments'); setIsMenuOpen(false); }}>Commitments</button>
                            <button class="text-left px-3 py-2 min-h-[44px] hover:bg-indigo-100 rounded" onClick={() => { setActiveTab('buffet'); setIsMenuOpen(false); }}>Buffet Layout</button>
                            <button class="text-left px-3 py-2 min-h-[44px] hover:bg-indigo-100 rounded" onClick={() => { setActiveTab('run'); setIsMenuOpen(false); }}>Run Day</button>
                            <button class="text-left px-3 py-2 min-h-[44px] bg-indigo-100 hover:bg-indigo-200 rounded font-bold" onClick={(e) => { handleExportJSON(e); setIsMenuOpen(false); }}>{isExporting() ? "Exporting..." : "Export JSON"}</button>
                        </div>
                    </Show>
                </div>"""

content = content.replace(old_nav, new_nav)
content = content.replace(
    "const [isExporting, setIsExporting] = createSignal(false);",
    "const [isExporting, setIsExporting] = createSignal(false);\n    const [isMenuOpen, setIsMenuOpen] = createSignal(false);"
)

# 2. Add realistic ledger calc and remove fake PWA offline tag
content = content.replace(
    '<span class="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full font-bold">PWA Offline Ready</span>',
    ''
)

old_ledger = """                                <ul class="list-none space-y-1 text-sm font-mono bg-white p-3 border rounded shadow-inner">
                                    <li class="flex justify-between border-b pb-1"><span>Requested:</span> <span>0 cents</span></li>
                                    <li class="flex justify-between border-b py-1"><span>Approved:</span> <span>0 cents</span></li>
                                    <li class="flex justify-between border-b py-1"><span>Reversed:</span> <span>0 cents</span></li>
                                    <li class="flex justify-between border-b py-1"><span>Paid-simulated:</span> <span>0 cents</span></li>
                                    <li class="flex justify-between pt-1 font-bold"><span>Remaining:</span> <span>0 cents</span></li>
                                </ul>"""

new_ledger = """                                <ul class="list-none space-y-1 text-sm font-mono bg-white p-3 border rounded shadow-inner">
                                    <li class="flex justify-between border-b pb-1"><span>Requested:</span> <span>{state.commitments.reduce((sum, c) => sum + (c.portions * 50), 0)} cents</span></li>
                                    <li class="flex justify-between border-b py-1"><span>Approved:</span> <span>{state.commitments.filter(c => ['accepted', 'arrived-partial', 'arrived-complete', 'reconciled'].includes(c.state)).reduce((sum, c) => sum + (c.portions * 50), 0)} cents</span></li>
                                    <li class="flex justify-between border-b py-1"><span>Reversed:</span> <span>{state.commitments.filter(c => ['declined', 'withdrawn', 'failed'].includes(c.state)).reduce((sum, c) => sum + (c.portions * 50), 0)} cents</span></li>
                                    <li class="flex justify-between border-b py-1"><span>Paid-simulated:</span> <span>{state.commitments.filter(c => ['reconciled'].includes(c.state)).reduce((sum, c) => sum + (c.portions * 50), 0)} cents</span></li>
                                    <li class="flex justify-between pt-1 font-bold"><span>Remaining:</span> <span>{state.commitments.filter(c => !['reconciled', 'declined', 'withdrawn', 'failed'].includes(c.state)).reduce((sum, c) => sum + (c.portions * 50), 0)} cents</span></li>
                                </ul>"""

content = content.replace(old_ledger, new_ledger)

with open('/tmp/App.jsx', 'w') as f:
    f.write(content)
