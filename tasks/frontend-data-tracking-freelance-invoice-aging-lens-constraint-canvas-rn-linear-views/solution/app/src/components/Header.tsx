import { useAppStore } from '../store';
import { Download, Upload, Undo2, Plus } from 'lucide-react';
import { InvoiceStatusEnum } from '../types';

export function Header() {
  const { filterStatus, setFilterStatus, undo, exportArtifact, importArtifact, createInvoice } = useAppStore();

  const handleExport = () => {
    const artifact = exportArtifact();
    const blob = new Blob([artifact], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoice-aging-v1-constraint-canvas.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          importArtifact(json);
        } catch (error) {
          console.error("Failed to parse artifact", error);
        }
      };
      reader.readAsText(file);
    }
    // reset the input
    e.target.value = '';
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-10 relative">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-gray-800 tracking-tight">Invoice Lens</h1>
        <div className="h-6 w-px bg-gray-300 mx-2"></div>
        <select
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block p-2"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
        >
          <option value="all">All Statuses</option>
          {InvoiceStatusEnum.options.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>

        <button
          onClick={() => createInvoice({ clientName: "New Client", amount: 1000, status: "draft", dueDate: new Date().toISOString().split('T')[0] })}
          className="flex items-center gap-1 bg-primary-600 text-white px-3 py-2 text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
        >
          <Plus size={16} />
          New Invoice
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={undo}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          title="Undo last action"
        >
          <Undo2 size={20} />
        </button>
        <div className="h-6 w-px bg-gray-300 mx-1"></div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <Download size={16} />
          Export
        </button>
        <label className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
          <Upload size={16} />
          Import
          <input type="file" accept=".json" className="hidden" onChange={handleImport} />
        </label>
      </div>
    </header>
  );
}
