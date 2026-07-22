import { InvoiceList } from './InvoiceList';
import { AuditLens } from './AuditLens';
import { useStore } from '../store';

export function Workbench() {
  const { addInvoice } = useStore();

  const handleSeed = () => {
    addInvoice({
      clientName: 'Acme Corp',
      amount: 1500.00,
      dueDate: new Date(Date.now() + 86400000 * 30).toISOString(),
    });
    addInvoice({
      clientName: 'Global Industries',
      amount: 3200.50,
      dueDate: new Date(Date.now() - 86400000 * 5).toISOString(),
    });
    addInvoice({
      clientName: 'Startup Inc',
      amount: 450.00,
      dueDate: new Date(Date.now() + 86400000 * 15).toISOString(),
    });
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full overflow-hidden bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <header className="lg:hidden p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
        <h1 className="font-bold">Freelance Invoice Aging Lens</h1>
        <button onClick={handleSeed} className="text-sm px-3 py-1 bg-purple-100 text-purple-700 rounded">Seed Data</button>
      </header>

      {/* List - Drawer on mobile, Sidebar on desktop */}
      <div className="h-1/3 lg:h-full lg:w-96 flex-shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-800">
        <div className="hidden lg:flex p-4 justify-between items-center bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <h1 className="font-bold truncate" title="Freelance Invoice Aging Lens">Aging Lens</h1>
          <button onClick={handleSeed} className="text-sm px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition">Seed</button>
        </div>
        <InvoiceList />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col h-2/3 lg:h-full">
        <AuditLens />
      </div>
    </div>
  );
}
