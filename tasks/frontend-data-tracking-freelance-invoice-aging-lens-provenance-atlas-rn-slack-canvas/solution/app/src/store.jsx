import React, { createContext, useContext, useState, useMemo } from 'react';
import { initialData } from './state';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [data, setData] = useState(initialData);
  const [historyStack, setHistoryStack] = useState([]);

  // Update derived state dynamically
  const derived = useMemo(() => {
    return {
      totalAmount: data.records.reduce((acc, curr) => acc + curr.amount, 0),
      quarantinedCount: data.records.filter(r => r.lineage === 'quarantined').length
    };
  }, [data.records]);

  const commitState = (newRecords, eventDesc) => {
    setHistoryStack(prev => [...prev, data]);
    setData(prev => ({
      ...prev,
      records: newRecords,
      history: [...prev.history, { timestamp: new Date().toISOString(), event: eventDesc }]
    }));
  };

  const createInvoice = (invoice) => {
    commitState([...data.records, invoice], 'Created invoice');
  };

  const updateInvoice = (id, updates) => {
    const newRecords = data.records.map(r => r.id === id ? { ...r, ...updates } : r);
    commitState(newRecords, `Updated invoice ${id}`);
  };

  const deleteInvoice = (id) => {
    const newRecords = data.records.filter(r => r.id !== id);
    commitState(newRecords, `Deleted invoice ${id}`);
  };

  const quarantineInvoice = (id, reason) => {
    const newRecords = data.records.map(r => r.id === id ? { ...r, lineage: 'quarantined', quarantineReason: reason, status: 'changed' } : r);
    commitState(newRecords, `Quarantined invoice ${id}`);
  };

  const undo = () => {
    if (historyStack.length === 0) return;
    const previousState = historyStack[historyStack.length - 1];
    setHistoryStack(prev => prev.slice(0, -1));
    setData(previousState);
  };

  const loadData = (newData) => {
    setData(newData);
    setHistoryStack([]);
  };

  return (
    <AppContext.Provider value={{
      data: { ...data, derived },
      createInvoice, updateInvoice, deleteInvoice, quarantineInvoice, undo, loadData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => useContext(AppContext);
