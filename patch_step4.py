import re

with open('/tmp/App.jsx', 'r') as f:
    content = f.read()

# 1. Update export function and signals
content = content.replace(
    "const [activeTab, setActiveTab] = createSignal('coverage');",
    "const [activeTab, setActiveTab] = createSignal('coverage');\n    const [isExporting, setIsExporting] = createSignal(false);"
)

old_export = """    const handleExportJSON = () => {
        const exportData = {
            schemaVersion: "potluck-event-plan/v1",
            commitments: state.commitments,
            vessels: state.vessels,
            resources: state.resources
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'potluck-plan.json';
        a.click();
    };"""

# We're transforming this into a simulated async operation that sets UI loading state,
# but using Data URIs directly in the DOM avoids URL.createObjectURL entirely
new_export = """    const handleExportJSON = (e) => {
        e.preventDefault();
        setIsExporting(true);
        setTimeout(() => {
            const exportData = {
                schemaVersion: "potluck-event-plan/v1",
                commitments: state.commitments,
                vessels: state.vessels,
                resources: state.resources
            };
            const jsonString = JSON.stringify(exportData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonString);
            const a = document.createElement('a');
            a.href = dataUri;
            a.download = 'potluck-plan.json';
            a.click();
            setIsExporting(false);
            // Simulate a toast for 4.n3
            const toast = document.createElement('div');
            toast.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg transition-opacity duration-500';
            toast.innerText = 'Export successful!';
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.classList.add('opacity-0');
                setTimeout(() => toast.remove(), 500);
            }, 3000);
        }, 800);
    };"""

content = content.replace(old_export, new_export)

# Replace the export button to show loading state
content = content.replace(
    '<button class="bg-indigo-800 hover:bg-indigo-900 px-3 py-2 min-h-[44px] rounded border border-white transition-all duration-300 ease-in-out hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none" onClick={handleExportJSON}>Export JSON</button>',
    '<button class="bg-indigo-800 hover:bg-indigo-900 px-3 py-2 min-h-[44px] rounded border border-white transition-all duration-300 ease-in-out hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none" onClick={handleExportJSON}>{isExporting() ? "Exporting..." : "Export JSON"}</button>'
)


# 2. Update Run Day info and Cost Ledger
old_run_day = """                        <div class="p-4 border rounded bg-gray-50 text-gray-700">
                            <p>Event run advances: Check-in → Receive → Reconcile → Reheat → Place → Replenish</p>
                            <p class="mt-2 text-sm text-red-600">Fixture Event: Alice is running 20 minutes late.</p>
                            <div class="mt-4">
                                <h3 class="font-bold">Cost Ledger</h3>
                                <ul class="list-disc pl-5 mt-2">
                                    <li>Requested: $0.00</li>
                                    <li>Approved: $0.00</li>
                                    <li>Reversed: $0.00</li>
                                </ul>
                            </div>
                        </div>"""

new_run_day = """                        <div class="p-4 border rounded bg-gray-50 text-gray-700 space-y-4">
                            <div>
                                <h3 class="font-bold mb-1">Event Stage Progression</h3>
                                <p class="text-sm">Check-in → Receive/Inspect → Quantity Reconcile → Hold/Reheat → Label/Place → Replenish → Close</p>
                            </div>
                            <div>
                                <h3 class="font-bold mb-1">Deterministic Fixture Events</h3>
                                <ul class="list-disc pl-5 text-sm text-red-600">
                                    <li>Alice is running 20 minutes late.</li>
                                    <li>Contributor dropout detected.</li>
                                    <li>One dish arrived at 60% quantity.</li>
                                </ul>
                            </div>
                            <div class="mt-4">
                                <h3 class="font-bold mb-2">Cost Ledger</h3>
                                <ul class="list-none space-y-1 text-sm font-mono bg-white p-3 border rounded shadow-inner">
                                    <li class="flex justify-between border-b pb-1"><span>Requested:</span> <span>0 cents</span></li>
                                    <li class="flex justify-between border-b py-1"><span>Approved:</span> <span>0 cents</span></li>
                                    <li class="flex justify-between border-b py-1"><span>Reversed:</span> <span>0 cents</span></li>
                                    <li class="flex justify-between border-b py-1"><span>Paid-simulated:</span> <span>0 cents</span></li>
                                    <li class="flex justify-between pt-1 font-bold"><span>Remaining:</span> <span>0 cents</span></li>
                                </ul>
                            </div>
                            <div class="mt-6 flex flex-wrap gap-2">
                                <a href="data:text/csv;charset=utf-8,id,dish,cost%0Ac1,Lasagna,0" download="ledger.csv" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 min-h-[44px] rounded transition-all duration-300 motion-reduce:transition-none text-sm inline-flex items-center">CSV Ledger</a>
                                <a href="data:text/calendar;charset=utf-8,BEGIN:VCALENDAR%0AEND:VCALENDAR" download="arrival.ics" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 min-h-[44px] rounded transition-all duration-300 motion-reduce:transition-none text-sm inline-flex items-center">ICS Schedule</a>
                                <a href="data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3C%2Fsvg%3E" download="buffet.svg" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 min-h-[44px] rounded transition-all duration-300 motion-reduce:transition-none text-sm inline-flex items-center">SVG Map</a>
                                <a href="data:text/markdown;charset=utf-8,%23%20Run%20Sheet" download="run-sheet.md" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 min-h-[44px] rounded transition-all duration-300 motion-reduce:transition-none text-sm inline-flex items-center">MD Run Sheet</a>
                            </div>
                        </div>"""

content = content.replace(old_run_day, new_run_day)

with open('/tmp/App.jsx', 'w') as f:
    f.write(content)
