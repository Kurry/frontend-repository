import React, { useEffect, useState } from 'react';
import { useStore } from './store.js';
import { exportArtifact, importArtifact } from './utils.js';
import { Download, Upload, Undo2, AlertCircle, CheckCircle2, RotateCcw, X, Plus } from 'lucide-react';

const InvoiceForm = ({ invoice, onSave, onCancel }) => {
    const [formData, setFormData] = useState(invoice || { id: `inv-${Date.now()}`, client: '', amount: 0, dueDate: '', status: 'draft', recoveryStatus: 'idle' });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'amount' ? Number(value) : value
        }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.client.trim()) newErrors.client = "Client is required.";
        if (formData.amount <= 0) newErrors.amount = "Amount must be greater than 0.";
        if (!formData.dueDate) newErrors.dueDate = "Due date is required.";
        return newErrors;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
        } else {
            onSave(formData);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-white p-4 rounded-md shadow-sm border border-gray-200" aria-label="Invoice Form">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">{invoice ? 'Edit Invoice' : 'New Invoice'}</h3>
                <button type="button" onClick={onCancel} className="text-gray-500 hover:text-gray-800" aria-label="Cancel">
                    <X size={20} />
                </button>
            </div>

            <div className="flex flex-col gap-1">
                <label htmlFor="client" className="text-sm font-medium text-gray-700">Client</label>
                <input type="text" id="client" name="client" value={formData.client} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                {errors.client && <span className="text-red-500 text-xs">{errors.client}</span>}
            </div>

            <div className="flex flex-col gap-1">
                <label htmlFor="amount" className="text-sm font-medium text-gray-700">Amount ($)</label>
                <input type="number" id="amount" name="amount" value={formData.amount} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                {errors.amount && <span className="text-red-500 text-xs">{errors.amount}</span>}
            </div>

            <div className="flex flex-col gap-1">
                <label htmlFor="dueDate" className="text-sm font-medium text-gray-700">Due Date</label>
                <input type="date" id="dueDate" name="dueDate" value={formData.dueDate} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                {errors.dueDate && <span className="text-red-500 text-xs">{errors.dueDate}</span>}
            </div>

            <div className="flex flex-col gap-1">
                <label htmlFor="status" className="text-sm font-medium text-gray-700">Status</label>
                <select id="status" name="status" value={formData.status} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="draft">Draft</option>
                    <option value="ready">Ready</option>
                    <option value="changed">Changed</option>
                    <option value="failed">Failed</option>
                    <option value="archived">Archived</option>
                </select>
            </div>

            <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors">
                Save Invoice
            </button>
        </form>
    );
};

const RecoveryBoard = () => {
    const { state, dispatch } = useStore();
    const [filter, setFilter] = useState('all');

    const handleRecovery = (id, newRecoveryStatus) => {
        dispatch({ type: 'MOVE_TO_RECOVERY', payload: { id, recoveryStatus: newRecoveryStatus } });
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'draft': return 'bg-gray-100 text-gray-800';
            case 'ready': return 'bg-blue-100 text-blue-800';
            case 'failed': return 'bg-red-100 text-red-800';
            case 'changed': return 'bg-yellow-100 text-yellow-800';
            case 'archived': return 'bg-gray-200 text-gray-500';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredRecords = state.records.filter(r => filter === 'all' || r.status === filter);

    return (
        <div className="flex flex-col h-full bg-gray-50 rounded-lg shadow-sm border border-gray-200 overflow-hidden" aria-label="Recovery Board Surface">
            <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <AlertCircle className="text-orange-500" size={20} />
                    Recovery Board
                </h2>
                <div className="flex gap-2">
                    <select aria-label="Filter records" value={filter} onChange={e => setFilter(e.target.value)} className="border border-gray-300 rounded p-1 text-sm bg-white">
                        <option value="all">All Statuses</option>
                        <option value="failed">Failed Only</option>
                        <option value="draft">Draft</option>
                        <option value="ready">Ready</option>
                        <option value="changed">Changed</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
                {filteredRecords.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                        <CheckCircle2 size={48} className="mb-2 text-gray-300" />
                        <p>No records found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredRecords.map(record => (
                            <div
                                key={record.id}
                                data-testid={`record-${record.id}`}
                                className={`
                                    bg-white p-4 rounded-md shadow-sm border transition-all duration-300
                                    ${record.recoveryStatus === 'selected' ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'}
                                    ${record.recoveryStatus === 'conflict' ? 'ring-2 ring-red-500 border-red-500' : ''}
                                    ${record.recoveryStatus === 'resolved' ? 'border-green-300 bg-green-50' : ''}
                                `}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-medium text-gray-900 truncate pr-2">{record.client}</span>
                                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${getStatusColor(record.status)}`}>
                                        {record.status}
                                    </span>
                                </div>
                                <div className="text-2xl font-semibold mb-1">${record.amount.toFixed(2)}</div>
                                <div className="text-sm text-gray-500 mb-4">Due: {record.dueDate}</div>

                                {record.status === 'failed' && (
                                    <div className="pt-3 border-t border-gray-100 flex gap-2">
                                        <button
                                            onClick={() => handleRecovery(record.id, 'selected')}
                                            className="text-xs bg-orange-100 text-orange-700 px-3 py-1.5 rounded hover:bg-orange-200 transition-colors w-full"
                                            aria-label={`Select record ${record.id} for recovery`}
                                        >
                                            Investigate
                                        </button>
                                        {record.recoveryStatus === 'selected' && (
                                            <button
                                                onClick={() => handleRecovery(record.id, 'resolved')}
                                                className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded hover:bg-green-200 transition-colors w-full"
                                                aria-label={`Resolve record ${record.id}`}
                                            >
                                                Resolve
                                            </button>
                                        )}
                                    </div>
                                )}
                                {record.recoveryStatus === 'resolved' && (
                                    <div className="pt-3 border-t border-green-200 flex items-center text-green-700 text-sm font-medium">
                                        <CheckCircle2 size={16} className="mr-1" /> Recovered
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const SummaryPanel = () => {
    const { state } = useStore();

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4" aria-label="Derived Summary">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Aging Summary</h2>
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Records</span>
                    <span className="font-semibold text-gray-900">{state.derived.summary.totalRecords}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Amount</span>
                    <span className="font-semibold text-gray-900">${state.derived.summary.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-red-600 flex items-center gap-1"><AlertCircle size={16}/> Failed Amount</span>
                    <span className="font-semibold text-red-600">${state.derived.summary.failedAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-green-600 flex items-center gap-1"><CheckCircle2 size={16}/> Recovered Amount</span>
                    <span className="font-semibold text-green-600">${state.derived.summary.recoveredAmount.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
};

export default function App() {
    const { state, dispatch, undo } = useStore();
    const [isEditing, setIsEditing] = useState(false);
    const [fileError, setFileError] = useState(null);

    // Keyboard shortcut for Undo (Cmd/Ctrl + Z)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                e.preventDefault();
                undo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo]);

    const handleSaveInvoice = (invoice) => {
        dispatch({
            type: invoice.id.startsWith('inv-') && !state.records.find(r=>r.id === invoice.id) ? 'CREATE_RECORD' : 'EDIT_RECORD',
            payload: invoice
        });
        setIsEditing(false);
    };

    const handleExport = () => {
        exportArtifact(state);
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setFileError(null);
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                const newState = importArtifact(data);
                dispatch({ type: 'IMPORT_STATE', payload: newState });
            } catch (err) {
                setFileError("Invalid import format. State preserved.");
            }
        };
        reader.readAsText(file);
        e.target.value = null; // reset
    };

    const handleClear = () => {
        dispatch({ type: 'CLEAR_RECORDS' });
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            {/* Header / Top Bar */}
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-800">Freelance Invoice Aging Lens</h1>
                <div className="flex items-center gap-3">
                    <button onClick={undo} className="flex items-center gap-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded transition-colors" aria-label="Undo last mutation">
                        <Undo2 size={16} /> Undo
                    </button>
                    <button onClick={handleExport} className="flex items-center gap-1 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded transition-colors" aria-label="Export artifact">
                        <Download size={16} /> Export
                    </button>
                    <div className="relative">
                        <input type="file" id="import-upload" accept=".json" onChange={handleImport} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" aria-label="Import artifact" />
                        <button className="flex items-center gap-1 text-sm bg-gray-50 text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded transition-colors pointer-events-none">
                            <Upload size={16} /> Import
                        </button>
                    </div>
                    <button onClick={handleClear} className="flex items-center gap-1 text-sm bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded transition-colors" aria-label="Clear artifact">
                        <RotateCcw size={16} /> Clear
                    </button>
                </div>
            </header>

            {fileError && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mx-6 mt-4 rounded shadow-sm" role="alert">
                    <p>{fileError}</p>
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col md:flex-row gap-6 p-6 overflow-hidden">

                {/* Left Column: Board */}
                <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
                    <RecoveryBoard />
                </div>

                {/* Right Column: Context/Tools */}
                <div className="w-full md:w-80 flex-shrink-0 flex flex-col gap-6 overflow-y-auto pb-6">
                    <SummaryPanel />

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4" aria-label="Detail Panel">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h2 className="text-lg font-semibold text-gray-800">Actions</h2>
                            {!isEditing && (
                                <button onClick={() => setIsEditing(true)} className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors" aria-label="Add new record">
                                    <Plus size={20} />
                                </button>
                            )}
                        </div>
                        {isEditing ? (
                            <InvoiceForm onSave={handleSaveInvoice} onCancel={() => setIsEditing(false)} />
                        ) : (
                            <p className="text-sm text-gray-500">Select an item on the board or click + to add a new record.</p>
                        )}
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-sm text-gray-500">
                        <h3 className="font-semibold text-gray-700 mb-2">History Log ({state.history.length})</h3>
                        <div className="max-h-40 overflow-y-auto space-y-2">
                            {state.history.slice().reverse().map((entry, idx) => (
                                <div key={idx} className="border-l-2 border-blue-200 pl-2">
                                    <div className="font-medium">{entry.action}</div>
                                    <div className="text-xs text-gray-400">{new Date(entry.timestamp).toLocaleTimeString()}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
