import { h } from 'preact';
import { useState, useRef, useEffect } from 'preact/hooks';
import { filteredTransactions, totals, displayCurrency, fxRates, bulkCategorize, bulkDelete, setFilters, deleteTransaction, showToast } from '../state.js';
import { Icon } from '@iconify/react';
import autoAnimate from '@formkit/auto-animate';
import { TransactionForm } from './TransactionForm.jsx';

export function TransactionsList() {
    const listRef = useRef(null);
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [bulkCategory, setBulkCategory] = useState('');
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (listRef.current) {
            const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            if (!mediaQuery.matches) {
                autoAnimate(listRef.current);
            }
        }
    }, [listRef]);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: displayCurrency.value,
            minimumFractionDigits: 2
        }).format(val * fxRates[displayCurrency.value]);
    };

    const handleSelectRow = (id, checked) => {
        const newSet = new Set(selectedRows);
        if (checked) newSet.add(id);
        else newSet.delete(id);
        setSelectedRows(newSet);
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedRows(new Set(filteredTransactions.value.map(t => t.id)));
        } else {
            setSelectedRows(new Set());
        }
    };

    const handleBulkCategorize = () => {
        if (selectedRows.size > 0 && bulkCategory) {
            bulkCategorize(Array.from(selectedRows), bulkCategory);
            showToast(`Categorized ${selectedRows.size} transactions as ${bulkCategory}`);
            setSelectedRows(new Set());
            setBulkCategory('');
        }
    };

    const handleBulkDelete = () => {
        if (selectedRows.size > 0) {
            bulkDelete(Array.from(selectedRows));
            showToast(`Deleted ${selectedRows.size} transactions`);
            setSelectedRows(new Set());
        }
    };

    const categories = ['Books', 'Groceries', 'Income', 'Utilities', 'Dining', 'Entertainment', 'Transportation', 'Housing'];

    return (
        <div class="card bg-base-100 shadow-sm border border-base-200">
            <div class="card-body p-0">
                <div class="p-4 border-b border-base-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 class="text-lg font-bold">Transactions</h2>
                    <div class="flex flex-wrap items-center gap-2">
                        <select class="select select-bordered select-sm" onChange={(e) => setFilters({ category: e.target.value || null })}>
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select class="select select-bordered select-sm" onChange={(e) => setFilters({ type: e.target.value || null })}>
                            <option value="">All Types</option>
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                        </select>
                        <button class="btn btn-primary btn-sm" onClick={() => setIsCreating(true)}>
                            <Icon icon="mdi:plus" /> New
                        </button>
                    </div>
                </div>

                {selectedRows.size > 0 && (
                    <div class="bg-base-200 p-2 px-4 flex items-center gap-4">
                        <span class="text-sm font-medium">{selectedRows.size} selected</span>
                        <select class="select select-bordered select-sm" value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)}>
                            <option value="" disabled>Select category...</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <button class="btn btn-sm btn-outline" onClick={handleBulkCategorize} disabled={!bulkCategory}>Apply</button>
                        <button class="btn btn-sm btn-error" onClick={handleBulkDelete}>Delete Selected</button>
                    </div>
                )}

                <div class="overflow-x-auto min-h-[300px]">
                    <table class="table table-zebra table-sm w-full">
                        <thead class="bg-base-200 sticky top-0 z-10">
                            <tr>
                                <th>
                                    <input
                                        type="checkbox"
                                        class="checkbox checkbox-sm"
                                        checked={selectedRows.size === filteredTransactions.value.length && filteredTransactions.value.length > 0}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                        aria-label="Select all rows"
                                    />
                                </th>
                                <th>Date</th>
                                <th>Payee</th>
                                <th>Category</th>
                                <th>Account</th>
                                <th class="text-right">Amount</th>
                                <th class="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody ref={listRef}>
                            {filteredTransactions.value.length === 0 ? (
                                <tr>
                                    <td colSpan="7" class="text-center py-10 text-base-content/60">
                                        <div class="flex flex-col items-center gap-2">
                                            <Icon icon="mdi:file-document-outline" class="text-4xl" />
                                            <p>No transactions found for the current scope.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.value.map(t => (
                                    <tr key={t.id} class="hover:bg-teal-50/20 transition-colors">
                                        <td>
                                            <input
                                                type="checkbox"
                                                class="checkbox checkbox-sm"
                                                checked={selectedRows.has(t.id)}
                                                onChange={(e) => handleSelectRow(t.id, e.target.checked)}
                                                aria-label={`Select transaction ${t.label}`}
                                            />
                                        </td>
                                        <td>{t.date}</td>
                                        <td class="font-medium">{t.label}</td>
                                        <td><span class="badge badge-ghost badge-sm">{t.category}</span></td>
                                        <td>{t.account || 'Checking'}</td>
                                        <td class={`text-right font-medium ${t.amount > 0 ? 'text-success' : ''}`}>
                                            {formatCurrency(t.amount)}
                                        </td>
                                        <td class="text-center">
                                            <div class="join">
                                                <button class="btn btn-xs btn-ghost join-item" onClick={() => setEditingTransaction(t)} aria-label="Edit">
                                                    <Icon icon="mdi:pencil" />
                                                </button>
                                                <button class="btn btn-xs btn-ghost text-error join-item" onClick={() => deleteTransaction(t.id)} aria-label="Delete">
                                                    <Icon icon="mdi:delete" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div class="p-4 border-t border-base-200 bg-base-100 flex justify-between text-sm">
                    <span class="font-medium text-base-content/70">Showing transactions list</span>
                    <span class="font-bold">{totals.value.count} transactions</span>
                </div>
            </div>

            {(isCreating || editingTransaction) && (
                <TransactionForm
                    transaction={editingTransaction}
                    onClose={() => { setIsCreating(false); setEditingTransaction(null); }}
                />
            )}
        </div>
    );
}
