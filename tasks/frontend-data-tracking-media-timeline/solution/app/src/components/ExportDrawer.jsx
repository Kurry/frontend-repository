import { createSignal, Show } from 'solid-js';
import { state, setState } from '../store';
import { MT_DATA } from '../data';

export default function ExportDrawer({ onClose }) {
  const [activeTab, setActiveTab] = createSignal('json');

  const exportJSON = () => {
    return JSON.stringify({
      version: 1,
      document: "media-timeline",
      window: { fromYear: state.window.from, toYear: state.window.to },
      enabledCategories: [...state.filters.categories],
      eras: MT_DATA.eras.map(e => ({ name: e.label, fromYear: e.from, toYear: e.to })),
      events: state.events.map(ev => {
        const { id, isUserManaged, ...rest } = ev;
        return rest;
      })
    }, null, 2);
  };

  const exportCSV = () => {
    const header = "title,type,timestamp,mediaRefs,year,place,categories,summary,source";
    const rows = state.events.map(ev => {
      return `"${ev.title}","${ev.type}","${ev.timestamp}","${ev.mediaRefs?.join(';') || ''}",${ev.year},"${ev.place || ''}","${ev.categories?.join('|') || ''}","${ev.summary || ''}","${ev.source || ''}"`;
    });
    return [header, ...rows].join('\n');
  };

  const exportMD = () => {
    const inView = state.events.filter(e => e.year >= state.window.from && e.year <= state.window.to);
    return `# Media Timeline: ${state.window.from} to ${state.window.to}\n\n` +
      `**Enabled Categories:** ${state.filters.categories.join(', ')}\n\n` +
      inView.map(e => `- **${e.title}** (${e.type}, ${e.year})`).join('\n');
  };

  const activeContent = () => {
    if (activeTab() === 'json') return exportJSON();
    if (activeTab() === 'csv') return exportCSV();
    return exportMD();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent());
    alert('Copied to clipboard!');
  };

  const handleDownload = () => {
    const blob = new Blob([activeContent()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeTab() === 'json' ? 'timeline-pack.json' : activeTab() === 'csv' ? 'timeline-events.csv' : 'timeline-window.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div class="fixed inset-y-0 right-0 w-[500px] bg-white shadow-2xl z-50 flex flex-col border-l">
      <div class="p-4 border-b flex justify-between items-center bg-gray-50">
        <h2 class="text-xl font-bold">Export Timeline</h2>
        <button onClick={onClose} class="text-gray-500 hover:text-black">✕</button>
      </div>
      
      <div class="p-4 bg-gray-100 flex gap-2">
        <button class={`px-3 py-1 rounded text-sm font-medium ${activeTab() === 'json' ? 'bg-blue-600 text-white' : 'bg-white'}`} onClick={() => setActiveTab('json')}>Timeline JSON</button>
        <button class={`px-3 py-1 rounded text-sm font-medium ${activeTab() === 'csv' ? 'bg-blue-600 text-white' : 'bg-white'}`} onClick={() => setActiveTab('csv')}>Events CSV</button>
        <button class={`px-3 py-1 rounded text-sm font-medium ${activeTab() === 'md' ? 'bg-blue-600 text-white' : 'bg-white'}`} onClick={() => setActiveTab('md')}>Window Markdown</button>
      </div>
      
      <div class="p-4 flex-1 overflow-auto bg-slate-800 text-green-400 font-mono text-sm whitespace-pre-wrap">
        {activeContent()}
      </div>

      <div class="p-4 border-t flex gap-2 justify-end bg-gray-50">
        <button onClick={handleCopy} class="px-4 py-2 border rounded font-medium hover:bg-gray-100">Copy</button>
        <button onClick={handleDownload} class="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700">Download</button>
      </div>
    </div>
  );
}
