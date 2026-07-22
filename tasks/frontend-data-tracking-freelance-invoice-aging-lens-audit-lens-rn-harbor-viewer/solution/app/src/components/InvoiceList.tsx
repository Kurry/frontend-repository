import { useState } from 'react';
import { useStore, getDerivedSummary, type Invoice, type InvoiceStatus, INVOICE_STATUS } from '../store';
import { FileText, AlertCircle, CheckCircle, Clock, Plus, Filter, Edit2, Archive, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function InvoiceList() {
  const { records, selectInvoice, selectedInvoiceId, undo, exportSession, clearSession, importSession, addInvoice, updateInvoice, deleteInvoice } = useStore();
  const summary = getDerivedSummary(records);
  const [filter, setFilter] = useState<InvoiceStatus | 'all'>('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formState, setFormState] = useState({ clientName: '', amount: '', dueDate: '' });
  const [formError, setFormError] = useState('');

  const filteredRecords = records.filter(r => filter === 'all' || r.status === filter);

  const handleImport = () => {
    const json = prompt('Paste session JSON here:');
    if (json) {
      const result = importSession(json);
      if (!result.success) alert(result.error);
    }
  };

  const handleExport = () => {
    const json = exportSession();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoice-aging-v1-audit-lens.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const openCreateForm = () => {
    setFormState({ clientName: '', amount: '', dueDate: '' });
    setFormError('');
    setEditingId(null);
    setIsFormOpen(true);
  };

  const openEditForm = (e: React.MouseEvent, invoice: Invoice) => {
    e.stopPropagation();
    setFormState({
      clientName: invoice.clientName,
      amount: invoice.amount.toString(),
      dueDate: invoice.dueDate.split('T')[0]
    });
    setFormError('');
    setEditingId(invoice.id);
    setIsFormOpen(true);
  };

  const handleArchive = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    updateInvoice(id, { status: 'archived' });
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteInvoice(id);
  };

  const submitForm = () => {
    setFormError('');
    if (!formState.clientName.trim()) {
      setFormError('Client name is required. Prior valid state preserved.');
      return;
    }
    const amountNum = parseFloat(formState.amount);
    if (isNaN(amountNum) || amountNum < 0) {
      setFormError('Amount must be a non-negative number. Prior valid state preserved.');
      return;
    }
    const dateParsed = Date.parse(formState.dueDate);
    if (isNaN(dateParsed)) {
      setFormError('Invalid due date. Prior valid state preserved.');
      return;
    }

    if (editingId) {
       updateInvoice(editingId, {
         clientName: formState.clientName.trim(),
         amount: amountNum,
         dueDate: new Date(dateParsed).toISOString()
       });
    } else {
       addInvoice({
         clientName: formState.clientName.trim(),
         amount: amountNum,
         dueDate: new Date(dateParsed).toISOString()
       });
    }
    setIsFormOpen(false);
  };

  return (
    <div className="flex flex-col h-full border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 w-full lg:w-96 relative overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shrink-0">
        <h2 className="text-xl font-bold mb-4">Invoices</h2>
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
           <button onClick={openCreateForm} className="px-3 py-1 flex items-center gap-1 bg-purple-600 text-white rounded text-sm shrink-0 hover:bg-purple-700 transition-colors"><Plus className="w-4 h-4"/>New</button>
           <button onClick={undo} className="px-3 py-1 bg-gray-200 dark:bg-gray-800 rounded text-sm shrink-0 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">Undo</button>
           <button onClick={handleExport} className="px-3 py-1 bg-gray-200 dark:bg-gray-800 rounded text-sm shrink-0 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">Export</button>
           <button onClick={handleImport} className="px-3 py-1 bg-gray-200 dark:bg-gray-800 rounded text-sm shrink-0 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">Import</button>
           <button onClick={clearSession} className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-sm shrink-0 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">Clear</button>
        </div>

        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 text-sm">
          <Filter className="w-4 h-4 text-gray-500" />
          <button onClick={() => setFilter('all')} className={`px-2 py-0.5 rounded-full capitalize whitespace-nowrap ${filter === 'all' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 'bg-gray-100 dark:bg-gray-800'}`}>All</button>
          {INVOICE_STATUS.map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-2 py-0.5 rounded-full capitalize whitespace-nowrap ${filter === s ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 'bg-gray-100 dark:bg-gray-800'}`}>{s}</button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
            <div>Total</div>
            <div className="font-mono text-lg text-gray-900 dark:text-gray-100">{summary.totalInvoices}</div>
          </div>
          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
            <div>Amount</div>
            <div className="font-mono text-lg text-gray-900 dark:text-gray-100">${summary.totalAmount.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 relative" role="list">
        <AnimatePresence>
          {filteredRecords.map((invoice: Invoice) => (
            <motion.div
              key={invoice.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => selectInvoice(invoice.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-colors group ${selectedInvoiceId === invoice.id ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:border-gray-300 dark:hover:border-gray-700'}`}
              tabIndex={0}
              role="listitem"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  selectInvoice(invoice.id);
                }
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium truncate pr-2">{invoice.clientName}</div>
                <div className="font-mono whitespace-nowrap">${invoice.amount.toFixed(2)}</div>
              </div>
              <div className="flex justify-between items-center text-xs mb-2">
                <div className="text-gray-500">{new Date(invoice.dueDate).toLocaleDateString()}</div>
                <div className="flex items-center gap-1">
                  {invoice.auditLensState === 'resolved' && <CheckCircle className="w-3 h-3 text-green-500" />}
                  {invoice.auditLensState === 'conflict' && <AlertCircle className="w-3 h-3 text-red-500" />}
                  {invoice.auditLensState === 'selected' && <FileText className="w-3 h-3 text-purple-500" />}
                  {invoice.auditLensState === 'idle' && <Clock className="w-3 h-3 text-gray-400" />}
                  <span className="capitalize">{invoice.auditLensState}</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-100 dark:border-gray-800">
                  <span className="capitalize text-gray-500 font-semibold">{invoice.status}</span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button onClick={(e) => openEditForm(e, invoice)} className="text-blue-500 hover:text-blue-700" title="Edit"><Edit2 className="w-3 h-3" /></button>
                    {invoice.status !== 'archived' && <button onClick={(e) => handleArchive(e, invoice.id)} className="text-yellow-500 hover:text-yellow-700" title="Archive"><Archive className="w-3 h-3" /></button>}
                    <button onClick={(e) => handleDelete(e, invoice.id)} className="text-red-500 hover:text-red-700" title="Delete"><Trash2 className="w-3 h-3" /></button>
                  </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {filteredRecords.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No invoices found.
          </div>
        )}
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="absolute inset-0 bg-white dark:bg-gray-950 flex flex-col z-10"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h3 className="font-bold text-lg">{editingId ? 'Edit Invoice' : 'New Invoice'}</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded">
                  {formError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Client Name</label>
                <input
                  type="text"
                  value={formState.clientName}
                  onChange={e => setFormState({...formState, clientName: e.target.value})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formState.amount}
                  onChange={e => setFormState({...formState, amount: e.target.value})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  value={formState.dueDate}
                  onChange={e => setFormState({...formState, dueDate: e.target.value})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900"
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
               <button onClick={submitForm} className="w-full py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition">Save Invoice</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
