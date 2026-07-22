import { useAppStore } from '../store';
import { useState, useEffect } from 'react';
import type { InvoiceStatus } from '../types';
import { InvoiceStatusEnum, InvoiceSchema } from '../types';
import { z } from 'zod';

export function DetailPanel() {
  const { invoices, selectedInvoiceId, updateInvoice, selectInvoice, deleteInvoice } = useAppStore();

  const selectedInvoice = invoices.find(inv => inv.id === selectedInvoiceId);

  const [clientName, setClientName] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<any>('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (selectedInvoice) {
      setClientName(selectedInvoice.clientName);
      setAmount(selectedInvoice.amount);
      setDueDate(selectedInvoice.dueDate);
      setStatus(selectedInvoice.status);
      setErrors({});
    }
  }, [selectedInvoice]);

  if (!selectedInvoiceId) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-6 flex flex-col items-center justify-center text-gray-500 h-full">
        <div className="text-center">
          <p className="text-sm">Select an invoice from the canvas to view details</p>
        </div>
      </div>
    );
  }

  if (!selectedInvoice) return null;

  const handleSave = () => {
    try {
      const data = InvoiceSchema.parse({
        id: selectedInvoice.id,
        clientName,
        amount: Number(amount),
        dueDate,
        status
      });

      updateInvoice(selectedInvoice.id, {
        clientName: data.clientName,
        amount: data.amount,
        dueDate: data.dueDate,
        status: data.status as InvoiceStatus
      });
      setErrors({});
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        const fieldErrors: { [key: string]: string } = {};
        JSON.parse(e.message).forEach((err: any) => {
          if (err.path[0]) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full z-10 shadow-xl overflow-y-auto">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <h2 className="font-semibold text-lg">Invoice Details</h2>
        <button onClick={() => selectInvoice(null)} className="text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
          <div className="text-sm text-gray-500 font-mono bg-gray-50 p-2 rounded">{selectedInvoice.id}</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
          <input
            type="text"
            className={`w-full border rounded p-2 text-sm focus:ring-primary-500 focus:border-primary-500 ${errors.clientName ? 'border-red-500' : 'border-gray-300'}`}
            value={clientName}
            onChange={e => setClientName(e.target.value)}
          />
          {errors.clientName && <p className="text-red-500 text-xs mt-1">{errors.clientName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
          <input
            type="number"
            className={`w-full border rounded p-2 text-sm focus:ring-primary-500 focus:border-primary-500 ${errors.amount ? 'border-red-500' : 'border-gray-300'}`}
            value={amount}
            onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
          />
          {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
          <input
            type="date"
            className={`w-full border rounded p-2 text-sm focus:ring-primary-500 focus:border-primary-500 ${errors.dueDate ? 'border-red-500' : 'border-gray-300'}`}
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
          />
          {errors.dueDate && <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-primary-500 focus:border-primary-500 capitalize"
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            {InvoiceStatusEnum.options.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {status === 'conflict' && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm mt-2">
            <span className="font-bold block mb-1">Conflict Detected</span>
            Please review the invoice and move it to a valid state.
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 bg-primary-600 text-white py-2 rounded-md font-medium hover:bg-primary-700 transition-colors"
          >
            Save Changes
          </button>
        </div>

        <div className="mt-2 flex gap-2">
          <button
            onClick={() => deleteInvoice(selectedInvoice.id)}
            className="flex-1 bg-white border border-red-200 text-red-600 py-2 rounded-md font-medium hover:bg-red-50 transition-colors"
          >
            Delete Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
